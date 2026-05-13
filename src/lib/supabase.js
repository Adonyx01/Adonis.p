import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes. Copie .env.example vers .env et remplis les valeurs (tableau Supabase → Settings → API).'
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Évite des blocages rares avec React Strict Mode / plusieurs onglets (Web Locks)
    lockAcquireTimeout: 15000,
  },
})
