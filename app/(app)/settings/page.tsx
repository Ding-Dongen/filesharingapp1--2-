"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import type { Tables } from "@/lib/supabase/database.types"
import { updateUserProfile } from "@/lib/client-actions/user-actions"
import { Loader2, Save, KeyRound } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const [user, setUser] = useState<Tables<"profiles"> | null>(null)
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        if (data) {
          setUser(data)
          setFullName(data.full_name || "")
          setAvatarUrl(data.avatar_url || "")
        }
      }

      setLoading(false)
    }

    fetchUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsSubmitting(true)

    try {
      await updateUserProfile(user.id, {
        full_name: fullName,
        avatar_url: avatarUrl,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords don't match")
      }

      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.id as string, // user.id contains the email in Supabase Auth
        password: currentPassword,
      })

      if (signInError) {
        throw new Error("Current password is incorrect")
      }

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })

      // Reset form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
              {avatarUrl && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={avatarUrl || "/placeholder.svg"}
                    alt="Avatar preview"
                    className="h-20 w-20 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="text-sm text-muted-foreground">
                <p>Email: {user?.id}</p>
                <p>Role: {user?.role}</p>
                <p>Joined: {new Date(user?.created_at || "").toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handlePasswordChange}>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Update your account password</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

