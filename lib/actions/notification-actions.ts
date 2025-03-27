"use client"

import { createClient } from "@/lib/supabase/client"
import type { InsertTables } from "@/lib/supabase/database.types"

export async function createNotification(notificationData: InsertTables<"notifications">) {
  const supabase = createClient()

  const { data, error } = await supabase.from("notifications").insert(notificationData).select().single()

  if (error) {
    throw new Error(`Error creating notification: ${error.message}`)
  }

  return data
}

export async function markNotificationAsRead(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id).select().single()

  if (error) {
    throw new Error(`Error updating notification: ${error.message}`)
  }

  return data
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    throw new Error(`Error updating notifications: ${error.message}`)
  }

  return true
}

export async function getUserNotifications(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Error fetching notifications: ${error.message}`)
  }

  return data || []
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = createClient()

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    throw new Error(`Error counting notifications: ${error.message}`)
  }

  return count || 0
}

