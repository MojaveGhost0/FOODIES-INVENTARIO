'use client';
import { useState, Component } from 'react';
import { CldUploadWidget } from 'next-cloudinary';

// Error Boundary para capturar cualquier excepción imprevista de Cloudinary
class CloudinaryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('Cloudinary widget error captured:', error?.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '0.6rem', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
          El cargador de archivos requiere configurar Cloudinary en Vercel. Puedes pegar un enlace de imagen arriba.
        </div>
      );
    }
    return this.props.children;
  }
}

function CloudinaryWidgetButton({ onUpload, disabled }) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  if (!cloudName) {
    return null;
  }

  return (
    <CloudinaryErrorBoundary>
      <CldUploadWidget
        uploadPreset={uploadPreset}
        onSuccess={(result) => {
          if (result?.info?.secure_url) {
            onUpload(result.info.secure_url);
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => open?.()}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              justifyContent: 'center',
              padding: '0.65rem',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-elevated)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '13px'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.1rem', height: '1.1rem' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Subir archivo desde mi dispositivo
          </button>
        )}
      </CldUploadWidget>
    </CloudinaryErrorBoundary>
  );
}

export default function ImageUpload({ onUpload, disabled }) {
  const [urlInput, setUrlInput] = useState('');
  const hasCloudinary = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

  const handleApplyUrl = (e) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (cleanUrl) {
      onUpload(cleanUrl);
      setUrlInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
      {/* Opción 1: Entrada rápida de URL de imagen */}
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <input
          type="url"
          placeholder="Pegar enlace de imagen (https://...)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text-primary)',
            fontSize: '13px'
          }}
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={handleApplyUrl}
          disabled={disabled || !urlInput.trim()}
          style={{
            padding: '0.65rem 1rem',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          Aplicar Foto
        </button>
      </div>

      {/* Opción 2: Subida por Cloudinary si está configurada la variable en Vercel */}
      {hasCloudinary ? (
        <CloudinaryWidgetButton onUpload={onUpload} disabled={disabled} />
      ) : (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
          💡 Pega el enlace web de cualquier foto. (Para habilitar el botón de subida directa desde archivos, agrega <code style={{ color: 'var(--accent)' }}>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> en Vercel).
        </p>
      )}
    </div>
  );
}
