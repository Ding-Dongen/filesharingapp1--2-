"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Types
type UserProfile = {
  id: string
  email?: string | null
  full_name: string | null
  role: "user" | "core_admin" | "superadmin"
  created_at: string
  last_sign_in_at?: string | null
}

// Create a Supabase client for server components
function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

// Check if current user is an admin
export async function checkIsAdmin() {
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is an admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  if (!profile || (profile.role !== "core_admin" && profile.role !== "superadmin")) {
    redirect("/")
  }

  return true
}

// Get all users with their profiles - without using admin API
export async function getAllUsers(): Promise<UserProfile[]> {
  await checkIsAdmin()

  const supabase = createServerSupabaseClient()

  try {
    // Get all profiles directly - this is simpler and doesn't require admin API
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching profiles:", error)
      throw new Error("Failed to fetch users")
    }

    return profiles || []
  } catch (error) {
    console.error("Error in getAllUsers:", error)
    throw new Error("Failed to fetch users")
  }
}

// Update user role
export async function updateUserRole(userId: string, role: "user" | "core_admin" | "superadmin") {
  await checkIsAdmin()

  const supabase = createServerSupabaseClient()

  try {
    // Update the profile
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

    if (error) {
      console.error("Error updating user role:", error)
      throw new Error("Failed to update user role")
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error in updateUserRole:", error)
    throw new Error("Failed to update user role")
  }
}

