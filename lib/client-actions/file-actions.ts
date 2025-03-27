"use client"

import { createClient } from "@/lib/supabase/client"
import { deleteStorageFile } from "@/lib/supabase/storage-utils"
import type { Tables, InsertTables } from "@/lib/supabase/database.types"

export async function createFile(fileData: InsertTables<"files">) {
  const supabase = createClient()

  const { data, error } = await supabase.from("files").insert(fileData).select().single()

  if (error) {
    throw new Error(`Error creating file: ${error.message}`)
  }

  // Create notification for all users
  const { data: profiles } = await supabase.from("profiles").select("id")

  if (profiles) {
    const notifications = profiles.map((profile) => ({
      user_id: profile.id,
      content: `New file uploaded: ${fileData.name}`,
      type: "file_upload",
      related_id: data.id,
    }))

    await supabase.from("notifications").insert(notifications)
  }

  return data
}

export async function updateFile(id: string, fileData: Partial<Tables<"files">>) {
  const supabase = createClient()

  const { data, error } = await supabase.from("files").update(fileData).eq("id", id).select().single()

  if (error) {
    throw new Error(`Error updating file: ${error.message}`)
  }

  return data
}

export async function deleteFileRecord(id: string) {
  const supabase = createClient()

  try {
    // Get file path first
    const { data: file } = await supabase.from("files").select("file_path").eq("id", id).single()

    if (!file) {
      throw new Error("File not found")
    }

    // Delete from storage
    const storageDeleted = await deleteStorageFile(file.file_path)

    if (!storageDeleted) {
      console.warn("Warning: File may not have been deleted from storage")
    }

    // Delete from database
    const { error } = await supabase.from("files").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting file: ${error.message}`)
    }

    return true
  } catch (error: any) {
    console.error("Error deleting file:", error)
    throw new Error(`Error deleting file: ${error.message}`)
  }
}

export async function getFileById(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("files")
    .select("*, categories(name), profiles(full_name)")
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`Error fetching file: ${error.message}`)
  }

  return data
}

export async function searchFiles(query: string, categoryId?: string) {
  const supabase = createClient()

  let queryBuilder = supabase.from("files").select("*, categories(name), profiles(full_name)")

  if (query) {
    queryBuilder = queryBuilder.ilike("name", `%${query}%`)
  }

  if (categoryId) {
    queryBuilder = queryBuilder.eq("category_id", categoryId)
  }

  const { data, error } = await queryBuilder.order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Error searching files: ${error.message}`)
  }

  return data || []
}

