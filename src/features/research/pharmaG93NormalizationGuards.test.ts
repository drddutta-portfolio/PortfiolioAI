import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const panel = readFileSync(
  resolve(process.cwd(), "src/features/research/PharmaG93NormalizedResearchPanel.tsx"),
  "utf8",
)
const sql = readFileSync(
  resolve(process.cwd(), "scripts/r4n/pharma-g9-3-persistence-regression.sql"),
  "utf8",
)
const runner = readFileSync(
  resolve(process.cwd(), "scripts/r4n/run-pharma-g9-3-persistence-regression.sh"),
  "utf8",
)
const workspace = readFileSync(
  resolve(process.cwd(), "src/features/research/PharmaResearchWorkspacePanel.tsx"),
  "utf8",
)
const researchPage = readFileSync(
  resolve(process.cwd(), "src/pages/ResearchPage.tsx"),
  "utf8",
)

describe("G9.3 UI and persisted-data regression guards", () => {
  it("renders NOT ENGAGED through a distinct UI branch", () => {
    expect(panel).toContain('value === "NOT_ENGAGED" ? "NOT ENGAGED"')
    expect(panel).toContain('className={item.state === "NOT_ENGAGED" ? "pharma-methodology-not-engaged" : undefined}')
    expect(panel).toContain('data-methodology-state={item.state}')
    expect(panel).toContain("no zero/default modifier is emitted")
  })

  it("asserts both companies' canonical Primary authorities and secondary roles", () => {
    expect(sql).toContain("'DOMESTIC_FORMULATIONS'")
    expect(sql).toContain("'GLOBAL_GENERICS'")
    expect(sql).toContain("'CDMO_CRAMS'")
    expect(sql).toContain("'API_BULK_DRUGS'")
    expect(sql).toContain("'MATERIAL'")
    expect(sql).toContain("'EMERGING'")
  })

  it("keeps AUROPHARMA Biosimilars absent from active reviewed authority", () => {
    expect(sql).toContain("'BIOPHARMA_BIOSIMILARS'")
    expect(sql).toContain("AUROPHARMA Biosimilars must remain absent from active reviewed authority")
  })

  it("keeps shared architecture separate from company-specific audit history", () => {
    expect(workspace).toContain('presentationMode?: "FULL" | "AUDIT_ONLY"')
    expect(workspace).toContain('const auditOnly = presentationMode === "AUDIT_ONLY"')
    expect(workspace).toContain("TORNTPHARM research operations & audit")
    expect(researchPage).toContain('presentationMode="AUDIT_ONLY"')
    expect(researchPage).toContain("AUROPHARMA development & validation history")
    expect(researchPage.indexOf("<PharmaG93NormalizedResearchPanel")).toBeLessThan(
      researchPage.indexOf("AUROPHARMA development & validation history"),
    )
  })

  it("is read-only and local-only", () => {
    expect(sql).toContain("BEGIN READ ONLY;")
    expect(sql).toContain("ROLLBACK;")
    expect(sql).not.toMatch(/insert\s+into/iu)
    expect(sql).not.toMatch(/update\s+public\./iu)
    expect(sql).not.toMatch(/delete\s+from/iu)
    expect(runner).toContain("127.0.0.1")
    expect(runner).toContain("localhost")
    expect(runner).toContain("REFUSING: G9.3 persistence regression is local-only")
  })
})
