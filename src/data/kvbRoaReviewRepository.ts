import { supabase } from "../lib/supabase"
const PORTFOLIO = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const SECURITY = "be55b3cc-0400-45af-84aa-2a95e2c361c5"
export type KvbRoaProposal = { sourceRecordId: string; sourcePayloadHash: string; supportingQuote: string; issuerUrl: string; regulatorUrl: string; roaPercent: "1.93"; period: "FY2025-26"; scope: "STANDALONE"; publicationPrecision: "UNKNOWN" }
async function invoke(body: Record<string, unknown>, functionName = "v14-bank-kvb-roa-numeric-review"): Promise<Record<string, unknown>> {
 const { data, error } = await supabase.auth.getSession()
 if (error || !data.session) throw new Error("Sign in with your Development portfolio-owner account.")
 const result = await supabase.functions.invoke(functionName, { body: { ...body, portfolioId: PORTFOLIO, securityId: SECURITY } })
 if (result.error) {
  let code = "ROA review request failed."
  try {
   const context: unknown = (result.error as { context?: unknown }).context
   if (context instanceof Response) {
    const details: unknown = await context.json()
    if (details && typeof details === "object" && "code" in details && typeof details.code === "string") code = details.code
   }
  } catch { /* no credentials in diagnostics */ }
  throw new Error(code)
 }
 if (!result.data || typeof result.data !== "object") throw new Error("Incomplete ROA review response.")
 return result.data as Record<string, unknown>
}
export async function loadKvbRoaProposal(): Promise<KvbRoaProposal> {
 const p = await invoke({ action: "READ_KVB_FY26_ROA_PROPOSAL" })
 if (p.code !== "SOURCE_BOUND_ROA_PROPOSAL_NOT_ACCEPTED" || p.canonicalPromotion !== false || p.roaPercent !== "1.93" || p.period !== "FY2025-26" || p.scope !== "STANDALONE" || p.publicationPrecision !== "UNKNOWN" || ![p.sourceRecordId, p.sourcePayloadHash, p.supportingQuote, p.issuerUrl, p.regulatorUrl].every(x => typeof x === "string" && x.length > 0)) throw new Error("Source-bound proposal verification failed.")
 return p as unknown as KvbRoaProposal
}
export async function approveKvbRoaProposal(p: KvbRoaProposal): Promise<string> {
 const r = await invoke({ action: "V14_KVB_ROA_OWNER_NUMERIC_REVIEW", confirmation: "APPROVE_KVB_FY26_ROA_SOURCE_BOUND_193", sourceRecordId: p.sourceRecordId, sourcePayloadHash: p.sourcePayloadHash, supportingQuote: p.supportingQuote })
 if (r.code !== "NUMERIC_REVIEW_APPENDED_NOT_MATERIALIZED" || typeof r.reviewId !== "string") throw new Error("Review acceptance was not established.")
 return r.reviewId
}

export async function validateAndSaveKvbReadiness(): Promise<string> {
 const now = new Date().toISOString()
 const request = { portfolioId: PORTFOLIO, securityIds: [SECURITY], selectionRunId: crypto.randomUUID(), evaluationAsOf: now, sourceCutoffAt: now }
 const validation = await invoke({ ...request, action: "P7_IC3_VALIDATE_CANONICAL_INPUTS" }, "p7-ic2-materialize-readiness")
 const results = validation.results as { securityId?: string; items?: { requirement_code?: string; evidence_state?: string }[] }[] | undefined
 const writes = validation.writeTotals as Record<string, unknown> | undefined
 if (validation.dryRun !== true || validation.status !== "IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY" || validation.providerCalls !== 0 || !Array.isArray(results) || results.length !== 1 || results[0]?.securityId !== SECURITY || !results[0].items?.some(x => x.requirement_code === "ROA_ANNUAL" && x.evidence_state === "FRESH") || !writes || ["snapshotsCreated", "snapshotsReused", "selectionsCreated", "selectionsReused"].some(k => writes[k] !== 0) || !Array.isArray(validation.snapshotIds) || validation.snapshotIds.length || !Array.isArray(validation.selectionIds) || validation.selectionIds.length) throw new Error("Canonical ROA is not FRESH in a complete read-only result. No materialization grant requested.")
 const grant = await invoke({ action: "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS", requestId: crypto.randomUUID(), confirmation: "ISSUE_KVB_V14_SINGLE_USE_MATERIALIZATION_GRANT" }, "v14-bank-kvb-owner-materialize-grant")
 if (grant.code !== "GRANT_ISSUED_SINGLE_USE" || typeof grant.grantId !== "string" || grant.scope !== "SECURITY_IDS:" + SECURITY || grant.action !== "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS" || typeof grant.expiresAt !== "string" || Date.parse(grant.expiresAt) <= Date.now()) throw new Error("A valid KVB-only materialization grant was not established.")
 const saved = await invoke({ ...request, action: "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS", targetingMode: "P4_GRANT_SCOPED_SECURITY_IDS_V1", grantId: grant.grantId }, "p7-ic2-materialize-readiness")
 if (saved.status !== "IC3_CANONICAL_SNAPSHOTS_MATERIALIZED" || saved.dryRun !== false || saved.providerCalls !== 0 || saved.processed !== 1 || !Array.isArray(saved.snapshotIds) || saved.snapshotIds.length !== 1 || typeof saved.snapshotIds[0] !== "string" || !Array.isArray(saved.selectionIds) || saved.selectionIds.length !== 1) throw new Error("Materialization response is incomplete. Request independent database readback before retrying.")
 return saved.snapshotIds[0]
}
