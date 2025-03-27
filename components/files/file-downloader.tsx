"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Download, Loader2 } from "lucide-react"
import { downloadFile } from "@/lib/supabase/storage-utils"

interface FileDownloaderProps {
  filePath: string
  fileName: string
  fileSize?: number
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  showSize?: boolean
}

export function FileDownloader({
  filePath,
  fileName,
  fileSize,
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  showSize = false,
}: FileDownloaderProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)

    try {
      const success = await downloadFile(filePath, fileName)

      if (success) {
        toast({
          title: "Download started",
          description: `${fileName} is being downloaded`,
        })
      }
    } catch (error: any) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleDownload} disabled={downloading}>
      {downloading ? (
        <>
          <Loader2 className={showIcon ? "mr-2 h-4 w-4 animate-spin" : "h-4 w-4 animate-spin"} />
          <span>Downloading...</span>
        </>
      ) : (
        <>
          {showIcon && <Download className="mr-2 h-4 w-4" />}
          <span>Download{showSize && fileSize ? ` (${(fileSize / 1024 / 1024).toFixed(2)} MB)` : ""}</span>
        </>
      )}
    </Button>
  )
}

