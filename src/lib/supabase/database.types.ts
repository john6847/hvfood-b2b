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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
          mfa_verified: boolean
          permissions: string[]
          role_code: string
          role_name: string
          staff_user_id: string
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
  public: {
    Enums: {},
  },
} as const

