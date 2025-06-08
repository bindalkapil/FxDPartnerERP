export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          customer_type: string
          contact: string
          email: string
          address: string
          delivery_addresses: Json[] | null
          gst_number: string | null
          pan_number: string | null
          credit_limit: number
          current_balance: number
          payment_terms: number
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          customer_type?: string
          contact: string
          email: string
          address: string
          delivery_addresses?: Json[] | null
          gst_number?: string | null
          pan_number?: string | null
          credit_limit?: number
          current_balance?: number
          payment_terms?: number
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          customer_type?: string
          contact?: string
          email?: string
          address?: string
          delivery_addresses?: Json[] | null
          gst_number?: string | null
          pan_number?: string | null
          credit_limit?: number
          current_balance?: number
          payment_terms?: number
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          created_at: string | null
          updated_at: string | null
          category: string
          description: string | null
          status: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
          updated_at?: string | null
          category?: string
          description?: string | null
          status?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
          category?: string
          description?: string | null
          status?: string
        }
        Relationships: []
      }
      purchase_record_costs: {
        Row: {
          id: string
          purchase_record_id: string
          name: string
          amount: number
          type: string
          calculated_amount: number
          created_at: string | null
        }
        Insert: {
          id?: string
          purchase_record_id: string
          name: string
          amount: number
          type: string
          calculated_amount?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          purchase_record_id?: string
          name?: string
          amount?: number
          type?: string
          calculated_amount?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_record_costs_purchase_record_id_fkey"
            columns: ["purchase_record_id"]
            isOneToOne: false
            referencedRelation: "purchase_records"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_record_items: {
        Row: {
          id: string
          purchase_record_id: string
          product_id: string
          sku_id: string
          product_name: string
          sku_code: string
          category: string
          quantity: number
          unit_type: string
          total_weight: number
          market_price: number | null
          commission: number | null
          unit_price: number
          total: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          purchase_record_id: string
          product_id: string
          sku_id: string
          product_name: string
          sku_code: string
          category: string
          quantity: number
          unit_type: string
          total_weight: number
          market_price?: number | null
          commission?: number | null
          unit_price: number
          total: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          purchase_record_id?: string
          product_id?: string
          sku_id?: string
          product_name?: string
          sku_code?: string
          category?: string
          quantity?: number
          unit_type?: string
          total_weight?: number
          market_price?: number | null
          commission?: number | null
          unit_price?: number
          total?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_record_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_record_items_purchase_record_id_fkey"
            columns: ["purchase_record_id"]
            isOneToOne: false
            referencedRelation: "purchase_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_record_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_records: {
        Row: {
          id: string
          vehicle_arrival_id: string | null
          record_number: string
          supplier: string
          record_date: string
          arrival_timestamp: string
          pricing_model: string
          default_commission: number | null
          payment_terms: number | null
          items_subtotal: number
          additional_costs_total: number
          total_amount: number
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_arrival_id?: string | null
          record_number: string
          supplier: string
          record_date: string
          arrival_timestamp: string
          pricing_model: string
          default_commission?: number | null
          payment_terms?: number | null
          items_subtotal?: number
          additional_costs_total?: number
          total_amount?: number
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_arrival_id?: string | null
          record_number?: string
          supplier?: string
          record_date?: string
          arrival_timestamp?: string
          pricing_model?: string
          default_commission?: number | null
          payment_terms?: number | null
          items_subtotal?: number
          additional_costs_total?: number
          total_amount?: number
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_records_vehicle_arrival_id_fkey"
            columns: ["vehicle_arrival_id"]
            isOneToOne: false
            referencedRelation: "vehicle_arrivals"
            referencedColumns: ["id"]
          }
        ]
      }
      sales_order_items: {
        Row: {
          id: string
          sales_order_id: string
          product_id: string
          sku_id: string
          product_name: string
          sku_code: string
          quantity: number
          unit_type: string
          unit_price: number
          total_price: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          sales_order_id: string
          product_id: string
          sku_id: string
          product_name: string
          sku_code: string
          quantity: number
          unit_type: string
          unit_price: number
          total_price: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          sales_order_id?: string
          product_id?: string
          sku_id?: string
          product_name?: string
          sku_code?: string
          quantity?: number
          unit_type?: string
          unit_price?: number
          total_price?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          }
        ]
      }
      sales_orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          order_date: string
          delivery_date: string | null
          delivery_address: string | null
          payment_terms: number | null
          payment_mode: string
          payment_status: string
          subtotal: number | null
          tax_amount: number | null
          discount_amount: number | null
          total_amount: number | null
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_number: string
          customer_id: string
          order_date?: string
          delivery_date?: string | null
          delivery_address?: string | null
          payment_terms?: number | null
          payment_mode?: string
          payment_status?: string
          subtotal?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          total_amount?: number | null
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          order_date?: string
          delivery_date?: string | null
          delivery_address?: string | null
          payment_terms?: number | null
          payment_mode?: string
          payment_status?: string
          subtotal?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          total_amount?: number | null
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      skus: {
        Row: {
          id: string
          product_id: string
          code: string
          created_at: string | null
          updated_at: string | null
          unit_type: string
          unit_weight: number | null
          status: string
        }
        Insert: {
          id?: string
          product_id: string
          code: string
          created_at?: string | null
          updated_at?: string | null
          unit_type?: string
          unit_weight?: number | null
          status?: string
        }
        Update: {
          id?: string
          product_id?: string
          code?: string
          created_at?: string | null
          updated_at?: string | null
          unit_type?: string
          unit_weight?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "skus_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          id: string
          company_name: string
          contact_person: string
          phone: string
          email: string
          address: string
          gst_number: string | null
          pan_number: string | null
          bank_name: string | null
          account_number: string | null
          ifsc_code: string | null
          payment_terms: number
          credit_limit: number
          current_balance: number
          products: string[] | null
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_name: string
          contact_person: string
          phone: string
          email: string
          address: string
          gst_number?: string | null
          pan_number?: string | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          payment_terms?: number
          credit_limit?: number
          current_balance?: number
          products?: string[] | null
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          contact_person?: string
          phone?: string
          email?: string
          address?: string
          gst_number?: string | null
          pan_number?: string | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          payment_terms?: number
          credit_limit?: number
          current_balance?: number
          products?: string[] | null
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_arrival_attachments: {
        Row: {
          id: string
          vehicle_arrival_id: string
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          created_at: string | null
        }
        Insert: {
          id?: string
          vehicle_arrival_id: string
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          created_at?: string | null
        }
        Update: {
          id?: string
          vehicle_arrival_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          file_url?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_arrival_attachments_vehicle_arrival_id_fkey"
            columns: ["vehicle_arrival_id"]
            isOneToOne: false
            referencedRelation: "vehicle_arrivals"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicle_arrival_items: {
        Row: {
          id: string
          vehicle_arrival_id: string
          product_id: string
          sku_id: string
          unit_type: string
          unit_weight: number | null
          quantity: number
          total_weight: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_arrival_id: string
          product_id: string
          sku_id: string
          unit_type: string
          unit_weight?: number | null
          quantity: number
          total_weight: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_arrival_id?: string
          product_id?: string
          sku_id?: string
          unit_type?: string
          unit_weight?: number | null
          quantity?: number
          total_weight?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_arrival_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_arrival_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_arrival_items_vehicle_arrival_id_fkey"
            columns: ["vehicle_arrival_id"]
            isOneToOne: false
            referencedRelation: "vehicle_arrivals"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicle_arrivals: {
        Row: {
          id: string
          vehicle_number: string | null
          supplier: string
          driver_name: string | null
          driver_contact: string | null
          arrival_time: string
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicle_number?: string | null
          supplier: string
          driver_name?: string | null
          driver_contact?: string | null
          arrival_time: string
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicle_number?: string | null
          supplier?: string
          driver_name?: string | null
          driver_contact?: string | null
          arrival_time?: string
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never