import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'Gourmet & Grill — Sistema de Inventario Gastronómico',
  description: 'Control de inventario de cocina para restaurante: Parrilla, Comida Árabe, Comida Rápida, Bebidas y Salsas',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
