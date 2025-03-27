export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: "user" | "core_admin" | "superadmin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "user" | "core_admin" | "superadmin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "user" | "core_admin" | "superadmin"
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
          admin_only: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
          admin_only?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
          admin_only?: boolean
        }
      }
      files: {
        Row: {
          id: string
          name: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          category_id: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          category_id?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          category_id?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string | null
          is_admin_post: boolean
          referenced_file_id: string | null
          referenced_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id?: string | null
          is_admin_post?: boolean
          referenced_file_id?: string | null
          referenced_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string | null
          is_admin_post?: boolean
          referenced_file_id?: string | null
          referenced_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          referenced_file_id: string | null
          referenced_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          referenced_file_id?: string | null
          referenced_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          referenced_file_id?: string | null
          referenced_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          content: string
          type: string
          is_read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          type: string
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          type?: string
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

