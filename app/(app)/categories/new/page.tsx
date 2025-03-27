import { redirect } from "next/navigation"
import { CategoryForm } from "@/components/files/category-form"
import { createClient } from "@/lib/supabase/server"

export default async function NewCategoryPage() {
  const supabase = createClient()

  // Check if the user is logged in and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is an admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const isAdmin = profile && (profile.role === "core_admin" || profile.role === "superadmin")

  if (!isAdmin) {
    redirect("/files")
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Folder</h1>
      <CategoryForm />
    </div>
  )
}

