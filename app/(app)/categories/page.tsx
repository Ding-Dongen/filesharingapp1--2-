"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import type { Tables } from "@/lib/supabase/database.types"
import { FolderOpen, Plus, Pencil, Trash2, Loader2, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createCategory, updateCategory, deleteCategory } from "@/lib/client-actions/category-actions"
import { CategoryForm } from "@/components/categories/category-form"
import { Badge } from "@/components/ui/badge"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Tables<"categories">[]>([])
  const [user, setUser] = useState<Tables<"profiles"> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Tables<"categories"> | undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: userData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        if (userData) {
          setUser(userData)
        }
      }

      // Fetch categories
      const { data } = await supabase.from("categories").select("*").order("name")

      if (data) {
        setCategories(data)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id)

      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      })

      // Remove category from list
      setCategories(categories.filter((cat) => cat.id !== id))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCategoryCreated = async () => {
    // Refresh categories
    const { data } = await supabase.from("categories").select("*").order("name")
    if (data) {
      setCategories(data)
    }
  }

  // Check if user is admin
  const isAdmin = user?.role === "core_admin" || user?.role === "superadmin"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You need to be a core admin or superadmin to manage categories.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage file categories</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>Create a new category to organize your files.</DialogDescription>
            </DialogHeader>
            <CategoryForm onSuccess={handleCategoryCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{category.name}</CardTitle>
                {category.admin_only && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              {category.description && <CardDescription>{category.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created on {new Date(category.created_at).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>Update the category details.</DialogDescription>
                  </DialogHeader>
                  <CategoryForm 
                    category={editingCategory} 
                    onSuccess={() => {
                      handleCategoryCreated()
                      setEditingCategory(undefined)
                    }}
                    onCancel={() => setEditingCategory(undefined)}
                  />
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this category? This action cannot be undone. All files in this category will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(category.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No categories found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create a category to organize your files</p>
          </div>
        )}
      </div>
    </div>
  )
}

