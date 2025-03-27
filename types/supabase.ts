export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      files: {
        Row: {
          id: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          description: string | null
          category_id: string | null
          user_id: string
          created_at: string
          categories?: {
            id: string
            name: string
            admin_only: boolean
          }
          profiles?: {
            id: string
            full_name: string | null
            role: string
          }
        }
        Insert: {
          id?: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          description?: string | null
          category_id?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          description?: string | null
          category_id?: string | null
          user_id?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          admin_only: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          admin_only?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          admin_only?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 