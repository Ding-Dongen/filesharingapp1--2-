"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { SimpleFileSelector } from "@/components/files/simple-file-selector"
import { createMessage, updateMessage } from "@/lib/client-actions/message-actions"
import type { Tables } from "@/lib/supabase/database.types"

interface MessageFormProps {
  message?: Tables<"posts">
  isAdmin?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function MessageForm({ message, isAdmin = false, onSuccess, onCancel }: MessageFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(message?.title || "")
  const [content, setContent] = useState(message?.content || "")
  const [isAdminPost, setIsAdminPost] = useState(message?.is_admin_post || false)
  const [referencedFileId, setReferencedFileId] = useState<string | null>(message?.referenced_file_id || null)
  const [referencedCategoryId, setReferencedCategoryId] = useState<string | null>(
    message?.referenced_category_id || null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (!content.trim()) {
      setError("Content is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isEditing) {
        await updateMessage(message.id, {
          title,
          content,
          is_admin_post: isAdminPost,
          referenced_file_id: referencedFileId,
          referenced_category_id: referencedCategoryId,
        })

        toast({
          title: "Message updated",
          description: "Your message has been updated successfully",
        })
      } else {
        await createMessage({
          title,
          content,
          is_admin_post: isAdminPost,
          referenced_file_id: referencedFileId,
          referenced_category_id: referencedCategoryId,
        })

        toast({
          title: "Message created",
          description: "Your message has been created successfully",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/messages")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error saving message:", error)
      setError(error.message || "Failed to save message")
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
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Message" : "Create Message"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter message title"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter message content"
              rows={6}
              disabled={loading}
              required
            />
          </div>

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
                Reference a file or folder to provide context for your message. Click the button above to browse or
                search.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Switch id="admin-post" checked={isAdminPost} onCheckedChange={setIsAdminPost} disabled={loading} />
              <Label htmlFor="admin-post">Mark as announcement</Label>
            </div>
          )}

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
              "Update Message"
            ) : (
              "Create Message"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

