"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import {
  Folder,
  File,
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  FileText,
  FileImage,
  FileArchive,
  FileAudio,
  FileVideo,
  FilePlus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/database.types"

interface FileBrowserProps {
  initialCategoryId?: string | null
}

export function FileBrowser({ initialCategoryId = null }: FileBrowserProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Tables<"categories">[]>([])
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [currentCategory, setCurrentCategory] = useState<Tables<"categories"> | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Tables<"categories">[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    checkAdminStatus()
    loadContent(initialCategoryId)

    // Set up real-time subscription for categories
    const categoriesSubscription = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        () => {
          loadContent(currentCategory?.id || initialCategoryId || null)
        },
      )
      .subscribe()

    // Set up real-time subscription for files
    const filesSubscription = supabase
      .channel("files-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "files",
        },
        () => {
          loadContent(currentCategory?.id || initialCategoryId || null)
        },
      )
      .subscribe()

    return () => {
      categoriesSubscription.unsubscribe()
      filesSubscription.unsubscribe()
    }
  }, [initialCategoryId, supabase])

  const checkAdminStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsAdmin(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

      setIsAdmin(profile && (profile.role === "core_admin" || profile.role === "superadmin"))
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
    }
  }

  const loadContent = async (categoryId: string | null) => {
    try {
      setLoading(true)
      console.log("Loading content for category ID:", categoryId)

      // Load subcategories
      const { data: subcategories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", categoryId)
        .order("name")

      if (categoriesError) {
        console.error("Error loading categories:", categoriesError)
        throw categoriesError
      }

      console.log("Loaded categories:", subcategories)
      setCategories(subcategories || [])

      // Load files in this category
      const { data: categoryFiles, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("category_id", categoryId)
        .order("name")

      if (filesError) {
        console.error("Error loading files:", filesError)
        throw filesError
      }

      console.log("Loaded files:", categoryFiles)
      setFiles(categoryFiles || [])

      // If we have a category ID, load the current category details
      if (categoryId) {
        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("id", categoryId)
          .single()

        if (categoryError) {
          console.error("Error loading current category:", categoryError)
          throw categoryError
        }

        setCurrentCategory(category)

        // Build breadcrumbs
        await buildBreadcrumbs(category)
      } else {
        setCurrentCategory(null)
        setBreadcrumbs([])
      }
    } catch (error: any) {
      console.error("Error loading content:", error)
      setError("Failed to load files and folders")
    } finally {
      setLoading(false)
    }
  }

  const buildBreadcrumbs = async (category: Tables<"categories">) => {
    const breadcrumbsArray: Tables<"categories">[] = [category]
    let currentParentId = category.parent_id

    while (currentParentId) {
      const { data: parentCategory } = await supabase.from("categories").select("*").eq("id", currentParentId).single()

      if (parentCategory) {
        breadcrumbsArray.unshift(parentCategory)
        currentParentId = parentCategory.parent_id
      } else {
        currentParentId = null
      }
    }

    setBreadcrumbs(breadcrumbsArray)
  }

  const navigateToCategory = (categoryId: string | null) => {
    loadContent(categoryId)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <FileImage className="h-6 w-6" />
    } else if (fileType.startsWith("audio/")) {
      return <FileAudio className="h-6 w-6" />
    } else if (fileType.startsWith("video/")) {
      return <FileVideo className="h-6 w-6" />
    } else if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("tar") ||
      fileType.includes("gz")
    ) {
      return <FileArchive className="h-6 w-6" />
    } else if (fileType.includes("pdf") || fileType.includes("doc") || fileType.includes("txt")) {
      return <FileText className="h-6 w-6" />
    } else {
      return <File className="h-6 w-6" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + " B"
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB"
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
    }
  }

  const downloadFile = async (file: Tables<"files">) => {
    try {
      const { data, error } = await supabase.storage.from("files").download(file.file_path)

      if (error) {
        throw error
      }

      // Create a download link
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error("Error downloading file:", error)
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return
    }

    try {
      const { data: file } = await supabase.from("files").select("file_path").eq("id", fileId).single()

      if (file) {
        // Delete from storage
        const { error: storageError } = await supabase.storage.from("files").remove([file.file_path])

        if (storageError) {
          console.error("Error deleting file from storage:", storageError)
        }
      }

      // Delete from database
      const { error } = await supabase.from("files").delete().eq("id", fileId)

      if (error) {
        throw error
      }

      toast({
        title: "File deleted",
        description: "The file has been deleted successfully",
      })

      // Refresh the file list
      loadContent(currentCategory?.id || null)
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => loadContent(currentCategory?.id || null)}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{currentCategory ? currentCategory.name : "All Files"}</h2>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => navigateToCategory(null)}>
                Root
              </Button>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center">
                  <span className="mx-1">/</span>
                  {index === breadcrumbs.length - 1 ? (
                    <span>{crumb.name}</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => navigateToCategory(crumb.id)}
                    >
                      {crumb.name}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          {currentCategory && (
            <Button variant="outline" onClick={() => navigateToCategory(currentCategory.parent_id)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          <Button
            onClick={() => router.push(`/files/upload${currentCategory ? `?category=${currentCategory.id}` : ""}`)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>

          {isAdmin && (
            <Button
              onClick={() => router.push(`/categories/new${currentCategory ? `?parent=${currentCategory.id}` : ""}`)}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          )}
        </div>
      </div>

      {/* Categories (folders) */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigateToCategory(category.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Folder className="h-10 w-10 text-blue-500" />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(file.file_type)}
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                      {file.description && <p className="text-sm text-muted-foreground mt-1">{file.description}</p>}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadFile(file)
                        }}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFile(file.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {categories.length > 0
              ? "No files in this folder. Upload a file or navigate to a subfolder."
              : "No files or folders found. Upload a file or create a folder."}
          </p>
        </div>
      )}
    </div>
  )
}

