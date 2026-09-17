import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import {
  PHARMA_SUBPROFILE_CODES,
  resolvePharmaSubprofileAssignment,
  type PharmaSubprofileAssignment,
  type PharmaSubprofileCode,
  type PharmaSubprofileResolution,
  type ResearchSubprofileAssignmentState,
  type ResearchSubprofileConfidence,
  type ResearchSubprofileExposure,
  type ResearchSubprofileExposureMateriality,
} from "../features/research/pharmaSubprofileAssignment"

const db = supabase as unknown as SupabaseClient

const ASSIGNMENT_STATES = ["PROVISIONAL", "REVIEWED", "DISPUTED", "RETIRED"] as const
const CONFIDENCE_STATES = ["LOW", "MEDIUM", "HIGH"] as const
const MATERIALITY_STATES = ["IMMATERIAL", "EMERGING", "MATERIAL", "DOMINANT", "UNKNOWN"] as const

type AssignmentRow = {
  id: string
  security_id: string
  parent_profile_code: string
  parent_profile_version: string
  subprofile_code: string
  subprofile_version: string
  assignment_status: string
  confidence_state: string
  assignment_basis: string
  source_reference: string
  effective_from: string
  effective_to: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

type SecondaryRow = {
  assignment_id: string
  parent_profile_code: string
  parent_profile_version: string
  subprofile_code: string
  subprofile_version: string
  materiality_state: string
  evidence_basis: string
  source_reference: string
  assignment_status: string
  confidence_state: string
  effective_from: string
  effective_to: string | null
  reason_code: string
  reviewed_by: string | null
  reviewed_at: string | null
}

function isOneOf<T extends string>(value: string, values: readonly T[]): value is T {
  return values.includes(value as T)
}

function dateOnly(value: string | null) {
  return value === null ? null : value.slice(0, 10)
}

function assertSubprofileCode(value: string): PharmaSubprofileCode {
  if (!isOneOf(value, PHARMA_SUBPROFILE_CODES)) throw new Error(`Unknown PHARMA_V1 subprofile code: ${value}`)
  return value
}

function assertAssignmentState(value: string): ResearchSubprofileAssignmentState {
  if (!isOneOf(value, ASSIGNMENT_STATES)) throw new Error(`Unknown research-subprofile assignment state: ${value}`)
  return value
}

function assertConfidence(value: string): ResearchSubprofileConfidence {
  if (!isOneOf(value, CONFIDENCE_STATES)) throw new Error(`Unknown research-subprofile confidence state: ${value}`)
  return value
}

function assertMateriality(value: string): ResearchSubprofileExposureMateriality {
  if (!isOneOf(value, MATERIALITY_STATES)) throw new Error(`Unknown research-subprofile materiality state: ${value}`)
  return value
}

function mapSecondary(row: SecondaryRow): ResearchSubprofileExposure {
  return {
    exposureCode: assertSubprofileCode(row.subprofile_code),
    materiality: assertMateriality(row.materiality_state),
    confidence: assertConfidence(row.confidence_state),
    assignmentState: assertAssignmentState(row.assignment_status),
    effectiveFrom: dateOnly(row.effective_from),
    effectiveTo: dateOnly(row.effective_to),
    sourceReference: row.source_reference,
    reasonCode: row.reason_code || row.evidence_basis,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
  }
}

export function mapResearchSubprofileRows(
  assignmentRows: readonly AssignmentRow[],
  secondaryRows: readonly SecondaryRow[],
): readonly PharmaSubprofileAssignment[] {
  const ordered = [...assignmentRows].sort((left, right) => {
    const effective = left.effective_from.localeCompare(right.effective_from)
    return effective !== 0 ? effective : left.created_at.localeCompare(right.created_at)
  })

  return ordered.map((row, index) => {
    if (row.parent_profile_code !== "PHARMA" || row.parent_profile_version !== "PHARMA_V1") {
      throw new Error("Unexpected parent research profile in PHARMA_V1 assignment query")
    }
    const secondaries = secondaryRows
      .filter((secondary) => secondary.assignment_id === row.id)
      .map(mapSecondary)

    return {
      securityId: row.security_id,
      profileCode: "PHARMA_V1",
      primarySubprofileCode: assertSubprofileCode(row.subprofile_code),
      assignmentVersion: index + 1,
      assignmentState: assertAssignmentState(row.assignment_status),
      effectiveFrom: dateOnly(row.effective_from),
      effectiveTo: dateOnly(row.effective_to),
      sourceReference: row.source_reference,
      reasonCode: row.assignment_basis,
      confidence: assertConfidence(row.confidence_state),
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      secondaryExposures: secondaries,
    }
  })
}

export async function loadPharmaSubprofileResolution(
  securityId: string,
  evaluationDate: string,
): Promise<PharmaSubprofileResolution> {
  const assignmentsResult = await db.from("research_subprofile_assignments")
    .select("id,security_id,parent_profile_code,parent_profile_version,subprofile_code,subprofile_version,assignment_status,confidence_state,assignment_basis,source_reference,effective_from,effective_to,reviewed_by,reviewed_at,created_at")
    .eq("security_id", securityId)
    .eq("parent_profile_code", "PHARMA")
    .eq("parent_profile_version", "PHARMA_V1")
    .order("effective_from", { ascending: true })
    .order("created_at", { ascending: true })

  if (assignmentsResult.error) throw assignmentsResult.error
  const assignmentRows = (assignmentsResult.data ?? []) as AssignmentRow[]
  const assignmentIds = assignmentRows.map((row) => row.id)

  let secondaryRows: SecondaryRow[] = []
  if (assignmentIds.length) {
    const secondariesResult = await db.from("research_subprofile_secondary_exposures")
      .select("assignment_id,parent_profile_code,parent_profile_version,subprofile_code,subprofile_version,materiality_state,evidence_basis,source_reference,assignment_status,confidence_state,effective_from,effective_to,reason_code,reviewed_by,reviewed_at")
      .in("assignment_id", assignmentIds)
      .order("subprofile_code", { ascending: true })
    if (secondariesResult.error) throw secondariesResult.error
    secondaryRows = (secondariesResult.data ?? []) as SecondaryRow[]
  }

  return resolvePharmaSubprofileAssignment(
    mapResearchSubprofileRows(assignmentRows, secondaryRows),
    securityId,
    evaluationDate,
  )
}
