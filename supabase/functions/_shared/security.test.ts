import { describe, expect, it } from "vitest"
import { redactSensitiveText, safeError, SafeOperationalError } from "./security.ts"

describe("market-data error safety", () => {
  it("redacts configured secrets, bearer tokens, JWTs, and credential fields", () => {
    const raw = 'key=topsecret Bearer abc.def.ghi {"pin":"1234","totp":"999999","clientcode":"C123"}'
    const result = redactSensitiveText(raw, ["topsecret", "C123", "1234"])
    expect(result).not.toMatch(/topsecret|abc\.def\.ghi|C123|1234|999999/u)
    expect(result).toContain("[REDACTED]")
  })

  it("does not expose unknown raw errors", () => {
    expect(safeError(new Error("upstream body with secret")).publicMessage).toBe("Market-data operation failed.")
    expect(safeError(new SafeOperationalError("SAFE", "Safe message", 429)).publicMessage).toBe("Safe message")
  })
})
