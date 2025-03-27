"use client"

import { createClient } from "@/lib/supabase/client"
import type { Tables, InsertTables } from "@/lib/supabase/database.types"

export async function createCategory(categoryData: InsertTables<"categories">) {
  const supabase = createClient()

  const { data, error } = await supabase.from("categories").insert(categoryData).select().single()

  if (error) {
    throw new Error(`Error creating category: ${error.message}`)
  }

  return data
}

export async function updateCategory(id: string, categoryData: Partial<Tables<"categories">>) {
  const supabase = createClient()

  const { data, error } = await supabase.from("categories").update(categoryData).eq("id", id).select().single()

  if (error) {
    throw new Error(`Error updating category: ${error.message}`)
  }

  return data
}

export async function deleteCategory(id: string) {
  const supabase = createClient()

  // Update files with this category to have null category
  await supabase.from("files").update({ category_id: null }).eq("category_id", id)

  // Delete the category
  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    throw new Error(`Error deleting category: ${error.message}`)
  }

  return true
}

export async function getAllCategories() {
  const supabase = createClient()

  const { data, error } = await supabase.from("categories").select("*").order("name")

  if (error) {
    throw new Error(`Error fetching categories: ${error.message}`)
  }

  return data || []
}

