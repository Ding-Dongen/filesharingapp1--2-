"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Upload, X, FileText, Loader2 } from "lucide-react"
import { uploadFileWithProgress } from "@/lib/supabase/storage-utils"
import { createClient } from "@/lib/supabase/client"
import { createFile } from "@/lib/client-actions/file-actions"

interface FileUploaderProps {
  onSuccess?: (fileData: any) => void
  onCancel?: () => void
  maxSizeMB?: number
  allowedTypes?: string[]
  categoryId?: string | null
}

export function FileUploader({
  onSuccess,
  onCancel,
  maxSizeMB = 50, // Default 50MB max
  allowedTypes,
  categoryId = null,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file size
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds the maximum allowed size (${maxSizeMB}MB)`)
        return
      }

      // Check file type if restrictions provided
      if (allowedTypes && allowedTypes.length > 0) {
        const fileType = selectedFile.type
        if (!allowedTypes.some((type) => fileType.includes(type))) {
          setError(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`)
          return
        }
      }

      setFile(selectedFile)

      // Auto-fill name from filename if empty
      if (!name) {
        const fileName = selectedFile.name.split(".")[0]
        setName(fileName)
      }
    }
  }

  const resetForm = () => {
    setFile(null)
    setName("")
    setDescription("")
    setProgress(0)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    if (!name.trim()) {
      setError("Please provide a name for the file")
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to upload files")
      }

      // Generate a unique file path
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      // Upload file to Supabase Storage with progress tracking
      const { data, error: uploadError } = await uploadFileWithProgress(file, filePath, {
        onProgress: (event) => {
          setProgress(event.progress)
        },
      })

      if (uploadError) {
        throw uploadError
      }

      // Create file record in database
      const fileData = await createFile({
        name,
        description,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category_id: categoryId,
        uploaded_by: session.user.id,
      })

      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded and is now available",
      })

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(fileData)
      }

      resetForm()
    } catch (error: any) {
      console.error("Upload error:", error)
      setError(error.message || "Failed to upload file")
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Click to select or drag and drop a file</p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {maxSizeMB}MB
              {allowedTypes && ` • Allowed types: ${allowedTypes.join(", ")}`}
            </p>
            <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "Unknown type"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={uploading}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="File name"
            disabled={uploading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="File description (optional)"
            disabled={uploading}
          />
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Uploading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading || !name.trim()}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

