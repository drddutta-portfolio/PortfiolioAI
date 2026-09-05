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
      broker_accounts: {
        Row: {
          account_name: string
          broker_id: string
          created_at: string
          external_account_id: string | null
          id: string
          is_active: boolean
          portfolio_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          broker_id: string
          created_at?: string
          external_account_id?: string | null
          id?: string
          is_active?: boolean
          portfolio_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          broker_id?: string
          created_at?: string
          external_account_id?: string | null
          id?: string
          is_active?: boolean
          portfolio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_accounts_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_accounts_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          api_provider: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          api_provider?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          api_provider?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          ambiguous_row_count: number
          broker_account_id: string | null
          committed_at: string | null
          confirmed_at: string | null
          created_at: string
          duplicate_of_import_batch_id: string | null
          duplicate_row_count: number
          failure_details: Json | null
          file_format: string | null
          file_name: string | null
          file_sha256: string | null
          id: string
          invalid_row_count: number
          mapping_config: Json | null
          mapping_version: string | null
          portfolio_id: string
          snapshot_as_of_date: string | null
          source_provider: string | null
          source_type: string
          status: string
          total_row_count: number
          updated_at: string
          valid_row_count: number
        }
        Insert: {
          ambiguous_row_count?: number
          broker_account_id?: string | null
          committed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          duplicate_of_import_batch_id?: string | null
          duplicate_row_count?: number
          failure_details?: Json | null
          file_format?: string | null
          file_name?: string | null
          file_sha256?: string | null
          id?: string
          invalid_row_count?: number
          mapping_config?: Json | null
          mapping_version?: string | null
          portfolio_id: string
          snapshot_as_of_date?: string | null
          source_provider?: string | null
          source_type: string
          status?: string
          total_row_count?: number
          updated_at?: string
          valid_row_count?: number
        }
        Update: {
          ambiguous_row_count?: number
          broker_account_id?: string | null
          committed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          duplicate_of_import_batch_id?: string | null
          duplicate_row_count?: number
          failure_details?: Json | null
          file_format?: string | null
          file_name?: string | null
          file_sha256?: string | null
          id?: string
          invalid_row_count?: number
          mapping_config?: Json | null
          mapping_version?: string | null
          portfolio_id?: string
          snapshot_as_of_date?: string | null
          source_provider?: string | null
          source_type?: string
          status?: string
          total_row_count?: number
          updated_at?: string
          valid_row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_broker_account_portfolio_fkey"
            columns: ["broker_account_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id", "portfolio_id"]
          },
          {
            foreignKeyName: "import_batches_duplicate_portfolio_fkey"
            columns: ["duplicate_of_import_batch_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "portfolio_id"]
          },
          {
            foreignKeyName: "import_batches_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      import_source_rows: {
        Row: {
          created_at: string
          duplicate_of_transaction_id: string | null
          duplicate_status: string | null
          id: string
          import_batch_id: string
          normalized_data: Json | null
          portfolio_id: string
          raw_data: Json
          raw_row_hash: string | null
          resolved_security_id: string | null
          row_number: number
          validation_errors: Json
          validation_status: string
          validation_warnings: Json
        }
        Insert: {
          created_at?: string
          duplicate_of_transaction_id?: string | null
          duplicate_status?: string | null
          id?: string
          import_batch_id: string
          normalized_data?: Json | null
          portfolio_id: string
          raw_data: Json
          raw_row_hash?: string | null
          resolved_security_id?: string | null
          row_number: number
          validation_errors?: Json
          validation_status?: string
          validation_warnings?: Json
        }
        Update: {
          created_at?: string
          duplicate_of_transaction_id?: string | null
          duplicate_status?: string | null
          id?: string
          import_batch_id?: string
          normalized_data?: Json | null
          portfolio_id?: string
          raw_data?: Json
          raw_row_hash?: string | null
          resolved_security_id?: string | null
          row_number?: number
          validation_errors?: Json
          validation_status?: string
          validation_warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "import_source_rows_batch_portfolio_fkey"
            columns: ["import_batch_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "portfolio_id"]
          },
          {
            foreignKeyName: "import_source_rows_duplicate_transaction_fkey"
            columns: ["duplicate_of_transaction_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "portfolio_id"]
          },
          {
            foreignKeyName: "import_source_rows_resolved_security_id_fkey"
            columns: ["resolved_security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sector_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sector_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sector_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "industries_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_security_settings: {
        Row: {
          created_at: string
          id: string
          investment_horizon: string | null
          is_frozen: boolean
          is_watchlisted: boolean
          maximum_weight: number | null
          minimum_weight: number | null
          notes: string | null
          portfolio_id: string
          portfolio_role: string
          priority: number | null
          security_id: string
          target_weight: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          investment_horizon?: string | null
          is_frozen?: boolean
          is_watchlisted?: boolean
          maximum_weight?: number | null
          minimum_weight?: number | null
          notes?: string | null
          portfolio_id: string
          portfolio_role?: string
          priority?: number | null
          security_id: string
          target_weight?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          investment_horizon?: string | null
          is_frozen?: boolean
          is_watchlisted?: boolean
          maximum_weight?: number | null
          minimum_weight?: number | null
          notes?: string | null
          portfolio_id?: string
          portfolio_role?: string
          priority?: number | null
          security_id?: string
          target_weight?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_security_settings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_security_settings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      securities: {
        Row: {
          asset_class: string
          created_at: string
          currency: string
          exchange: string
          id: string
          industry_id: string | null
          instrument_type: string
          is_active: boolean
          isin: string | null
          name: string
          sector_id: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          asset_class: string
          created_at?: string
          currency?: string
          exchange: string
          id?: string
          industry_id?: string | null
          instrument_type: string
          is_active?: boolean
          isin?: string | null
          name: string
          sector_id?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          asset_class?: string
          created_at?: string
          currency?: string
          exchange?: string
          id?: string
          industry_id?: string | null
          instrument_type?: string
          is_active?: boolean
          isin?: string | null
          name?: string
          sector_id?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "securities_industry_sector_fkey"
            columns: ["industry_id", "sector_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id", "sector_id"]
          },
          {
            foreignKeyName: "securities_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      security_identifiers: {
        Row: {
          created_at: string
          exchange: string | null
          id: string
          identifier_type: string
          identifier_value: string
          is_primary: boolean
          provider_code: string
          security_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exchange?: string | null
          id?: string
          identifier_type: string
          identifier_value: string
          is_primary?: boolean
          provider_code: string
          security_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exchange?: string | null
          id?: string
          identifier_type?: string
          identifier_value?: string
          is_primary?: boolean
          provider_code?: string
          security_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_identifiers_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          accounting_status: string
          broker_account_id: string | null
          charges: number | null
          created_at: string
          currency_code: string
          data_quality_status: string
          deduplication_key: string | null
          executed_at: string | null
          external_order_id: string | null
          external_trade_id: string | null
          external_transaction_id: string | null
          gross_amount: number | null
          id: string
          import_batch_id: string | null
          import_source_row_id: string | null
          net_amount: number | null
          notes: string | null
          portfolio_id: string
          quantity: number | null
          reversal_of_transaction_id: string | null
          security_id: string
          source_average_cost: number | null
          source_cost_basis: number | null
          source_provider: string | null
          source_sequence: number | null
          source_type: string
          superseded_at: string | null
          superseded_by_import_batch_id: string | null
          supersession_reason: string | null
          taxes: number | null
          transaction_date: string | null
          transaction_type: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          accounting_status?: string
          broker_account_id?: string | null
          charges?: number | null
          created_at?: string
          currency_code?: string
          data_quality_status: string
          deduplication_key?: string | null
          executed_at?: string | null
          external_order_id?: string | null
          external_trade_id?: string | null
          external_transaction_id?: string | null
          gross_amount?: number | null
          id?: string
          import_batch_id?: string | null
          import_source_row_id?: string | null
          net_amount?: number | null
          notes?: string | null
          portfolio_id: string
          quantity?: number | null
          reversal_of_transaction_id?: string | null
          security_id: string
          source_average_cost?: number | null
          source_cost_basis?: number | null
          source_provider?: string | null
          source_sequence?: number | null
          source_type: string
          superseded_at?: string | null
          superseded_by_import_batch_id?: string | null
          supersession_reason?: string | null
          taxes?: number | null
          transaction_date?: string | null
          transaction_type: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          accounting_status?: string
          broker_account_id?: string | null
          charges?: number | null
          created_at?: string
          currency_code?: string
          data_quality_status?: string
          deduplication_key?: string | null
          executed_at?: string | null
          external_order_id?: string | null
          external_trade_id?: string | null
          external_transaction_id?: string | null
          gross_amount?: number | null
          id?: string
          import_batch_id?: string | null
          import_source_row_id?: string | null
          net_amount?: number | null
          notes?: string | null
          portfolio_id?: string
          quantity?: number | null
          reversal_of_transaction_id?: string | null
          security_id?: string
          source_average_cost?: number | null
          source_cost_basis?: number | null
          source_provider?: string | null
          source_sequence?: number | null
          source_type?: string
          superseded_at?: string | null
          superseded_by_import_batch_id?: string | null
          supersession_reason?: string | null
          taxes?: number | null
          transaction_date?: string | null
          transaction_type?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_broker_account_portfolio_fkey"
            columns: ["broker_account_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id", "portfolio_id"]
          },
          {
            foreignKeyName: "transactions_import_batch_portfolio_fkey"
            columns: ["import_batch_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "portfolio_id"]
          },
          {
            foreignKeyName: "transactions_import_source_row_batch_portfolio_fkey"
            columns: ["import_source_row_id", "import_batch_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "import_source_rows"
            referencedColumns: ["id", "import_batch_id", "portfolio_id"]
          },
          {
            foreignKeyName: "transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_reversal_portfolio_fkey"
            columns: ["reversal_of_transaction_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "portfolio_id"]
          },
          {
            foreignKeyName: "transactions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_superseded_batch_portfolio_fkey"
            columns: ["superseded_by_import_batch_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "portfolio_id"]
          },
        ]
      }
    }
    Views: {
      current_holdings: {
        Row: {
          active_transaction_count: number | null
          current_quantity: number | null
          has_missing_broker: boolean | null
          has_missing_dates: boolean | null
          incomplete_transaction_count: number | null
          is_quantity_complete: boolean | null
          portfolio_id: string | null
          security_id: string | null
          unresolved_quantity_event_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
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
