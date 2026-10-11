import { supabase } from "../lib/supabase"
const PORTFOLIO = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const SECURITY = "be55b3cc-0400-45af-84aa-2a95e2c361c5"
export type KvbRoaProposal = { sourceRecordId: string; sourcePayloadHash: string; supportingQuote: string; issuerUrl: string; regulatorUrl: string; roaPercent: "1.93"; period: "FY2025-26"; scope: "STANDALONE"; publicationPrecision: "UNKNOWN" }
async function invoke(body: Record<string, unknown>): Promise<Record<string, unknown>> {
 const { data, error } = await supabase.auth.getSession()
 if (error || !data.session) throw new Error("Sign in with your Development portfolio-owner account.")
 const result = await supabase.functions.invoke("v14-bank-kvb-roa-numeric-review", { body: { ...body, portfolioId: PORTFOLIO, securityId: SECURITY } })
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
