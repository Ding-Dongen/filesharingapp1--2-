import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 })
  }

  const supabase = createClient()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get file details
  const { data: file, error: fileError } = await supabase.from("files").select("*").eq("id", id).single()

  if (fileError || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  // Generate download URL
  const { data, error } = await supabase.storage.from("files").createSignedUrl(file.file_path, 60)

  if (error || !data?.signedUrl) {
    console.error("Error generating signed URL:", error)
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
  }

  // Redirect to the signed URL
  return NextResponse.redirect(data.signedUrl)
}

