"use client"

import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

// Types for upload progress tracking
export interface UploadProgressEvent {
  progress: number
  bytesUploaded: number
  totalBytes: number
}

export interface UploadOptions {
  onProgress?: (event: UploadProgressEvent) => void
  cacheControl?: string
  upsert?: boolean
}

/**
 * Upload a file to Supabase Storage with progress tracking
 */
export async function uploadFileWithProgress(
  file: File,
  path: string,
  options?: UploadOptions,
): Promise<{ data: any; error: any }> {
  const supabase = createClient()

  try {
    // Create upload options
    const uploadOptions: any = {
      cacheControl: options?.cacheControl || "3600",
      upsert: options?.upsert || false,
    }

    // Add progress tracking if callback provided
    if (options?.onProgress) {
      uploadOptions.onUploadProgress = (progressEvent: any) => {
        const progress = (progressEvent.loaded / progressEvent.total) * 100
        options.onProgress?.({
          progress,
          bytesUploaded: progressEvent.loaded,
          totalBytes: progressEvent.total,
        })
      }
    }

    // Perform the upload
    const { data, error } = await supabase.storage.from("files").upload(path, file, uploadOptions)

    if (error) {
      console.error("Upload error:", error)
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Upload error:", error)
    return { data: null, error }
  }
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(path: string, filename?: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Remove the files/ prefix if it exists
    const cleanPath = path.replace(/^files\//, "")

    // Try to get a signed URL directly - this will fail if the file doesn't exist
    const { data, error } = await supabase.storage.from("files").createSignedUrl(cleanPath, 60)

    if (error || !data?.signedUrl) {
      console.error("Download error:", error)
      throw new Error(error?.message || "File not found in storage")
    }

    // Create an anchor element and trigger download
    const link = document.createElement("a")
    link.href = data.signedUrl
    link.download = filename || cleanPath.split("/").pop() || "download"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (error: any) {
    console.error("Download error:", error)
    toast({
      title: "Download failed",
      description: error.message || "Failed to download file",
      variant: "destructive",
    })
    return false
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteStorageFile(path: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage.from("files").remove([path])

    if (error) {
      console.error("Delete error:", error)
      throw error
    }

    return true
  } catch (error: any) {
    console.error("Delete error:", error)
    toast({
      title: "Delete failed",
      description: error.message || "Failed to delete file",
      variant: "destructive",
    })
    return false
  }
}

/**
 * Get a public URL for a file
 */
export function getPublicFileUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from("files").getPublicUrl(path)
  return data.publicUrl
}

/**
 * Get a temporary signed URL for a file
 */
export async function getSignedFileUrl(path: string, expiresIn = 60): Promise<string | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage.from("files").createSignedUrl(path, expiresIn)

    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error)
      throw error
    }

    return data.signedUrl
  } catch (error) {
    console.error("Signed URL error:", error)
    return null
  }
}

/**
 * List all files in a folder
 */
export async function listFiles(folder?: string): Promise<any[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage.from("files").list(folder || "")

    if (error) {
      console.error("List files error:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("List files error:", error)
    return []
  }
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(path: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Try to get file metadata
    const { data, error } = await supabase.storage.from("files").createSignedUrl(path, 1) // Short expiry to just check existence

    return !error && !!data
  } catch (error) {
    return false
  }
}

