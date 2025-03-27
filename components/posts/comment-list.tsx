"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Edit, Trash2, Send, Clock, File, Folder, ExternalLink } from "lucide-react"
import {
  createComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
  canUserModifyComment,
} from "@/lib/client-actions/comment-actions"
import { FileSelector } from "@/components/files/file-selector"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/database.types"

interface CommentListProps {
  postId: string
}

export function CommentList({ postId }: CommentListProps) {
  const router = useRouter()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [referencedFileId, setReferencedFileId] = useState<string | null>(null)
  const [referencedCategoryId, setReferencedCategoryId] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editFileId, setEditFileId] = useState<string | null>(null)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    checkLoginStatus()
    fetchComments()

    // Set up real-time subscription
    const subscription = supabase
      .channel("comments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [postId, supabase])

  const checkLoginStatus = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }

  const fetchComments = async () => {
    try {
      setLoading(true)
      const data = await getCommentsByPostId(postId)

      // Fetch referenced files and categories
      const commentsWithReferences = await Promise.all(
        data.map(async (comment) => {
          let referencedFile = null
          let referencedCategory = null

          if (comment.referenced_file_id) {
            const { data: file } = await supabase
              .from("files")
              .select("*")
              .eq("id", comment.referenced_file_id)
              .single()

            referencedFile = file
          }

          if (comment.referenced_category_id) {
            const { data: category } = await supabase
              .from("categories")
              .select("*")
              .eq("id", comment.referenced_category_id)
              .single()

            referencedCategory = category
          }

          return {
            ...comment,
            referenced_file: referencedFile,
            referenced_category: referencedCategory,
          }
        }),
      )

      setComments(commentsWithReferences)
    } catch (error: any) {
      console.error("Error fetching comments:", error)
      setError("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) {
      return
    }

    try {
      setSubmitting(true)
      await createComment({
        post_id: postId,
        content: newComment,
        referenced_file_id: referencedFileId,
        referenced_category_id: referencedCategoryId,
      })

      setNewComment("")
      setReferencedFileId(null)
      setReferencedCategoryId(null)

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      return
    }

    try {
      setSubmitting(true)
      await updateComment(commentId, {
        content: editContent,
        referenced_file_id: editFileId,
        referenced_category_id: editCategoryId,
      })

      setEditingComment(null)
      setEditContent("")
      setEditFileId(null)
      setEditCategoryId(null)

      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return
    }

    try {
      setSubmitting(true)
      await deleteComment(commentId)

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = (comment: any) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
    setEditFileId(comment.referenced_file_id)
    setEditCategoryId(comment.referenced_category_id)
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

  const handleEditSelectFile = (file: Tables<"files">) => {
    setEditFileId(file.id)
    setEditCategoryId(null)
  }

  const handleEditSelectCategory = (category: Tables<"categories">) => {
    setEditCategoryId(category.id)
    setEditFileId(null)
  }

  const handleEditClearReference = () => {
    setEditFileId(null)
    setEditCategoryId(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments</h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            rows={3}
          />

          <div className="space-y-2">
            <FileSelector
              onSelectFile={handleSelectFile}
              onSelectCategory={handleSelectCategory}
              onClearSelection={handleClearReference}
              selectedFileId={referencedFileId}
              selectedCategoryId={referencedCategoryId}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-center text-muted-foreground">
              Please{" "}
              <Button variant="link" className="p-0" onClick={() => router.push("/login")}>
                log in
              </Button>{" "}
              to add a comment.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-2" onClick={fetchComments}>
            Try Again
          </Button>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isEditing={editingComment === comment.id}
              editContent={editContent}
              setEditContent={setEditContent}
              onEdit={() => handleEdit(comment.id)}
              onStartEdit={() => startEditing(comment)}
              onCancelEdit={() => setEditingComment(null)}
              onDelete={() => handleDelete(comment.id)}
              submitting={submitting}
              onSelectFile={handleEditSelectFile}
              onSelectCategory={handleEditSelectCategory}
              onClearReference={handleEditClearReference}
              selectedFileId={editFileId}
              selectedCategoryId={editCategoryId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: any
  isEditing: boolean
  editContent: string
  setEditContent: (content: string) => void
  onEdit: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  submitting: boolean
  onSelectFile: (file: Tables<"files">) => void
  onSelectCategory: (category: Tables<"categories">) => void
  onClearReference: () => void
  selectedFileId: string | null
  selectedCategoryId: string | null
}

function CommentItem({
  comment,
  isEditing,
  editContent,
  setEditContent,
  onEdit,
  onStartEdit,
  onCancelEdit,
  onDelete,
  submitting,
  onSelectFile,
  onSelectCategory,
  onClearReference,
  selectedFileId,
  selectedCategoryId,
}: CommentItemProps) {
  const [canModify, setCanModify] = useState(false)

  useEffect(() => {
    async function checkPermissions() {
      try {
        const hasPermission = await canUserModifyComment(comment.id)
        setCanModify(hasPermission)
      } catch (error) {
        console.error("Error checking permissions:", error)
        setCanModify(false)
      }
    }

    checkPermissions()
  }, [comment.id])

  const formattedDate = new Date(comment.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={comment.profiles?.avatar_url || ""} alt={comment.profiles?.full_name || "User"} />
            <AvatarFallback>{comment.profiles?.full_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{comment.profiles?.full_name || "Anonymous User"}</p>
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline mr-1 h-3 w-3" />
                  {formattedDate}
                </p>
              </div>

              {canModify && !isEditing && (
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={onStartEdit} disabled={submitting}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onDelete} disabled={submitting}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={submitting}
                  rows={3}
                />

                <div className="space-y-2">
                  <FileSelector
                    onSelectFile={onSelectFile}
                    onSelectCategory={onSelectCategory}
                    onClearSelection={onClearReference}
                    selectedFileId={selectedFileId}
                    selectedCategoryId={selectedCategoryId}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={onEdit} disabled={submitting || !editContent.trim()}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2">{comment.content}</p>

                {/* Display file or category reference if present */}
                {(comment.referenced_file || comment.referenced_category) && (
                  <div className="mt-3 p-2 bg-muted rounded-md flex items-center gap-2">
                    {comment.referenced_file && (
                      <>
                        <File className="h-4 w-4 text-blue-500" />
                        <Link
                          href={`/files/${comment.referenced_file.id}`}
                          className="flex items-center gap-1 text-sm hover:underline"
                        >
                          <span>{comment.referenced_file.name}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </>
                    )}

                    {comment.referenced_category && (
                      <>
                        <Folder className="h-4 w-4 text-blue-500" />
                        <Link
                          href={`/files?category=${comment.referenced_category.id}`}
                          className="flex items-center gap-1 text-sm hover:underline"
                        >
                          <span>{comment.referenced_category.name}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

