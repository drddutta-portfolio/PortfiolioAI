import { invokeBankingReadOnlyValidation } from "./bankingValidationRepository"

type BankingRequirement = { requirement_code: string; evidence_state: string; reason_code: string }
export type EffectiveBankReadOnlyResult = {
  readonly securityId: string
  readonly status: string
  readonly snapshotHash: string
  readonly items: readonly BankingRequirement[]
  readonly evaluationAsOf: string
  readonly sourceCutoffAt: string
  readonly selectionRunId: string
}

const action = "P7_IC3_VALIDATE_CANONICAL_INPUTS"

/**
 * An authenticated, read-only canonical evaluation, NEVER a persisted READY.
 * Fail closed on incomplete identities, requirements, side effects or counters.
 */
export async function validateEffectiveBankReadOnly(
  portfolioId: string, securityId: string, evaluationAsOf: string,
): Promise<EffectiveBankReadOnlyResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(portfolioId) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(securityId) ||
      !Number.isFinite(Date.parse(evaluationAsOf))) throw new Error("BANK_CURRENT_VALIDATION_SCOPE_INVALID")
  const selectionRunId=crypto.randomUUID()
  const raw = await invokeBankingReadOnlyValidation({
    action, portfolioId, securityIds:[securityId],
    selectionRunId, evaluationAsOf, sourceCutoffAt:evaluationAsOf,
  })
  if (!raw || typeof raw !== "object") throw new Error("BANK_CURRENT_VALIDATION_INCOMPLETE")
  const body = raw as Record<string,unknown>
  const writes = body.writeTotals as Record<string,unknown> | undefined
  if (body.dryRun !== true || body.status !== "IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY" ||
      body.providerCalls !== 0 || body.processed !== 1 ||
      !writes || ["snapshotsCreated","snapshotsReused","selectionsCreated","selectionsReused"].some(key=>writes[key]!==0) ||
      !Array.isArray(body.snapshotIds) || body.snapshotIds.length!==0 ||
      !Array.isArray(body.selectionIds) || body.selectionIds.length!==0) {
    throw new Error("BANK_CURRENT_VALIDATION_SIDE_EFFECT_OR_INCOMPLETE")
  }
  const rows = body.results
  if (!Array.isArray(rows) || rows.length!==1 || !rows[0] || typeof rows[0]!=="object") throw new Error("BANK_CURRENT_VALIDATION_RESULTS_INCOMPLETE")
  const result = rows[0] as Record<string,unknown>
  if (result.securityId!==securityId || typeof result.status!=="string" ||
      !["READY","REVIEW_REQUIRED","STALE","CONFLICTING","INSUFFICIENT"].includes(result.status) ||
      typeof result.snapshotHash!=="string" || !result.snapshotHash ||
      !Array.isArray(result.items) || !result.items.length) throw new Error("BANK_CURRENT_VALIDATION_IDENTITY_OR_STATUS_INVALID")
  const codes = new Set<string>()
  const items:BankingRequirement[] = []
  for (const rawItem of result.items) {
    if (!rawItem || typeof rawItem!=="object") throw new Error("BANK_CURRENT_VALIDATION_ITEM_INVALID")
    const item = rawItem as Record<string,unknown>
    if (typeof item.requirement_code!=="string" || !item.requirement_code ||
        typeof item.evidence_state!=="string" || !item.evidence_state ||
        typeof item.reason_code!=="string" || codes.has(item.requirement_code)) throw new Error("BANK_CURRENT_VALIDATION_ITEM_INVALID")
    codes.add(item.requirement_code)
    items.push({requirement_code:item.requirement_code,evidence_state:item.evidence_state,reason_code:item.reason_code})
  }
  return {securityId,status:result.status,snapshotHash:result.snapshotHash,items,evaluationAsOf,sourceCutoffAt:evaluationAsOf,selectionRunId}
}
