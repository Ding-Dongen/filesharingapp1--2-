import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Calendar, User, FileText } from "lucide-react"
import { FilePreview } from "@/components/files/file-preview"
import { createClient } from "@/lib/supabase/server"
import { formatFileSize } from "@/lib/utils"

interface FileDetailPageProps {
  params: Promise<{
    id: string
  }>
}

const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Add structured logging
const logError = (error: any, context: string) => {
  console.error({
    timestamp: new Date().toISOString(),
    context,
    error: error.message,
    stack: error.stack
  })
}

const getFileDetails = async (id: string) => {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    // Log error
    logError(error, 'getFileDetails')
    // Return fallback data or throw
    throw new Error('Failed to load file details')
  }
}

export default async function FileDetailPage({ params }: FileDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get file details
  const { data: file, error } = await supabase
    .from("files")
    .select("*, categories(id, name, parent_id), profiles(full_name)")
    .eq("id", id)
    .single()

  if (error || !file) {
    notFound()
  }

  // Get download URL
  const { data } = await supabase.storage.from("files").createSignedUrl(file.file_path, 60)
  const downloadUrl = data?.signedUrl

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/files">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{file.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FilePreview filePath={file.file_path} fileType={file.file_type} height={500} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p>{file.description || "No description provided"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                {file.categories ? (
                  <Badge variant="outline" className="mt-1">
                    <Link href={`/files?category=${file.categories.id}`}>{file.categories.name}</Link>
                  </Badge>
                ) : (
                  <p>None</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Details</h3>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{formatFileSize(file.file_size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{file.profiles?.full_name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(file.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {downloadUrl && (
                <Button asChild className="w-full">
                  <a href={downloadUrl} download={file.name}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

