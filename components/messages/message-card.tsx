"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Edit, Calendar, Send, ChevronUp, Loader2, File, Folder, ExternalLink } from "lucide-react"
import { DeleteMessageButton } from "@/components/messages/delete-message-button"
import { canUserModifyMessage } from "@/lib/client-actions/message-actions"
import { createComment } from "@/lib/client-actions/comment-actions"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { SimpleFileSelector } from "@/components/files/simple-file-selector"
import type { Tables } from "@/lib/supabase/database.types"

interface MessageCardProps {
  message: Tables<"posts"> & {
    profiles?: {
      full_name: string | null
      avatar_url: string | null
    } | null
    comment_count?: number
    referenced_file?: Tables<"files"> | null
    referenced_category?: Tables<"categories"> | null
  }
  onDelete?: () => void
}

export function MessageCard({ message, onDelete }: MessageCardProps) {
  const router = useRouter()
  const [canModify, setCanModify] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [referencedFileId, setReferencedFileId] = useState<string | null>(null)
  const [referencedCategoryId, setReferencedCategoryId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [referencedFile, setReferencedFile] = useState<Tables<"files"> | null>(null)
  const [referencedCategory, setReferencedCategory] = useState<Tables<"categories"> | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function checkPermissions() {
      try {
        setLoading(true)
        const hasPermission = await canUserModifyMessage(message.id)
        setCanModify(!!hasPermission)

        // Check login status
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setIsLoggedIn(!!session)

        // Load referenced items if needed
        if (message.referenced_file_id && !message.referenced_file) {
          const { data } = await supabase.from("files").select("*").eq("id", message.referenced_file_id).single()

          if (data) {
            setReferencedFile(data)
          }
        } else if (message.referenced_file) {
          setReferencedFile(message.referenced_file)
        }

        if (message.referenced_category_id && !message.referenced_category) {
          const { data } = await supabase
            .from("categories")
            .select("*")
            .eq("id", message.referenced_category_id)
            .single()

          if (data) {
            setReferencedCategory(data)
          }
        } else if (message.referenced_category) {
          setReferencedCategory(message.referenced_category)
        }
      } catch (error) {
        console.error("Error checking permissions:", error)
        setCanModify(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermissions()
  }, [message, supabase])

  const formattedDate = new Date(message.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const truncatedContent = message.content.length > 200 ? message.content.substring(0, 200) + "..." : message.content

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentText.trim()) {
      return
    }

    try {
      setSubmitting(true)
      await createComment({
        post_id: message.id,
        content: commentText,
        referenced_file_id: referencedFileId,
        referenced_category_id: referencedCategoryId,
      })

      setCommentText("")
      setReferencedFileId(null)
      setReferencedCategoryId(null)
      setShowCommentForm(false)

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })

      // Refresh the message list to update comment count
      if (onDelete) {
        onDelete() // Using onDelete as a refresh function
      }
    } catch (error: any) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.profiles?.avatar_url || ""} alt={message.profiles?.full_name || "User"} />
              <AvatarFallback>{message.profiles?.full_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{message.profiles?.full_name || "Anonymous User"}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                {formattedDate}
              </div>
            </div>
          </div>

          {message.is_admin_post && <Badge variant="secondary">Announcement</Badge>}
        </div>
        <CardTitle className="text-xl mt-2">
          <Link href={`/messages/${message.id}`} className="hover:underline">
            {message.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">{truncatedContent}</p>

        {/* Display file or category reference if present */}
        {(referencedFile || referencedCategory || message.referenced_file || message.referenced_category) && (
          <div className="mt-3 p-2 bg-muted rounded-md flex items-center gap-2">
            {(referencedFile || message.referenced_file) && (
              <>
                <File className="h-4 w-4 text-blue-500" />
                <Link
                  href={`/files/${referencedFile?.id || message.referenced_file?.id}`}
                  className="flex items-center gap-1 text-sm hover:underline"
                >
                  <span>{referencedFile?.name || message.referenced_file?.name}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            )}

            {(referencedCategory || message.referenced_category) && (
              <>
                <Folder className="h-4 w-4 text-blue-500" />
                <Link
                  href={`/files?category=${referencedCategory?.id || message.referenced_category?.id}`}
                  className="flex items-center gap-1 text-sm hover:underline"
                >
                  <span>{referencedCategory?.name || message.referenced_category?.name}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col pt-2">
        <div className="flex justify-between items-center w-full">
          <Button variant="ghost" size="sm" asChild className="text-sm text-muted-foreground hover:text-foreground">
            <Link href={`/messages/${message.id}`}>
              <MessageSquare className="mr-1 h-4 w-4" />
              {message.comment_count || 0} comments
            </Link>
          </Button>

          <div className="flex space-x-2">
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="text-sm"
              >
                {showCommentForm ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Comment
                  </>
                )}
              </Button>
            )}

            {!loading && canModify && (
              <>
                <Button variant="outline" size="sm" onClick={() => router.push(`/messages/${message.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <DeleteMessageButton id={message.id} size="sm" onSuccess={onDelete} />
              </>
            )}
          </div>
        </div>

        {showCommentForm && (
          <div className="mt-4 w-full">
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <Textarea
                placeholder="Write your comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
                rows={3}
                className="resize-none"
              />

              <div className="space-y-2">
                <SimpleFileSelector
                  onSelectFile={handleSelectFile}
                  onSelectCategory={handleSelectCategory}
                  onClearSelection={handleClearReference}
                  selectedFileId={referencedFileId}
                  selectedCategoryId={referencedCategoryId}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCommentForm(false)
                    setCommentText("")
                    setReferencedFileId(null)
                    setReferencedCategoryId(null)
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting || !commentText.trim()}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-3 w-3" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

