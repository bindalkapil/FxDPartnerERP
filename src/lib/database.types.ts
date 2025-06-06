export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category?: string
          description?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      skus: {
        Row: {
          id: string
          product_id: string
          code: string
          unit_type: string
          unit_weight: number | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          code: string
          unit_type?: string
          unit_weight?: number | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          code?: string
          unit_type?: string
          unit_weight?: number | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}