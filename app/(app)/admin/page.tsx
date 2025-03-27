"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    userCount: 0,
    fileCount: 0,
    postCount: 0,
    notificationCount: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    async function checkAdmin() {
      try {
        setLoading(true)

        // Check if user is logged in
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error("Failed to get session")
        }

        if (!session) {
          router.push("/login")
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          throw new Error("Failed to fetch profile")
        }

        if (!profile || (profile.role !== "core_admin" && profile.role !== "superadmin")) {
          router.push("/")
          return
        }

        setProfile(profile)

        // Get stats
        const [{ count: userCount }, { count: fileCount }, { count: postCount }, { count: notificationCount }] =
          await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("files").select("*", { count: "exact", head: true }),
            supabase.from("posts").select("*", { count: "exact", head: true }),
            supabase.from("notifications").select("*", { count: "exact", head: true }),
          ])

        setStats({
          userCount: userCount || 0,
          fileCount: fileCount || 0,
          postCount: postCount || 0,
          notificationCount: notificationCount || 0,
        })
      } catch (error: any) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || "Admin"}</p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to App</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fileCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notificationCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Admin Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">User ID:</p>
              <p className="text-muted-foreground">{profile?.id}</p>
            </div>
            <div>
              <p className="font-medium">Name:</p>
              <p className="text-muted-foreground">{profile?.full_name || "Not set"}</p>
            </div>
            <div>
              <p className="font-medium">Role:</p>
              <p className="text-muted-foreground">{profile?.role}</p>
            </div>
            <div>
              <p className="font-medium">Created At:</p>
              <p className="text-muted-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleString() : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

