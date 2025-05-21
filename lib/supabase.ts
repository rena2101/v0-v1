import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Get the Supabase client instance (creates it if it doesn't exist)
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>()
  }
  return supabaseInstance
}

// Export the supabase client for convenience
export const supabase = getSupabaseClient()
