"use client"

import { createClient } from "@/lib/supabase/client"

// Client-side storage functions
export function getFileUrl(filePath: string, expiresIn = 60) {
  const supabase = createClient()
  return supabase.storage.from("files").createSignedUrl(filePath, expiresIn)
}

export function getFileUrlClient(filePath: string, expiresIn = 60) {
  const supabase = createClient()
  return supabase.storage.from("files").createSignedUrl(filePath, expiresIn)
}

export function deleteFile(filePath: string) {
  const supabase = createClient()
  return supabase.storage.from("files").remove([filePath])
}

export function uploadFile(file: File, path: string) {
  const supabase = createClient()
  return supabase.storage.from("files").upload(path, file)
}

export function getPublicUrl(filePath: string) {
  const supabase = createClient()
  const { data } = supabase.storage.from("files").getPublicUrl(filePath)
  return data.publicUrl
}

