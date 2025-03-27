"use client"

import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { Tables, UpdateTables } from "@/lib/supabase/database.types"

export async function createMessage(
  messageData: Omit<Tables<"posts">, "id" | "created_at" | "updated_at" | "author_id">,
) {
  const supabase = createClient()

  try {
    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to create a message")
    }

    // Check if user is admin for admin messages
    if (messageData.is_admin_post) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

      if (!profile || (profile.role !== "core_admin" && profile.role !== "superadmin")) {
        throw new Error("Only admins can create announcements")
      }
    }

    // Create message
    const { data, error } = await supabase
      .from("posts")
      .insert({
        ...messageData,
        author_id: session.user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create notification for admin messages
    if (messageData.is_admin_post) {
      const { data: profiles } = await supabase.from("profiles").select("id")

      if (profiles) {
        const notifications = profiles.map((profile) => ({
          user_id: profile.id,
          content: `New announcement: ${messageData.title}`,
          type: "admin_post",
          related_id: data.id,
        }))

        await supabase.from("notifications").insert(notifications)
      }
    }

    // Create notification for file/folder references
    if (messageData.referenced_file_id || messageData.referenced_category_id) {
      // Get all users
      const { data: profiles } = await supabase.from("profiles").select("id")

      if (profiles) {
        let notificationContent = ""

        if (messageData.referenced_file_id) {
          const { data: file } = await supabase
            .from("files")
            .select("name")
            .eq("id", messageData.referenced_file_id)
            .single()

          if (file) {
            notificationContent = `New message referencing file: ${file.name}`
          }
        } else if (messageData.referenced_category_id) {
          const { data: category } = await supabase
            .from("categories")
            .select("name")
            .eq("id", messageData.referenced_category_id)
            .single()

          if (category) {
            notificationContent = `New message referencing folder: ${category.name}`
          }
        }

        if (notificationContent) {
          const notifications = profiles.map((profile) => ({
            user_id: profile.id,
            content: notificationContent,
            type: "file_reference",
            related_id: data.id,
          }))

          await supabase.from("notifications").insert(notifications)
        }
      }
    }

    return data
  } catch (error: any) {
    console.error("Error creating message:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to create message",
      variant: "destructive",
    })
    throw error
  }
}

export async function updateMessage(id: string, messageData: UpdateTables<"posts">) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("posts").update(messageData).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Error updating message:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update message",
      variant: "destructive",
    })
    throw error
  }
}

export async function deleteMessage(id: string) {
  const supabase = createClient()

  try {
    // Delete associated comments first
    const { error: commentsError } = await supabase.from("comments").delete().eq("post_id", id)

    if (commentsError) {
      console.warn("Error deleting comments:", commentsError)
    }

    // Delete message
    const { error } = await supabase.from("posts").delete().eq("id", id)

    if (error) {
      throw error
    }

    // Delete related notifications
    await supabase.from("notifications").delete().eq("related_id", id)

    return true
  } catch (error: any) {
    console.error("Error deleting message:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete message",
      variant: "destructive",
    })
    throw error
  }
}

export async function getMessageById(id: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", id)
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Error fetching message:", error)
    throw error
  }
}

export async function getAllMessages(isAdminOnly = false) {
  const supabase = createClient()

  try {
    // Get current user's role
    const { data: { session } } = await supabase.auth.getSession()
    let isAdmin = false
    if (session?.user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()
      isAdmin = profile?.role === "core_admin" || profile?.role === "superadmin"
    }

    let query = supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })

    if (isAdminOnly) {
      query = query.eq("is_admin_post", true)
    } else if (!isAdmin) {
      // For non-admin users, exclude admin posts
      query = query.eq("is_admin_post", false)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    throw error
  }
}

export async function isUserAdmin() {
  const supabase = createClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    return profile && (profile.role === "core_admin" || profile.role === "superadmin")
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

export async function canUserModifyMessage(messageId: string) {
  const supabase = createClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    // Get the message
    const { data: message } = await supabase.from("posts").select("author_id").eq("id", messageId).single()

    // User can modify their own messages
    if (message && message.author_id === session.user.id) {
      return true
    }

    // Check if user is an admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    return profile && (profile.role === "core_admin" || profile.role === "superadmin")
  } catch (error) {
    console.error("Error checking message permissions:", error)
    return false
  }
}

