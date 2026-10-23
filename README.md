# 🍽️ Gourmet & Grill — Sistema de Inventario Gastronómico

Sistema web para el control de inventario de restaurante especializado en **Parrilla, Comida Árabe, Comida Rápida, Bebidas y Cocina**.

Desarrollado con **Next.js (App Router)**, **Supabase (PostgreSQL & RLS)** y **Cloudinary**.

---

## 🚀 Áreas de Cocina & Categorías
* 🥩 **Parrilla y Carnes**: Cortes de res, pechugas, chuletas, chorizos, carbón vegetal.
* 🥙 **Comida Árabe**: Shawarma marinado, pan pita/árabe, falafel, kibbe, tahini.
* 🍔 **Comida Rápida**: Carne para hamburguesa, panes brioche, papas fritas, quesos, tocineta.
* 🥤 **Bebidas y Refrescos**: Refrescos en lata/botella, agua mineral, cervezas.
* 🍓 **Jugos y Frutas**: Pulpas congeladas (maracuyá, fresa), frutas frescas, hielo.
* 🥗 **Vegetales y Frescos**: Tomate, lechuga, cebolla, ajo, hierbas frescas.
* 🧂 **Salsas y Condimentos**: Salsa de ajo de la casa, salsa BBQ, especias árabes, aceites.
* 📦 **Desechables y Empaques**: Cajas térmicas, vasos, papel parafinado, servilletas.

---

## 🛡️ Seguridad Implementada
- **Row Level Security (RLS)** estricto en Supabase restringido a usuarios autenticados.
- Validación de sesiones en servidor con `supabase.auth.getUser()`.
- Control de roles (`admin` y `usuario`) con protección anti-bloqueo del último admin.
- Auditoría con registro de `usuario_email` en cada movimiento de cocina.
- Content Security Policy (CSP), HSTS, X-Frame-Options DENY y Permissions-Policy.
- Protección anti-fuerza bruta en pantalla de login.

---

## 🛠️ Tecnologías
- **Framework**: Next.js 15 (App Router, Client Components)
- **Base de Datos & Auth**: Supabase PostgreSQL
- **Almacenamiento de Fotos**: Cloudinary Upload Widget
- **Estilos**: Vanilla CSS con diseño responsivo y tema dark/glassmorphic
