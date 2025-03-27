"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Eye, Clock, User, Tag, Trash2 } from "lucide-react"
import { FileDownloader } from "@/components/files/file-downloader"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { deleteFile } from "@/app/actions/file-operations"

interface FileListProps {
  files: any[]
  emptyMessage?: string
  showDownload?: boolean
  onDelete?: (fileId: string) => void
}

export function FileList({ files, emptyMessage = "No files found", showDownload = true, onDelete }: FileListProps) {
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [localFiles, setLocalFiles] = useState(files)

  useEffect(() => {
    setLocalFiles(files)
  }, [files])

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsAdmin(false)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        setIsAdmin(profile?.role === "core_admin" || profile?.role === "superadmin" || false)
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [supabase])

  const handleDelete = async (file: any) => {
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "Only administrators can delete files",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await deleteFile(file.id)
      
      if (result.error) {
        const errorMessage = typeof result.error === 'object' && result.error !== null && 'message' in result.error
          ? String(result.error.message)
          : "Failed to delete file"
        throw new Error(errorMessage)
      }

      // Update local state
      setLocalFiles(prev => prev.filter(f => f.id !== file.id))
      
      // Call parent's onDelete if provided
      if (onDelete) {
        onDelete(file.id)
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  if (!localFiles.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {localFiles.map((file) => (
        <Card key={file.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="flex-1 overflow-hidden">
                <CardTitle className="text-lg truncate" title={file.name}>
                  {file.name}
                </CardTitle>
                {file.categories && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    <span>{file.categories.name}</span>
                  </div>
                )}
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(file)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Uploaded by {file.profiles?.full_name || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(file.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
          {showDownload && (
            <CardFooter>
              <FileDownloader 
                filePath={file.file_path}
                fileName={file.name}
                fileSize={file.file_size}
              />
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}

