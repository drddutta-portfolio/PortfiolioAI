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
      data_ingestion_run_items: {
        Row: {
          accepted_record_count: number
          attempted_call_count: number
          completed_at: string | null
          data_domain: string
          id: string
          ingestion_run_id: string
          metadata: Json
          safe_reason_code: string | null
          security_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          accepted_record_count?: number
          attempted_call_count?: number
          completed_at?: string | null
          data_domain: string
          id?: string
          ingestion_run_id: string
          metadata?: Json
          safe_reason_code?: string | null
          security_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          accepted_record_count?: number
          attempted_call_count?: number
          completed_at?: string | null
          data_domain?: string
          id?: string
          ingestion_run_id?: string
          metadata?: Json
          safe_reason_code?: string | null
          security_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_ingestion_run_items_ingestion_run_id_fkey"
            columns: ["ingestion_run_id"]
            isOneToOne: false
            referencedRelation: "data_ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_ingestion_run_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "data_ingestion_run_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "data_ingestion_run_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "data_ingestion_run_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      data_ingestion_runs: {
        Row: {
          accepted_count: number | null
          attempted_call_count: number | null
          cached_count: number
          completed_at: string | null
          conflicting_count: number | null
          error_summary: string | null
          estimated_call_count: number | null
          failed_count: number
          fetched_count: number
          id: string
          metadata: Json
          operation: string
          orchestration_type: string | null
          policy_version: number | null
          portfolio_id: string | null
          rejected_count: number | null
          requested_by: string | null
          requested_count: number
          reserved_call_count: number | null
          skipped_count: number | null
          source_code: string
          started_at: string
          status: string
          trigger_source: string | null
          unchanged_count: number
        }
        Insert: {
          accepted_count?: number | null
          attempted_call_count?: number | null
          cached_count?: number
          completed_at?: string | null
          conflicting_count?: number | null
          error_summary?: string | null
          estimated_call_count?: number | null
          failed_count?: number
          fetched_count?: number
          id?: string
          metadata?: Json
          operation: string
          orchestration_type?: string | null
          policy_version?: number | null
          portfolio_id?: string | null
          rejected_count?: number | null
          requested_by?: string | null
          requested_count?: number
          reserved_call_count?: number | null
          skipped_count?: number | null
          source_code: string
          started_at?: string
          status: string
          trigger_source?: string | null
          unchanged_count?: number
        }
        Update: {
          accepted_count?: number | null
          attempted_call_count?: number | null
          cached_count?: number
          completed_at?: string | null
          conflicting_count?: number | null
          error_summary?: string | null
          estimated_call_count?: number | null
          failed_count?: number
          fetched_count?: number
          id?: string
          metadata?: Json
          operation?: string
          orchestration_type?: string | null
          policy_version?: number | null
          portfolio_id?: string | null
          rejected_count?: number | null
          requested_by?: string | null
          requested_count?: number
          reserved_call_count?: number | null
          skipped_count?: number | null
          source_code?: string
          started_at?: string
          status?: string
          trigger_source?: string | null
          unchanged_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "data_ingestion_runs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "data_ingestion_runs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
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
      external_rating_observations: {
        Row: {
          agency_code: string
          created_at: string
          evidence_status: string
          fresh_until: string
          id: string
          instrument_description: string | null
          instrument_type: string | null
          outlook: string | null
          rating_action: string | null
          rating_date: string | null
          rating_symbol: string
          retrieved_at: string
          security_id: string
          source_record_id: string | null
          source_url: string
        }
        Insert: {
          agency_code: string
          created_at?: string
          evidence_status?: string
          fresh_until: string
          id?: string
          instrument_description?: string | null
          instrument_type?: string | null
          outlook?: string | null
          rating_action?: string | null
          rating_date?: string | null
          rating_symbol: string
          retrieved_at?: string
          security_id: string
          source_record_id?: string | null
          source_url: string
        }
        Update: {
          agency_code?: string
          created_at?: string
          evidence_status?: string
          fresh_until?: string
          id?: string
          instrument_description?: string | null
          instrument_type?: string | null
          outlook?: string | null
          rating_action?: string | null
          rating_date?: string | null
          rating_symbol?: string
          retrieved_at?: string
          security_id?: string
          source_record_id?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_rating_observations_agency_code_fkey"
            columns: ["agency_code"]
            isOneToOne: false
            referencedRelation: "rating_agencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "external_rating_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "external_rating_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "external_rating_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "external_rating_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_rating_observations_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
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
      market_benchmark_price_history: {
        Row: {
          benchmark_code: string
          close: number
          created_at: string
          high: number
          id: string
          interval: string
          low: number
          open: number
          period_start: string
          provenance: Json
          provider_code: string
          retrieved_at: string
          volume: number | null
        }
        Insert: {
          benchmark_code: string
          close: number
          created_at?: string
          high: number
          id?: string
          interval: string
          low: number
          open: number
          period_start: string
          provenance?: Json
          provider_code: string
          retrieved_at: string
          volume?: number | null
        }
        Update: {
          benchmark_code?: string
          close?: number
          created_at?: string
          high?: number
          id?: string
          interval?: string
          low?: number
          open?: number
          period_start?: string
          provenance?: Json
          provider_code?: string
          retrieved_at?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_benchmark_price_history_benchmark_code_fkey"
            columns: ["benchmark_code"]
            isOneToOne: false
            referencedRelation: "market_benchmarks"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "market_benchmark_price_history_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
        ]
      }
      market_benchmarks: {
        Row: {
          code: string
          exchange: string | null
          mapping_evidence: Json
          mapping_status: string
          name: string
          provider_code: string
          provider_instrument_id: string | null
          trading_symbol: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          code: string
          exchange?: string | null
          mapping_evidence?: Json
          mapping_status?: string
          name: string
          provider_code: string
          provider_instrument_id?: string | null
          trading_symbol?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          exchange?: string | null
          mapping_evidence?: Json
          mapping_status?: string
          name?: string
          provider_code?: string
          provider_instrument_id?: string | null
          trading_symbol?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_benchmarks_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
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
      market_metric_observations: {
        Row: {
          as_of_date: string
          created_at: string
          derivation: Json
          evidence_status: string
          fresh_until: string
          id: string
          lookback_end: string
          lookback_start: string | null
          metric_code: string
          numeric_value: number
          provider_code: string
          retrieved_at: string
          security_id: string
          unit: string
        }
        Insert: {
          as_of_date: string
          created_at?: string
          derivation?: Json
          evidence_status?: string
          fresh_until: string
          id?: string
          lookback_end: string
          lookback_start?: string | null
          metric_code: string
          numeric_value: number
          provider_code: string
          retrieved_at?: string
          security_id: string
          unit: string
        }
        Update: {
          as_of_date?: string
          created_at?: string
          derivation?: Json
          evidence_status?: string
          fresh_until?: string
          id?: string
          lookback_end?: string
          lookback_start?: string | null
          metric_code?: string
          numeric_value?: number
          provider_code?: string
          retrieved_at?: string
          security_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_metric_observations_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "market_data_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "market_metric_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_metric_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_metric_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "market_metric_observations_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
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
      news_classification_events: {
        Row: {
          classifier_version: string
          created_at: string
          evidence_record_id: string | null
          id: string
          new_category: string
          new_importance_state: string
          new_tone_state: string
          news_item_id: string
          previous_category: string
          previous_importance_state: string
          previous_tone_state: string
          reason: string
        }
        Insert: {
          classifier_version: string
          created_at?: string
          evidence_record_id?: string | null
          id?: string
          new_category: string
          new_importance_state: string
          new_tone_state: string
          news_item_id: string
          previous_category: string
          previous_importance_state: string
          previous_tone_state: string
          reason: string
        }
        Update: {
          classifier_version?: string
          created_at?: string
          evidence_record_id?: string | null
          id?: string
          new_category?: string
          new_importance_state?: string
          new_tone_state?: string
          news_item_id?: string
          previous_category?: string
          previous_importance_state?: string
          previous_tone_state?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_classification_events_evidence_record_id_fkey"
            columns: ["evidence_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_classification_events_news_item_id_fkey"
            columns: ["news_item_id"]
            isOneToOne: false
            referencedRelation: "news_items"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          canonical_key: string
          category: string
          created_at: string
          first_seen_at: string
          headline: string
          id: string
          importance_state: string
          is_active: boolean
          last_seen_at: string
          primary_source_name: string | null
          primary_source_url: string | null
          publication_precision: string
          published_at: string | null
          security_id: string
          summary: string | null
          tone_confidence: number | null
          tone_method: string
          tone_reason: string | null
          tone_state: string
          updated_at: string
        }
        Insert: {
          canonical_key: string
          category?: string
          created_at?: string
          first_seen_at?: string
          headline: string
          id?: string
          importance_state?: string
          is_active?: boolean
          last_seen_at?: string
          primary_source_name?: string | null
          primary_source_url?: string | null
          publication_precision?: string
          published_at?: string | null
          security_id: string
          summary?: string | null
          tone_confidence?: number | null
          tone_method?: string
          tone_reason?: string | null
          tone_state?: string
          updated_at?: string
        }
        Update: {
          canonical_key?: string
          category?: string
          created_at?: string
          first_seen_at?: string
          headline?: string
          id?: string
          importance_state?: string
          is_active?: boolean
          last_seen_at?: string
          primary_source_name?: string | null
          primary_source_url?: string | null
          publication_precision?: string
          published_at?: string | null
          security_id?: string
          summary?: string | null
          tone_confidence?: number | null
          tone_method?: string
          tone_reason?: string | null
          tone_state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "news_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "news_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "news_items_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      news_pipeline_leases: {
        Row: {
          acquired_at: string
          cooldown_until: string
          expires_at: string
          lease_holder: string
          portfolio_id: string
          source_code: string
          updated_at: string
        }
        Insert: {
          acquired_at?: string
          cooldown_until?: string
          expires_at: string
          lease_holder: string
          portfolio_id: string
          source_code: string
          updated_at?: string
        }
        Update: {
          acquired_at?: string
          cooldown_until?: string
          expires_at?: string
          lease_holder?: string
          portfolio_id?: string
          source_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_pipeline_leases_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "news_pipeline_leases_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_pipeline_leases_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      news_source_appearances: {
        Row: {
          content_hash: string
          created_at: string
          data_source_record_id: string
          dedupe_key: string
          headline_as_received: string
          id: string
          news_item_id: string
          provider_record_id: string | null
          provider_security_identity: string
          published_at: string | null
          publisher_name: string | null
          retrieved_at: string
          source_code: string
          source_url: string | null
          summary_as_received: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string
          data_source_record_id: string
          dedupe_key: string
          headline_as_received: string
          id?: string
          news_item_id: string
          provider_record_id?: string | null
          provider_security_identity: string
          published_at?: string | null
          publisher_name?: string | null
          retrieved_at: string
          source_code: string
          source_url?: string | null
          summary_as_received?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string
          data_source_record_id?: string
          dedupe_key?: string
          headline_as_received?: string
          id?: string
          news_item_id?: string
          provider_record_id?: string | null
          provider_security_identity?: string
          published_at?: string | null
          publisher_name?: string | null
          retrieved_at?: string
          source_code?: string
          source_url?: string | null
          summary_as_received?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_source_appearances_data_source_record_id_fkey"
            columns: ["data_source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_source_appearances_news_item_id_fkey"
            columns: ["news_item_id"]
            isOneToOne: false
            referencedRelation: "news_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_source_appearances_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
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
          stop_loss_alert_enabled: boolean
          stop_loss_price: number | null
          target_price: number | null
          target_price_alert_enabled: boolean
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
          stop_loss_alert_enabled?: boolean
          stop_loss_price?: number | null
          target_price?: number | null
          target_price_alert_enabled?: boolean
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
          stop_loss_alert_enabled?: boolean
          stop_loss_price?: number | null
          target_price?: number | null
          target_price_alert_enabled?: boolean
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
      position_sizing_assessments: {
        Row: {
          as_of_at: string
          assessment_state: string
          created_at: string
          current_weight: number | null
          engine_version: string
          evaluation_key: string
          evidence_confidence: number | null
          evidence_coverage: number | null
          id: string
          input_snapshot: Json
          portfolio_id: string
          rationale: Json
          reason_codes: string[]
          recommended_action: string | null
          research_profile_code: string | null
          research_profile_version: string | null
          security_id: string
          source_recommendation_run_id: string | null
          source_score_run_id: string | null
          suggested_maximum_weight: number | null
          suggested_minimum_weight: number | null
          suggested_target_weight: number | null
        }
        Insert: {
          as_of_at: string
          assessment_state: string
          created_at?: string
          current_weight?: number | null
          engine_version: string
          evaluation_key: string
          evidence_confidence?: number | null
          evidence_coverage?: number | null
          id?: string
          input_snapshot: Json
          portfolio_id: string
          rationale?: Json
          reason_codes?: string[]
          recommended_action?: string | null
          research_profile_code?: string | null
          research_profile_version?: string | null
          security_id: string
          source_recommendation_run_id?: string | null
          source_score_run_id?: string | null
          suggested_maximum_weight?: number | null
          suggested_minimum_weight?: number | null
          suggested_target_weight?: number | null
        }
        Update: {
          as_of_at?: string
          assessment_state?: string
          created_at?: string
          current_weight?: number | null
          engine_version?: string
          evaluation_key?: string
          evidence_confidence?: number | null
          evidence_coverage?: number | null
          id?: string
          input_snapshot?: Json
          portfolio_id?: string
          rationale?: Json
          reason_codes?: string[]
          recommended_action?: string | null
          research_profile_code?: string | null
          research_profile_version?: string | null
          security_id?: string
          source_recommendation_run_id?: string | null
          source_score_run_id?: string | null
          suggested_maximum_weight?: number | null
          suggested_minimum_weight?: number | null
          suggested_target_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "position_sizing_assessments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "position_sizing_assessments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_sizing_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "position_sizing_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "position_sizing_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "position_sizing_assessments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_sizing_assessments_source_recommendation_run_id_fkey"
            columns: ["source_recommendation_run_id"]
            isOneToOne: false
            referencedRelation: "stock_recommendation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_sizing_assessments_source_score_run_id_fkey"
            columns: ["source_score_run_id"]
            isOneToOne: false
            referencedRelation: "stock_score_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_budget_reservations: {
        Row: {
          consumed_units: number
          estimated_units: number
          expires_at: string
          failed_units: number
          id: string
          ingestion_run_id: string
          policy_version: number
          released_units: number
          reservation_key: string
          reserved_at: string
          settled_at: string | null
          source_code: string
          status: string
        }
        Insert: {
          consumed_units?: number
          estimated_units: number
          expires_at: string
          failed_units?: number
          id?: string
          ingestion_run_id: string
          policy_version: number
          released_units?: number
          reservation_key: string
          reserved_at?: string
          settled_at?: string | null
          source_code: string
          status?: string
        }
        Update: {
          consumed_units?: number
          estimated_units?: number
          expires_at?: string
          failed_units?: number
          id?: string
          ingestion_run_id?: string
          policy_version?: number
          released_units?: number
          reservation_key?: string
          reserved_at?: string
          settled_at?: string | null
          source_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_budget_reservations_ingestion_run_id_fkey"
            columns: ["ingestion_run_id"]
            isOneToOne: false
            referencedRelation: "data_ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_budget_reservations_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      provider_control_events: {
        Row: {
          actor_id: string | null
          actor_kind: string
          control_name: string
          created_at: string
          expires_at: string | null
          id: string
          new_value: Json
          policy_version: number
          previous_value: Json | null
          reason: string
          source_code: string
        }
        Insert: {
          actor_id?: string | null
          actor_kind: string
          control_name: string
          created_at?: string
          expires_at?: string | null
          id?: string
          new_value: Json
          policy_version: number
          previous_value?: Json | null
          reason: string
          source_code: string
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          control_name?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          new_value?: Json
          policy_version?: number
          previous_value?: Json | null
          reason?: string
          source_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_control_events_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      provider_ingestion_controls: {
        Row: {
          actual_provider_quota: Json | null
          actual_provider_quota_status: string
          caution_threshold: number
          concurrency_limit: number
          consecutive_failure_threshold: number
          conservation_threshold: number
          daily_internal_attempt_limit: number
          hard_stop_threshold: number
          ingestion_enabled: boolean
          per_run_internal_attempt_limit: number
          policy_version: number
          rolling_internal_attempt_limit: number
          rolling_window_days: number
          scheduler_enabled: boolean
          source_code: string
          updated_at: string
          updated_by: string | null
          warning_threshold: number
        }
        Insert: {
          actual_provider_quota?: Json | null
          actual_provider_quota_status?: string
          caution_threshold: number
          concurrency_limit: number
          consecutive_failure_threshold: number
          conservation_threshold: number
          daily_internal_attempt_limit: number
          hard_stop_threshold?: number
          ingestion_enabled?: boolean
          per_run_internal_attempt_limit: number
          policy_version: number
          rolling_internal_attempt_limit: number
          rolling_window_days?: number
          scheduler_enabled?: boolean
          source_code: string
          updated_at?: string
          updated_by?: string | null
          warning_threshold: number
        }
        Update: {
          actual_provider_quota?: Json | null
          actual_provider_quota_status?: string
          caution_threshold?: number
          concurrency_limit?: number
          consecutive_failure_threshold?: number
          conservation_threshold?: number
          daily_internal_attempt_limit?: number
          hard_stop_threshold?: number
          ingestion_enabled?: boolean
          per_run_internal_attempt_limit?: number
          policy_version?: number
          rolling_internal_attempt_limit?: number
          rolling_window_days?: number
          scheduler_enabled?: boolean
          source_code?: string
          updated_at?: string
          updated_by?: string | null
          warning_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_ingestion_controls_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: true
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      provider_usage_events: {
        Row: {
          accounting_class: string
          actual_internal_units: number
          attempted_at: string
          completed_at: string | null
          created_at: string
          data_domain: string | null
          estimated_internal_units: number
          id: string
          idempotency_key: string
          ingestion_run_id: string | null
          operation_class: string
          outcome: string
          provider_reported_units: number | null
          retry_attempt: number
          run_item_id: string | null
          safe_error_code: string | null
          security_id: string | null
          source_code: string
        }
        Insert: {
          accounting_class: string
          actual_internal_units: number
          attempted_at: string
          completed_at?: string | null
          created_at?: string
          data_domain?: string | null
          estimated_internal_units?: number
          id?: string
          idempotency_key: string
          ingestion_run_id?: string | null
          operation_class: string
          outcome: string
          provider_reported_units?: number | null
          retry_attempt?: number
          run_item_id?: string | null
          safe_error_code?: string | null
          security_id?: string | null
          source_code: string
        }
        Update: {
          accounting_class?: string
          actual_internal_units?: number
          attempted_at?: string
          completed_at?: string | null
          created_at?: string
          data_domain?: string | null
          estimated_internal_units?: number
          id?: string
          idempotency_key?: string
          ingestion_run_id?: string | null
          operation_class?: string
          outcome?: string
          provider_reported_units?: number | null
          retry_attempt?: number
          run_item_id?: string | null
          safe_error_code?: string | null
          security_id?: string | null
          source_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_usage_events_ingestion_run_id_fkey"
            columns: ["ingestion_run_id"]
            isOneToOne: false
            referencedRelation: "data_ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_usage_events_run_item_id_fkey"
            columns: ["run_item_id"]
            isOneToOne: false
            referencedRelation: "data_ingestion_run_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_usage_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "provider_usage_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "provider_usage_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "provider_usage_events_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_usage_events_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      rating_agencies: {
        Row: {
          code: string
          country_code: string | null
          created_at: string
          is_active: boolean
          name: string
          website_url: string | null
        }
        Insert: {
          code: string
          country_code?: string | null
          created_at?: string
          is_active?: boolean
          name: string
          website_url?: string | null
        }
        Update: {
          code?: string
          country_code?: string | null
          created_at?: string
          is_active?: boolean
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      recommendation_profile_policies: {
        Row: {
          caution_rules: Json
          core_min_score: number | null
          created_at: string
          mandatory_dimension_floors: Json
          min_score_ready_coverage: number
          notes: string | null
          persistence_rules: Json
          policy_version: number
          profile_code: string
          satellite_min_score: number | null
          sector_focus: Json
          status: string
          updated_at: string
          watch_min_score: number | null
          weight_policy: Json
        }
        Insert: {
          caution_rules?: Json
          core_min_score?: number | null
          created_at?: string
          mandatory_dimension_floors?: Json
          min_score_ready_coverage?: number
          notes?: string | null
          persistence_rules?: Json
          policy_version?: number
          profile_code: string
          satellite_min_score?: number | null
          sector_focus?: Json
          status?: string
          updated_at?: string
          watch_min_score?: number | null
          weight_policy?: Json
        }
        Update: {
          caution_rules?: Json
          core_min_score?: number | null
          created_at?: string
          mandatory_dimension_floors?: Json
          min_score_ready_coverage?: number
          notes?: string | null
          persistence_rules?: Json
          policy_version?: number
          profile_code?: string
          satellite_min_score?: number | null
          sector_focus?: Json
          status?: string
          updated_at?: string
          watch_min_score?: number | null
          weight_policy?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_profile_policies_profile_code_fkey"
            columns: ["profile_code"]
            isOneToOne: false
            referencedRelation: "scoring_profiles"
            referencedColumns: ["code"]
          },
        ]
      }
      refresh_domain_policies: {
        Row: {
          cooldown_seconds: number
          created_at: string
          data_domain: string
          definition: Json
          effective_from: string
          effective_to: string | null
          freshness_basis: string
          freshness_seconds: number | null
          is_enabled: boolean
          policy_version: number
          retry_schedule_seconds: number[]
          source_code: string
        }
        Insert: {
          cooldown_seconds?: number
          created_at?: string
          data_domain: string
          definition?: Json
          effective_from?: string
          effective_to?: string | null
          freshness_basis: string
          freshness_seconds?: number | null
          is_enabled?: boolean
          policy_version: number
          retry_schedule_seconds?: number[]
          source_code: string
        }
        Update: {
          cooldown_seconds?: number
          created_at?: string
          data_domain?: string
          definition?: Json
          effective_from?: string
          effective_to?: string | null
          freshness_basis?: string
          freshness_seconds?: number | null
          is_enabled?: boolean
          policy_version?: number
          retry_schedule_seconds?: number[]
          source_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_domain_policies_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
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
      research_evidence_snapshot_items: {
        Row: {
          applicability: string
          benchmark_authority: string[] | null
          candidate_evidence_ids: string[]
          canonical_selection_state: string
          created_at: string
          evidence_as_of_date: string | null
          evidence_state: string
          fresh_through: string | null
          freshness_policy: string | null
          id: string
          metric_code: string | null
          minimum_history: number
          normalized_value: Json | null
          raw_source_record_id: string | null
          reason_code: string
          recommended_remediation_action: string
          required: boolean
          requirement_code: string
          retrieved_at: string | null
          selected_evidence_id: string | null
          snapshot_id: string
          source_provider: string | null
          validation_state: string
        }
        Insert: {
          applicability: string
          benchmark_authority?: string[] | null
          candidate_evidence_ids?: string[]
          canonical_selection_state: string
          created_at?: string
          evidence_as_of_date?: string | null
          evidence_state: string
          fresh_through?: string | null
          freshness_policy?: string | null
          id?: string
          metric_code?: string | null
          minimum_history?: number
          normalized_value?: Json | null
          raw_source_record_id?: string | null
          reason_code: string
          recommended_remediation_action: string
          required?: boolean
          requirement_code: string
          retrieved_at?: string | null
          selected_evidence_id?: string | null
          snapshot_id: string
          source_provider?: string | null
          validation_state: string
        }
        Update: {
          applicability?: string
          benchmark_authority?: string[] | null
          candidate_evidence_ids?: string[]
          canonical_selection_state?: string
          created_at?: string
          evidence_as_of_date?: string | null
          evidence_state?: string
          fresh_through?: string | null
          freshness_policy?: string | null
          id?: string
          metric_code?: string | null
          minimum_history?: number
          normalized_value?: Json | null
          raw_source_record_id?: string | null
          reason_code?: string
          recommended_remediation_action?: string
          required?: boolean
          requirement_code?: string
          retrieved_at?: string | null
          selected_evidence_id?: string | null
          snapshot_id?: string
          source_provider?: string | null
          validation_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_evidence_snapshot_items_raw_source_record_id_fkey"
            columns: ["raw_source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_items_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "current_research_evidence_snapshot_lineage_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_items_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "current_research_evidence_snapshot_v1"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_items_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "research_evidence_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      research_evidence_snapshot_lineage: {
        Row: {
          assignment_authority: string
          assignment_id: string
          assignment_version: string
          classification_authority: string
          classification_version: string
          created_at: string
          methodology_role: string
          portfolio_id: string
          security_id: string
          snapshot_id: string
        }
        Insert: {
          assignment_authority: string
          assignment_id: string
          assignment_version: string
          classification_authority: string
          classification_version: string
          created_at?: string
          methodology_role: string
          portfolio_id: string
          security_id: string
          snapshot_id: string
        }
        Update: {
          assignment_authority?: string
          assignment_id?: string
          assignment_version?: string
          classification_authority?: string
          classification_version?: string
          created_at?: string
          methodology_role?: string
          portfolio_id?: string
          security_id?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_evidence_snapshot_lineage_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_snapshot_scope_fk"
            columns: ["snapshot_id", "portfolio_id", "security_id"]
            isOneToOne: false
            referencedRelation: "current_research_evidence_snapshot_lineage_v1"
            referencedColumns: ["id", "portfolio_id", "security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_snapshot_scope_fk"
            columns: ["snapshot_id", "portfolio_id", "security_id"]
            isOneToOne: false
            referencedRelation: "current_research_evidence_snapshot_v1"
            referencedColumns: ["id", "portfolio_id", "security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_lineage_snapshot_scope_fk"
            columns: ["snapshot_id", "portfolio_id", "security_id"]
            isOneToOne: false
            referencedRelation: "research_evidence_snapshots"
            referencedColumns: ["id", "portfolio_id", "security_id"]
          },
        ]
      }
      research_evidence_snapshot_selections: {
        Row: {
          evaluation_as_of: string
          execution_grant_id: string | null
          id: string
          materializer_version: string
          portfolio_id: string
          security_id: string
          selected_at: string
          selected_by: string | null
          selection_basis: string
          selection_run_id: string
          snapshot_id: string
          source_cutoff_at: string
        }
        Insert: {
          evaluation_as_of: string
          execution_grant_id?: string | null
          id?: string
          materializer_version: string
          portfolio_id: string
          security_id: string
          selected_at?: string
          selected_by?: string | null
          selection_basis: string
          selection_run_id: string
          snapshot_id: string
          source_cutoff_at: string
        }
        Update: {
          evaluation_as_of?: string
          execution_grant_id?: string | null
          id?: string
          materializer_version?: string
          portfolio_id?: string
          security_id?: string
          selected_at?: string
          selected_by?: string | null
          selection_basis?: string
          selection_run_id?: string
          snapshot_id?: string
          source_cutoff_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_evidence_snapshot_selections_execution_grant_id_fkey"
            columns: ["execution_grant_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_snapshot_scope_fk"
            columns: ["snapshot_id", "portfolio_id", "security_id"]
            isOneToOne: false
            referencedRelation: "current_research_evidence_snapshot_lineage_v1"
            referencedColumns: ["id", "portfolio_id", "security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_snapshot_scope_fk"
            columns: ["snapshot_id", "portfolio_id", "security_id"]
            isOneToOne: false
            referencedRelation: "current_research_evidence_snapshot_v1"
            referencedColumns: ["id", "portfolio_id", "security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshot_selections_snapshot_scope_fk"
            columns: ["snapshot_id", "portfolio_id", "security_id"]
            isOneToOne: false
            referencedRelation: "research_evidence_snapshots"
            referencedColumns: ["id", "portfolio_id", "security_id"]
          },
        ]
      }
      research_evidence_snapshots: {
        Row: {
          as_of_date: string
          created_at: string
          created_by: string | null
          id: string
          methodology_authority: string
          methodology_version: string
          portfolio_id: string
          profile_code: string
          requirement_registry_version: string
          security_id: string
          snapshot_hash: string
          snapshot_status: string
          subprofile_code: string | null
        }
        Insert: {
          as_of_date: string
          created_at?: string
          created_by?: string | null
          id?: string
          methodology_authority: string
          methodology_version: string
          portfolio_id: string
          profile_code: string
          requirement_registry_version: string
          security_id: string
          snapshot_hash: string
          snapshot_status: string
          subprofile_code?: string | null
        }
        Update: {
          as_of_date?: string
          created_at?: string
          created_by?: string | null
          id?: string
          methodology_authority?: string
          methodology_version?: string
          portfolio_id?: string
          profile_code?: string
          requirement_registry_version?: string
          security_id?: string
          snapshot_hash?: string
          snapshot_status?: string
          subprofile_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_evidence_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      research_subprofile_assignments: {
        Row: {
          assignment_basis: string
          assignment_status: string
          confidence_state: string
          created_at: string
          created_by: string | null
          effective_from: string
          effective_period: unknown
          effective_to: string | null
          id: string
          parent_profile_code: string
          parent_profile_version: string
          retired_at: string | null
          retired_by: string | null
          retirement_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          security_id: string
          source_record_id: string | null
          source_reference: string
          subprofile_code: string
          subprofile_version: string
        }
        Insert: {
          assignment_basis: string
          assignment_status: string
          confidence_state: string
          created_at?: string
          created_by?: string | null
          effective_from: string
          effective_period?: unknown
          effective_to?: string | null
          id?: string
          parent_profile_code: string
          parent_profile_version: string
          retired_at?: string | null
          retired_by?: string | null
          retirement_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id: string
          source_record_id?: string | null
          source_reference: string
          subprofile_code: string
          subprofile_version: string
        }
        Update: {
          assignment_basis?: string
          assignment_status?: string
          confidence_state?: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_period?: unknown
          effective_to?: string | null
          id?: string
          parent_profile_code?: string
          parent_profile_version?: string
          retired_at?: string | null
          retired_by?: string | null
          retirement_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_id?: string
          source_record_id?: string | null
          source_reference?: string
          subprofile_code?: string
          subprofile_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_subprofile_assignments_contract_fkey"
            columns: [
              "parent_profile_code",
              "parent_profile_version",
              "subprofile_code",
              "subprofile_version",
            ]
            isOneToOne: false
            referencedRelation: "research_subprofile_contracts"
            referencedColumns: [
              "parent_profile_code",
              "parent_profile_version",
              "subprofile_code",
              "subprofile_version",
            ]
          },
          {
            foreignKeyName: "research_subprofile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_subprofile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_subprofile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_subprofile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_subprofile_assignments_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      research_subprofile_contracts: {
        Row: {
          created_at: string
          display_name: string
          parent_profile_code: string
          parent_profile_version: string
          subprofile_code: string
          subprofile_version: string
        }
        Insert: {
          created_at?: string
          display_name: string
          parent_profile_code: string
          parent_profile_version: string
          subprofile_code: string
          subprofile_version: string
        }
        Update: {
          created_at?: string
          display_name?: string
          parent_profile_code?: string
          parent_profile_version?: string
          subprofile_code?: string
          subprofile_version?: string
        }
        Relationships: []
      }
      research_subprofile_secondary_exposures: {
        Row: {
          assignment_id: string
          assignment_status: string
          confidence_state: string
          created_at: string
          effective_from: string
          effective_to: string | null
          evidence_basis: string
          id: string
          materiality_state: string
          parent_profile_code: string
          parent_profile_version: string
          reason_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_reference: string
          subprofile_code: string
          subprofile_version: string
        }
        Insert: {
          assignment_id: string
          assignment_status: string
          confidence_state: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          evidence_basis: string
          id?: string
          materiality_state: string
          parent_profile_code: string
          parent_profile_version: string
          reason_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_reference: string
          subprofile_code: string
          subprofile_version: string
        }
        Update: {
          assignment_id?: string
          assignment_status?: string
          confidence_state?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          evidence_basis?: string
          id?: string
          materiality_state?: string
          parent_profile_code?: string
          parent_profile_version?: string
          reason_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_reference?: string
          subprofile_code?: string
          subprofile_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_subprofile_secondary_contract_fkey"
            columns: [
              "parent_profile_code",
              "parent_profile_version",
              "subprofile_code",
              "subprofile_version",
            ]
            isOneToOne: false
            referencedRelation: "research_subprofile_contracts"
            referencedColumns: [
              "parent_profile_code",
              "parent_profile_version",
              "subprofile_code",
              "subprofile_version",
            ]
          },
          {
            foreignKeyName: "research_subprofile_secondary_exposures_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "research_subprofile_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_model_dimensions: {
        Row: {
          created_at: string
          dimension_code: string
          display_order: number
          id: string
          minimum_coverage: number
          scoring_model_id: string
          scoring_profile: string
          weight: number
        }
        Insert: {
          created_at?: string
          dimension_code: string
          display_order: number
          id?: string
          minimum_coverage?: number
          scoring_model_id: string
          scoring_profile: string
          weight: number
        }
        Update: {
          created_at?: string
          dimension_code?: string
          display_order?: number
          id?: string
          minimum_coverage?: number
          scoring_model_id?: string
          scoring_profile?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_model_dimensions_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "scoring_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_model_metric_rules: {
        Row: {
          created_at: string
          dimension_code: string
          direction: string
          display_order: number
          id: string
          input_code: string
          input_kind: string
          metric_code: string | null
          metric_weight: number
          normalization_rule: Json
          preferred_source: string | null
          provider_field_contract: string | null
          rule_state: string
          scoring_model_id: string
          scoring_profile: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimension_code: string
          direction: string
          display_order: number
          id?: string
          input_code: string
          input_kind: string
          metric_code?: string | null
          metric_weight: number
          normalization_rule?: Json
          preferred_source?: string | null
          provider_field_contract?: string | null
          rule_state?: string
          scoring_model_id: string
          scoring_profile: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dimension_code?: string
          direction?: string
          display_order?: number
          id?: string
          input_code?: string
          input_kind?: string
          metric_code?: string | null
          metric_weight?: number
          normalization_rule?: Json
          preferred_source?: string | null
          provider_field_contract?: string | null
          rule_state?: string
          scoring_model_id?: string
          scoring_profile?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_model_metric_rules_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "scoring_models"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_models: {
        Row: {
          activated_at: string | null
          code: string
          created_at: string
          id: string
          methodology: Json
          name: string
          retired_at: string | null
          status: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          code: string
          created_at?: string
          id?: string
          methodology?: Json
          name: string
          retired_at?: string | null
          status?: string
          version: number
        }
        Update: {
          activated_at?: string | null
          code?: string
          created_at?: string
          id?: string
          methodology?: Json
          name?: string
          retired_at?: string | null
          status?: string
          version?: number
        }
        Relationships: []
      }
      scoring_profile_dimension_overrides: {
        Row: {
          created_at: string
          dimension_code: string
          id: string
          rationale: string | null
          scoring_model_id: string
          scoring_profile_code: string
          weight: number
        }
        Insert: {
          created_at?: string
          dimension_code: string
          id?: string
          rationale?: string | null
          scoring_model_id: string
          scoring_profile_code: string
          weight: number
        }
        Update: {
          created_at?: string
          dimension_code?: string
          id?: string
          rationale?: string | null
          scoring_model_id?: string
          scoring_profile_code?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_profile_dimension_overrides_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "scoring_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_profile_dimension_overrides_scoring_profile_code_fkey"
            columns: ["scoring_profile_code"]
            isOneToOne: false
            referencedRelation: "scoring_profiles"
            referencedColumns: ["code"]
          },
        ]
      }
      scoring_profile_metric_overrides: {
        Row: {
          applicability: string
          created_at: string
          dimension_code: string
          id: string
          input_code: string
          rationale: string | null
          scoring_model_id: string
          scoring_profile_code: string
          weight_multiplier: number
        }
        Insert: {
          applicability?: string
          created_at?: string
          dimension_code: string
          id?: string
          input_code: string
          rationale?: string | null
          scoring_model_id: string
          scoring_profile_code: string
          weight_multiplier?: number
        }
        Update: {
          applicability?: string
          created_at?: string
          dimension_code?: string
          id?: string
          input_code?: string
          rationale?: string | null
          scoring_model_id?: string
          scoring_profile_code?: string
          weight_multiplier?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_profile_metric_overrides_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "scoring_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_profile_metric_overrides_scoring_profile_code_fkey"
            columns: ["scoring_profile_code"]
            isOneToOne: false
            referencedRelation: "scoring_profiles"
            referencedColumns: ["code"]
          },
        ]
      }
      scoring_profile_sector_rules: {
        Row: {
          created_at: string
          id: string
          industry_pattern: string | null
          is_active: boolean
          priority: number
          scoring_profile_code: string
          sector_pattern: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry_pattern?: string | null
          is_active?: boolean
          priority?: number
          scoring_profile_code: string
          sector_pattern: string
        }
        Update: {
          created_at?: string
          id?: string
          industry_pattern?: string | null
          is_active?: boolean
          priority?: number
          scoring_profile_code?: string
          sector_pattern?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_profile_sector_rules_scoring_profile_code_fkey"
            columns: ["scoring_profile_code"]
            isOneToOne: false
            referencedRelation: "scoring_profiles"
            referencedColumns: ["code"]
          },
        ]
      }
      scoring_profiles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          is_active: boolean
          name: string
          parent_profile_code: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          name: string
          parent_profile_code?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          name?: string
          parent_profile_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_profiles_parent_profile_code_fkey"
            columns: ["parent_profile_code"]
            isOneToOne: false
            referencedRelation: "scoring_profiles"
            referencedColumns: ["code"]
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
      security_company_profiles: {
        Row: {
          about_retrieved_at: string | null
          about_summary: string | null
          company_website_url: string | null
          created_at: string
          last_checked_at: string | null
          last_safe_error_code: string | null
          logo_content_type: string | null
          logo_retrieved_at: string | null
          logo_source_url: string | null
          logo_storage_path: string | null
          metadata: Json
          profile_status: string
          security_id: string
          source_about_hash: string | null
          source_code: string | null
          source_record_id: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          about_retrieved_at?: string | null
          about_summary?: string | null
          company_website_url?: string | null
          created_at?: string
          last_checked_at?: string | null
          last_safe_error_code?: string | null
          logo_content_type?: string | null
          logo_retrieved_at?: string | null
          logo_source_url?: string | null
          logo_storage_path?: string | null
          metadata?: Json
          profile_status?: string
          security_id: string
          source_about_hash?: string | null
          source_code?: string | null
          source_record_id?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          about_retrieved_at?: string | null
          about_summary?: string | null
          company_website_url?: string | null
          created_at?: string
          last_checked_at?: string | null
          last_safe_error_code?: string | null
          logo_content_type?: string | null
          logo_retrieved_at?: string | null
          logo_source_url?: string | null
          logo_storage_path?: string | null
          metadata?: Json
          profile_status?: string
          security_id?: string
          source_about_hash?: string | null
          source_code?: string | null
          source_record_id?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_company_profiles_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_company_profiles_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_company_profiles_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_company_profiles_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_company_profiles_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "security_company_profiles_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "data_source_records"
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
          observed_series: string | null
          observed_symbol: string | null
          provider_instrument_id: string | null
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
          observed_series?: string | null
          observed_symbol?: string | null
          provider_instrument_id?: string | null
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
          observed_series?: string | null
          observed_symbol?: string | null
          provider_instrument_id?: string | null
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
      security_refresh_states: {
        Row: {
          consecutive_failures: number
          data_domain: string
          fresh_until: string | null
          last_attempt_at: string | null
          last_evidence_change_at: string | null
          last_run_id: string | null
          last_safe_error_code: string | null
          last_success_at: string | null
          next_eligible_refresh_at: string | null
          refresh_status: string
          security_id: string
          source_code: string
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          data_domain: string
          fresh_until?: string | null
          last_attempt_at?: string | null
          last_evidence_change_at?: string | null
          last_run_id?: string | null
          last_safe_error_code?: string | null
          last_success_at?: string | null
          next_eligible_refresh_at?: string | null
          refresh_status?: string
          security_id: string
          source_code: string
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          data_domain?: string
          fresh_until?: string | null
          last_attempt_at?: string | null
          last_evidence_change_at?: string | null
          last_run_id?: string | null
          last_safe_error_code?: string | null
          last_success_at?: string | null
          next_eligible_refresh_at?: string | null
          refresh_status?: string
          security_id?: string
          source_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_refresh_states_last_run_id_fkey"
            columns: ["last_run_id"]
            isOneToOne: false
            referencedRelation: "data_ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_refresh_states_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_refresh_states_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_refresh_states_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_refresh_states_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_refresh_states_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      security_scoring_profile_assignments: {
        Row: {
          assigned_at: string
          assignment_basis: string
          assignment_status: string
          notes: string | null
          reviewed_at: string | null
          scoring_profile_code: string
          security_id: string
          source_reference: string | null
        }
        Insert: {
          assigned_at?: string
          assignment_basis: string
          assignment_status?: string
          notes?: string | null
          reviewed_at?: string | null
          scoring_profile_code: string
          security_id: string
          source_reference?: string | null
        }
        Update: {
          assigned_at?: string
          assignment_basis?: string
          assignment_status?: string
          notes?: string | null
          reviewed_at?: string | null
          scoring_profile_code?: string
          security_id?: string
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_scoring_profile_assignments_scoring_profile_code_fkey"
            columns: ["scoring_profile_code"]
            isOneToOne: false
            referencedRelation: "scoring_profiles"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "security_scoring_profile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_scoring_profile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_scoring_profile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "security_scoring_profile_assignments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: true
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_dimension_scores: {
        Row: {
          confidence: number
          created_at: string
          dimension_code: string
          dimension_weight: number
          evidence_coverage: number
          heat_state: string
          id: string
          rationale: Json
          raw_score: number | null
          score_run_id: string
          weighted_contribution: number | null
        }
        Insert: {
          confidence?: number
          created_at?: string
          dimension_code: string
          dimension_weight: number
          evidence_coverage?: number
          heat_state?: string
          id?: string
          rationale?: Json
          raw_score?: number | null
          score_run_id: string
          weighted_contribution?: number | null
        }
        Update: {
          confidence?: number
          created_at?: string
          dimension_code?: string
          dimension_weight?: number
          evidence_coverage?: number
          heat_state?: string
          id?: string
          rationale?: Json
          raw_score?: number | null
          score_run_id?: string
          weighted_contribution?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_dimension_scores_score_run_id_fkey"
            columns: ["score_run_id"]
            isOneToOne: false
            referencedRelation: "stock_score_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_metric_score_inputs: {
        Row: {
          contribution: number | null
          created_at: string
          dimension_score_id: string
          external_rating_observation_id: string | null
          fundamental_observation_id: string | null
          id: string
          input_label: string
          input_state: string
          metric_code: string | null
          metric_weight: number
          normalization_rule: Json
          normalized_score: number | null
          observed_numeric_value: number | null
          observed_text_value: string | null
        }
        Insert: {
          contribution?: number | null
          created_at?: string
          dimension_score_id: string
          external_rating_observation_id?: string | null
          fundamental_observation_id?: string | null
          id?: string
          input_label: string
          input_state?: string
          metric_code?: string | null
          metric_weight: number
          normalization_rule?: Json
          normalized_score?: number | null
          observed_numeric_value?: number | null
          observed_text_value?: string | null
        }
        Update: {
          contribution?: number | null
          created_at?: string
          dimension_score_id?: string
          external_rating_observation_id?: string | null
          fundamental_observation_id?: string | null
          id?: string
          input_label?: string
          input_state?: string
          metric_code?: string | null
          metric_weight?: number
          normalization_rule?: Json
          normalized_score?: number | null
          observed_numeric_value?: number | null
          observed_text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_metric_score_inputs_dimension_score_id_fkey"
            columns: ["dimension_score_id"]
            isOneToOne: false
            referencedRelation: "stock_dimension_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_metric_score_inputs_external_rating_observation_id_fkey"
            columns: ["external_rating_observation_id"]
            isOneToOne: false
            referencedRelation: "external_rating_observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_metric_score_inputs_fundamental_observation_id_fkey"
            columns: ["fundamental_observation_id"]
            isOneToOne: false
            referencedRelation: "fundamental_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_recommendation_runs: {
        Row: {
          action_bias: string | null
          ai_interpretation: Json | null
          ai_interpretation_generated_at: string | null
          ai_interpretation_input_hash: string | null
          ai_interpretation_model: string | null
          ai_interpretation_provider: string | null
          ai_interpretation_status: string | null
          ai_interpretation_usage: Json
          ai_summary: string | null
          change_signal: string | null
          created_at: string
          current_user_role: string | null
          current_weight: number | null
          evaluation_key: string | null
          evidence_confidence: number | null
          id: string
          overall_score: number | null
          persistence_count: number
          portfolio_id: string
          rationale: Json
          recommendation_policy_version: number
          run_state: string
          score_ready_coverage: number | null
          scoring_profile_code: string
          security_id: string
          source_score_run_id: string | null
          suggested_role: string
          suggested_weight_max: number | null
          suggested_weight_min: number | null
          transition_status: string | null
        }
        Insert: {
          action_bias?: string | null
          ai_interpretation?: Json | null
          ai_interpretation_generated_at?: string | null
          ai_interpretation_input_hash?: string | null
          ai_interpretation_model?: string | null
          ai_interpretation_provider?: string | null
          ai_interpretation_status?: string | null
          ai_interpretation_usage?: Json
          ai_summary?: string | null
          change_signal?: string | null
          created_at?: string
          current_user_role?: string | null
          current_weight?: number | null
          evaluation_key?: string | null
          evidence_confidence?: number | null
          id?: string
          overall_score?: number | null
          persistence_count?: number
          portfolio_id: string
          rationale?: Json
          recommendation_policy_version: number
          run_state?: string
          score_ready_coverage?: number | null
          scoring_profile_code: string
          security_id: string
          source_score_run_id?: string | null
          suggested_role: string
          suggested_weight_max?: number | null
          suggested_weight_min?: number | null
          transition_status?: string | null
        }
        Update: {
          action_bias?: string | null
          ai_interpretation?: Json | null
          ai_interpretation_generated_at?: string | null
          ai_interpretation_input_hash?: string | null
          ai_interpretation_model?: string | null
          ai_interpretation_provider?: string | null
          ai_interpretation_status?: string | null
          ai_interpretation_usage?: Json
          ai_summary?: string | null
          change_signal?: string | null
          created_at?: string
          current_user_role?: string | null
          current_weight?: number | null
          evaluation_key?: string | null
          evidence_confidence?: number | null
          id?: string
          overall_score?: number | null
          persistence_count?: number
          portfolio_id?: string
          rationale?: Json
          recommendation_policy_version?: number
          run_state?: string
          score_ready_coverage?: number | null
          scoring_profile_code?: string
          security_id?: string
          source_score_run_id?: string | null
          suggested_role?: string
          suggested_weight_max?: number | null
          suggested_weight_min?: number | null
          transition_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_recommendation_runs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_scoring_profile_code_fkey"
            columns: ["scoring_profile_code"]
            isOneToOne: false
            referencedRelation: "scoring_profiles"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_scoring_profile_code_recommendat_fkey"
            columns: ["scoring_profile_code", "recommendation_policy_version"]
            isOneToOne: false
            referencedRelation: "recommendation_profile_policies"
            referencedColumns: ["profile_code", "policy_version"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_recommendation_runs_source_score_run_id_fkey"
            columns: ["source_score_run_id"]
            isOneToOne: false
            referencedRelation: "stock_score_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_score_runs: {
        Row: {
          as_of_date: string
          completed_at: string | null
          created_at: string
          evidence_confidence: number
          evidence_coverage: number
          evidence_quality_factor: number
          freshness_factor: number
          id: string
          overall_score: number | null
          run_state: string
          scoring_model_id: string
          scoring_profile: string
          security_id: string
          summary: Json
        }
        Insert: {
          as_of_date: string
          completed_at?: string | null
          created_at?: string
          evidence_confidence?: number
          evidence_coverage?: number
          evidence_quality_factor?: number
          freshness_factor?: number
          id?: string
          overall_score?: number | null
          run_state?: string
          scoring_model_id: string
          scoring_profile: string
          security_id: string
          summary?: Json
        }
        Update: {
          as_of_date?: string
          completed_at?: string | null
          created_at?: string
          evidence_confidence?: number
          evidence_coverage?: number
          evidence_quality_factor?: number
          freshness_factor?: number
          id?: string
          overall_score?: number | null
          run_state?: string
          scoring_model_id?: string
          scoring_profile?: string
          security_id?: string
          summary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "stock_score_runs_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "scoring_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_score_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "stock_score_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "stock_score_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "stock_score_runs_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
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
      current_research_evidence_snapshot_lineage_v1: {
        Row: {
          as_of_date: string | null
          assignment_authority: string | null
          assignment_id: string | null
          assignment_version: string | null
          classification_authority: string | null
          classification_version: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          methodology_authority: string | null
          methodology_role: string | null
          methodology_version: string | null
          portfolio_id: string | null
          profile_code: string | null
          requirement_registry_version: string | null
          security_id: string | null
          snapshot_hash: string | null
          snapshot_status: string | null
          subprofile_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_evidence_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
          },
        ]
      }
      current_research_evidence_snapshot_v1: {
        Row: {
          as_of_date: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          methodology_authority: string | null
          methodology_version: string | null
          portfolio_id: string | null
          profile_code: string | null
          requirement_registry_version: string | null
          security_id: string | null
          snapshot_hash: string | null
          snapshot_status: string | null
          subprofile_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_evidence_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_enrichment_coverage_v1"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_classification_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_enrichment_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "current_security_identity_v1"
            referencedColumns: ["security_id"]
          },
          {
            foreignKeyName: "research_evidence_snapshots_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "securities"
            referencedColumns: ["id"]
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
      _p4b_launch_batch: {
        Args: { p_after: string; p_limit?: number }
        Returns: number
      }
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
      acquire_news_pipeline_lease_v1: {
        Args: {
          p_lease_holder: string
          p_lease_seconds?: number
          p_portfolio_id: string
          p_source_code: string
        }
        Returns: {
          acquired: boolean
          retry_after: number
        }[]
      }
      append_and_select_research_evidence_snapshot_v2: {
        Args: { p_items: Json; p_selection: Json; p_snapshot: Json }
        Returns: Json
      }
      append_and_select_research_evidence_snapshot_v3: {
        Args: {
          p_items: Json
          p_lineage: Json
          p_selection: Json
          p_snapshot: Json
        }
        Returns: Json
      }
      append_research_evidence_snapshot_v1: {
        Args: { p_items: Json; p_snapshot: Json }
        Returns: string
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
      get_portfolio_coverage_registry_v1: {
        Args: { p_portfolio_id: string; p_user_id: string }
        Returns: Json
      }
      get_portfolio_news_feed_v1: {
        Args: {
          p_before?: string
          p_limit?: number
          p_portfolio_id: string
          p_security_ids?: string[]
        }
        Returns: {
          category: string
          company_name: string
          first_seen_at: string
          headline: string
          importance_state: string
          news_item_id: string
          publication_precision: string
          published_at: string
          security_id: string
          source_name: string
          source_url: string
          symbol: string
        }[]
      }
      get_portfolio_news_feed_v2: {
        Args: {
          p_before?: string
          p_limit?: number
          p_portfolio_id: string
          p_security_ids?: string[]
        }
        Returns: {
          category: string
          company_name: string
          first_seen_at: string
          headline: string
          importance_state: string
          news_item_id: string
          publication_precision: string
          published_at: string
          security_id: string
          source_name: string
          source_url: string
          symbol: string
          tone_confidence: number
          tone_method: string
          tone_reason: string
          tone_state: string
        }[]
      }
      get_portfolio_profile_weight_context_v1: {
        Args: {
          p_portfolio_id: string
          p_profile_code: string
          p_security_id: string
        }
        Returns: {
          current_weight: number
          reviewed_assignment_count: number
          reviewed_assignment_coverage: number
          same_profile_weight: number
          total_position_count: number
        }[]
      }
      get_provider_operational_summary_v1: {
        Args: { p_source_code?: string }
        Returns: {
          active_orchestrations: number
          active_reservations: number
          actual_provider_quota_status: string
          daily_internal_attempt_limit: number
          daily_observed_usage: number
          daily_remaining: number
          ingestion_enabled: boolean
          last_failed_run_at: string
          last_successful_run_at: string
          latest_safe_error: string
          policy_version: number
          provider_name: string
          rolling_internal_attempt_limit: number
          rolling_observed_usage: number
          rolling_remaining: number
          scheduler_enabled: boolean
          source_code: string
          utilization_state: string
        }[]
      }
      get_provider_quota_summary_v1: {
        Args: { p_source_code?: string }
        Returns: {
          day_started_at: string
          internal_daily_limit: number
          internal_daily_remaining: number
          internal_daily_used: number
          month_started_at: string
          plan_name: string
          provider_daily_estimated_remaining: number
          provider_daily_estimated_used: number
          provider_daily_limit: number
          provider_monthly_estimated_remaining: number
          provider_monthly_estimated_used: number
          provider_monthly_limit: number
          quota_status: string
          source_code: string
          usage_basis: string
        }[]
      }
      invoke_amfi_market_cap_refresh_v1: {
        Args: { p_action?: string }
        Returns: number
      }
      invoke_nse_news_pipeline_scheduled_v1: { Args: never; Returns: number }
      invoke_trendlyne_classification_refresh_v1: {
        Args: { p_action?: string; p_limit?: number }
        Returns: number
      }
      p7_ic2_cache_facts_v1: { Args: { p_portfolio_id: string }; Returns: Json }
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
      reclassify_unclassified_news_from_stored_evidence_v1: {
        Args: { p_limit?: number }
        Returns: {
          remaining_unclassified: number
          scanned_count: number
          updated_count: number
        }[]
      }
      record_provider_usage_event_v1: {
        Args: {
          p_accounting_class: string
          p_actual_internal_units: number
          p_attempted_at: string
          p_completed_at: string
          p_data_domain: string
          p_estimated_internal_units: number
          p_idempotency_key: string
          p_ingestion_run_id: string
          p_operation_class: string
          p_outcome: string
          p_retry_attempt: number
          p_run_item_id: string
          p_safe_error_code: string
          p_security_id: string
          p_source_code: string
        }
        Returns: string
      }
      record_recommendation_preview_v1: {
        Args: {
          p_current_user_role: string
          p_current_weight: number
          p_evaluation_key: string
          p_evidence_confidence: number
          p_overall_score: number
          p_policy_version: number
          p_portfolio_id: string
          p_rationale?: Json
          p_score_ready_coverage: number
          p_scoring_profile_code: string
          p_security_id: string
          p_suggested_role: string
        }
        Returns: {
          change_signal: string
          created_at: string
          id: string
          persistence_count: number
          suggested_role: string
          transition_status: string
        }[]
      }
      record_recommendation_preview_v2: {
        Args: {
          p_action_bias: string
          p_current_user_role: string
          p_current_weight: number
          p_evaluation_key: string
          p_evidence_confidence: number
          p_overall_score: number
          p_policy_version: number
          p_portfolio_id: string
          p_rationale?: Json
          p_score_ready_coverage: number
          p_scoring_profile_code: string
          p_security_id: string
          p_suggested_role: string
          p_suggested_weight_max: number
          p_suggested_weight_min: number
        }
        Returns: {
          action_bias: string
          change_signal: string
          created_at: string
          id: string
          persistence_count: number
          suggested_role: string
          suggested_weight_max: number
          suggested_weight_min: number
          transition_status: string
        }[]
      }
      record_refresh_item_result_v1: {
        Args: {
          p_accepted_record_count: number
          p_attempted_call_count: number
          p_metadata?: Json
          p_run_item_id: string
          p_safe_reason_code: string
          p_status: string
        }
        Returns: {
          accepted_record_count: number
          attempted_call_count: number
          completed_at: string | null
          data_domain: string
          id: string
          ingestion_run_id: string
          metadata: Json
          safe_reason_code: string | null
          security_id: string
          started_at: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "data_ingestion_run_items"
          isOneToOne: true
          isSetofReturn: false
        }
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
      release_news_pipeline_lease_v1: {
        Args: {
          p_cooldown_seconds?: number
          p_lease_holder: string
          p_portfolio_id: string
          p_source_code: string
        }
        Returns: boolean
      }
      reserve_provider_budget_v1: {
        Args: {
          p_estimated_units: number
          p_ingestion_run_id: string
          p_reservation_key: string
          p_reservation_seconds?: number
          p_source_code: string
        }
        Returns: {
          policy_version: number
          reason_code: string
          reservation_id: string
          reserved: boolean
        }[]
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
      set_provider_ingestion_control_v1: {
        Args: {
          p_changes: Json
          p_expires_at?: string
          p_reason: string
          p_source_code: string
        }
        Returns: {
          actual_provider_quota: Json | null
          actual_provider_quota_status: string
          caution_threshold: number
          concurrency_limit: number
          consecutive_failure_threshold: number
          conservation_threshold: number
          daily_internal_attempt_limit: number
          hard_stop_threshold: number
          ingestion_enabled: boolean
          per_run_internal_attempt_limit: number
          policy_version: number
          rolling_internal_attempt_limit: number
          rolling_window_days: number
          scheduler_enabled: boolean
          source_code: string
          updated_at: string
          updated_by: string | null
          warning_threshold: number
        }
        SetofOptions: {
          from: "*"
          to: "provider_ingestion_controls"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      settle_provider_budget_v1: {
        Args: {
          p_consumed_units: number
          p_failed_units: number
          p_released_units: number
          p_reservation_id: string
        }
        Returns: {
          consumed_units: number
          failed_units: number
          released_units: number
          reservation_id: string
          status: string
        }[]
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
      verify_amfi_market_cap_refresh_token_v1: {
        Args: { p_token: string }
        Returns: boolean
      }
      verify_news_pipeline_scheduler_token_v1: {
        Args: { p_token: string }
        Returns: boolean
      }
      verify_trendlyne_classification_refresh_token_v1: {
        Args: { p_token: string }
        Returns: boolean
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
