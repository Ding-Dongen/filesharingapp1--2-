"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/database.types"

export async function updateUserRole(userId: string, role: "user" | "core_admin" | "superadmin") {
  const supabase = createClient()

  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select().single()

  if (error) {
    throw new Error(`Error updating user role: ${error.message}`)
  }

  revalidatePath("/admin/users")
  return data
}

export async function getAllUsers() {
  const supabase = createClient()

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Error fetching users: ${error.message}`)
  }

  return data || []
}

export async function getUserById(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    throw new Error(`Error fetching user: ${error.message}`)
  }

  return data
}

export async function updateUserProfile(userId: string, profileData: Partial<Tables<"profiles">>) {
  const supabase = createClient()

  const { data, error } = await supabase.from("profiles").update(profileData).eq("id", userId).select().single()

  if (error) {
    throw new Error(`Error updating profile: ${error.message}`)
  }

  revalidatePath("/settings")
  return data
}

