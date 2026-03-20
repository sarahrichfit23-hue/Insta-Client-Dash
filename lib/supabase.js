// Supabase browser client for authentication and database access
// Creates a client-side Supabase instance
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOtp: async () => ({ error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }), order: () => ({ data: [], error: null }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }) }),
        delete: () => ({ eq: async () => ({ error: { message: 'Supabase not configured' } }) }),
        upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) })
      }),
      rpc: async () => ({ data: null, error: { message: 'Supabase not configured' } })
    }
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
