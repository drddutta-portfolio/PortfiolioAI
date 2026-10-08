import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { getSupabaseProjectRef, DEVELOPMENT_SUPABASE_PROJECT_REF } from "../lib/environment"
import { publicConfig } from "../lib/config"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import manifest from "../../docs/private/v1-4-industry-batches/Banking_13_Read_Only_Request_Manifest.json"

const ACTION = "P7_IC3_VALIDATE_CANONICAL_INPUTS"
const FUNCTION = "p7-ic2-materialize-readiness"
const DEV_HOST = "portfolioai-development"
type Requirement = { requirement_code?: string; evidence_state?: string; reason_code?: string; validation_state?: string; canonical_selection_state?: string; raw_source_record_id?: string | null; candidate_evidence_ids?: string[] }
type StockResult = { securityId: string; status: string; snapshotHash: string; items: Requirement[] }
type SliceResult = { sliceId: string; evaluationAsOf: string; sourceCutoffAt: string; selectionRunId: string; deployment: string; results: StockResult[]; providerCalls: number; writeTotals: Record<string, number>; processed: number }
type SliceState = { status: "idle" | "running" | "completed" | "failed"; error?: string; result?: SliceResult }

function isDevelopment() {
  if (typeof window === "undefined") return false
  const hostname = window.location.hostname.toLowerCase()
  const project = getSupabaseProjectRef(publicConfig.supabaseUrl)
  return project === DEVELOPMENT_SUPABASE_PROJECT_REF &&
    (hostname.includes(DEV_HOST) || hostname === "localhost" || hostname === "127.0.0.1")
}

function cleanResult(raw: unknown, expectedIds: readonly string[]): Omit<SliceResult, "sliceId" | "evaluationAsOf" | "sourceCutoffAt" | "selectionRunId" | "deployment"> {
  if (!raw || typeof raw !== "object") throw new Error("Missing validator response")
  const body = raw as Record<string, unknown>
  if (body.dryRun !== true || body.status !== "IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY") throw new Error("Unexpected non-read-only validator response")
  if (!Array.isArray(body.results)) throw new Error("Missing per-stock validation results")
  const stocks = body.results as Record<string, unknown>[]
  if (stocks.length !== expectedIds.length || stocks.some((stock, index) => stock.securityId !== expectedIds[index])) throw new Error("Validator returned mismatched banking identities")
  if (body.providerCalls !== 0) throw new Error("Validator reported provider calls; results withheld")
  const writes = (body.writeTotals || {}) as Record<string, unknown>
  if (Object.values(writes).some(value => value !== 0)) throw new Error("Validator reported writes; results withheld")
  if ((body.snapshotIds as unknown[] | undefined)?.length || (body.selectionIds as unknown[] | undefined)?.length) throw new Error("Validator reported selected snapshots")
  return {
    processed: Number(body.processed),
    providerCalls: 0,
    writeTotals: Object.fromEntries(Object.entries(writes).map(([key, value]) => [key, Number(value)])),
    results: stocks.map(stock => ({
      securityId: String(stock.securityId),
      status: String(stock.status),
      snapshotHash: String(stock.snapshotHash),
      items: Array.isArray(stock.items) ? (stock.items as Record<string, unknown>[]).map(item => ({
        requirement_code: String(item.requirement_code ?? ""),
        evidence_state: String(item.evidence_state ?? ""),
        reason_code: String(item.reason_code ?? ""),
        validation_state: String(item.validation_state ?? ""),
        canonical_selection_state: String(item.canonical_selection_state ?? ""),
        raw_source_record_id: typeof item.raw_source_record_id === "string" ? item.raw_source_record_id : null,
        candidate_evidence_ids: Array.isArray(item.candidate_evidence_ids) ? item.candidate_evidence_ids.filter((id): id is string => typeof id === "string") : [],
      })) : [],
    })),
  }
}

