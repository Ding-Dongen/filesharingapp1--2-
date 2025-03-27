"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Trash2, Loader2 } from "lucide-react"
import { deleteMessage } from "@/lib/client-actions/message-actions"

interface DeleteMessageButtonProps {
  id: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  onSuccess?: () => void
}

export function DeleteMessageButton({
  id,
  variant = "destructive",
  size = "default",
  onSuccess,
}: DeleteMessageButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteMessage(id)

      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully",
      })

      setOpen(false)

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/messages")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error deleting message:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={loading}>
          {size === "icon" ? (
            <Trash2 className="h-4 w-4" />
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the message and all associated comments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={loading}
          >
            {loading ? (
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
  )
}

