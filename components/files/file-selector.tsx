"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search, Folder, File, FileText, FileImage, FileVideo, FileAudio, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/database.types"

interface FileSelectorProps {
  onSelectFile?: (file: Tables<"files">) => void
  onSelectCategory?: (category: Tables<"categories">) => void
  onClearSelection?: () => void
  selectedFileId?: string | null
  selectedCategoryId?: string | null
}

export function FileSelector({
  onSelectFile,
  onSelectCategory,
  onClearSelection,
  selectedFileId,
  selectedCategoryId,
}: FileSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [categories, setCategories] = useState<Tables<"categories">[]>([])
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<Tables<"files"> | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Tables<"categories"> | null>(null)

  const supabase = createClient()

  // Load initial data
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, currentCategory])

  // Load selected items if IDs are provided
  useEffect(() => {
    const loadSelectedItems = async () => {
      if (selectedFileId) {
        const { data } = await supabase.from("files").select("*").eq("id", selectedFileId).single()

        if (data) {
          setSelectedFile(data)
        }
      } else {
        setSelectedFile(null)
      }

      if (selectedCategoryId) {
        const { data } = await supabase.from("categories").select("*").eq("id", selectedCategoryId).single()

        if (data) {
          setSelectedCategory(data)
        }
      } else {
        setSelectedCategory(null)
      }
    }

    loadSelectedItems()
  }, [selectedFileId, selectedCategoryId, supabase])

  const loadData = async () => {
    setLoading(true)
    console.log("Loading data for category:", currentCategory)

    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", currentCategory)
        .order("name")

      if (categoriesError) {
        console.error("Error loading categories:", categoriesError)
        throw categoriesError
      }

      console.log("Loaded categories:", categoriesData)
      setCategories(categoriesData || [])

      // Load files
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("category_id", currentCategory)
        .order("name")

      if (filesError) {
        console.error("Error loading files:", filesError)
        throw filesError
      }

      console.log("Loaded files:", filesData)
      setFiles(filesData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("Searching for:", searchQuery)

    try {
      // Search categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .ilike("name", `%${searchQuery}%`)
        .order("name")

      if (categoriesError) {
        console.error("Error searching categories:", categoriesError)
        throw categoriesError
      }

      console.log("Search results - categories:", categoriesData)
      setCategories(categoriesData || [])

      // Search files
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("*")
        .ilike("name", `%${searchQuery}%`)
        .order("name")

      if (filesError) {
        console.error("Error searching files:", filesError)
        throw filesError
      }

      console.log("Search results - files:", filesData)
      setFiles(filesData || [])
    } catch (error) {
      console.error("Error during search:", error)
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
    if (onSelectCategory) {
      setSelectedCategory(category)
      setSelectedFile(null)
      onSelectCategory(category)
      setOpen(false)
    } else {
      // Navigate to this category
      setCurrentCategory(category.id)
    }
  }

  const handleClearSelection = () => {
    setSelectedFile(null)
    setSelectedCategory(null)
    if (onClearSelection) {
      onClearSelection()
    }
  }

  const navigateUp = async () => {
    if (!currentCategory) return

    try {
      const { data } = await supabase.from("categories").select("parent_id").eq("id", currentCategory).single()

      setCurrentCategory(data?.parent_id)
    } catch (error) {
      console.error("Error navigating up:", error)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <FileImage className="h-5 w-5 text-blue-500" />
    } else if (fileType.startsWith("video/")) {
      return <FileVideo className="h-5 w-5 text-red-500" />
    } else if (fileType.startsWith("audio/")) {
      return <FileAudio className="h-5 w-5 text-green-500" />
    } else {
      return <FileText className="h-5 w-5 text-orange-500" />
    }
  }

  return (
    <div>
      {selectedFile || selectedCategory ? (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          {selectedFile && (
            <>
              {getFileIcon(selectedFile.file_type)}
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

            <Tabs defaultValue="browse">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse">Browse</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{currentCategory ? "Current folder" : "Root folder"}</h3>

                  {currentCategory && (
                    <Button variant="ghost" size="sm" onClick={navigateUp}>
                      Go up
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[300px] rounded-md border">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {categories.length === 0 && files.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No files or folders found</p>
                      ) : (
                        <>
                          {categories.map((category) => (
                            <Card
                              key={category.id}
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => handleSelectCategory(category)}
                            >
                              <CardContent className="p-3 flex items-center gap-3">
                                <Folder className="h-5 w-5 text-blue-500" />
                                <span>{category.name}</span>
                              </CardContent>
                            </Card>
                          ))}

                          {files.map((file) => (
                            <Card
                              key={file.id}
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => handleSelectFile(file)}
                            >
                              <CardContent className="p-3 flex items-center gap-3">
                                {getFileIcon(file.file_type)}
                                <span>{file.name}</span>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {onSelectCategory && currentCategory && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      const { data } = await supabase.from("categories").select("*").eq("id", currentCategory).single()

                      if (data) {
                        handleSelectCategory(data)
                      }
                    }}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Select current folder
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="search">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search files and folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] rounded-md border">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="p-4 space-y-2">
                        {categories.length === 0 && files.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No files or folders found</p>
                        ) : (
                          <>
                            {/* Show categories/folders first */}
                            {categories.map((category) => (
                              <Card
                                key={category.id}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => handleSelectCategory(category)}
                              >
                                <CardContent className="p-3 flex items-center gap-3">
                                  <Folder className="h-5 w-5 text-blue-500" />
                                  <span>{category.name}</span>
                                </CardContent>
                              </Card>
                            ))}

                            {/* Then show files */}
                            {files.map((file) => (
                              <Card
                                key={file.id}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => handleSelectFile(file)}
                              >
                                <CardContent className="p-3 flex items-center gap-3">
                                  {getFileIcon(file.file_type)}
                                  <span>{file.name}</span>
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

