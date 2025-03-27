"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, MessageSquare, Users, Loader2, Trash2 } from "lucide-react"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { FileList } from "@/components/files/file-list"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    fileCount: 0,
    todayUploads: 0,
    messageCount: 0,
    userCount: 0,
  })
  const [recentFiles, setRecentFiles] = useState<any[]>([])
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [hideRecentActivity, setHideRecentActivity] = useState(false)
  const [hideRecentFiles, setHideRecentFiles] = useState(false)
  const supabase = createClient()

  // Single effect to handle both preferences and data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // Get user preferences first
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: preferences } = await supabase
            .from("user_preferences")
            .select("hide_recent_activity, hide_recent_files")
            .eq("user_id", session.user.id)
            .single()

          // If no preferences exist, create them
          if (!preferences) {
            const { data: newPreferences } = await supabase
              .from("user_preferences")
              .insert({
                user_id: session.user.id,
                hide_recent_activity: false,
                hide_recent_files: false,
              })
              .select()
              .single()

            if (newPreferences) {
              setHideRecentActivity(newPreferences.hide_recent_activity)
              setHideRecentFiles(newPreferences.hide_recent_files)
            }
          } else {
            setHideRecentActivity(preferences.hide_recent_activity)
            setHideRecentFiles(preferences.hide_recent_files)
          }
        }

        // Fetch data based on current preferences
        if (!hideRecentFiles) {
          const { data: files } = await supabase
            .from("files")
            .select("*, categories(name), profiles(full_name)")
            .order("created_at", { ascending: false })
            .limit(5)

          if (files) {
            setRecentFiles(files)
          }
        }

        if (!hideRecentActivity) {
          const { data: posts } = await supabase
            .from("posts")
            .select("*, profiles(full_name)")
            .order("created_at", { ascending: false })
            .limit(5)

          if (posts) {
            setRecentPosts(posts)
          }
        }

        // Get stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [{ count: fileCount }, { count: todayUploads }, { count: messageCount }, { count: userCount }] = await Promise.all([
          supabase.from("files").select("*", { count: "exact", head: true }),
          supabase
            .from("files")
            .select("*", { count: "exact", head: true })
            .gte("created_at", today.toISOString()),
          supabase.from("posts").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ])

        setStats({
          fileCount: fileCount || 0,
          todayUploads: todayUploads || 0,
          messageCount: messageCount || 0,
          userCount: userCount || 0,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase]) // Only depend on supabase client

  const clearRecentActivity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Update user preferences
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: session.user.id,
            hide_recent_activity: true,
            hide_recent_files: hideRecentFiles,
          })

        if (error) throw error

        setHideRecentActivity(true)
        setRecentFiles([])
        setRecentPosts([])
        
        toast({
          title: "History cleared",
          description: "Recent activity has been cleared",
        })
      }
    } catch (error) {
      console.error("Error clearing history:", error)
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      })
    }
  }

  const clearRecentFiles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Update user preferences
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: session.user.id,
            hide_recent_activity: hideRecentActivity,
            hide_recent_files: true,
          })

        if (error) throw error

        setHideRecentFiles(true)
        setRecentFiles([])
        
        toast({
          title: "History cleared",
          description: "Recent files have been cleared",
        })
      }
    } catch (error) {
      console.error("Error clearing history:", error)
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      })
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to FileShare, your secure file sharing platform.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fileCount}</div>
            <p className="text-xs text-muted-foreground">Files stored in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Uploads Today</CardTitle>
            <Upload className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayUploads}</div>
            <p className="text-xs text-muted-foreground">Files uploaded today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messageCount}</div>
            <p className="text-xs text-muted-foreground">Total messages posted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="files">Recent Files</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Recent files and messages across the platform</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearRecentActivity}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </CardHeader>
            <CardContent>
              <RecentActivity files={recentFiles} posts={recentPosts} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="files">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Files</CardTitle>
                <CardDescription>Files that have been recently uploaded</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearRecentFiles}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </CardHeader>
            <CardContent>
              <FileList files={recentFiles} emptyMessage="No files have been uploaded yet" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

