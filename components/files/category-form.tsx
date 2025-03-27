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
import { Loader2, FolderPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CategoryFormProps {
  category?: any
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialParentId = searchParams.get("parent")

  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [parentId, setParentId] = useState<string | null>(category?.parent_id || initialParentId)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!category

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

      // Filter out the current category (if editing) to prevent circular references
      const filteredCategories = isEditing ? data?.filter((c) => c.id !== category.id) || [] : data || []

      setCategories(filteredCategories)
    } catch (error: any) {
      console.error("Error loading categories:", error)
      setError("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Folder name is required")
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to create folders")
      }

      if (isEditing) {
        // Update existing category
        const { error: updateError } = await supabase
          .from("categories")
          .update({
            name,
            description: description || null,
            parent_id: parentId,
          })
          .eq("id", category.id)

        if (updateError) {
          throw updateError
        }

        toast({
          title: "Folder updated",
          description: "The folder has been updated successfully",
        })
      } else {
        // Create new category
        const { error: createError } = await supabase.from("categories").insert({
          name,
          description: description || null,
          parent_id: parentId,
          created_by: session.user.id,
        })

        if (createError) {
          throw createError
        }

        toast({
          title: "Folder created",
          description: "The folder has been created successfully",
        })
      }

      // Redirect back to files page
      router.push(parentId ? `/files?category=${parentId}` : "/files")
    } catch (error: any) {
      console.error("Error saving folder:", error)
      setError(error.message || "Failed to save folder")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Folder" : "Create Folder"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter folder description"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Parent Folder (Optional)</Label>
            <Select
              value={parentId || ""}
              onValueChange={(value) => setParentId(value === "" ? null : value)}
              disabled={submitting || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Root (No parent)</SelectItem>
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
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <FolderPlus className="mr-2 h-4 w-4" />
                {isEditing ? "Update Folder" : "Create Folder"}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