export function BankingReadOnlyValidationPage() {
  const { portfolio, isLoading, error: portfolioError } = usePortfolioView()
  const [states, setStates] = useState<Record<string, SliceState>>({})
  const busy = useRef(false)
  const [active, setActive] = useState<string | null>(null)
  const permitted = isDevelopment()
  const slices = manifest.slices

  async function execute(slice: (typeof slices)[number]) {
    if (!permitted || busy.current || !portfolio?.portfolio.id) return
    busy.current = true
    setActive(slice.slice_id)
    setStates(previous => ({ ...previous, [slice.slice_id]: { status: "running" } }))
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) throw new Error("Session unavailable or expired. Sign in again using the existing login page.")
      const evaluationAsOf = new Date().toISOString()
      const sourceCutoffAt = evaluationAsOf
      const selectionRunId = crypto.randomUUID()
      const body = {
        action: ACTION, portfolioId: portfolio.portfolio.id,
        securityIds: slice.securityIds, selectionRunId, evaluationAsOf, sourceCutoffAt,
      }
      const { data, error } = await supabase.functions.invoke(FUNCTION, { body })
      if (error) throw new Error("Read-only validator failed. Confirm that your Development session is still valid and the function is available.")
      const cleaned = cleanResult(data, slice.securityIds)
      if (cleaned.processed !== slice.securityIds.length) throw new Error("Validator processed an unexpected number of securities")
      const result: SliceResult = { sliceId: slice.slice_id, evaluationAsOf, sourceCutoffAt, selectionRunId, deployment: "Development function p7-ic2-materialize-readiness; verify actual deployed version separately", ...cleaned }
      setStates(previous => ({ ...previous, [slice.slice_id]: { status: "completed", result } }))
    } catch (error) {
      setStates(previous => ({ ...previous, [slice.slice_id]: { status: "failed", error: error instanceof Error ? error.message : "Validation failed" } }))
    } finally {
      busy.current = false
      setActive(null)
    }
  }

  function downloadResults() {
    const completed = slices.map(slice => states[slice.slice_id]?.result).filter((result): result is SliceResult => Boolean(result))
    if (!completed.length) return
    const blob = new Blob([JSON.stringify({ contract: "V1_4_BANKING_OWNER_READ_ONLY", prospectiveOnly: true, savedCanonicalReadiness: false, developmentProject: DEVELOPMENT_SUPABASE_PROJECT_REF, slices: completed }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "portfolioai-v1-4-banking-prospective-results.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!permitted) return <section className="panel"><h1>Development-only validator</h1><p>This control is unavailable outside the approved Development environment.</p><Link to="/app/settings">Return to Settings</Link></section>

  return <section className="portfolio-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Development diagnostics / V1-4</p><h1>13-bank owner validation</h1><p>Owner-authenticated, read-only canonical input validation. Results are prospective only: this tool does not save or change persisted research readiness.</p></div></div>
    <div className="panel">
      <p><strong>Environment:</strong> Development Supabase ({DEVELOPMENT_SUPABASE_PROJECT_REF})</p>
      <p><strong>Selected portfolio:</strong> {isLoading ? "Loading…" : portfolio?.portfolio.name ?? "Unavailable"}</p>
      {portfolioError && <p role="alert">{portfolioError}</p>}
      <p>Each slice runs once when selected. Run again only after resolving a failure or after an authorized evidence repair. No provider acquisition, grants, reviews, or canonical writes are requested.</p>
      {slices.map(slice => {
        const state = states[slice.slice_id]
        return <div className="panel" key={slice.slice_id}>
          <h2>{slice.slice_id}: {slice.symbols.join(", ")}</h2>
          <button type="button" disabled={Boolean(active) || isLoading || !portfolio?.portfolio.id} onClick={() => void execute(slice)}>{state?.status === "running" ? "Validating…" : state?.status === "completed" ? "Revalidate this slice" : "Run read-only validation"}</button>
          {state?.error && <p role="alert">{state.error} <Link to="/login">Sign in</Link> if your session expired.</p>}
          {state?.result && <div>
            <p><strong>Prospective only:</strong> {state.result.results.length} stocks, zero reported provider calls and writes. Existing persisted selections have not been changed by this tool.</p>
            <p>Evaluation/cutoff: {state.result.evaluationAsOf}</p>
            {state.result.results.map((stock, i) => <details key={stock.securityId}><summary>{slice.symbols[i]} — prospective {stock.status} ({stock.items.length} requirements)</summary>
              <table className="research-table"><thead><tr><th>Requirement</th><th>State</th><th>Reason</th><th>Source</th></tr></thead><tbody>{stock.items.map((item, j) => <tr key={j}><td>{item.requirement_code}</td><td>{item.evidence_state}</td><td>{item.reason_code}</td><td>{item.raw_source_record_id ?? "Not selected"}</td></tr>)}</tbody></table>
            </details>)}
          </div>}
        </div>
      })}
      <button type="button" disabled={!slices.some(slice => states[slice.slice_id]?.status === "completed")} onClick={downloadResults}>Download sanitized prospective results</button>
      <p><Link to="/app/settings">Back to Settings</Link></p>
    </div>
  </section>
}
