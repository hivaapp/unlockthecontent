import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage across page refreshes.
    persistSession: true,

    // Auto-refresh the JWT before it expires (every ~55 minutes).
    autoRefreshToken: true,

    // Detect session from URL hash on OAuth callback and email confirmation links.
    detectSessionInUrl: true,

    // Storage key prefix — keeps AdGate sessions separate if user has other
    // Supabase apps open in the same browser.
    storageKey: 'adgate_auth',
  },

  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },

  global: {
    headers: {
      'x-application-name': 'adgate',
    },
  },
})

export default supabase
