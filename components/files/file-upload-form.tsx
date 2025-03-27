"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"

export function FileUploadForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategoryId = searchParams.get("category")

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId)
  const [file, setFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) {
        throw error
      }

      setCategories(data || [])
    } catch (error: any) {
      console.error("Error loading categories:", error)
      setError("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Auto-fill name if not already set
      if (!name) {
        setName(selectedFile.name.split(".")[0])
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a file to upload")
      return
    }

    if (!name.trim()) {
      setError("File name is required")
      return
    }

    setError(null)
    setUploading(true)

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
      const filePath = `${uuidv4()}.${fileExt}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage.from("files").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Create file record in database
      const { error: dbError } = await supabase.from("files").insert({
        name,
        description: description || null,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category_id: categoryId,
        uploaded_by: session.user.id,
      })

      if (dbError) {
        // If database insert fails, try to delete the uploaded file
        await supabase.storage.from("files").remove([filePath])
        throw dbError
      }

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      })

      // Redirect back to files page
      router.push(categoryId ? `/files?category=${categoryId}` : "/files")
    } catch (error: any) {
      console.error("Error uploading file:", error)
      setError(error.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input id="file" type="file" onChange={handleFileChange} disabled={uploading} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">File Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter file name"
              disabled={uploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter file description"
              rows={3}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Folder (Optional)</Label>
            <Select
              value={categoryId || ""}
              onValueChange={(value) => setCategoryId(value === "" ? null : value)}
              disabled={uploading || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No folder)</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={uploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

