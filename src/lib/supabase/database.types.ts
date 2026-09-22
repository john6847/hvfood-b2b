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
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          currency: string
          display_name: string
          email: string
          id: string
          legal_name: string
          phone: string | null
          pricing_tier_id: string | null
          status: string
          updated_at: string
          version: number
          website: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          display_name: string
          email: string
          id?: string
          legal_name: string
          phone?: string | null
          pricing_tier_id?: string | null
          status?: string
          updated_at?: string
          version?: number
          website?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string
          email?: string
          id?: string
          legal_name?: string
          phone?: string | null
          pricing_tier_id?: string | null
          status?: string
          updated_at?: string
          version?: number
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_pricing_tier_id_fkey"
            columns: ["pricing_tier_id"]
            isOneToOne: false
            referencedRelation: "pricing_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_addresses: {
        Row: {
          archived_at: string | null
          city: string
          company_id: string
          contact_name: string
          country_code: string
          created_at: string
          id: string
          is_billing: boolean
          is_default_shipping: boolean
          label: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          region: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          city: string
          company_id: string
          contact_name: string
          country_code?: string
          created_at?: string
          id?: string
          is_billing?: boolean
          is_default_shipping?: boolean
          label: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          region: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          city?: string
          company_id?: string
          contact_name?: string
          country_code?: string
          created_at?: string
          id?: string
          is_billing?: boolean
          is_default_shipping?: boolean
          label?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          region?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_commerce_policies: {
        Row: {
          allow_ach: boolean
          allow_card: boolean
          allow_manual: boolean
          allow_terms: boolean
          company_id: string
          created_at: string
          credit_limit_minor: number
          id: string
          order_minimum_minor: number | null
          payment_terms_days: number
          release_policy: string
          updated_at: string
          version: number
        }
        Insert: {
          allow_ach?: boolean
          allow_card?: boolean
          allow_manual?: boolean
          allow_terms?: boolean
          company_id: string
          created_at?: string
          credit_limit_minor?: number
          id?: string
          order_minimum_minor?: number | null
          payment_terms_days?: number
          release_policy?: string
          updated_at?: string
          version?: number
        }
        Update: {
          allow_ach?: boolean
          allow_card?: boolean
          allow_manual?: boolean
          allow_terms?: boolean
          company_id?: string
          created_at?: string
          credit_limit_minor?: number
          id?: string
          order_minimum_minor?: number | null
          payment_terms_days?: number
          release_policy?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_commerce_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          revoked_at: string | null
          role: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          revoked_at?: string | null
          role: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          revoked_at?: string | null
          role?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_locations: {
        Row: {
          active: boolean
          address_id: string
          appointment_required: boolean
          company_id: string
          created_at: string
          has_dock: boolean
          id: string
          is_residential: boolean
          liftgate_required: boolean
          name: string
          receiving_instructions: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address_id: string
          appointment_required?: boolean
          company_id: string
          created_at?: string
          has_dock?: boolean
          id?: string
          is_residential?: boolean
          liftgate_required?: boolean
          name: string
          receiving_instructions?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address_id?: string
          appointment_required?: boolean
          company_id?: string
          created_at?: string
          has_dock?: boolean
          id?: string
          is_residential?: boolean
          liftgate_required?: boolean
          name?: string
          receiving_instructions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_locations_address_id_company_id_fkey"
            columns: ["address_id", "company_id"]
            isOneToOne: false
            referencedRelation: "company_addresses"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "company_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_private_details: {
        Row: {
          business_number: string | null
          company_id: string
          created_at: string
          id: string
          internal_notes: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          business_number?: string | null
          company_id: string
          created_at?: string
          id?: string
          internal_notes?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          business_number?: string | null
          company_id?: string
          created_at?: string
          id?: string
          internal_notes?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_private_details_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          cases: number
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          pack_description: string
          packaging_id: string | null
          product_id: string | null
          product_name: string
          product_sku: string
          product_slug: string
          total_minor: number
          unit_price_minor: number
        }
        Insert: {
          cases: number
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          pack_description: string
          packaging_id?: string | null
          product_id?: string | null
          product_name: string
          product_sku: string
          product_slug: string
          total_minor: number
          unit_price_minor: number
        }
        Update: {
          cases?: number
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          pack_description?: string
          packaging_id?: string | null
          product_id?: string | null
          product_name?: string
          product_sku?: string
          product_slug?: string
          total_minor?: number
          unit_price_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "product_packaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          created_at: string
          currency: string
          fulfillment_status: string
          id: string
          internal_notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          placed_by_name: string
          placed_by_user_id: string
          po_number: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal_minor: number
          total_minor: number
          updated_at: string
          wire_reference: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          currency?: string
          fulfillment_status?: string
          id?: string
          internal_notes?: string | null
          order_number: string
          payment_method: string
          payment_status?: string
          placed_by_name: string
          placed_by_user_id: string
          po_number?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_minor: number
          total_minor: number
          updated_at?: string
          wire_reference?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          currency?: string
          fulfillment_status?: string
          id?: string
          internal_notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          placed_by_name?: string
          placed_by_user_id?: string
          po_number?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_minor?: number
          total_minor?: number
          updated_at?: string
          wire_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_list_items: {
        Row: {
          created_at: string
          id: string
          packaging_id: string
          price_list_id: string
          unit_price_minor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          packaging_id: string
          price_list_id: string
          unit_price_minor: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          packaging_id?: string
          price_list_id?: string
          unit_price_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "product_packaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          id: string
          name: string
          pricing_tier_id: string | null
          scope: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          name: string
          pricing_tier_id?: string | null
          scope?: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          name?: string
          pricing_tier_id?: string | null
          scope?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_pricing_tier_id_fkey"
            columns: ["pricing_tier_id"]
            isOneToOne: false
            referencedRelation: "pricing_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_packaging: {
        Row: {
          active: boolean
          barcode: string | null
          base_unit_quantity: number
          created_at: string
          freight_class: string | null
          id: string
          maximum_quantity: number | null
          minimum_quantity: number
          name: string
          product_id: string
          quantity_increment: number
          sku: string
          type: string
          units_per_case: number
          updated_at: string
          weight_g: number | null
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          base_unit_quantity?: number
          created_at?: string
          freight_class?: string | null
          id?: string
          maximum_quantity?: number | null
          minimum_quantity?: number
          name: string
          product_id: string
          quantity_increment?: number
          sku: string
          type?: string
          units_per_case?: number
          updated_at?: string
          weight_g?: number | null
        }
        Update: {
          active?: boolean
          barcode?: string | null
          base_unit_quantity?: number
          created_at?: string
          freight_class?: string | null
          id?: string
          maximum_quantity?: number | null
          minimum_quantity?: number
          name?: string
          product_id?: string
          quantity_increment?: number
          sku?: string
          type?: string
          units_per_case?: number
          updated_at?: string
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_packaging_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          allergens: string | null
          base_unit: string
          brand: string
          category_id: string | null
          country_of_origin: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          ingredients: string | null
          name: string
          shelf_life_days: number | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          sku: string
          slug: string
          storage_requirements: string | null
          tag: string | null
          updated_at: string
          version: number
          wholesale_description_override: string | null
          wholesale_enabled: boolean
          wholesale_name_override: string | null
        }
        Insert: {
          active?: boolean
          allergens?: string | null
          base_unit?: string
          brand?: string
          category_id?: string | null
          country_of_origin?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          name: string
          shelf_life_days?: number | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku: string
          slug: string
          storage_requirements?: string | null
          tag?: string | null
          updated_at?: string
          version?: number
          wholesale_description_override?: string | null
          wholesale_enabled?: boolean
          wholesale_name_override?: string | null
        }
        Update: {
          active?: boolean
          allergens?: string | null
          base_unit?: string
          brand?: string
          category_id?: string | null
          country_of_origin?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          name?: string
          shelf_life_days?: number | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          sku?: string
          slug?: string
          storage_requirements?: string | null
          tag?: string | null
          updated_at?: string
          version?: number
          wholesale_description_override?: string | null
          wholesale_enabled?: boolean
          wholesale_name_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          locale: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          locale?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quantity_price_breaks: {
        Row: {
          created_at: string
          id: string
          minimum_quantity: number
          price_list_item_id: string
          unit_price_minor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          minimum_quantity: number
          price_list_item_id: string
          unit_price_minor: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          minimum_quantity?: number
          price_list_item_id?: string
          unit_price_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantity_price_breaks_price_list_item_id_fkey"
            columns: ["price_list_item_id"]
            isOneToOne: false
            referencedRelation: "price_list_items"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_users: {
        Row: {
          active: boolean
          created_at: string
          id: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_exemptions: {
        Row: {
          certificate_storage_path: string
          company_id: string
          created_at: string
          id: string
          jurisdiction: string
          status: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          verified_by: string | null
        }
        Insert: {
          certificate_storage_path: string
          company_id: string
          created_at?: string
          id?: string
          jurisdiction: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          verified_by?: string | null
        }
        Update: {
          certificate_storage_path?: string
          company_id?: string
          created_at?: string
          id?: string
          jurisdiction?: string
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_exemptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_exemptions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wholesale_applications: {
        Row: {
          address: Json
          applicant_notes: string | null
          business_name: string
          business_number: string | null
          business_type: string
          company_id: string | null
          created_at: string
          customer_message: string | null
          email: string
          estimated_monthly_volume: string | null
          first_name: string
          id: string
          internal_notes: string | null
          last_name: string
          phone: string
          products_interested_in: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submission_key: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address: Json
          applicant_notes?: string | null
          business_name: string
          business_number?: string | null
          business_type: string
          company_id?: string | null
          created_at?: string
          customer_message?: string | null
          email: string
          estimated_monthly_volume?: string | null
          first_name: string
          id?: string
          internal_notes?: string | null
          last_name: string
          phone: string
          products_interested_in?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_key: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json
          applicant_notes?: string | null
          business_name?: string
          business_number?: string | null
          business_type?: string
          company_id?: string | null
          created_at?: string
          customer_message?: string | null
          email?: string
          estimated_monthly_volume?: string | null
          first_name?: string
          id?: string
          internal_notes?: string | null
          last_name?: string
          phone?: string
          products_interested_in?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_key?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wholesale_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token_hash: string }; Returns: string }
      admin_approve_application: {
        Args: {
          p_application_id: string
          p_expires_at: string
          p_internal_notes?: string
          p_pricing_tier_id: string
          p_token_hash: string
        }
        Returns: {
          company_id: string
          invitation_id: string
        }[]
      }
      admin_companies: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          legal_name: string
          member_count: number
          phone: string
          pricing_tier_code: string
          pricing_tier_name: string
          status: string
          updated_at: string
          version: number
          website: string
        }[]
      }
      admin_company_counts: {
        Args: never
        Returns: {
          status: string
          total: number
        }[]
      }
      admin_confirm_wire_payment: {
        Args: { p_internal_notes?: string; p_order_id: string }
        Returns: boolean
      }
      admin_reject_application: {
        Args: {
          p_application_id: string
          p_customer_message?: string
          p_internal_notes?: string
        }
        Returns: undefined
      }
      admin_staff_directory: {
        Args: never
        Returns: {
          active: boolean
          created_at: string
          email: string
          first_name: string
          last_name: string
          role_code: string
          role_name: string
          staff_user_id: string
          user_id: string
        }[]
      }
      bootstrap_administrator: {
        Args: { target_email: string }
        Returns: string
      }
      create_wholesale_order: {
        Args: {
          p_company_id: string
          p_lines?: Json
          p_payment_method: string
          p_payment_status?: string
          p_po_number?: string
          p_stripe_payment_intent_id?: string
          p_stripe_session_id?: string
        }
        Returns: {
          order_id: string
          order_number: string
          total_minor: number
          wire_reference: string
        }[]
      }
      current_memberships: {
        Args: never
        Returns: {
          company_display_name: string
          company_id: string
          company_status: string
          membership_id: string
          role: string
        }[]
      }
      current_staff_context: {
        Args: never
        Returns: {
          mfa_required: boolean
          mfa_verified: boolean
          permissions: string[]
          role_code: string
          role_name: string
          staff_user_id: string
        }[]
      }
      get_catalog_for_company: {
        Args: { p_company_id?: string }
        Returns: {
          available: boolean
          brand: string
          case_price_minor: number
          category_name: string
          category_slug: string
          image_url: string
          pack_name: string
          pack_sku: string
          product_description: string
          product_id: string
          product_name: string
          product_sku: string
          product_slug: string
          tag: string
          units_per_case: number
          volume_breaks: Json
        }[]
      }
      get_invitation_details: {
        Args: { p_token_hash: string }
        Returns: {
          company_id: string
          company_name: string
          email: string
          invitation_id: string
          is_accepted: boolean
          is_expired: boolean
          is_revoked: boolean
          role: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
