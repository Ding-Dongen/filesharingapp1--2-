"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Send } from "lucide-react"
import { SimpleFileSelector } from "@/components/files/simple-file-selector"
import { createComment } from "@/lib/client-actions/comment-actions"
import type { Tables } from "@/lib/supabase/database.types"

interface CommentFormProps {
  postId: string
  onSuccess?: () => void
}

export function CommentForm({ postId, onSuccess }: CommentFormProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [referencedFileId, setReferencedFileId] = useState<string | null>(null)
  const [referencedCategoryId, setReferencedCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await createComment({
        post_id: postId,
        content,
        referenced_file_id: referencedFileId,
        referenced_category_id: referencedCategoryId,
      })

      setContent("")
      setReferencedFileId(null)
      setReferencedCategoryId(null)

      toast({
        title: "Success",
        description: "Your comment has been added",
      })

      if (onSuccess) {
        onSuccess()
      }

      router.refresh()
    } catch (error: any) {
      console.error("Error creating comment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFile = (file: Tables<"files">) => {
    setReferencedFileId(file.id)
    setReferencedCategoryId(null)
  }

  const handleSelectCategory = (category: Tables<"categories">) => {
    setReferencedCategoryId(category.id)
    setReferencedFileId(null)
  }

  const handleClearReference = () => {
    setReferencedFileId(null)
    setReferencedCategoryId(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Write your comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
        rows={4}
      />

      <div className="space-y-2">
        <Label>Reference a File or Folder (Optional)</Label>
        <div className="border rounded-md p-4 bg-muted/30">
          <SimpleFileSelector
            onSelectFile={handleSelectFile}
            onSelectCategory={handleSelectCategory}
            onClearSelection={handleClearReference}
            selectedFileId={referencedFileId}
            selectedCategoryId={referencedCategoryId}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Reference a file or folder to provide context for your comment. Click the button above to browse or search.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Comment
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

