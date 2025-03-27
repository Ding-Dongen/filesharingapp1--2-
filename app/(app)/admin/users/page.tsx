"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function AdminUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function checkAdminAndLoadUsers() {
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
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          throw new Error("Failed to fetch profile")
        }

        if (!profile || (profile.role !== "core_admin" && profile.role !== "superadmin")) {
          router.push("/")
          return
        }

        // Load users
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })

        if (usersError) {
          throw new Error("Failed to fetch users")
        }

        setUsers(users || [])
      } catch (error: any) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoadUsers()
  }, [router, supabase])

  const handleRoleChange = async (userId: string, newRole: "user" | "core_admin" | "superadmin") => {
    try {
      setUpdatingUserId(userId)

      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) {
        throw new Error("Failed to update role")
      }

      // Update local state
      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))

      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating role:", error)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

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
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{user.full_name || "No name"}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "superadmin"
                            ? "bg-red-100 text-red-800"
                            : user.role === "core_admin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {updatingUserId === user.id ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value as "user" | "core_admin" | "superadmin")
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="core_admin">Core Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

