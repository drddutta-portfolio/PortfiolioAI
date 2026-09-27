import { execFileSync } from "node:child_process"

const baseCommit = "f7c6cf45e7ec1d1820173addea0e18f38f84a25a"
const expectedBranch = "program-d-operations-optional-ai"
const auditRef = `origin/${expectedBranch}`
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim()
const changedFiles = git("diff", "--name-only", `${baseCommit}..${auditRef}`).split("\n").filter(Boolean)
const [behind, ahead] = git("rev-list", "--left-right", "--count", `${baseCommit}...${auditRef}`)
  .split(/\s+/u).map(Number)
const allowed = (file) => file === "src/components/AppShell.tsx"
  || file === "src/routes/AppRoutes.tsx"
  || file.startsWith("src/features/operations/")
  || file === "src/pages/OperationsPage.tsx"
  || file === "src/pages/InvestmentCommitteePage.tsx"
  || file === "scripts/program-d-final-audit.mjs"
  || file.startsWith("docs/PortfolioAI_PROGRAM_D_")
  || file === "docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF.md"
  || file === "docs/PortfolioAI_Development_Status.md"

const report = {
  evidenceClass: "EXECUTABLE_REPOSITORY_EVIDENCE",
  branch: expectedBranch,
  head: git("rev-parse", auditRef),
  baseCommit,
  baseIsAncestor: (() => {
    try { execFileSync("git", ["merge-base", "--is-ancestor", baseCommit, auditRef]); return true } catch { return false }
  })(),
  ahead,
  behind,
  mergeCommitCount: Number(git("rev-list", "--count", "--merges", `${baseCommit}..${auditRef}`)),
  changedFiles,
  unexpectedFiles: changedFiles.filter((file) => !allowed(file)),
  expectedBranch,
  programCDecisionFilesModified: changedFiles.filter((file) => file.startsWith("src/features/decision/")).length,
  researchAuthorityFilesModified: changedFiles.filter((file) => file.startsWith("src/features/research/")).length,
  supabaseMigrationFilesModified: changedFiles.filter((file) => file.startsWith("supabase/migrations/")).length,
  providerFunctionFilesModified: changedFiles.filter((file) => file.startsWith("supabase/functions/")).length,
  schedulerFilesModified: changedFiles.filter((file) => /(?:cron|scheduler)/iu.test(file)).length,
  tradingFilesModified: changedFiles.filter((file) => /(?:trade|trading|order)/iu.test(file)).length,
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
