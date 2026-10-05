import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

export type P7EvidenceSnapshotStatus =
  | "READY"
  | "INSUFFICIENT"
  | "STALE"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface P7CurrentEvidenceSnapshot {
  readonly snapshotId: string
  readonly portfolioId: string
  readonly securityId: string
  readonly asOfDate: string
  readonly snapshotStatus: P7EvidenceSnapshotStatus
  readonly profileCode: string
  readonly subprofileCode: string | null
  readonly methodologyAuthority: string
  readonly methodologyVersion: string
  readonly classificationVersion: string
  readonly methodologyRole: string
  readonly assignmentId: string
  readonly assignmentAuthority?: string
  readonly assignmentVersion: string
}

interface SnapshotDbRow {
  readonly id: string
  readonly portfolio_id: string
  readonly security_id: string
  readonly as_of_date: string
  readonly snapshot_status: P7EvidenceSnapshotStatus
  readonly profile_code: string
  readonly subprofile_code: string | null
  readonly methodology_authority: string
  readonly methodology_version: string
  readonly classification_version: string
  readonly methodology_role: string
  readonly assignment_id: string
  readonly assignment_authority: string
  readonly assignment_version: string
}

// This IC3 view is newer than the checked-in generated types. Keep the narrow
// compatibility boundary here; presentation code never queries storage directly.
const db = supabase as unknown as SupabaseClient

export async function loadP7CurrentEvidenceSnapshots(
  portfolioId: string,
): Promise<readonly P7CurrentEvidenceSnapshot[]> {
  const result = await db
    .from("current_research_evidence_snapshot_lineage_v1")
    .select(SNAPSHOT_COLUMNS)
    .eq("portfolio_id", portfolioId)
    .order("security_id")

  if (result.error) throw result.error
  return ((result.data ?? []) as SnapshotDbRow[]).map(mapSnapshot)
}

const SNAPSHOT_COLUMNS = "id,portfolio_id,security_id,as_of_date,snapshot_status,profile_code,subprofile_code,methodology_authority,methodology_version,classification_version,methodology_role,assignment_id,assignment_authority,assignment_version"

function mapSnapshot(row: SnapshotDbRow): P7CurrentEvidenceSnapshot {
  return {
    snapshotId: row.id,
    portfolioId: row.portfolio_id,
    securityId: row.security_id,
    asOfDate: row.as_of_date,
    snapshotStatus: row.snapshot_status,
    profileCode: row.profile_code,
    subprofileCode: row.subprofile_code,
    methodologyAuthority: row.methodology_authority,
    methodologyVersion: row.methodology_version,
    classificationVersion: row.classification_version,
    methodologyRole: row.methodology_role,
    assignmentId: row.assignment_id,
    assignmentAuthority: row.assignment_authority,
    assignmentVersion: row.assignment_version,
  }
}

/** Same canonical projection as Dashboard/Intelligence, scoped to both owners' portfolio and security. */
export async function loadP7CurrentEvidenceSnapshot(
  portfolioId: string,
  securityId: string,
): Promise<P7CurrentEvidenceSnapshot | null> {
  const result = await db.from("current_research_evidence_snapshot_lineage_v1")
    .select(SNAPSHOT_COLUMNS).eq("portfolio_id", portfolioId).eq("security_id", securityId).maybeSingle()
  if (result.error) throw result.error
  return result.data ? mapSnapshot(result.data) : null
}

export interface P7EvidenceRequirement {
  readonly id: string
  readonly snapshot_id: string
  readonly requirement_code: string
  readonly metric_code: string | null
  readonly required: boolean
  readonly minimum_history: number | null
  readonly freshness_policy: string | null
  readonly benchmark_authority: readonly string[]
  readonly applicability: "APPLICABLE" | "NOT_APPLICABLE"
  readonly evidence_state: "FRESH" | "STALE" | "MISSING" | "INSUFFICIENT" | "CONFLICTING" | "REVIEW_REQUIRED" | "NOT_APPLICABLE"
  readonly candidate_evidence_ids: readonly string[]
  readonly selected_evidence_id: string | null
  readonly evidence_as_of_date: string | null
  readonly retrieved_at: string | null
  readonly fresh_through: string | null
  readonly source_provider: string | null
  readonly raw_source_record_id: string | null
  readonly normalized_value: unknown
  readonly validation_state: string
  readonly canonical_selection_state: string
  readonly reason_code: string
  readonly recommended_remediation_action: string
}

export interface P7CurrentEvidenceDetails {
  readonly snapshot: P7CurrentEvidenceSnapshot
  readonly requirements: readonly P7EvidenceRequirement[]
}

/** Read immutable items of the selected canonical snapshot; never select a new snapshot or refresh a provider. */
export async function loadP7CurrentEvidenceDetails(portfolioId: string, securityId: string): Promise<P7CurrentEvidenceDetails | null> {
  const snapshot = await loadP7CurrentEvidenceSnapshot(portfolioId, securityId)
  if (!snapshot) return null
  const result = await db.from("research_evidence_snapshot_items")
    .select("id,snapshot_id,requirement_code,metric_code,required,minimum_history,freshness_policy,benchmark_authority,applicability,evidence_state,candidate_evidence_ids,selected_evidence_id,evidence_as_of_date,retrieved_at,fresh_through,source_provider,raw_source_record_id,normalized_value,validation_state,canonical_selection_state,reason_code,recommended_remediation_action")
    .eq("snapshot_id", snapshot.snapshotId).order("requirement_code")
  if (result.error) throw result.error
  const requirements: P7EvidenceRequirement[] = result.data ?? []
  return { snapshot, requirements }
}
