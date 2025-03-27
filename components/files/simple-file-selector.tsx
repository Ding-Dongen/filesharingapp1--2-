"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Folder, File, X } from "lucide-react"
import { createSimpleClient } from "@/lib/supabase/simple-client"
import type { Tables } from "@/lib/supabase/database.types"

interface SimpleFileSelectorProps {
  onSelectFile?: (file: Tables<"files">) => void
  onSelectCategory?: (category: Tables<"categories">) => void
  onClearSelection?: () => void
  selectedFileId?: string | null
  selectedCategoryId?: string | null
}

export function SimpleFileSelector({
  onSelectFile,
  onSelectCategory,
  onClearSelection,
  selectedFileId,
  selectedCategoryId,
}: SimpleFileSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [categories, setCategories] = useState<Tables<"categories">[]>([])
  const [selectedFile, setSelectedFile] = useState<Tables<"files"> | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Tables<"categories"> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Load all data when dialog opens
  useEffect(() => {
    if (open) {
      loadAllData()
    }
  }, [open])

  // Load selected items if IDs are provided
  useEffect(() => {
    const loadSelectedItems = async () => {
      try {
        const supabase = createSimpleClient()

        if (selectedFileId) {
          const { data, error } = await supabase.from("files").select("*").eq("id", selectedFileId).single()

          if (error) throw error
          if (data) setSelectedFile(data)
        } else {
          setSelectedFile(null)
        }

        if (selectedCategoryId) {
          const { data, error } = await supabase.from("categories").select("*").eq("id", selectedCategoryId).single()

          if (error) throw error
          if (data) setSelectedCategory(data)
        } else {
          setSelectedCategory(null)
        }
      } catch (err) {
        console.error("Error loading selected items:", err)
      }
    }

    loadSelectedItems()
  }, [selectedFileId, selectedCategoryId])

  const loadAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Loading all files and categories for selector...")
      const supabase = createSimpleClient()

      // Check if user is admin
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
        
        setIsAdmin(profile?.role === "core_admin" || profile?.role === "superadmin")
      }

      // Load all files
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .order("name")

      if (filesError) throw new Error(`Failed to load files: ${filesError.message}`)

      console.log("Files loaded for selector:", filesData?.length || 0)
      setFiles(filesData || [])

      // Load all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (categoriesError) throw new Error(`Failed to load categories: ${categoriesError.message}`)

      // Filter out admin-only categories for non-admin users
      const filteredCategories = isAdmin 
        ? categoriesData 
        : categoriesData?.filter(category => !category.admin_only) || []

      console.log("Categories loaded for selector:", filteredCategories.length)
      setCategories(filteredCategories)
    } catch (err: any) {
      console.error("Error loading data for selector:", err)
      setError(err.message || "Failed to load files and categories")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFile = (file: Tables<"files">) => {
    setSelectedFile(file)
    setSelectedCategory(null)
    if (onSelectFile) {
      onSelectFile(file)
    }
    setOpen(false)
  }

  const handleSelectCategory = (category: Tables<"categories">) => {
    setSelectedCategory(category)
    setSelectedFile(null)
    if (onSelectCategory) {
      onSelectCategory(category)
    }
    setOpen(false)
  }

  const handleClearSelection = () => {
    setSelectedFile(null)
    setSelectedCategory(null)
    if (onClearSelection) {
      onClearSelection()
    }
  }

  return (
    <div>
      {selectedFile || selectedCategory ? (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          {selectedFile && (
            <>
              <File className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
            </>
          )}

          {selectedCategory && (
            <>
              <Folder className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">{selectedCategory.name}</span>
            </>
          )}

          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={handleClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <File className="mr-2 h-4 w-4" />
              Reference a file or folder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Select a file or folder</DialogTitle>
              <DialogDescription>Choose a file or folder to reference in your message.</DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={loadAllData}>Retry</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Folders</h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {categories.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No folders found</p>
                    ) : (
                      categories.map((category) => (
                        <Card
                          key={category.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleSelectCategory(category)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <Folder className="h-5 w-5 text-blue-500" />
                            <span>{category.name}</span>
                            {category.admin_only && (
                              <span className="ml-auto text-xs text-muted-foreground">Admin only</span>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Files</h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {files.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No files found</p>
                    ) : (
                      files.map((file) => (
                        <Card
                          key={file.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleSelectFile(file)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <File className="h-5 w-5 text-blue-500" />
                            <span>{file.name}</span>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

