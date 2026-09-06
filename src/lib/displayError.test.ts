import { describe, expect, it } from "vitest"
import { displayError } from "./displayError"

describe("displayError", () => {
  it("surfaces safe PostgREST diagnostics", () => {
    expect(displayError({
      message: "source row failed validation",
      code: "22023",
      details: "row id 123",
      hint: "review the source evidence",
      access_token: "must-not-be-rendered",
    })).toBe(
      "message: source row failed validation | code: 22023 | details: row id 123 | hint: review the source evidence",
    )
  })

  it("keeps ordinary Error messages and safely handles unknown values", () => {
    expect(displayError(new Error("parse failed"))).toBe("parse failed")
    expect(displayError({ access_token: "secret" })).toBe("The import operation failed unexpectedly.")
  })
})
