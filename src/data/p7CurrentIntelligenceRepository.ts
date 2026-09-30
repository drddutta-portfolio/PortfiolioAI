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
    .select("id,portfolio_id,security_id,as_of_date,snapshot_status,profile_code,subprofile_code,methodology_authority,methodology_version,classification_version,methodology_role,assignment_id,assignment_version")
    .eq("portfolio_id", portfolioId)
    .order("security_id")

  if (result.error) throw result.error
  return ((result.data ?? []) as SnapshotDbRow[]).map((row) => ({
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
    assignmentVersion: row.assignment_version,
  }))
}
