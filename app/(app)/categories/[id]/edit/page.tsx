import { notFound, redirect } from "next/navigation"
import { CategoryForm } from "@/components/files/category-form"
import { createClient } from "@/lib/supabase/server"

interface EditCategoryPageProps {
  params: {
    id: string
  }
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
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

  // Get the category
  const { data: category, error } = await supabase.from("categories").select("*").eq("id", params.id).single()

  if (error || !category) {
    notFound()
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Folder</h1>
      <CategoryForm category={category} />
    </div>
  )
}

