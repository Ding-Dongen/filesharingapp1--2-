"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getAllCategories } from "@/lib/client-actions/category-actions"
import { FileUploader } from "@/components/files/file-uploader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UploadPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const data = await getAllCategories()
        setCategories(data)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleUploadSuccess = (fileData: any) => {
    router.push(`/files/${fileData.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Upload File</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Category</CardTitle>
          <CardDescription>Choose a category for your file (optional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <FileUploader
        onSuccess={handleUploadSuccess}
        onCancel={() => router.push("/files")}
        maxSizeMB={100}
        categoryId={selectedCategory}
      />
    </div>
  )
}

