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

// Improved deleteNotification function with better error handling
export async function deleteNotification(id: string) {
  const supabase = createClient()

  try {
    // Perform the delete operation
    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (error) {
      console.error("Delete error:", error)
      throw new Error(`Error deleting notification: ${error.message}`)
    }

    // Verify the deletion was successful
    const { data: checkData } = await supabase.from("notifications").select("*").eq("id", id).single()

    if (checkData) {
      console.error("Deletion verification failed - notification still exists:", checkData)
      throw new Error("Failed to delete notification from database")
    }

    // Force refresh notification count
    await refreshNotificationCount()

    return true
  } catch (error) {
    console.error("Delete notification error:", error)
    throw error
  }
}

// Improved deleteAllNotifications function with better error handling
export async function deleteAllNotifications(userId: string) {
  const supabase = createClient()

  try {
    // Perform the delete operation
    const { error } = await supabase.from("notifications").delete().eq("user_id", userId)

    if (error) {
      console.error("Delete all error:", error)
      throw new Error(`Error deleting notifications: ${error.message}`)
    }

    // Verify the deletion was successful
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (count && count > 0) {
      console.error("Deletion verification failed - notifications still exist, count:", count)
      throw new Error("Failed to delete all notifications from database")
    }

    // Force refresh notification count
    await refreshNotificationCount()

    return true
  } catch (error) {
    console.error("Delete all notifications error:", error)
    throw error
  }
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

// Add a global notification count refresh function
let notificationCountRefreshCallback: (() => void) | null = null

export function setNotificationCountRefreshCallback(callback: (() => void) | null) {
  notificationCountRefreshCallback = callback
}

export async function refreshNotificationCount() {
  if (notificationCountRefreshCallback) {
    notificationCountRefreshCallback()
  }
}

