"use client"

import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"

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
  options?: UploadOptions,
): Promise<{ path: string; error: any }> {
  const supabase = createClient()

  try {
    // Generate a unique file path
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${fileName}`

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
    const { error } = await supabase.storage.from("files").upload(filePath, file, uploadOptions)

    if (error) {
      console.error("Upload error:", error)
      throw error
    }

    return { path: filePath, error: null }
  } catch (error: any) {
    console.error("Upload error:", error)
    return { path: "", error }
  }
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(path: string, filename?: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Get a signed URL for the file
    const { data, error } = await supabase.storage.from("files").createSignedUrl(path, 60)

    if (error || !data?.signedUrl) {
      console.error("Download error:", error)
      throw new Error("Failed to generate download URL")
    }

    // Create an anchor element and trigger download
    const link = document.createElement("a")
    link.href = data.signedUrl
    link.download = filename || path.split("/").pop() || "download"
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
 * Get file metadata from storage
 */
export async function getFileMetadata(path: string): Promise<any | null> {
  const supabase = createClient()

  try {
    // This is a workaround since Supabase doesn't have a direct method to get metadata
    // We'll create a short-lived signed URL and check if it exists
    const { data, error } = await supabase.storage.from("files").createSignedUrl(path, 1)

    if (error) {
      throw error
    }

    return {
      exists: !!data,
      path,
      signedUrl: data?.signedUrl,
    }
  } catch (error) {
    console.error("Metadata error:", error)
    return null
  }
}

