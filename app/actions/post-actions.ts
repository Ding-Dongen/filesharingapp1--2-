"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Tables, InsertTables } from "@/lib/supabase/database.types"

export async function createPost(postData: InsertTables<"posts">) {
  const supabase = createClient()

  const { data, error } = await supabase.from("posts").insert(postData).select().single()

  if (error) {
    throw new Error(`Error creating post: ${error.message}`)
  }

  // Create notification for all users if it's an admin post
  if (postData.is_admin_post) {
    const { data: profiles } = await supabase.from("profiles").select("id")

    if (profiles) {
      const notifications = profiles.map((profile) => ({
        user_id: profile.id,
        content: `New announcement: ${postData.title}`,
        type: "admin_announcement",
        related_id: data.id,
      }))

      await supabase.from("notifications").insert(notifications)
    }
  }

  revalidatePath("/messages")
  return data
}

export async function updatePost(id: string, postData: Partial<Tables<"posts">>) {
  const supabase = createClient()

  const { data, error } = await supabase.from("posts").update(postData).eq("id", id).select().single()

  if (error) {
    throw new Error(`Error updating post: ${error.message}`)
  }

  revalidatePath("/messages")
  return data
}

export async function deletePost(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("posts").delete().eq("id", id)

  if (error) {
    throw new Error(`Error deleting post: ${error.message}`)
  }

  revalidatePath("/messages")
  return true
}

export async function getAllPosts(isAdminOnly = false) {
  const supabase = createClient()

  let query = supabase.from("posts").select("*, profiles(full_name, role)")

  if (isAdminOnly) {
    query = query.eq("is_admin_post", true)
  } else {
    query = query.eq("is_admin_post", false)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Error fetching posts: ${error.message}`)
  }

  return data || []
}

