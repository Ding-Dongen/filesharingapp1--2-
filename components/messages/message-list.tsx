"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import { MessageCard } from "@/components/messages/message-card"
import { getAllMessages, isUserAdmin } from "@/lib/client-actions/message-actions"
import { createClient } from "@/lib/supabase/client"

interface MessageListProps {
  isAdminOnly?: boolean
}

export function MessageList({ isAdminOnly = false }: MessageListProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
    checkAdminStatus()

    // Set up real-time subscription for posts
    const postsSubscription = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: isAdminOnly ? "is_admin_post=eq.true" : undefined,
        },
        () => {
          fetchMessages()
        },
      )
      .subscribe()

    // Set up real-time subscription for comments
    const commentsSubscription = supabase
      .channel("comments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
        },
        () => {
          fetchMessages()
        },
      )
      .subscribe()

    return () => {
      postsSubscription.unsubscribe()
      commentsSubscription.unsubscribe()
    }
  }, [isAdminOnly, supabase])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await getAllMessages(isAdminOnly)

      // Get comment counts
      const messagesWithComments = await Promise.all(
        data.map(async (message) => {
          const { count } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", message.id)
            .then(({ count, error }) => {
              if (error) {
                console.error("Error counting comments:", error)
                return { count: 0 }
              }
              return { count }
            })

          return {
            ...message,
            comment_count: count,
          }
        }),
      )

      setMessages(messagesWithComments)
    } catch (error: any) {
      console.error("Error fetching messages:", error)
      setError("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }

  const checkAdminStatus = async () => {
    try {
      const admin = await isUserAdmin()
      setIsAdmin(admin)
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchMessages}>
          Try Again
        </Button>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {isAdminOnly ? "No announcements have been posted yet." : "No messages have been created yet."}
        </p>
        {(isAdmin || !isAdminOnly) && (
          <Button className="mt-4" onClick={() => router.push("/messages/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {isAdminOnly ? "Create Announcement" : "Create Message"}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{isAdminOnly ? "Announcements" : "Recent Messages"}</h2>

        {(isAdmin || !isAdminOnly) && (
          <Button onClick={() => router.push("/messages/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {isAdminOnly ? "Create Announcement" : "Create Message"}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} onDelete={fetchMessages} />
        ))}
      </div>
    </div>
  )
}

