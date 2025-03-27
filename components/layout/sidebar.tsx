"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Bell,
  Upload,
  Users,
  Settings,
  Menu,
  LogOut,
  FolderOpen,
} from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<Tables<"profiles"> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          if (data) {
            setUser(data)
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchUser()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-purple-500",
    },
    {
      label: "Files",
      icon: FileText,
      href: "/files",
      color: "text-blue-500",
    },
    {
      label: "Categories",
      icon: FolderOpen,
      href: "/categories",
      color: "text-yellow-500",
      admin: true,
    },
    {
      label: "Message Board",
      icon: MessageSquare,
      href: "/messages",
      color: "text-orange-500",
    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/notifications",
      color: "text-red-500",
    },
    {
      label: "Upload",
      icon: Upload,
      href: "/upload",
      color: "text-green-500",
    },
    {
      label: "User Management",
      icon: Users,
      href: "/admin/users",
      color: "text-pink-500",
      superadmin: true,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      color: "text-gray-500",
    },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SidebarContent
            user={user}
            routes={routes}
            pathname={pathname}
            closeSheet={() => setOpen(false)}
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>
      <div className={cn("hidden h-screen border-r md:flex md:w-72 md:flex-col", className)}>
        <SidebarContent user={user} routes={routes} pathname={pathname} onSignOut={handleSignOut} />
      </div>
    </>
  )
}

interface SidebarContentProps {
  user: Tables<"profiles"> | null
  routes: {
    label: string
    icon: any
    href: string
    color?: string
    admin?: boolean
    superadmin?: boolean
  }[]
  pathname: string
  closeSheet?: () => void
  onSignOut: () => void
}

function SidebarContent({ user, routes, pathname, closeSheet, onSignOut }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="px-6 py-5 flex items-center border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-purple-500">
          <FileText className="h-6 w-6" />
          <span>FileShare</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="mt-6 space-y-1">
          {routes.map((route) => {
            // Skip admin routes for non-admin users
            if (route.admin && user?.role !== "core_admin" && user?.role !== "superadmin") {
              return null
            }

            // Skip superadmin routes for non-superadmin users
            if (route.superadmin && user?.role !== "superadmin") {
              return null
            }

            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={closeSheet}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                  pathname === route.href ? "bg-secondary text-primary" : "text-muted-foreground",
                )}
              >
                <route.icon className={cn("h-5 w-5", route.color)} />
                {route.label}
              </Link>
            )
          })}
        </div>
      </ScrollArea>
      {user && (
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3 py-2">
            <div className="rounded-full bg-secondary p-1">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                {user.full_name
                  ? user.full_name
                      .split(" ")
                      .slice(0, 2)
                      .map((name) => name[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-100/10"
              onClick={onSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

