import { describe, expect, it } from "vitest"
import { validatePositionSettings } from "./positionSettings"

const draft = { portfolioRole: "CORE" as const, targetWeight: "5.125", minimumWeight: "2.5", maximumWeight: "7.75", priority: "1", isWatchlisted: false, isFrozen: false, investmentHorizon: " Long term ", notes: " Thesis note " }

describe("validatePositionSettings", () => {
  it("preserves exact decimal percentages and trims optional text", () => {
    expect(validatePositionSettings(draft)).toEqual({ portfolioRole: "CORE", targetWeight: "5.125", minimumWeight: "2.5", maximumWeight: "7.75", priority: 1, isWatchlisted: false, isFrozen: false, investmentHorizon: "Long term", notes: "Thesis note" })
  })

  it("preserves blank optional values as unset", () => {
    expect(validatePositionSettings({ ...draft, targetWeight: "", minimumWeight: "", maximumWeight: "", priority: "", investmentHorizon: "", notes: "" })).toMatchObject({ targetWeight: null, minimumWeight: null, maximumWeight: null, priority: null, investmentHorizon: null, notes: null })
  })

  it.each([
    [{ ...draft, minimumWeight: "6" }, "Minimum weight cannot exceed target weight."],
    [{ ...draft, targetWeight: "8" }, "Target weight cannot exceed maximum weight."],
    [{ ...draft, maximumWeight: "101" }, "Maximum weight must be between 0 and 100."],
    [{ ...draft, targetWeight: "1.1234567" }, "Target weight supports at most 6 decimal places."],
  ])("rejects invalid weights", (value, message) => {
    expect(() => validatePositionSettings(value)).toThrow(message)
  })
})
