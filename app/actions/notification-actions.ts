"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { InsertTables } from "@/lib/supabase/database.types"

export async function createNotification(notificationData: InsertTables<"notifications">) {
  const supabase = createClient()

  const { data, error } = await supabase.from("notifications").insert(notificationData).select().single()

  if (error) {
    throw new Error(`Error creating notification: ${error.message}`)
  }

  revalidatePath("/notifications")
  return data
}

// Improved deleteNotification function with better error handling
export async function deleteNotification(id: string) {
  const supabase = createClient()

  try {
    // Perform the delete operation with more detailed logging
    console.log("Server-side: Attempting to delete notification with ID:", id)

    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (error) {
      console.error("Server delete error:", error)
      throw new Error(`Error deleting notification: ${error.message}`)
    }

    // Verify the deletion was successful
    const { data: checkData } = await supabase.from("notifications").select("*").eq("id", id).single()

    if (checkData) {
      console.error("Server-side: Deletion verification failed - notification still exists:", checkData)
      throw new Error("Failed to delete notification from database")
    }

    console.log("Server-side: Successfully deleted notification with ID:", id)

    revalidatePath("/notifications")
    return true
  } catch (error) {
    console.error("Server-side delete notification error:", error)
    throw error
  }
}

// Improved deleteAllNotifications function with better error handling
export async function deleteAllNotifications(userId: string) {
  const supabase = createClient()

  try {
    // Perform the delete operation with more detailed logging
    console.log("Server-side: Attempting to delete all notifications for user:", userId)

    const { error } = await supabase.from("notifications").delete().eq("user_id", userId)

    if (error) {
      console.error("Server delete all error:", error)
      throw new Error(`Error deleting notifications: ${error.message}`)
    }

    // Verify the deletion was successful
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (count && count > 0) {
      console.error("Server-side: Deletion verification failed - notifications still exist, count:", count)
      throw new Error("Failed to delete all notifications from database")
    }

    console.log("Server-side: Successfully deleted all notifications for user:", userId)

    revalidatePath("/notifications")
    return true
  } catch (error) {
    console.error("Server-side delete all notifications error:", error)
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

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Error counting notifications: ${error.message}`)
  }

  return count || 0
}

