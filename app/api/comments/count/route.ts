import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  try {
    const supabase = createClient()

    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)

    if (error) {
      throw error
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    console.error("Error getting comment count:", error)
    return NextResponse.json({ error: error.message || "Failed to get comment count" }, { status: 500 })
  }
}

