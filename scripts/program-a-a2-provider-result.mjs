const SAFE_CLASSIFICATION_CODES = new Set([
  "AMBIGUOUS_PROVIDER_IDENTITY",
  "NO_EXACT_PROVIDER_IDENTITY",
  "CLASSIFICATION_MISSING",
  "PROVIDER_SCHEMA_MISMATCH",
])

function safeCode(value, fallback) {
  if (typeof value !== "string") return fallback
  if (SAFE_CLASSIFICATION_CODES.has(value) || /^PROVIDER_[A-Z0-9_]+$/.test(value)) return value
  return fallback
}

export function assertProgramAA2ProviderResult(payload) {
  const providerCalls = Number(payload.providerCalls ?? 0)
  const localWrites = Number(payload.localWrites ?? payload.accepted ?? payload.candlesStored ?? payload.benchmarkCandlesStored ?? 0)
  if (payload.rejected > 0) throw Object.assign(new Error(safeCode(payload.code, "PROVIDER_REQUEST_FAILED")), { providerCalls, localWrites })
  if (payload.conflicts > 0 || payload.pendingReview > 0) throw Object.assign(new Error("CLASSIFICATION_CONFLICT"), { providerCalls, localWrites })
  if (payload.failed > 0) throw Object.assign(new Error(safeCode(payload.code, "PROVIDER_REQUEST_FAILED")), { providerCalls, localWrites })
  return { providerCalls, localWrites }
}
