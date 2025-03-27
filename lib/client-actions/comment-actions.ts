"use client"

import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { Tables, UpdateTables } from "@/lib/supabase/database.types"

export async function createComment(
  commentData: Omit<Tables<"comments">, "id" | "created_at" | "updated_at" | "user_id">,
) {
  const supabase = createClient()

  try {
    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to comment")
    }

    // Create comment
    const { data, error } = await supabase
      .from("comments")
      .insert({
        ...commentData,
        user_id: session.user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create notification for the post author
    const { data: post } = await supabase
      .from("posts")
      .select("author_id, title")
      .eq("id", commentData.post_id)
      .single()

    if (post && post.author_id && post.author_id !== session.user.id) {
      await supabase.from("notifications").insert({
        user_id: post.author_id,
        content: `New comment on your message: ${post.title}`,
        type: "comment",
        related_id: commentData.post_id,
      })
    }

    return data
  } catch (error: any) {
    console.error("Error creating comment:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to create comment",
      variant: "destructive",
    })
    throw error
  }
}

export async function updateComment(id: string, data: UpdateTables<"comments">) {
  const supabase = createClient()

  try {
    const { data: updatedComment, error } = await supabase.from("comments").update(data).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return updatedComment
  } catch (error: any) {
    console.error("Error updating comment:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update comment",
      variant: "destructive",
    })
    throw error
  }
}

export async function deleteComment(id: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("comments").delete().eq("id", id)

    if (error) {
      throw error
    }

    return true
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete comment",
      variant: "destructive",
    })
    throw error
  }
}

export async function getCommentsByPostId(postId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error: any) {
    console.error("Error fetching comments:", error)
    throw error
  }
}

export async function canUserModifyComment(commentId: string) {
  const supabase = createClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    // Get the comment
    const { data: comment } = await supabase.from("comments").select("user_id").eq("id", commentId).single()

    // User can modify their own comments
    if (comment && comment.user_id === session.user.id) {
      return true
    }

    // Check if user is an admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    return profile && (profile.role === "core_admin" || profile.role === "superadmin")
  } catch (error) {
    console.error("Error checking comment permissions:", error)
    return false
  }
}

