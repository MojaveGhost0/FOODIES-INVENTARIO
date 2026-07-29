'use client';
import { CldUploadWidget } from 'next-cloudinary';

export default function ImageUpload({ onUpload, disabled }) {
  return (
    <CldUploadWidget 
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"} 
      onSuccess={(result) => {
        if (result.info && result.info.secure_url) {
          onUpload(result.info.secure_url);
        }
      }}
    >
      {({ open }) => {
        return (
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => open()}
            disabled={disabled}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem', border: '1px dashed #999', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: '#555' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.2rem', height: '1.2rem' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Subir Foto
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
