"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Send, Trash2, Clock } from "lucide-react"
import { createComment, getCommentsByPostId, deleteComment } from "@/lib/client-actions/comment-actions"
import { formatDistanceToNow } from "date-fns"
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

interface CommentListProps {
  postId: string
}

export function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true)
      try {
        const data = await getCommentsByPostId(postId)
        setComments(data)
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }

    fetchComments()
    fetchUser()

    // Set up real-time subscription
    const channel = supabase
      .channel(`comments-${postId}`)
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
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("You must be logged in to comment")
      }

      // Create the comment
      const newCommentData = await createComment({
        post_id: postId,
        user_id: session.user.id,
        content: newComment,
      })

      // Get post details to get the author
      const { data: postData } = await supabase.from("posts").select("title, author_id").eq("id", postId).single()

      if (postData) {
        // Get all users who have commented on this post (excluding the current user)
        const { data: commenters } = await supabase
          .from("comments")
          .select("user_id")
          .eq("post_id", postId)
          .neq("user_id", session.user.id)
          .distinct()

        // Create a set of unique user IDs to notify (including the post author)
        const usersToNotify = new Set<string>()

        // Add post author if not the current user
        if (postData.author_id && postData.author_id !== session.user.id) {
          usersToNotify.add(postData.author_id)
        }

        // Add all commenters
        if (commenters) {
          commenters.forEach((commenter) => {
            usersToNotify.add(commenter.user_id)
          })
        }

        // Get current user's name
        const { data: userData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single()

        const userName = userData?.full_name || "Someone"

        // Create notifications for all users
        if (usersToNotify.size > 0) {
          const notifications = Array.from(usersToNotify).map((userId) => ({
            user_id: userId,
            content: `${userName} commented on post: "${postData.title}"`,
            type: "comment",
            related_id: postId,
          }))

          await supabase.from("notifications").insert(notifications)
        }
      }

      setNewComment("")
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id)
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                    {comment.profiles?.full_name ? comment.profiles.full_name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="font-medium">{comment.profiles?.full_name || "Unknown User"}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                {userId === comment.user_id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete comment</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this comment? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(comment.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

