export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Preserve the repository's deployed PostgREST compatibility marker while
  // regenerating the public schema with the locally installed Supabase CLI.
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
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
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
      classification_source_mappings: {
        Row: {
          evidence: Json
          id: string
          industry_id: string | null
          mapping_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          sector_id: string | null
          source_code: string
          source_industry: string | null
          source_sector: string | null
          taxonomy_code: string
          taxonomy_version: number
        }
        Insert: {
          evidence?: Json
          id?: string
          industry_id?: string | null
          mapping_status: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sector_id?: string | null
          source_code: string
          source_industry?: string | null
          source_sector?: string | null
          taxonomy_code: string
          taxonomy_version: number
        }
        Update: {
          evidence?: Json
          id?: string
          industry_id?: string | null
          mapping_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sector_id?: string | null
          source_code?: string
          source_industry?: string | null
          source_sector?: string | null
          taxonomy_code?: string
          taxonomy_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "classification_source_mapping_taxonomy_code_taxonomy_versi_fkey"
            columns: ["taxonomy_code", "taxonomy_version"]
            isOneToOne: false
            referencedRelation: "classification_taxonomies"
            referencedColumns: ["code", "version"]
          },
          {
            foreignKeyName: "classification_source_mappings_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_source_mappings_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_source_mappings_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      classification_taxonomies: {
        Row: {
          code: string
          created_at: string
          definition: Json
          effective_from: string
          is_active: boolean
          level_names: string[]
          name: string
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          definition?: Json
          effective_from: string
          is_active?: boolean
          level_names: string[]
          name: string
          version: number
        }
        Update: {
          code?: string
          created_at?: string
          definition?: Json
          effective_from?: string
          is_active?: boolean
          level_names?: string[]
          name?: string
          version?: number
        }
        Relationships: []
      }
      data_ingestion_leases: {
        Row: {
          lease_expires_at: string | null
          lease_holder: string | null
          next_allowed_at: string
          operation: string
          source_code: string
          updated_at: string
        }
        Insert: {
          lease_expires_at?: string | null
          lease_holder?: string | null
          next_allowed_at?: string
          operation: string
          source_code: string
          updated_at?: string
        }
        Update: {
          lease_expires_at?: string | null
          lease_holder?: string | null
          next_allowed_at?: string
          operation?: string
          source_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_ingestion_leases_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      data_ingestion_runs: {
        Row: {
          cached_count: number
          completed_at: string | null
          error_summary: string | null
          failed_count: number
          fetched_count: number
          id: string
          metadata: Json
          operation: string
          requested_by: string | null
          requested_count: number
          source_code: string
          started_at: string
          status: string
          unchanged_count: number
        }
        Insert: {
          cached_count?: number
          completed_at?: string | null
          error_summary?: string | null
          failed_count?: number
          fetched_count?: number
          id?: string
          metadata?: Json
          operation: string
          requested_by?: string | null
          requested_count?: number
          source_code: string
          started_at?: string
          status: string
          unchanged_count?: number
        }
        Update: {
          cached_count?: number
          completed_at?: string | null
          error_summary?: string | null
          failed_count?: number
          fetched_count?: number
          id?: string
          metadata?: Json
          operation?: string
          requested_by?: string | null
          requested_count?: number
          source_code?: string
          started_at?: string
          status?: string
          unchanged_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "data_ingestion_runs_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      data_source_records: {
        Row: {
          created_at: string
          external_record_id: string | null
          id: string
          ingestion_run_id: string | null
          payload_hash: string
          published_at: string | null
          raw_payload: Json
          record_kind: string
          retrieved_at: string
          source_code: string
          source_observed_at: string | null
          source_url: string | null
          terms_snapshot: Json
        }
        Insert: {
          created_at?: string
          external_record_id?: string | null
          id?: string
          ingestion_run_id?: string | null
          payload_hash: string
          published_at?: string | null
          raw_payload: Json
          record_kind: string
          retrieved_at?: string
          source_code: string
          source_observed_at?: string | null
          source_url?: string | null
          terms_snapshot?: Json
        }
        Update: {
          created_at?: string
          external_record_id?: string | null
          id?: string
          ingestion_run_id?: string | null
          payload_hash?: string
          published_at?: string | null
          raw_payload?: Json
          record_kind?: string
          retrieved_at?: string
          source_code?: string
          source_observed_at?: string | null
          source_url?: string | null
          terms_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "data_source_records_ingestion_run_id_fkey"
            columns: ["ingestion_run_id"]
            isOneToOne: false
            referencedRelation: "data_ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_records_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      data_sources: {
        Row: {
          capabilities: Json
          code: string
          configuration: Json
          created_at: string
          entitlement_verified: boolean
          evidence_priority: number
          is_active: boolean
          name: string
          retention_rights_verified: boolean
          source_kind: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          code: string
          configuration?: Json
          created_at?: string
          entitlement_verified?: boolean
          evidence_priority: number
          is_active?: boolean
          name: string
          retention_rights_verified?: boolean
          source_kind: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          code?: string
          configuration?: Json
          created_at?: string
          entitlement_verified?: boolean
          evidence_priority?: number
          is_active?: boolean
          name?: string
          retention_rights_verified?: boolean
          source_kind?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrichment_decision_events: {
        Row: {
          changed_at: string
          changed_by: string | null
          decision_kind: string
          id: string
          new_decision: Json | null
          old_decision: Json | null
          operation: string
          security_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          decision_kind: string
          id?: string
          new_decision?: Json | null
          old_decision?: Json | null
          operation: string
          security_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          decision_kind?: string
          id?: string
          new_decision?: Json | null
          old_decision?: Json | null
          operation?: string
          security_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_decision_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "enrichment_decision_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "enrichment_decision_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "enrichment_decision_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      fundamental_metric_definitions: {
        Row: {
          canonical_unit: string | null
          code: string
          definition: Json
          freshness_seconds: number
          is_active: boolean
          name: string
          statement_scope: string | null
          value_kind: string
        }
        Insert: {
          canonical_unit?: string | null
          code: string
          definition?: Json
          freshness_seconds: number
          is_active?: boolean
          name: string
          statement_scope?: string | null
          value_kind: string
        }
        Update: {
          canonical_unit?: string | null
          code?: string
          definition?: Json
          freshness_seconds?: number
          is_active?: boolean
          name?: string
          statement_scope?: string | null
          value_kind?: string
        }
        Relationships: []
      }
      fundamental_observation_decisions: {
        Row: {
          consolidation_scope: string | null
          decided_at: string
          decided_by: string | null
          decision_basis: string
          metric_code: string
          notes: string | null
          period_end: string | null
          period_type: string | null
          security_id: string
          selected_observation_id: string
        }
        Insert: {
          consolidation_scope?: string | null
          decided_at?: string
          decided_by?: string | null
          decision_basis: string
          metric_code: string
          notes?: string | null
          period_end?: string | null
          period_type?: string | null
          security_id: string
          selected_observation_id: string
        }
        Update: {
          consolidation_scope?: string | null
          decided_at?: string
          decided_by?: string | null
          decision_basis?: string
          metric_code?: string
          notes?: string | null
          period_end?: string | null
          period_type?: string | null
          security_id?: string
          selected_observation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundamental_observation_decisions_metric_code_fkey"
            columns: ["metric_code"]
            isOneToOne: false
            referencedRelation: "fundamental_metric_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_selected_observation_id_fkey"
            columns: ["selected_observation_id"]
            isOneToOne: false
            referencedRelation: "fundamental_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      fundamental_observations: {
        Row: {
          accounting_standard: string | null
          boolean_value: boolean | null
          consolidation_scope: string | null
          created_at: string
          currency: string | null
          date_value: string | null
          evidence_status: string
          fresh_until: string
          id: string
          metric_code: string
          numeric_value: number | null
          observed_at: string | null
          period_end: string | null
          period_start: string | null
          period_type: string | null
          published_at: string | null
          retrieved_at: string
          security_id: string
          source_code: string
          source_record_id: string
          text_value: string | null
          unit: string | null
        }
        Insert: {
          accounting_standard?: string | null
          boolean_value?: boolean | null
          consolidation_scope?: string | null
          created_at?: string
          currency?: string | null
          date_value?: string | null
          evidence_status?: string
          fresh_until: string
          id?: string
          metric_code: string
          numeric_value?: number | null
          observed_at?: string | null
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          published_at?: string | null
          retrieved_at?: string
          security_id: string
          source_code: string
          source_record_id: string
          text_value?: string | null
          unit?: string | null
        }
        Update: {
          accounting_standard?: string | null
          boolean_value?: boolean | null
          consolidation_scope?: string | null
          created_at?: string
          currency?: string | null
          date_value?: string | null
          evidence_status?: string
          fresh_until?: string
          id?: string
          metric_code?: string
          numeric_value?: number | null
          observed_at?: string | null
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          published_at?: string | null
          retrieved_at?: string
          security_id?: string
          source_code?: string
          source_record_id?: string
          text_value?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundamental_observations_metric_code_fkey"
            columns: ["metric_code"]
            isOneToOne: false
            referencedRelation: "fundamental_metric_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fundamental_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundamental_observations_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fundamental_observations_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      fundamental_reconciliation_cases: {
        Row: {
          accounting_standard: string | null
          case_status: string
          consolidation_scope: string | null
          id: string
          metric_code: string
          opened_at: string
          period_end: string | null
          period_start: string | null
          period_type: string | null
          reason_code: string
          resolution_type: string | null
          resolved_at: string | null
          review_notes: string | null
          reviewed_by: string | null
          security_id: string
          selected_observation_id: string | null
          semantic_fingerprint: string
          unit: string | null
        }
        Insert: {
          accounting_standard?: string | null
          case_status?: string
          consolidation_scope?: string | null
          id?: string
          metric_code: string
          opened_at?: string
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          reason_code: string
          resolution_type?: string | null
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          security_id: string
          selected_observation_id?: string | null
          semantic_fingerprint: string
          unit?: string | null
        }
        Update: {
          accounting_standard?: string | null
          case_status?: string
          consolidation_scope?: string | null
          id?: string
          metric_code?: string
          opened_at?: string
          period_end?: string | null
          period_start?: string | null
          period_type?: string | null
          reason_code?: string
          resolution_type?: string | null
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          security_id?: string
          selected_observation_id?: string | null
          semantic_fingerprint?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundamental_reconciliation_cases_metric_code_fkey"
            columns: ["metric_code"]
            isOneToOne: false
            referencedRelation: "fundamental_metric_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fundamental_reconciliation_cases_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_reconciliation_cases_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_reconciliation_cases_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_reconciliation_cases_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundamental_reconciliation_cases_selected_observation_id_fkey"
            columns: ["selected_observation_id"]
            isOneToOne: false
            referencedRelation: "fundamental_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      fundamental_reconciliation_events: {
        Row: {
          case_id: string
          changed_at: string
          changed_by: string | null
          event_type: string
          id: string
          prior_state: Json | null
          resulting_state: Json
        }
        Insert: {
          case_id: string
          changed_at?: string
          changed_by?: string | null
          event_type: string
          id?: string
          prior_state?: Json | null
          resulting_state: Json
        }
        Update: {
          case_id?: string
          changed_at?: string
          changed_by?: string | null
          event_type?: string
          id?: string
          prior_state?: Json | null
          resulting_state?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fundamental_reconciliation_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fundamental_reconciliation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      fundamental_reconciliation_members: {
        Row: {
          added_at: string
          case_id: string
          compatibility_evidence: Json
          compatibility_status: string
          observation_id: string
        }
        Insert: {
          added_at?: string
          case_id: string
          compatibility_evidence?: Json
          compatibility_status: string
          observation_id: string
        }
        Update: {
          added_at?: string
          case_id?: string
          compatibility_evidence?: Json
          compatibility_status?: string
          observation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundamental_reconciliation_members_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fundamental_reconciliation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundamental_reconciliation_members_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "fundamental_observations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
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
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "import_source_rows_resolved_security_id_fkey"
            columns: ["resolved_security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "import_source_rows_resolved_security_id_fkey"
            columns: ["resolved_security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
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
      manual_transaction_requests: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          request_hash: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          request_hash: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          request_hash?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_transaction_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      market_cap_category_assessments: {
        Row: {
          assessed_at: string
          assessment_status: string
          category: string
          evidence: Json
          policy_code: string
          policy_version: number
          rank_used: number | null
          reason_code: string
          security_id: string
          selected_observation_id: string | null
        }
        Insert: {
          assessed_at?: string
          assessment_status: string
          category: string
          evidence?: Json
          policy_code: string
          policy_version: number
          rank_used?: number | null
          reason_code: string
          security_id: string
          selected_observation_id?: string | null
        }
        Update: {
          assessed_at?: string
          assessment_status?: string
          category?: string
          evidence?: Json
          policy_code?: string
          policy_version?: number
          rank_used?: number | null
          reason_code?: string
          security_id?: string
          selected_observation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_cap_category_assessments_policy_code_policy_version_fkey"
            columns: ["policy_code", "policy_version"]
            isOneToOne: false
            referencedRelation: "market_cap_classification_policies"
            referencedColumns: ["code", "version"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_selected_observation_id_fkey"
            columns: ["selected_observation_id"]
            isOneToOne: false
            referencedRelation: "market_cap_classification_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_cap_classification_observations: {
        Row: {
          as_of_date: string
          capitalization_basis: string
          comparable_status: string
          created_at: string
          currency: string
          fresh_until: string
          full_market_cap_rank: number | null
          id: string
          market_cap: number
          observed_at: string | null
          retrieved_at: string
          security_id: string
          source_code: string
          source_record_id: string
          universe_code: string | null
        }
        Insert: {
          as_of_date: string
          capitalization_basis: string
          comparable_status?: string
          created_at?: string
          currency: string
          fresh_until: string
          full_market_cap_rank?: number | null
          id?: string
          market_cap: number
          observed_at?: string | null
          retrieved_at?: string
          security_id: string
          source_code: string
          source_record_id: string
          universe_code?: string | null
        }
        Update: {
          as_of_date?: string
          capitalization_basis?: string
          comparable_status?: string
          created_at?: string
          currency?: string
          fresh_until?: string
          full_market_cap_rank?: number | null
          id?: string
          market_cap?: number
          observed_at?: string | null
          retrieved_at?: string
          security_id?: string
          source_code?: string
          source_record_id?: string
          universe_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_cap_classification_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_classification_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_classification_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_classification_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_cap_classification_observations_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "market_cap_classification_observations_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      market_cap_classification_policies: {
        Row: {
          code: string
          conflict_adjacent_date_percent: number
          conflict_same_date_percent: number
          created_at: string
          definition: Json
          effective_from: string
          effective_to: string | null
          is_active: boolean
          large_cap_max_rank: number
          mid_cap_max_rank: number
          minimum_universe_size: number
          name: string
          version: number
        }
        Insert: {
          code: string
          conflict_adjacent_date_percent?: number
          conflict_same_date_percent?: number
          created_at?: string
          definition?: Json
          effective_from: string
          effective_to?: string | null
          is_active?: boolean
          large_cap_max_rank: number
          mid_cap_max_rank: number
          minimum_universe_size?: number
          name: string
          version: number
        }
        Update: {
          code?: string
          conflict_adjacent_date_percent?: number
          conflict_same_date_percent?: number
          created_at?: string
          definition?: Json
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean
          large_cap_max_rank?: number
          mid_cap_max_rank?: number
          minimum_universe_size?: number
          name?: string
          version?: number
        }
        Relationships: []
      }
      market_data_instrument_mappings: {
        Row: {
          created_at: string
          evidence: Json
          exchange: string | null
          id: string
          instrument_master_as_of: string | null
          listing_id: string | null
          mapping_status: string
          match_basis: string | null
          provider_code: string
          provider_instrument_id: string | null
          provider_instrument_type: string | null
          security_id: string
          trading_symbol: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          evidence?: Json
          exchange?: string | null
          id?: string
          instrument_master_as_of?: string | null
          listing_id?: string | null
          mapping_status: string
          match_basis?: string | null
          provider_code: string
          provider_instrument_id?: string | null
          provider_instrument_type?: string | null
          security_id: string
          trading_symbol?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          evidence?: Json
          exchange?: string | null
          id?: string
          instrument_master_as_of?: string | null
          listing_id?: string | null
          mapping_status?: string
          match_basis?: string | null
          provider_code?: string
          provider_instrument_id?: string | null
          provider_instrument_type?: string | null
          security_id?: string
          trading_symbol?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_data_instrument_mappings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "market_data_instrument_mappings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "security_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_data_instrument_mappings_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "market_data_instrument_mappings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_data_instrument_mappings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_data_instrument_mappings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_data_instrument_mappings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_mapping_reviews: {
        Row: {
          detected_at: string
          evidence: Json
          id: string
          mapping_id: string
          proposed_exchange: string | null
          proposed_mapping_status: string
          proposed_match_basis: string | null
          proposed_provider_instrument_id: string | null
          proposed_provider_instrument_type: string | null
          proposed_trading_symbol: string | null
          provider_code: string
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          security_id: string
        }
        Insert: {
          detected_at?: string
          evidence?: Json
          id?: string
          mapping_id: string
          proposed_exchange?: string | null
          proposed_mapping_status: string
          proposed_match_basis?: string | null
          proposed_provider_instrument_id?: string | null
          proposed_provider_instrument_type?: string | null
          proposed_trading_symbol?: string | null
          provider_code: string
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id: string
        }
        Update: {
          detected_at?: string
          evidence?: Json
          id?: string
          mapping_id?: string
          proposed_exchange?: string | null
          proposed_mapping_status?: string
          proposed_match_basis?: string | null
          proposed_provider_instrument_id?: string | null
          proposed_provider_instrument_type?: string | null
          proposed_trading_symbol?: string | null
          provider_code?: string
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_data_mapping_review_mapping_consistency_fk"
            columns: ["mapping_id", "security_id", "provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_instrument_mappings"
            referencedColumns: ["id", "security_id", "provider_code"]
          },
          {
            foreignKeyName: "market_data_mapping_reviews_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "market_data_instrument_mappings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_data_mapping_reviews_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "market_data_mapping_reviews_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_data_mapping_reviews_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_data_mapping_reviews_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_data_mapping_reviews_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_operation_leases: {
        Row: {
          lease_expires_at: string | null
          lease_holder: string | null
          next_allowed_at: string
          operation: string
          portfolio_id: string
          provider_code: string
          updated_at: string
        }
        Insert: {
          lease_expires_at?: string | null
          lease_holder?: string | null
          next_allowed_at?: string
          operation: string
          portfolio_id: string
          provider_code: string
          updated_at?: string
        }
        Update: {
          lease_expires_at?: string | null
          lease_holder?: string | null
          next_allowed_at?: string
          operation?: string
          portfolio_id?: string
          provider_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_data_operation_leases_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "market_data_operation_leases_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_data_operation_leases_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
        ]
      }
      market_data_providers: {
        Row: {
          capabilities: Json
          code: string
          created_at: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          code: string
          created_at?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          code?: string
          created_at?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_data_refresh_runs: {
        Row: {
          cached_security_count: number
          completed_at: string | null
          error_summary: string | null
          failed_security_count: number
          fetched_security_count: number
          id: string
          metadata: Json
          portfolio_id: string
          provider_code: string
          requested_by: string
          requested_security_count: number
          started_at: string
          status: string
          unresolved_security_count: number
        }
        Insert: {
          cached_security_count?: number
          completed_at?: string | null
          error_summary?: string | null
          failed_security_count?: number
          fetched_security_count?: number
          id?: string
          metadata?: Json
          portfolio_id: string
          provider_code: string
          requested_by: string
          requested_security_count: number
          started_at?: string
          status: string
          unresolved_security_count?: number
        }
        Update: {
          cached_security_count?: number
          completed_at?: string | null
          error_summary?: string | null
          failed_security_count?: number
          fetched_security_count?: number
          id?: string
          metadata?: Json
          portfolio_id?: string
          provider_code?: string
          requested_by?: string
          requested_security_count?: number
          started_at?: string
          status?: string
          unresolved_security_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_data_refresh_runs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "market_data_refresh_runs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_data_refresh_runs_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
        ]
      }
      market_price_history: {
        Row: {
          adjusted_close: number | null
          close: number
          high: number
          interval: string
          low: number
          mapping_id: string
          open: number
          period_start: string
          provenance: Json
          provider_code: string
          retrieved_at: string
          security_id: string
          volume: number | null
        }
        Insert: {
          adjusted_close?: number | null
          close: number
          high: number
          interval: string
          low: number
          mapping_id: string
          open: number
          period_start: string
          provenance: Json
          provider_code: string
          retrieved_at?: string
          security_id: string
          volume?: number | null
        }
        Update: {
          adjusted_close?: number | null
          close?: number
          high?: number
          interval?: string
          low?: number
          mapping_id?: string
          open?: number
          period_start?: string
          provenance?: Json
          provider_code?: string
          retrieved_at?: string
          security_id?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_price_history_mapping_consistency_fk"
            columns: ["mapping_id", "security_id", "provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_instrument_mappings"
            referencedColumns: ["id", "security_id", "provider_code"]
          },
          {
            foreignKeyName: "market_price_history_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "market_price_history_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_price_history_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_price_history_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_price_history_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      market_price_latest: {
        Row: {
          currency: string
          day_high: number | null
          day_low: number | null
          day_open: number | null
          mapping_id: string
          market_session_status: string
          previous_close: number | null
          price: number
          price_timestamp: string | null
          provenance: Json
          provider_code: string
          retrieved_at: string
          security_id: string
        }
        Insert: {
          currency?: string
          day_high?: number | null
          day_low?: number | null
          day_open?: number | null
          mapping_id: string
          market_session_status?: string
          previous_close?: number | null
          price: number
          price_timestamp?: string | null
          provenance: Json
          provider_code: string
          retrieved_at?: string
          security_id: string
        }
        Update: {
          currency?: string
          day_high?: number | null
          day_low?: number | null
          day_open?: number | null
          mapping_id?: string
          market_session_status?: string
          previous_close?: number | null
          price?: number
          price_timestamp?: string | null
          provenance?: Json
          provider_code?: string
          retrieved_at?: string
          security_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_price_latest_mapping_consistency_fk"
            columns: ["mapping_id", "security_id", "provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_instrument_mappings"
            referencedColumns: ["id", "security_id", "provider_code"]
          },
          {
            foreignKeyName: "market_price_latest_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "market_price_latest_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_price_latest_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_price_latest_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_price_latest_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
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
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
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
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "portfolio_security_settings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "portfolio_security_settings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
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
      research_document_sources: {
        Row: {
          content_hash: string | null
          created_at: string
          extraction_method: string | null
          extraction_provenance: Json
          extraction_version: string | null
          id: string
          provider_document_id: string | null
          research_document_id: string
          retrieved_at: string
          source_code: string
          source_published_at: string | null
          source_record_id: string
          source_status: string
          source_title: string | null
          source_url: string | null
          source_version: string | null
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          extraction_method?: string | null
          extraction_provenance?: Json
          extraction_version?: string | null
          id?: string
          provider_document_id?: string | null
          research_document_id: string
          retrieved_at: string
          source_code: string
          source_published_at?: string | null
          source_record_id: string
          source_status: string
          source_title?: string | null
          source_url?: string | null
          source_version?: string | null
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          extraction_method?: string | null
          extraction_provenance?: Json
          extraction_version?: string | null
          id?: string
          provider_document_id?: string | null
          research_document_id?: string
          retrieved_at?: string
          source_code?: string
          source_published_at?: string | null
          source_record_id?: string
          source_status?: string
          source_title?: string | null
          source_url?: string | null
          source_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_document_sources_research_document_id_fkey"
            columns: ["research_document_id"]
            isOneToOne: false
            referencedRelation: "research_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_document_sources_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "research_document_sources_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      research_documents: {
        Row: {
          authoritative_identifier: string | null
          authoritative_identifier_scheme: string | null
          canonical_content_hash: string | null
          created_at: string
          document_type: string
          external_storage_reference: string | null
          id: string
          identity_basis: string
          identity_evidence: Json
          identity_status: string
          metadata_identity_hash: string | null
          published_at: string | null
          reporting_period_end: string | null
          reporting_period_start: string | null
          reporting_period_type: string | null
          security_id: string
          version_label: string | null
        }
        Insert: {
          authoritative_identifier?: string | null
          authoritative_identifier_scheme?: string | null
          canonical_content_hash?: string | null
          created_at?: string
          document_type: string
          external_storage_reference?: string | null
          id?: string
          identity_basis: string
          identity_evidence?: Json
          identity_status: string
          metadata_identity_hash?: string | null
          published_at?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          reporting_period_type?: string | null
          security_id: string
          version_label?: string | null
        }
        Update: {
          authoritative_identifier?: string | null
          authoritative_identifier_scheme?: string | null
          canonical_content_hash?: string | null
          created_at?: string
          document_type?: string
          external_storage_reference?: string | null
          id?: string
          identity_basis?: string
          identity_evidence?: Json
          identity_status?: string
          metadata_identity_hash?: string | null
          published_at?: string | null
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          reporting_period_type?: string | null
          security_id?: string
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_documents_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_documents_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_documents_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_documents_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
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
          created_by: string | null
          creation_source: string
          currency: string
          exchange: string
          id: string
          industry_id: string | null
          instrument_type: string
          is_active: boolean
          isin: string | null
          name: string
          sector_id: string | null
          series: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          asset_class: string
          created_at?: string
          created_by?: string | null
          creation_source?: string
          currency?: string
          exchange: string
          id?: string
          industry_id?: string | null
          instrument_type: string
          is_active?: boolean
          isin?: string | null
          name: string
          sector_id?: string | null
          series?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          asset_class?: string
          created_at?: string
          created_by?: string | null
          creation_source?: string
          currency?: string
          exchange?: string
          id?: string
          industry_id?: string | null
          instrument_type?: string
          is_active?: boolean
          isin?: string | null
          name?: string
          sector_id?: string | null
          series?: string | null
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
      security_attribute_decisions: {
        Row: {
          attribute_code: string
          decided_at: string
          decided_by: string | null
          decision_basis: string
          notes: string | null
          security_id: string
          selected_observation_id: string
        }
        Insert: {
          attribute_code: string
          decided_at?: string
          decided_by?: string | null
          decision_basis: string
          notes?: string | null
          security_id: string
          selected_observation_id: string
        }
        Update: {
          attribute_code?: string
          decided_at?: string
          decided_by?: string | null
          decision_basis?: string
          notes?: string | null
          security_id?: string
          selected_observation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_attribute_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_attribute_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_attribute_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_attribute_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_attribute_decisions_selected_observation_id_fkey"
            columns: ["selected_observation_id"]
            isOneToOne: false
            referencedRelation: "security_attribute_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_attribute_observations: {
        Row: {
          attribute_code: string
          created_at: string
          evidence_status: string
          fresh_until: string
          id: string
          normalized_value: string | null
          observed_at: string | null
          retrieved_at: string
          security_id: string
          source_code: string
          source_record_id: string
          text_value: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          attribute_code: string
          created_at?: string
          evidence_status?: string
          fresh_until: string
          id?: string
          normalized_value?: string | null
          observed_at?: string | null
          retrieved_at?: string
          security_id: string
          source_code: string
          source_record_id: string
          text_value: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          attribute_code?: string
          created_at?: string
          evidence_status?: string
          fresh_until?: string
          id?: string
          normalized_value?: string | null
          observed_at?: string | null
          retrieved_at?: string
          security_id?: string
          source_code?: string
          source_record_id?: string
          text_value?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_attribute_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_attribute_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_attribute_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_attribute_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_attribute_observations_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "security_attribute_observations_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      security_classification_changes: {
        Row: {
          applied_at: string
          applied_by: string
          evidence_reference: string
          id: string
          new_asset_class: string
          new_instrument_type: string
          old_asset_class: string
          old_instrument_type: string
          request_id: string
          security_id: string
        }
        Insert: {
          applied_at?: string
          applied_by: string
          evidence_reference: string
          id?: string
          new_asset_class: string
          new_instrument_type: string
          old_asset_class: string
          old_instrument_type: string
          request_id: string
          security_id: string
        }
        Update: {
          applied_at?: string
          applied_by?: string
          evidence_reference?: string
          id?: string
          new_asset_class?: string
          new_instrument_type?: string
          old_asset_class?: string
          old_instrument_type?: string
          request_id?: string
          security_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_classification_changes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "security_classification_correction_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_classification_changes_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_classification_changes_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_classification_changes_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_classification_changes_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_classification_correction_requests: {
        Row: {
          created_at: string
          evidence_reference: string
          id: string
          portfolio_id: string
          proposed_asset_class: string
          proposed_instrument_type: string
          reason: string
          request_status: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          security_id: string
        }
        Insert: {
          created_at?: string
          evidence_reference: string
          id?: string
          portfolio_id: string
          proposed_asset_class: string
          proposed_instrument_type: string
          reason: string
          request_status?: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id: string
        }
        Update: {
          created_at?: string
          evidence_reference?: string
          id?: string
          portfolio_id?: string
          proposed_asset_class?: string
          proposed_instrument_type?: string
          reason?: string
          request_status?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_classification_correction_requests_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "security_classification_correction_requests_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_classification_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_classification_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_classification_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_classification_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_creation_requests: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          request_hash: string
          security_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          request_hash: string
          security_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          request_hash?: string
          security_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_creation_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_creation_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_creation_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_creation_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_enrichment_correction_requests: {
        Row: {
          created_at: string
          id: string
          portfolio_id: string
          proposed_value: Json
          reason: string
          request_status: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          security_id: string
          target_code: string
          target_kind: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_id: string
          proposed_value: Json
          reason: string
          request_status?: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id: string
          target_code: string
          target_kind: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_id?: string
          proposed_value?: Json
          reason?: string
          request_status?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id?: string
          target_code?: string
          target_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_enrichment_correction_requests_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "security_enrichment_correction_requests_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_enrichment_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_enrichment_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_enrichment_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_enrichment_correction_requests_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
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
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_identifiers_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_identifiers_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_identifiers_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_identity_observations: {
        Row: {
          confidence: number | null
          created_at: string
          evidence_status: string
          id: string
          listing_id: string | null
          observed_at: string | null
          observed_exchange: string | null
          observed_isin: string | null
          observed_name: string | null
          provider_instrument_id: string | null
          observed_series: string | null
          observed_symbol: string | null
          security_id: string | null
          source_code: string
          source_record_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          evidence_status?: string
          id?: string
          listing_id?: string | null
          observed_at?: string | null
          observed_exchange?: string | null
          observed_isin?: string | null
          observed_name?: string | null
          provider_instrument_id?: string | null
          observed_series?: string | null
          observed_symbol?: string | null
          security_id?: string | null
          source_code: string
          source_record_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          evidence_status?: string
          id?: string
          listing_id?: string | null
          observed_at?: string | null
          observed_exchange?: string | null
          observed_isin?: string | null
          observed_name?: string | null
          provider_instrument_id?: string | null
          observed_series?: string | null
          observed_symbol?: string | null
          security_id?: string | null
          source_code?: string
          source_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_identity_observations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "security_identity_observations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "security_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_identity_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_identity_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_identity_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_identity_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_identity_observations_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "security_identity_observations_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      security_listings: {
        Row: {
          created_at: string
          currency: string
          exchange: string
          id: string
          is_active: boolean
          is_primary: boolean
          security_id: string
          series: string | null
          trading_symbol: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          exchange: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          security_id: string
          series?: string | null
          trading_symbol: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          exchange?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          security_id?: string
          series?: string | null
          trading_symbol?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_listings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_listings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_listings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_listings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_reconciliation_candidates: {
        Row: {
          case_id: string
          confidence: number
          evidence: Json
          match_basis: string
          security_id: string
        }
        Insert: {
          case_id: string
          confidence: number
          evidence?: Json
          match_basis: string
          security_id: string
        }
        Update: {
          case_id?: string
          confidence?: number
          evidence?: Json
          match_basis?: string
          security_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_reconciliation_candidates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "security_reconciliation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_reconciliation_candidates_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_reconciliation_candidates_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_reconciliation_candidates_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_reconciliation_candidates_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      security_reconciliation_cases: {
        Row: {
          case_status: string
          created_at: string
          id: string
          reason_code: string
          resolved_security_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_record_id: string
        }
        Insert: {
          case_status?: string
          created_at?: string
          id?: string
          reason_code: string
          resolved_security_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_record_id: string
        }
        Update: {
          case_status?: string
          created_at?: string
          id?: string
          reason_code?: string
          resolved_security_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_reconciliation_cases_resolved_security_id_fkey"
            columns: ["resolved_security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_reconciliation_cases_resolved_security_id_fkey"
            columns: ["resolved_security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_reconciliation_cases_resolved_security_id_fkey"
            columns: ["resolved_security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_reconciliation_cases_resolved_security_id_fkey"
            columns: ["resolved_security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_reconciliation_cases_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_securities: {
        Row: {
          created_at: string
          id: string
          portfolio_id: string
          security_id: string
          theme_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_id: string
          security_id: string
          theme_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_id?: string
          security_id?: string
          theme_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_securities_security_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "theme_securities_security_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "theme_securities_security_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "theme_securities_security_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "theme_securities_theme_portfolio_fkey"
            columns: ["theme_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id", "portfolio_id"]
          },
        ]
      }
      themes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_allocation: number | null
          name: string
          portfolio_id: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_allocation?: number | null
          name: string
          portfolio_id: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_allocation?: number | null
          name?: string
          portfolio_id?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "themes_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_accounting_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          performed_by: string
          portfolio_id: string
          prior_accounting_status: string
          reason: string
          request_hash: string
          resulting_accounting_status: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          performed_by: string
          portfolio_id: string
          prior_accounting_status: string
          reason: string
          request_hash: string
          resulting_accounting_status: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          performed_by?: string
          portfolio_id?: string
          prior_accounting_status?: string
          reason?: string
          request_hash?: string
          resulting_accounting_status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_accounting_events_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "transaction_accounting_events_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_accounting_events_transaction_portfolio_fkey"
            columns: ["transaction_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "portfolio_id"]
          },
        ]
      }
      transaction_correction_requests: {
        Row: {
          corrected_transaction_id: string
          created_at: string
          id: string
          idempotency_key: string
          original_transaction_id: string
          request_hash: string
          user_id: string
        }
        Insert: {
          corrected_transaction_id: string
          created_at?: string
          id?: string
          idempotency_key: string
          original_transaction_id: string
          request_hash: string
          user_id: string
        }
        Update: {
          corrected_transaction_id?: string
          created_at?: string
          id?: string
          idempotency_key?: string
          original_transaction_id?: string
          request_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_correction_requests_corrected_transaction_id_fkey"
            columns: ["corrected_transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_correction_requests_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          accounting_status: string
          broker_account_id: string | null
          charges: number | null
          corrected_by: string | null
          corrected_from_transaction_id: string | null
          correction_reason: string | null
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
          corrected_by?: string | null
          corrected_from_transaction_id?: string | null
          correction_reason?: string | null
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
          corrected_by?: string | null
          corrected_from_transaction_id?: string | null
          correction_reason?: string | null
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
            foreignKeyName: "transactions_correction_portfolio_fkey"
            columns: ["corrected_from_transaction_id", "portfolio_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
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
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "transactions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "transactions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
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
      current_fundamental_observations_v1: {
        Row: {
          boolean_value: boolean | null
          consolidation_scope: string | null
          currency: string | null
          date_value: string | null
          fresh_until: string | null
          freshness_status: string | null
          metric_code: string | null
          numeric_value: number | null
          observed_at: string | null
          period_end: string | null
          period_type: string | null
          published_at: string | null
          retrieved_at: string | null
          security_id: string | null
          source_code: string | null
          text_value: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundamental_observation_decisions_metric_code_fkey"
            columns: ["metric_code"]
            isOneToOne: false
            referencedRelation: "fundamental_metric_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "fundamental_observation_decisions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundamental_observations_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
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
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
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
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "transactions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "transactions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
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
      current_market_cap_category_v1: {
        Row: {
          as_of_date: string | null
          assessed_at: string | null
          assessment_status: string | null
          capitalization_basis: string | null
          category: string | null
          currency: string | null
          fresh_until: string | null
          market_cap: number | null
          policy_code: string | null
          policy_version: number | null
          rank_used: number | null
          reason_code: string | null
          security_id: string | null
          source_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_cap_category_assessments_policy_code_policy_version_fkey"
            columns: ["policy_code", "policy_version"]
            isOneToOne: false
            referencedRelation: "market_cap_classification_policies"
            referencedColumns: ["code", "version"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_cap_category_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_cap_classification_observations_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      current_security_classification_v1: {
        Row: {
          company_name: string | null
          fresh_until: string | null
          has_conflict: boolean | null
          industry: string | null
          sector: string | null
          security_id: string | null
        }
        Relationships: []
      }
      current_security_enrichment_v1: {
        Row: {
          canonical_name: string | null
          capitalization_basis: string | null
          company_name: string | null
          enrichment_state: string | null
          fresh_until: string | null
          industry: string | null
          market_cap: number | null
          market_cap_as_of_date: string | null
          market_cap_category: string | null
          market_cap_currency: string | null
          market_cap_rank: number | null
          market_cap_source: string | null
          sector: string | null
          security_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_cap_classification_observations_source_code_fkey"
            columns: ["market_cap_source"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      current_security_identity_v1: {
        Row: {
          asset_class: string | null
          currency: string | null
          exchange: string | null
          instrument_type: string | null
          isin: string | null
          listing_id: string | null
          name: string | null
          security_id: string | null
          series: string | null
          trading_symbol: string | null
        }
        Relationships: []
      }
      portfolio_enrichment_coverage_v1: {
        Row: {
          available_count: number | null
          failed_count: number | null
          partial_count: number | null
          portfolio_id: string | null
          security_count: number | null
          stale_count: number | null
          unavailable_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      acquire_data_ingestion_lease_v1: {
        Args: {
          p_lease_holder: string
          p_lease_seconds: number
          p_operation: string
          p_source_code: string
        }
        Returns: {
          acquired: boolean
          retry_after: string
        }[]
      }
      acquire_market_data_operation_lease: {
        Args: {
          p_lease_holder: string
          p_lease_seconds: number
          p_operation: string
          p_portfolio_id: string
          p_provider_code: string
        }
        Returns: {
          acquired: boolean
          retry_after: string
        }[]
      }
      apply_fundamental_observation_decision_v1: {
        Args: { p_basis: string; p_notes?: string; p_observation_id: string }
        Returns: undefined
      }
      apply_security_attribute_decision_v1: {
        Args: { p_basis: string; p_notes?: string; p_observation_id: string }
        Returns: undefined
      }
      apply_security_classification_correction_v1: {
        Args: {
          p_request_id: string
          p_review_notes: string
          p_reviewer: string
        }
        Returns: Json
      }
      apply_security_enrichment_correction_v1: {
        Args: { p_apply: boolean; p_request_id: string; p_review_notes: string }
        Returns: undefined
      }
      commit_import_batch_v1: {
        Args: { p_approved_source_row_ids: string[]; p_import_batch_id: string }
        Returns: Json
      }
      correct_transaction_v1: {
        Args: {
          p_broker_account_id: string
          p_idempotency_key: string
          p_notes: string
          p_original_transaction_id: string
          p_portfolio_id: string
          p_quantity: number
          p_reason: string
          p_security_id: string
          p_total_charges: number
          p_transaction_date: string
          p_transaction_type: string
          p_unit_price: number
        }
        Returns: Json
      }
      create_manual_security_v1: {
        Args: {
          p_asset_class: string
          p_exchange: string
          p_idempotency_key: string
          p_instrument_type: string
          p_isin: string
          p_name: string
          p_portfolio_id: string
          p_series: string
          p_symbol: string
        }
        Returns: Json
      }
      create_manual_transaction_v1: {
        Args: {
          p_broker_account_id: string
          p_idempotency_key: string
          p_notes: string
          p_portfolio_id: string
          p_quantity: number
          p_security_id: string
          p_total_charges: number
          p_transaction_date: string
          p_transaction_type: string
          p_unit_price: number
        }
        Returns: Json
      }
      portfolioai_assert_effective_quantity_valid: {
        Args: {
          p_excluded_transaction_id?: string
          p_included_transaction_id?: string
          p_portfolio_id: string
          p_security_id: string
        }
        Returns: undefined
      }
      portfolioai_import_cell: {
        Args: { p_aliases: string[]; p_raw_data: Json }
        Returns: Json
      }
      portfolioai_import_cell_text: { Args: { p_cell: Json }; Returns: string }
      portfolioai_import_date: { Args: { p_cell: Json }; Returns: string }
      portfolioai_is_valid_isin: { Args: { p_isin: string }; Returns: boolean }
      portfolioai_normalize_import_token: {
        Args: { p_value: string }
        Returns: string
      }
      release_data_ingestion_lease_v1: {
        Args: {
          p_cooldown_seconds: number
          p_lease_holder: string
          p_operation: string
          p_source_code: string
        }
        Returns: boolean
      }
      release_market_data_operation_lease: {
        Args: {
          p_cooldown_seconds: number
          p_lease_holder: string
          p_operation: string
          p_portfolio_id: string
          p_provider_code: string
        }
        Returns: boolean
      }
      resolve_fundamental_reconciliation_case_v1: {
        Args: {
          p_case_id: string
          p_resolution_type: string
          p_review_notes: string
          p_reviewed_by: string
          p_selected_observation_id: string
        }
        Returns: undefined
      }
      restore_transaction_v1: {
        Args: {
          p_idempotency_key: string
          p_portfolio_id: string
          p_reason: string
          p_transaction_id: string
        }
        Returns: Json
      }
      submit_security_enrichment_correction_v1: {
        Args: {
          p_portfolio_id: string
          p_proposed_value: Json
          p_reason: string
          p_security_id: string
          p_target_code: string
          p_target_kind: string
        }
        Returns: string
      }
      void_transaction_v1: {
        Args: {
          p_idempotency_key: string
          p_portfolio_id: string
          p_reason: string
          p_transaction_id: string
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
