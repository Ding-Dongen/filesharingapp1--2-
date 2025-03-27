"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { updateFile } from "@/lib/client-actions/file-actions"

export default function EditFilePage() {
  const params = useParams()
  const router = useRouter()
  const [file, setFile] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Get file details
      const { data: fileData } = await supabase.from("files").select("*, categories(name)").eq("id", params.id).single()

      if (fileData) {
        setFile(fileData)
        setName(fileData.name)
        setDescription(fileData.description || "")
        setCategory(fileData.category_id || "")
      } else {
        toast({
          title: "Error",
          description: "File not found",
          variant: "destructive",
        })
        router.push("/files")
      }

      // Get categories
      const { data: categoriesData } = await supabase.from("categories").select("*").order("name")

      if (categoriesData) {
        setCategories(categoriesData)
      }

      setLoading(false)
    }

    fetchData()
  }, [params.id, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateFile(params.id as string, {
        name,
        description,
        category_id: category || null,
      })

      toast({
        title: "File updated",
        description: "The file has been updated successfully",
      })

      router.push(`/files/${params.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/files/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit File</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>File Details</CardTitle>
            <CardDescription>Update the file information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="File name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this file"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
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

            <div className="pt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <span>File type: {file.file_type}</span>
                <span className="mx-2">•</span>
                <span>Size: {(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

