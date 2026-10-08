import { P7_IC_PROFILE_CONTRACTS } from "../../../supabase/functions/_shared/p7-ic-profile-contracts"
import { PHARMA_FALLBACK_SIGNALS, type Ic1ProfileEvidenceContract } from "../../../supabase/functions/_shared/p7-ic-profile-requirements"
import type { P7EvidenceRequirement } from "../../data/p7CurrentIntelligenceRepository"

export type ResearchResultSection = "Overview" | "Financials" | "Quality & Growth" | "Valuation"
const DIMENSIONS: Readonly<Record<Exclude<ResearchResultSection, "Overview">, readonly string[]>> = {
  Financials: ["QUALITY", "GROWTH", "CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT", "FINANCIAL_STRENGTH", "EARNINGS_CASH_QUALITY"],
  "Quality & Growth": ["QUALITY", "GROWTH", "CAPITAL_EFFICIENCY", "CASH_FLOW", "BUSINESS_DURABILITY", "RISK"],
  Valuation: ["VALUATION"],
}

/** Reuse IC1's exact persisted requirement codes, never sector/ticker heuristics. */
export function selectedRequirementDimensions(profileCode: string): ReadonlyMap<string, readonly string[]> {
  const dimensions = new Map<string, string[]>()
  const contract = (P7_IC_PROFILE_CONTRACTS as Readonly<Record<string, Ic1ProfileEvidenceContract>>)[profileCode]
  const signals = contract?.signalRequirements.length ? contract.signalRequirements : profileCode === "PHARMA" ? PHARMA_FALLBACK_SIGNALS : []
  for (const signal of signals) {
    for (const code of signal.evidenceCodes?.length ? signal.evidenceCodes : [signal.signalCode]) {
      const values = dimensions.get(code) ?? []
      if (signal.dimensionCode && !values.includes(signal.dimensionCode)) values.push(signal.dimensionCode)
      dimensions.set(code, values)
    }
  }
  return dimensions
}

export function selectSectionRequirements(items: readonly P7EvidenceRequirement[], profileCode: string, section: ResearchResultSection) {
  if (section === "Overview") return items
  const dimensions = selectedRequirementDimensions(profileCode)
  return items.filter(item => (dimensions.get(item.requirement_code) ?? []).some(dimension => DIMENSIONS[section].includes(dimension)))
}

export function retainedResultState(item: P7EvidenceRequirement) {
  if (item.applicability === "NOT_APPLICABLE") return "NOT_APPLICABLE"
  if (item.evidence_state === "MISSING" && item.normalized_value == null && !item.candidate_evidence_ids.length && !item.selected_evidence_id) return "NO_DATA"
  if (item.evidence_state === "FRESH" && item.validation_state.startsWith("VALIDATED") && item.canonical_selection_state.startsWith("DETERMINISTIC")) return "EVIDENCE_NOT_SCORE_READY"
  return "NO_VALIDATED_EVIDENCE"
}
