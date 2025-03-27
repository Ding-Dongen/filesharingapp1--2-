"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Upload, X, FileText, Loader2 } from "lucide-react"
import { uploadFileWithProgress } from "@/lib/supabase/storage-helpers"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/database.types"

interface EnhancedFileUploaderProps {
  categoryId?: string | null
  onSuccess?: (fileData: Tables<"files">) => void
  onCancel?: () => void
  maxSizeMB?: number
  allowedTypes?: string[]
}

export function EnhancedFileUploader({
  categoryId = null,
  onSuccess,
  onCancel,
  maxSizeMB = 100, // Default 100MB max
  allowedTypes,
}: EnhancedFileUploaderProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryId)
  const [categories, setCategories] = useState<Tables<"categories">[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) {
        throw error
      }

      setCategories(data || [])
    } catch (error: any) {
      console.error("Error loading categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Load categories on mount
  useState(() => {
    loadCategories()
  })

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

      // Upload file to Supabase Storage with progress tracking
      const { path: filePath, error: uploadError } = await uploadFileWithProgress(file, {
        onProgress: (event) => {
          setProgress(event.progress)
        },
      })

      if (uploadError) {
        throw uploadError
      }

      // Create file record in database
      const { data, error: dbError } = await supabase
        .from("files")
        .insert({
          name,
          description: description || null,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          category_id: selectedCategoryId,
          uploaded_by: session.user.id,
        })
        .select()
        .single()

      if (dbError) {
        // If database insert fails, try to delete the uploaded file
        await supabase.storage.from("files").remove([filePath])
        throw dbError
      }

      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded and is now available",
      })

      // Call success callback if provided
      if (onSuccess && data) {
        onSuccess(data)
      } else {
        // Redirect to files page
        router.push(selectedCategoryId ? `/files?category=${selectedCategoryId}` : "/files")
        router.refresh()
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
    } else {
      router.back()
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
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="File description (optional)"
            disabled={uploading}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Folder</Label>
          <Select
            value={selectedCategoryId || "none"}
            onValueChange={(value) => setSelectedCategoryId(value === "none" ? null : value)}
            disabled={uploading || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Root (No folder)</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

