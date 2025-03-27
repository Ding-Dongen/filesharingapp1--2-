"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Folder, Loader2, Shield } from "lucide-react"
import { FileList } from "@/components/files/file-list"
import { Badge } from "@/components/ui/badge"
import type { Tables } from "@/lib/supabase/database.types"
import { deleteFile, getFiles } from "@/app/actions/file-operations"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function FilesPage() {
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [user, setUser] = useState<Tables<"profiles"> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch user data first
  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
        if (profile) {
          setUser(profile)
        }
      }
    }
    fetchUser()
  }, [supabase])

  // Fetch data
  const fetchData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })

      if (categoriesData) {
        // Filter categories based on user role
        const isAdmin = user.role === "core_admin" || user.role === "superadmin"
        const filteredCategories = categoriesData.filter(
          (category) => !category.admin_only || isAdmin
        )
        setCategories(filteredCategories)
      }

      // Fetch files using server action
      const { files: filesData, error: filesError } = await getFiles()

      if (filesError) {
        console.error("Error fetching files:", filesError)
        setFiles([])
      } else if (filesData) {
        // Filter files based on user role and category visibility
        const isAdmin = user.role === "core_admin" || user.role === "superadmin"
        const filteredFiles = filesData.filter(
          (file) => !file.categories?.admin_only || isAdmin
        )
        setFiles(filteredFiles)
      } else {
        setFiles([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [supabase, user])

  const handleDeleteFile = async (fileId: string) => {
    try {
      console.log("Attempting to delete file:", fileId)
      const result = await deleteFile(fileId)
      
      if (result.error) {
        console.error("Error deleting file:", result.error)
        toast({
          title: "Error",
          description: "Failed to delete file",
          variant: "destructive",
        })
        return
      }

      // Update local state immediately
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      // Force a refresh of the data
      await fetchData()
      
      // Force a router refresh
      router.refresh()
      
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error) {
      console.error("Error in delete process:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const filteredFiles = selectedCategory
    ? files.filter((file) => file.category_id === selectedCategory)
    : files

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground">Browse and manage your files and categories.</p>
      </div>

      <Tabs defaultValue="all" onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
        <TabsList>
          <TabsTrigger value="all">All Files</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>{category.name}</span>
                {category.admin_only && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Files</CardTitle>
              <CardDescription>Files across all categories</CardDescription>
            </CardHeader>
            <CardContent>
              <FileList 
                files={filteredFiles} 
                emptyMessage="No files have been uploaded yet" 
                onDelete={handleDeleteFile}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
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
                <CardDescription>Files in this category</CardDescription>
              </CardHeader>
              <CardContent>
                <FileList
                  files={files.filter((file) => file.category_id === category.id)}
                  emptyMessage={`No files in ${category.name}`}
                  onDelete={handleDeleteFile}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

