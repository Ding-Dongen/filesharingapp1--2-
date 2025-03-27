"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { fetchUnreadNotificationCount } from "@/lib/supabase/client-utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { createClient } from "@/lib/supabase/client"
import { setNotificationCountRefreshCallback } from "@/lib/client-actions/notification-actions"

export function Header() {
  const [notificationCount, setNotificationCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  const fetchNotifications = async () => {
    try {
      const count = await fetchUnreadNotificationCount()
      setNotificationCount(count)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Register the refresh callback
    setNotificationCountRefreshCallback(fetchNotifications)

    // Set up interval to check for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Check every 30 seconds

    // Subscribe to notification changes
    const channel = supabase
      .channel("notification-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
      // Clear the callback when component unmounts
      setNotificationCountRefreshCallback(null)
    }
  }, [supabase])

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {notificationCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

