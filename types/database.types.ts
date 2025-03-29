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
      users: {
        Row: {
          id: number
          auth_id: string
          email: string
          username: string
          role: 'admin' | 'manager' | 'staff'
          avatar_url: string | null
          department: string | null
          location: string | null
          phone: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      clients: {
        Row: {
          id: number
          company_name: string
          manager_name: string
          field_type: string | null
          monthly_subscription: number
          status: 'active' | 'inactive' | 'pending'
          phone_number: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      client_payments: {
        Row: {
          id: number
          client_id: number
          amount: number
          payment_date: string
          payment_type: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['client_payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['client_payments']['Insert']>
      }
      client_contacts: {
        Row: {
          id: number
          client_id: number
          name: string
          position: string | null
          phone: string | null
          is_primary: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['client_contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['client_contacts']['Insert']>
      }
      expense_categories: {
        Row: {
          id: number
          name: string
          description: string | null
          budget_limit: number | null
          parent_category_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>
      }
      expenses: {
        Row: {
          id: number
          category_id: number | null
          amount: number
          currency: string
          description: string
          date: string
          payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'check' | null
          payment_status: 'pending' | 'paid' | 'cancelled' | 'rejected'
          receipt_url: string | null
          vendor_name: string | null
          vendor_tax_number: string | null
          reference_number: string | null
          notes: string | null
          billable: boolean
          client_id: number | null
          created_by: number | null
          approved_by: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      recurring_expenses: {
        Row: {
          id: number
          category_id: number | null
          amount: number
          currency: string
          description: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string | null
          last_generated_date: string | null
          next_generation_date: string | null
          payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'check' | null
          vendor_name: string | null
          vendor_tax_number: string | null
          notes: string | null
          status: 'active' | 'paused' | 'cancelled'
          created_by: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recurring_expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['recurring_expenses']['Insert']>
      }
      expense_attachments: {
        Row: {
          id: number
          expense_id: number
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          uploaded_by: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_attachments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expense_attachments']['Insert']>
      }
      expense_reports: {
        Row: {
          id: number
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
          total_amount: number
          currency: string
          submitted_by: number | null
          approved_by: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_reports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expense_reports']['Insert']>
      }
      expense_report_items: {
        Row: {
          id: number
          report_id: number
          expense_id: number
          amount: number
          currency: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_report_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expense_report_items']['Insert']>
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
