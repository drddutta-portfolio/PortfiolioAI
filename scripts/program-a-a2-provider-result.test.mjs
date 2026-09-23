import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { assertProgramAA2ProviderResult } from "./program-a-a2-provider-result.mjs"

describe("Program A A2 provider result propagation", () => {
  for (const code of ["NO_EXACT_PROVIDER_IDENTITY", "AMBIGUOUS_PROVIDER_IDENTITY", "CLASSIFICATION_MISSING", "PROVIDER_SCHEMA_MISMATCH"]) {
    it(`preserves ${code}`, () => {
      assert.throws(() => assertProgramAA2ProviderResult({ rejected: 1, providerCalls: 1, code }), { message: code, providerCalls: 1 })
    })
  }

  it("does not expose an arbitrary provider message", () => {
    assert.throws(() => assertProgramAA2ProviderResult({ rejected: 1, providerCalls: 1, code: "raw provider response" }), { message: "PROVIDER_REQUEST_FAILED" })
  })

  it("reports zero writes for a rejected response", () => {
    assert.throws(() => assertProgramAA2ProviderResult({ rejected: 1, accepted: 0, providerCalls: 1, code: "NO_EXACT_PROVIDER_IDENTITY" }), { message: "NO_EXACT_PROVIDER_IDENTITY", providerCalls: 1, localWrites: 0 })
  })

  it("reports accepted evidence writes when pending mapping review stops execution", () => {
    assert.throws(() => assertProgramAA2ProviderResult({ pendingReview: 1, accepted: 1, providerCalls: 1 }), { message: "CLASSIFICATION_CONFLICT", providerCalls: 1, localWrites: 1 })
  })
})
