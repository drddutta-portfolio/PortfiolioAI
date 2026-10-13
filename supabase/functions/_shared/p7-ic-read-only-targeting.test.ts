import { describe, expect, it } from "vitest"
import { readOnlySecurityIds, selectReadOnlySecurities } from "./p7-ic-read-only-targeting"

const a = "00000000-0000-4000-8000-000000000001"
const b = "00000000-0000-4000-8000-000000000002"
const action = "P7_IC3_VALIDATE_CANONICAL_INPUTS"

describe("owner read-only security targeting", () => {
  it("preserves the existing pagination contract when targeting is absent", () => {
    expect(readOnlySecurityIds({ action, offset: 0, limit: 4 })).toBeUndefined()
    expect(readOnlySecurityIds({ action: "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS" })).toBeUndefined()
  })
  it("validates bounded unique identities and preserves requested order", () => {
    const ids = readOnlySecurityIds({ action, securityIds: [b, a] })!
    expect(selectReadOnlySecurities([{ id: a, symbol: "A" }, { id: b, symbol: "B" }], ids).map(row => row.symbol)).toEqual(["B", "A"])
  })
  it.each([[], [a, a], [null], ["not-a-uuid"], Array(41).fill(a), "all"].map(securityIds => ({ securityIds })))("rejects malformed or unbounded targeting: $securityIds", ({ securityIds }) => {
    expect(() => readOnlySecurityIds({ action, securityIds })).toThrow()
  })
  it("rejects case-variant duplicates", () => {
    const id = "abcdefab-0000-4000-8000-000000000001"
    expect(() => readOnlySecurityIds({ action, securityIds: [id, id.toUpperCase()] })).toThrow("SECURITY_IDS_DUPLICATED")
  })
  it("rejects targeting on a write/provider action and ambiguous pagination", () => {
    expect(() => readOnlySecurityIds({ action: "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS", securityIds: [a] })).toThrow("SECURITY_IDS_REQUIRE_AUTHENTICATED_VALIDATION_OR_GRANT_SCOPED_WRITE")
    expect(() => readOnlySecurityIds({ action: "REFRESH", securityIds: [a] })).toThrow()
    expect(() => readOnlySecurityIds({ action, securityIds: [a], offset: 0 })).toThrow("SECURITY_IDS_CANNOT_COMBINE_WITH_PAGINATION")
    expect(() => readOnlySecurityIds({ action, securityIds: [a], limit: 1 })).toThrow()
  })
  it("fails atomically if any ID is not in the portfolio's open equity set", () => {
    expect(() => selectReadOnlySecurities([{ id: a }], [a, b])).toThrow("SECURITY_NOT_OPEN_EQUITY_IN_PORTFOLIO")
  })
})
