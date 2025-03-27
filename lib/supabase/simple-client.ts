"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

export function createSimpleClient() {
  try {
    console.log("Creating Supabase client...")
    const client = createClientComponentClient<Database>()
    console.log("Supabase client created successfully")
    return client
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}

