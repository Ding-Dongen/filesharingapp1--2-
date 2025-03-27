import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileId = searchParams.get("id")

  if (!fileId) {
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

  try {
    // Get file details
    const { data: file, error: fileError } = await supabase.from("files").select("*").eq("id", fileId).single()

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Generate download URL
    const { data, error } = await supabase.storage.from("files").createSignedUrl(file.file_path, 60)

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
    }

    // Return the signed URL
    return NextResponse.json({ url: data.signedUrl, fileName: file.name })
  } catch (error: any) {
    console.error("Download error:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

