import { redirect } from "next/navigation"
import { MessageForm } from "@/components/messages/message-form"
import { createClient } from "@/lib/supabase/server"

export default async function NewMessagePage() {
  const supabase = createClient()

  // Check if the user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is an admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const isAdmin = profile && (profile.role === "core_admin" || profile.role === "superadmin")

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Message</h1>
      <MessageForm isAdmin={isAdmin} />
    </div>
  )
}

