import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase/database.types"

// Create a single instance of the supabase client to avoid multiple instances
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      }
    )
  }
  return supabaseClient
}

