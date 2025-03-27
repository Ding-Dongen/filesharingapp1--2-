"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { updateUserRole } from "@/lib/server-actions/admin-actions"
import { Loader2 } from "lucide-react"

type UserProfile = {
  id: string
  email?: string | null
  full_name: string | null
  role: "user" | "core_admin" | "superadmin"
  created_at: string
  last_sign_in_at?: string | null
}

interface UserRoleManagerProps {
  users: UserProfile[]
}

export function UserRoleManager({ users }: UserRoleManagerProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: "user" | "core_admin" | "superadmin") => {
    try {
      setUpdatingUserId(userId)

      await updateUserRole(userId, newRole)

      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Update failed",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
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
                  <Select
                    defaultValue={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as "user" | "core_admin" | "superadmin")}
                    disabled={updatingUserId === user.id}
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
                </TableCell>
                <TableCell>
                  {updatingUserId === user.id ? (
                    <Button disabled size="sm">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

