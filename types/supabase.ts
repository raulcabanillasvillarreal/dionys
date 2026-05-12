export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_log: {
        Row: {
          business_id: string
          gate: string | null
          granted: boolean
          id: string
          member_id: string | null
          timestamp: string | null
        }
        Insert: {
          business_id: string
          gate?: string | null
          granted: boolean
          id?: string
          member_id?: string | null
          timestamp?: string | null
        }
        Update: {
          business_id?: string
          gate?: string | null
          granted?: boolean
          id?: string
          member_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          business_id: string
          content: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string | null
        }
        Insert: {
          business_id: string
          content?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Update: {
          business_id?: string
          content?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json | null
          active: boolean | null
          business_id: string
          conditions: Json | null
          created_at: string | null
          description: string | null
          executions_count: number | null
          id: string
          last_executed_at: string | null
          name: string
          trigger_config: Json | null
          trigger_type: string
        }
        Insert: {
          actions?: Json | null
          active?: boolean | null
          business_id: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          executions_count?: number | null
          id?: string
          last_executed_at?: string | null
          name: string
          trigger_config?: Json | null
          trigger_type: string
        }
        Update: {
          actions?: Json | null
          active?: boolean | null
          business_id?: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          executions_count?: number | null
          id?: string
          last_executed_at?: string | null
          name?: string
          trigger_config?: Json | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string | null
          credit_limit: number | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          attended: boolean | null
          event_id: string
          id: string
          member_id: string
          paid: boolean | null
          registered_at: string | null
        }
        Insert: {
          attended?: boolean | null
          event_id: string
          id?: string
          member_id: string
          paid?: boolean | null
          registered_at?: string | null
        }
        Update: {
          attended?: boolean | null
          event_id?: string
          id?: string
          member_id?: string
          paid?: boolean | null
          registered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          business_id: string
          capacity: number | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          name: string
          price: number | null
          status: string | null
        }
        Insert: {
          business_id: string
          capacity?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          name: string
          price?: number | null
          status?: string | null
        }
        Update: {
          business_id?: string
          capacity?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          business_id: string
          created_at: string | null
          document_number: string | null
          document_type: string | null
          email: string | null
          full_name: string
          id: string
          nationality: string | null
          phone: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          phone?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices_hotel: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          reservation_id: string
          tax: number | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          reservation_id: string
          tax?: number | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          reservation_id?: string
          tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_hotel_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_hotel_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          amount: number | null
          assigned_to: string | null
          business_id: string
          check_in: string | null
          check_out: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          notes: string | null
          position: number | null
          reservation_id: string | null
          room_id: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          stage_id: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          assigned_to?: string | null
          business_id: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          position?: number | null
          reservation_id?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage_id: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          assigned_to?: string | null
          business_id?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          position?: number | null
          reservation_id?: string | null
          room_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          stage_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          business_id: string
          created_at: string | null
          document_number: string | null
          email: string | null
          full_name: string
          id: string
          membership_type: Database["public"]["Enums"]["membership_plan"] | null
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["member_status"]
        }
        Insert: {
          business_id: string
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          full_name: string
          id?: string
          membership_type?:
            | Database["public"]["Enums"]["membership_plan"]
            | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"]
        }
        Update: {
          business_id?: string
          created_at?: string | null
          document_number?: string | null
          email?: string | null
          full_name?: string
          id?: string
          membership_type?:
            | Database["public"]["Enums"]["membership_plan"]
            | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"]
        }
        Relationships: [
          {
            foreignKeyName: "members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          amount: number
          auto_renew: boolean | null
          business_id: string
          created_at: string | null
          end_date: string
          id: string
          member_id: string
          paid_at: string | null
          plan: Database["public"]["Enums"]["membership_plan"]
          start_date: string
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          business_id: string
          created_at?: string | null
          end_date: string
          id?: string
          member_id: string
          paid_at?: string | null
          plan: Database["public"]["Enums"]["membership_plan"]
          start_date: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          business_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          member_id?: string
          paid_at?: string | null
          plan?: Database["public"]["Enums"]["membership_plan"]
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          business_id: string
          category: string | null
          created_at: string | null
          footer: string | null
          header: string | null
          id: string
          language: string | null
          name: string
          status: string | null
          updated_at: string | null
          variables: string[] | null
          wa_template_id: string | null
        }
        Insert: {
          body: string
          business_id: string
          category?: string | null
          created_at?: string | null
          footer?: string | null
          header?: string | null
          id?: string
          language?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
          variables?: string[] | null
          wa_template_id?: string | null
        }
        Update: {
          body?: string
          business_id?: string
          category?: string | null
          created_at?: string | null
          footer?: string | null
          header?: string | null
          id?: string
          language?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
          variables?: string[] | null
          wa_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          business_id: string
          color: string
          created_at: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          position: number
        }
        Insert: {
          business_id: string
          color?: string
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          position?: number
        }
        Update: {
          business_id?: string
          color?: string
          created_at?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sku: string
          stock: number
          stock_min: number | null
          unit_cost: number | null
          unit_price: number | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sku: string
          stock?: number
          stock_min?: number | null
          unit_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sku?: string
          stock?: number
          stock_min?: number | null
          unit_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_cost: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          business_id: string
          created_at: string | null
          expected_date: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          total: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          total?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          business_id: string
          check_in: string
          check_out: string
          created_at: string | null
          guest_id: string
          id: string
          notes: string | null
          room_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount: number | null
        }
        Insert: {
          business_id: string
          check_in: string
          check_out: string
          created_at?: string | null
          guest_id: string
          id?: string
          notes?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number | null
        }
        Update: {
          business_id?: string
          check_in?: string
          check_out?: string
          created_at?: string | null
          guest_id?: string
          id?: string
          notes?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: Json | null
          business_id: string
          capacity: number
          created_at: string | null
          id: string
          number: string
          price_per_night: number
          status: Database["public"]["Enums"]["room_status"]
          type: string
        }
        Insert: {
          amenities?: Json | null
          business_id: string
          capacity?: number
          created_at?: string | null
          id?: string
          number: string
          price_per_night: number
          status?: Database["public"]["Enums"]["room_status"]
          type: string
        }
        Update: {
          amenities?: Json | null
          business_id?: string
          capacity?: number
          created_at?: string | null
          id?: string
          number?: string
          price_per_night?: number
          status?: Database["public"]["Enums"]["room_status"]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          business_id: string
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          business_id: string
          contact: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
        }
        Insert: {
          business_id: string
          contact?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
        }
        Update: {
          business_id?: string
          contact?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          business_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_at: string | null
          guest_id: string | null
          id: string
          lead_id: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          guest_id?: string | null
          id?: string
          lead_id?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          guest_id?: string | null
          id?: string
          lead_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_business_roles: {
        Row: {
          business_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_business_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_business_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_conversations: {
        Row: {
          assigned_to: string | null
          business_id: string
          contact_name: string | null
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          lead_id: string | null
          phone: string
          status: string | null
          tags: string[] | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          phone: string
          status?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          phone?: string
          status?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          media_url: string | null
          sent_at: string | null
          status: string | null
          template_name: string | null
          type: string
          wa_message_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          media_url?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          media_url?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "wa_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type:
        | "nota"
        | "llamada"
        | "email"
        | "whatsapp"
        | "cambio_etapa"
        | "tarea"
        | "sistema"
      lead_source:
        | "web"
        | "telefono"
        | "whatsapp"
        | "email"
        | "referido"
        | "directo"
        | "otro"
      member_status: "activo" | "suspendido" | "vencido" | "baja"
      membership_plan: "basico" | "premium" | "vip"
      order_status:
        | "borrador"
        | "enviado"
        | "confirmado"
        | "recibido"
        | "cancelado"
      reservation_status:
        | "confirmada"
        | "pendiente"
        | "cancelada"
        | "completada"
      room_status: "disponible" | "ocupada" | "mantenimiento" | "reservada"
      user_role: "superadmin" | "admin" | "manager" | "staff" | "readonly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "nota",
        "llamada",
        "email",
        "whatsapp",
        "cambio_etapa",
        "tarea",
        "sistema",
      ],
      lead_source: [
        "web",
        "telefono",
        "whatsapp",
        "email",
        "referido",
        "directo",
        "otro",
      ],
      member_status: ["activo", "suspendido", "vencido", "baja"],
      membership_plan: ["basico", "premium", "vip"],
      order_status: [
        "borrador",
        "enviado",
        "confirmado",
        "recibido",
        "cancelado",
      ],
      reservation_status: [
        "confirmada",
        "pendiente",
        "cancelada",
        "completada",
      ],
      room_status: ["disponible", "ocupada", "mantenimiento", "reservada"],
      user_role: ["superadmin", "admin", "manager", "staff", "readonly"],
    },
  },
} as const
