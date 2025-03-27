"use client"

import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import type { InsertTables } from "@/lib/supabase/database.types"

export async function createCategory(
  categoryData: Omit<InsertTables<"categories">, "id" | "created_at" | "updated_at"> & {
    admin_only?: boolean
  },
) {
  const supabase = createClient()

  try {
    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to create a category")
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || (profile.role !== "core_admin" && profile.role !== "superadmin")) {
      throw new Error("Only admins can create categories")
    }

    // Create category
    const { data, error } = await supabase
      .from("categories")
      .insert({
        ...categoryData,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Error creating category:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to create category",
      variant: "destructive",
    })
    throw error
  }
}

export async function updateCategory(id: string, name: string, description: string | null = null, admin_only: boolean = false) {
  const supabase = createClient()

  try {
    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to update a category")
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || (profile.role !== "core_admin" && profile.role !== "superadmin")) {
      throw new Error("Only admins can update categories")
    }

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        description,
        admin_only,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Error updating category:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update category",
      variant: "destructive",
    })
    throw error
  }
}

export async function deleteCategory(id: string) {
  const supabase = createClient()

  try {
    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to delete a category")
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || (profile.role !== "core_admin" && profile.role !== "superadmin")) {
      throw new Error("Only admins can delete categories")
    }

    // First, delete all files in this category
    const { error: deleteFilesError } = await supabase
      .from("files")
      .delete()
      .eq("category_id", id)

    if (deleteFilesError) {
      throw deleteFilesError
    }

    // Then delete the category
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      throw error
    }

    return true
  } catch (error: any) {
    console.error("Error deleting category:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete category",
      variant: "destructive",
    })
    throw error
  }
}

export async function getCategoryById(id: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Error fetching category:", error)
    throw error
  }
}

export async function getAllCategories() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error: any) {
    console.error("Error fetching categories:", error)
    throw error
  }
}

