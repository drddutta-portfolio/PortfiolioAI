import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { assertUserJwtShape, normalizeLocalCredential, verifyLocalUserSession } from "./program-a-local-auth.mjs"

describe("Program A local user authentication", () => {
  it("normalizes shell whitespace without changing the credential", () => {
    assert.equal(normalizeLocalCredential("  header.payload.signature\n"), "header.payload.signature")
  })

  it("rejects a truncated browser-to-shell transfer", () => {
    assert.throws(() => assertUserJwtShape("not-a-user-jwt"), { message: "AUTH_OR_CONFIG_ERROR" })
  })

  it("accepts a normal three-segment JWT shape", () => {
    assert.doesNotThrow(() => assertUserJwtShape("header.payload.signature"))
  })

  it("verifies the user session without exposing the token", async () => {
    const seen = []
    const result = await verifyLocalUserSession({
      localUrl: "http://127.0.0.1:54321",
      anonKey: "anon-key",
      accessToken: "header.payload.signature",
      fetcher: async (url, init) => {
        seen.push({ url, authorization: init.headers.Authorization })
        return { ok: true, json: async () => ({ id: "local-user-id" }) }
      },
    })
    assert.deepEqual(result, { userId: "local-user-id" })
    assert.equal(seen[0].url, "http://127.0.0.1:54321/auth/v1/user")
    assert.equal(seen[0].authorization, "Bearer header.payload.signature")
  })

  it("fails closed before provider dispatch when local auth rejects", async () => {
    await assert.rejects(
      verifyLocalUserSession({
        localUrl: "http://127.0.0.1:54321",
        anonKey: "anon-key",
        accessToken: "header.payload.signature",
        fetcher: async () => ({ ok: false, json: async () => ({ message: "Invalid JWT" }) }),
      }),
      { message: "AUTH_OR_CONFIG_ERROR" },
    )
  })
})
