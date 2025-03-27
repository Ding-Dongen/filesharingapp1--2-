"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Users, FileText, Tag, MessageSquare, Bell, Settings, Home } from "lucide-react"

const adminRoutes = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Files",
    href: "/admin/files",
    icon: FileText,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: Tag,
  },
  {
    name: "Posts",
    href: "/admin/posts",
    icon: MessageSquare,
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r bg-background h-screen sticky top-0">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Manage your application</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {adminRoutes.map((route) => {
            const isActive = pathname === route.href

            return (
              <Button
                key={route.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive ? "bg-secondary" : "hover:bg-secondary/50")}
                asChild
              >
                <Link href={route.href}>
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.name}
                </Link>
              </Button>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to App
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

