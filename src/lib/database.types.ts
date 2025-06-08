type Json =
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
      customers: {
        Row: {
          id: string
          name: string
          customer_type: string
          contact: string
          email: string
          address: string
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
          contact?: string
          email?: string
          address?: string
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
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
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
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
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
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
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
      }
    }
  }
}