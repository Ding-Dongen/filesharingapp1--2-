"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Tables } from "@/lib/supabase/database.types"
import { Bell, Loader2, Trash, Trash2, LinkIcon } from "lucide-react"
import {
  deleteNotification,
  deleteAllNotifications,
  refreshNotificationCount,
} from "@/lib/client-actions/notification-actions"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [deletingAll, setDeletingAll] = useState(false)
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const supabase = createClient()

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })

        if (data) {
          setNotifications(data)
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications()
          refreshNotificationCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    // Prevent default behavior to avoid page refresh
    e.preventDefault()
    e.stopPropagation()

    setDeleting((prev) => ({ ...prev, [id]: true }))
    try {
      console.log("Client-side: Attempting to delete notification with ID:", id)

      // Delete from database
      await deleteNotification(id)

      console.log("Client-side: Successfully deleted notification with ID:", id)

      // Update local state
      setNotifications(notifications.filter((notification) => notification.id !== id))

      toast({
        title: "Notification deleted",
        description: "The notification has been deleted",
      })

      // Ensure notification count is refreshed
      refreshNotificationCount()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      })

      // Refresh notifications to ensure UI is in sync with database
      fetchNotifications()
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      try {
        console.log("Client-side: Attempting to delete all notifications for user:", session.user.id)

        // Delete all notifications from database
        await deleteAllNotifications(session.user.id)

        console.log("Client-side: Successfully deleted all notifications for user:", session.user.id)

        // Update local state
        setNotifications([])

        toast({
          title: "All notifications deleted",
          description: "All notifications have been deleted",
        })

        // Ensure notification count is refreshed
        refreshNotificationCount()
      } catch (error: any) {
        console.error("Delete all error:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete all notifications",
          variant: "destructive",
        })

        // Refresh notifications to ensure UI is in sync with database
        fetchNotifications()
      } finally {
        setDeletingAll(false)
        setIsDeleteAllDialogOpen(false)
      }
    }
  }

  // Function to get the appropriate link for a notification based on its type
  const getNotificationLink = (notification: Tables<"notifications">) => {
    if (!notification.related_id) return null

    switch (notification.type) {
      case "file_upload":
        return `/files/${notification.related_id}`
      case "admin_announcement":
      case "comment":
        return `/messages/${notification.related_id}`
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with the latest activity</p>
        </div>
        {notifications.length > 0 && (
          <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all notifications? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} disabled={deletingAll}>
                  {deletingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete All"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="mt-2 text-sm text-muted-foreground">You'll be notified when there's new activity</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const notificationLink = getNotificationLink(notification)

            return (
              <Card key={notification.id} className="border-purple-500/50">
                <CardHeader className="bg-purple-500/10">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg">{notification.type}</CardTitle>
                  </div>
                  <CardDescription>{new Date(notification.created_at).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{notification.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex gap-2">
                    {notificationLink && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={notificationLink}>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this notification? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => handleDelete(e, notification.id)}
                          disabled={deleting[notification.id]}
                        >
                          {deleting[notification.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

