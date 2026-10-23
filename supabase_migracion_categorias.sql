-- Migración de categorías antiguas a las nuevas categorías de cocina (Foodies)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase. Ajusta los destinos si lo prefieres.

UPDATE productos SET categoria = 'Carnes y Embutidos' WHERE categoria = 'Parrilla y Carnes';
UPDATE productos SET categoria = 'Panes y Masas'      WHERE categoria = 'Comida Rápida';
UPDATE productos SET categoria = 'Granos y Cereales'  WHERE categoria = 'Comida Árabe';
