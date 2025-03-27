"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

type FileRow = Database["public"]["Tables"]["files"]["Row"]
type FileUpdate = Database["public"]["Tables"]["files"]["Update"]

// 1) DELETE FILE
export async function deleteFile(fileId: FileRow["id"]) {
  console.log("Starting delete process for file:", fileId)

  try {
    // Get the cookie store
    const cookieStore = cookies()
    
    // Create the Supabase client with the cookie store
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    })

    // First check if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("Session error:", sessionError)
      throw new Error("Authentication error")
    }

    if (!session) {
      console.error("No session found")
      throw new Error("Not authenticated")
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      throw new Error("Error checking user role")
    }

    const isAdmin = profile?.role === "core_admin" || profile?.role === "superadmin"
    if (!isAdmin) {
      throw new Error("Only administrators can delete files")
    }

    // Fetch the file row from DB (to get file_path)
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("file_path")
      .eq("id", fileId)
      .single()

    if (fetchError || !file) {
      console.error("Error fetching file details:", fetchError)
      throw new Error("File not found in database")
    }

    console.log("Found file in DB with path:", file.file_path)

    // Remove from Supabase Storage (if file_path is not null)
    if (file.file_path) {
      const { error: storageError } = await supabase.storage
        .from("files")
        .remove([file.file_path])

      if (storageError) {
        console.error("Storage deletion error:", storageError)
        throw new Error(storageError.message)
      }

      console.log("Successfully removed file from storage")
    }

    // Delete the DB row
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)

    if (dbError) {
      console.error("Database deletion error:", dbError)
      throw new Error(dbError.message)
    }

    console.log("Successfully removed row from database")

    // Revalidate your files page
    revalidatePath("/files")
    console.log("Revalidated /files")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteFile process:", error)
    return { error }
  }
}

// 2) UPDATE FILE
export async function updateFile(
  id: FileRow["id"],
  data: Partial<FileUpdate>
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    })

    const {
      data: { session },
      error: authError
    } = await supabase.auth.getSession()

    if (authError || !session) {
      throw new Error("Not authenticated")
    }

    const { error } = await supabase
      .from("files")
      .update(data)
      .eq("id", id)

    if (error) {
      throw new Error(`Error updating file: ${error.message}`)
    }

    revalidatePath("/files")
    revalidatePath(`/files/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error updating file:", error)
    throw new Error(error.message || "Failed to update file")
  }
}

// 3) GET FILES BY CATEGORY
export async function getFilesByCategory(categoryId: Database["public"]["Tables"]["categories"]["Row"]["id"] | null) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    })

    let query = supabase
      .from("files")
      .select("*, categories(id, name), profiles(full_name)")
      .order("created_at", { ascending: false })

    if (categoryId) {
      query = query.eq("category_id", categoryId)
    } else {
      query = query.is("category_id", null)
    }

    const { data, error } = await query
    if (error) {
      throw new Error(`Error fetching files: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error("Error fetching files by category:", error)
    throw new Error(error.message || "Failed to fetch files")
  }
}

// 4) SEARCH FILES
export async function searchFiles(query: string, categoryId?: Database["public"]["Tables"]["categories"]["Row"]["id"] | null) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    })

    let dbQuery = supabase
      .from("files")
      .select("*, categories(id, name), profiles(full_name)")

    if (query) {
      dbQuery = dbQuery.ilike("name", `%${query}%`)
    }
    if (categoryId) {
      dbQuery = dbQuery.eq("category_id", categoryId)
    }

    const { data, error } = await dbQuery.order("created_at", { ascending: false })
    if (error) {
      throw new Error(`Error searching files: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error("Error searching files:", error)
    throw new Error(error.message || "Failed to search files")
  }
}

// 5) GET ALL FILES
export async function getFiles() {
  try {
    console.log("Fetching files from database...")
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    }, {
      options: {
        global: {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0"
          }
        }
      }
    })

    const { data: files, error } = await supabase
      .from("files")
      .select("*, categories(name, admin_only), profiles(full_name)")
      .order("created_at", { ascending: false })

    console.log("Files query result:", { files, error })

    if (error) {
      console.error("Error fetching files:", error)
      return { files: [], error }
    }

    if (!files) {
      console.log("No files found in database")
      return { files: [] }
    }

    console.log(`Found ${files.length} files in database`)
    return { files }
  } catch (error) {
    console.error("Error in getFiles:", error)
    return { files: [], error }
  }
}
