import { describe, expect, it } from "vitest"
import { parseSampleSecurityIds } from "./sample-request.ts"

const ids = Array.from({ length: 6 }, (_, index) => `00000000-0000-4000-8000-00000000000${index}`)

describe("bounded mapping samples", () => {
  it("accepts and deduplicates one to five UUIDs", () => {
    expect(parseSampleSecurityIds([ids[0], ids[0], ids[1]])).toEqual({ specified: true, valid: true, ids: [ids[0], ids[1]] })
  })

  it("rejects empty, oversized, and malformed samples", () => {
    expect(parseSampleSecurityIds([])).toEqual({ specified: true, valid: false })
    expect(parseSampleSecurityIds(ids)).toEqual({ specified: true, valid: false })
    expect(parseSampleSecurityIds(["not-a-uuid"])).toEqual({ specified: true, valid: false })
  })
})
