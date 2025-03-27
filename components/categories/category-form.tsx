"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createCategory, updateCategory } from "@/lib/client-actions/category-actions"
import type { Tables } from "@/lib/supabase/database.types"

interface CategoryFormProps {
  category?: Tables<"categories">
  onSuccess?: () => void
  onCancel?: () => void
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const router = useRouter()
  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [isAdminOnly, setIsAdminOnly] = useState(category?.admin_only || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!category

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Name is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isEditing) {
        await updateCategory(category.id, name, description, isAdminOnly)

        toast({
          title: "Category updated",
          description: "The category has been updated successfully",
        })
      } else {
        await createCategory({
          name,
          description,
          admin_only: isAdminOnly,
        })

        toast({
          title: "Category created",
          description: "The category has been created successfully",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/categories")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error saving category:", error)
      setError(error.message || "Failed to save category")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Category" : "Create Category"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter category description (optional)"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="admin-only"
              checked={isAdminOnly}
              onCheckedChange={(checked) => setIsAdminOnly(checked as boolean)}
              disabled={loading}
            />
            <Label htmlFor="admin-only">Admin-only category</Label>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel || (() => router.back())} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

