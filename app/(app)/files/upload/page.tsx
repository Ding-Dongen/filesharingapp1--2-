import { redirect } from "next/navigation"
import { EnhancedFileUploader } from "@/components/files/enhanced-file-uploader"
import { createClient } from "@/lib/supabase/server"

interface UploadPageProps {
  searchParams: {
    category?: string
  }
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const supabase = createClient()
  const categoryId = searchParams.category || null

  // Check if the user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Upload File</h1>
      <EnhancedFileUploader categoryId={categoryId} />
    </div>
  )
}

