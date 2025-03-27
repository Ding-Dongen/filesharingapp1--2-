"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { getSignedFileUrl } from "@/lib/supabase/storage-helpers"
import { FileText, FileImage, FileVideo, FileAudio, File, Loader2 } from "lucide-react"

interface FilePreviewProps {
  filePath: string
  fileType: string
  className?: string
  height?: number
}

export function FilePreview({ filePath, fileType, className = "", height = 400 }: FilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true)
      try {
        const signedUrl = await getSignedFileUrl(filePath, 3600) // 1 hour expiry
        setUrl(signedUrl)
      } catch (error: any) {
        console.error("Error fetching file URL:", error)
        setError(error.message || "Failed to load file preview")
      } finally {
        setLoading(false)
      }
    }

    fetchUrl()
  }, [filePath])

  if (loading) {
    return (
      <Card className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (error || !url) {
    return (
      <Card className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Preview not available</p>
          <p className="text-xs text-muted-foreground mt-2">{error || "Could not generate preview"}</p>
        </div>
      </Card>
    )
  }

  // Determine the preview type based on file type
  const isImage = fileType.startsWith("image/")
  const isPdf = fileType === "application/pdf"
  const isVideo = fileType.startsWith("video/")
  const isAudio = fileType.startsWith("audio/")
  const isText = fileType.startsWith("text/") || fileType === "application/json" || fileType === "application/xml"

  const getFileIcon = () => {
    if (isImage) return <FileImage className="h-12 w-12 text-blue-500" />
    if (isVideo) return <FileVideo className="h-12 w-12 text-red-500" />
    if (isAudio) return <FileAudio className="h-12 w-12 text-green-500" />
    if (isPdf || isText) return <FileText className="h-12 w-12 text-orange-500" />
    return <File className="h-12 w-12 text-gray-500" />
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 overflow-hidden">
        {isImage && (
          <div className="flex items-center justify-center bg-black/5 p-2" style={{ maxHeight: height }}>
            <img
              src={url || "/placeholder.svg"}
              alt="File preview"
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: height - 16 }}
            />
          </div>
        )}

        {isPdf && <iframe src={url} className="w-full border-0" style={{ height }} title="PDF preview" />}

        {isVideo && (
          <video src={url} controls className="w-full max-h-full" style={{ maxHeight: height }}>
            Your browser does not support video playback.
          </video>
        )}

        {isAudio && (
          <div className="flex flex-col items-center justify-center p-8" style={{ height }}>
            {getFileIcon()}
            <audio src={url} controls className="w-full mt-4">
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {!isImage && !isPdf && !isVideo && !isAudio && (
          <div className="flex flex-col items-center justify-center p-8" style={{ height }}>
            {getFileIcon()}
            <p className="text-muted-foreground mt-4">Preview not available for this file type</p>
            <p className="text-xs text-muted-foreground mt-2">Download the file to view its contents</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

