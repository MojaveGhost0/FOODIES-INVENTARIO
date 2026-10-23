import { createClient } from '@supabase/supabase-js'

// Fallback placeholders prevent build-time crash when env vars are not set.
// At runtime (Vercel / local with .env.local), the real values are used.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false // Prevenir fugas de tokens en URL tras redirecciones innecesarias
  }
})
