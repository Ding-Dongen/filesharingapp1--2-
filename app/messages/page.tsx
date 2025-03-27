"use client"

import { Suspense, useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageList } from "@/components/messages/message-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function MessagesPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
          
          setIsAdmin(profile?.role === "core_admin" || profile?.role === "superadmin")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [supabase])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Messages & Announcements</h1>
        </div>
        <MessageListSkeleton />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Messages & Announcements</h1>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          {isAdmin && <TabsTrigger value="announcements">Announcements</TabsTrigger>}
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<MessageListSkeleton />}>
            <MessageList />
          </Suspense>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="announcements">
            <Suspense fallback={<MessageListSkeleton />}>
              <MessageList isAdminOnly={true} />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function MessageListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
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
    </div>
  )
}

