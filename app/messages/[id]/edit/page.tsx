import { notFound, redirect } from "next/navigation"
import { MessageForm } from "@/components/messages/message-form"
import { createClient } from "@/lib/supabase/server"

interface EditMessagePageProps {
  params: {
    id: string
  }
}

export default async function EditMessagePage({ params }: EditMessagePageProps) {
  const supabase = createClient()

  // Get the message
  const { data: message, error } = await supabase.from("posts").select("*").eq("id", params.id).single()

  if (error || !message) {
    notFound()
  }

  // Check if the current user can edit this message
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is the author
  const isAuthor = message.author_id === session.user.id

  // Check if user is an admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const isAdmin = profile && (profile.role === "core_admin" || profile.role === "superadmin")

  // Only allow the author or admins to edit
  if (!isAuthor && !isAdmin) {
    redirect("/messages")
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Message</h1>
      <MessageForm message={message} isAdmin={isAdmin} />
    </div>
  )
}

