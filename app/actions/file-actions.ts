"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { deleteFile } from "@/lib/supabase/storage"
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

  revalidatePath("/files")
  return data
}

export async function updateFile(id: string, fileData: Partial<Tables<"files">>) {
  const supabase = createClient()

  const { data, error } = await supabase.from("files").update(fileData).eq("id", id).select().single()

  if (error) {
    throw new Error(`Error updating file: ${error.message}`)
  }

  revalidatePath("/files")
  return data
}

export async function deleteFileRecord(id: string) {
  const supabase = createClient()

  // Get file path first
  const { data: file } = await supabase.from("files").select("file_path").eq("id", id).single()

  if (!file) {
    throw new Error("File not found")
  }

  // Delete from storage
  try {
    await deleteFile(file.file_path)
  } catch (error) {
    console.error("Error deleting file from storage:", error)
    // Continue with database deletion even if storage deletion fails
  }

  // Delete from database
  const { error } = await supabase.from("files").delete().eq("id", id)

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }

  revalidatePath("/files")
  return true
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

