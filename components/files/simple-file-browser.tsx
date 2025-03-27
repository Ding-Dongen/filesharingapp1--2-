"use client"

import { useState, useEffect } from "react"
import { createSimpleClient } from "@/lib/supabase/simple-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Folder, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

export function SimpleFileBrowser() {
  const [files, setFiles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        console.log("Attempting to load files and categories...")

        // Create a fresh Supabase client
        const supabase = createSimpleClient()

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/login")
          return
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        const isUserAdmin = profile?.role === "core_admin" || profile?.role === "superadmin"
        setIsAdmin(isUserAdmin || false)

        // Load categories first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name")

        if (categoriesError) {
          console.error("Error loading categories:", categoriesError)
          throw new Error(`Failed to load categories: ${categoriesError.message}`)
        }

        // Filter out admin-only categories for non-admin users
        const filteredCategories = isUserAdmin 
          ? categoriesData 
          : categoriesData?.filter(category => !category.admin_only) || []
        
        console.log("Categories loaded successfully:", filteredCategories)
        setCategories(filteredCategories)

        // Load files
        const { data: filesData, error: filesError } = await supabase
          .from("files")
          .select("*, categories(*)")
          .order("name")

        if (filesError) {
          console.error("Error loading files:", filesError)
          throw new Error(`Failed to load files: ${filesError.message}`)
        }

        // Check which files actually exist in storage
        const filesWithExistence = await Promise.all(
          (filesData || []).map(async (file) => {
            try {
              const { data } = await supabase.storage.from("files").createSignedUrl(file.file_path, 1)
              return { ...file, exists_in_storage: !!data }
            } catch (error) {
              console.warn(`File ${file.name} not found in storage:`, error)
              return { ...file, exists_in_storage: false }
            }
          })
        )

        // Filter out files that don't exist in storage and admin-only files for non-admin users
        const filteredFiles = filesWithExistence
          .filter(file => file.exists_in_storage && (isUserAdmin || !file.categories?.admin_only))
          .map(({ exists_in_storage, ...file }) => file) // Remove the exists_in_storage flag
        
        console.log("Files loaded successfully:", filteredFiles)
        setFiles(filteredFiles)
      } catch (err: any) {
        console.error("Error in loadData:", err)
        setError(err.message || "Failed to load files and categories")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return <div className="p-8 text-center">Loading files and categories...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Categories ({categories.length})</h2>
        {categories.length === 0 ? (
          <p className="text-muted-foreground">No categories found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Folder className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                    {category.admin_only && (
                      <p className="text-xs text-blue-500">Admin only</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Files ({files.length})</h2>
        {files.length === 0 ? (
          <p className="text-muted-foreground">No files found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <FileText className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.file_size / 1024 / 1024).toFixed(2)} MB • {file.file_type}
                    </p>
                    {file.description && <p className="text-sm text-muted-foreground">{file.description}</p>}
                    {file.categories?.admin_only && (
                      <p className="text-xs text-blue-500">Admin only</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

