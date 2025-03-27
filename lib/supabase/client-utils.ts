"use client"

import { createClient } from "@/lib/supabase/client"

// Client-side utility functions that don't rely on server components
export async function fetchCategories() {
  const supabase = createClient()

  const { data, error } = await supabase.from("categories").select("*").order("name")

  if (error) {
    throw new Error(`Error fetching categories: ${error.message}`)
  }

  return data || []
}

export async function fetchFiles(search?: string, categoryId?: string) {
  const supabase = createClient()

  let query = supabase
    .from("files")
    .select("*, categories(name), profiles(full_name)")
    .order("created_at", { ascending: false })

  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Error fetching files: ${error.message}`)
  }

  return data || []
}

export async function fetchUserProfile() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return null
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

export async function fetchNotifications() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return []
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notifications:", error)
    return []
  }

  return data
}

export async function fetchUnreadNotificationCount() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return 0
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)

  if (error) {
    console.error("Error counting notifications:", error)
    return 0
  }

  return count || 0
}

