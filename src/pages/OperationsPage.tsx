import { useMemo, useState } from "react"
import { PROGRAM_D_D1_LOCAL_FIXTURES } from "../features/operations/programD1Fixtures"
import { buildProgramD1Plan } from "../features/operations/programD1Planner"
import {
  createBrowserProgramD1Store,
  emptyProgramD1LocalState,
  PROGRAM_D_D1_BROWSER_STORAGE_KEY,
} from "../features/operations/programD1Store"
import { executeProgramD1Plan } from "../features/operations/programD1Runtime"
import type { ProgramD1RunRecord } from "../features/operations/programD1Types"
import "../features/operations/programD1Operations.css"

function store() {
  return createBrowserProgramD1Store(window.localStorage)
}

export function OperationsPage() {
  const [runs, setRuns] = useState<readonly ProgramD1RunRecord[]>(() => store().load().runs)
  const [runningCode, setRunningCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const physicalCalls = useMemo(
    () => runs.reduce((total, run) => total + run.externalProviderCalls, 0),
    [runs],
  )

  const runFixture = async (code: string) => {
    const selected = PROGRAM_D_D1_LOCAL_FIXTURES.find((entry) => entry.code === code)
    if (!selected) return
    setRunningCode(code)
    setError(null)
    try {
      const localStore = store()
      const plan = await buildProgramD1Plan(selected.trigger)
      executeProgramD1Plan(plan, localStore)
      setRuns(localStore.load().runs)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "D1 local orchestration failed.")
    } finally {
      setRunningCode(null)
    }
  }

  const clearLocalLedger = () => {
    window.localStorage.removeItem(PROGRAM_D_D1_BROWSER_STORAGE_KEY)
    store().save(emptyProgramD1LocalState())
    setRuns([])
    setError(null)
  }

  return (
    <section className="operations-page">
      <div className="portfolio-hero compact-hero">
        <div>
          <p className="eyebrow">Program D · D1 local orchestration</p>
          <h1>Operations</h1>
          <p>
            Local provider-free R11 orchestration validation. This surface plans dependency work,
            semantic dedupe, leases, recovery and downstream routing without calling providers or
            automatically executing R6–R10.
          </p>
        </div>
        <span className="status status-fresh">LOCAL / DRY RUN</span>
      </div>

      <section className="summary-grid" aria-label="D1 safety summary">
        <Summary label="Local runs" value={runs.length} />
        <Summary label="Physical provider calls" value={physicalCalls} />
        <Summary label="Automatic R6–R10 executions" value={0} />
        <Summary label="Production writes" value={0} />
      </section>

      <section className="panel operations-safety-panel">
        <div>
          <p className="eyebrow">Frozen safety boundary</p>
          <h2>D1 cannot activate production</h2>
          <p>
            Trendlyne, Angel One and AI calls are disabled. Provider requirements are planning-only.
            The ledger is disposable browser-local state, not business authority.
          </p>
        </div>
        <div className="operations-safety-grid">
          <Safety label="Provider execution" value="0 calls" />
          <Safety label="Scheduler" value="Disabled" />
          <Safety label="Migration" value="None" />
          <Safety label="R12 / AI" value="Disabled" />
          <Safety label="Trading" value="Disabled" />
          <Safety label="Canonical mutation" value="None" />
        </div>
      </section>

      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Frozen local fixtures</p>
            <h2>Exercise the R11 orchestration contract</h2>
            <p>Each fixture writes only to this browser's disposable D1 ledger.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={clearLocalLedger} disabled={!runs.length}>
            Clear local D1 ledger
          </button>
        </div>
        <div className="operations-fixture-grid">
          {PROGRAM_D_D1_LOCAL_FIXTURES.map((fixture) => (
            <article className="operations-fixture-card" key={fixture.code}>
              <strong>{fixture.label}</strong>
              <small>{fixture.code}</small>
              <p>{fixture.trigger.type.replaceAll("_", " ")} · {fixture.trigger.scope.subjectIds.join(", ")}</p>
              <button
                className="button button-primary"
                type="button"
                disabled={runningCode !== null}
                onClick={() => void runFixture(fixture.code)}
              >
                {runningCode === fixture.code ? "Planning…" : "Run local dry-run"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Disposable operational ledger</p>
            <h2>Recent local runs</h2>
          </div>
        </div>
        {runs.length ? (
          <div className="research-table-wrap" tabIndex={0}>
            <table className="research-table operations-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Trigger</th>
                  <th>Semantic job</th>
                  <th>Stages</th>
                  <th>Provider plan</th>
                  <th>Physical calls</th>
                  <th>Resume / dedupe</th>
                </tr>
              </thead>
              <tbody>
                {[...runs].reverse().map((run) => (
                  <tr key={run.semanticJobId}>
                    <td><span className={statusClass(run.state)}>{run.state.replaceAll("_", " ")}</span></td>
                    <td>{run.triggerType.replaceAll("_", " ")}</td>
                    <td><code>{run.semanticJobId.slice(0, 12)}…</code></td>
                    <td>
                      {run.checkpoints.length
                        ? run.checkpoints.map((checkpoint) => checkpoint.node).join(" → ")
                        : run.failureReason ?? "No affected stages"}
                    </td>
                    <td>
                      {run.providerPlans.length
                        ? run.providerPlans.map((plan) => `${plan.provider} ${plan.domain}: ${plan.estimatedPhysicalCalls} estimated / 0 executed`).join("; ")
                        : "None"}
                    </td>
                    <td><strong>{run.externalProviderCalls}</strong></td>
                    <td>
                      {run.reusedExistingSemanticRun
                        ? "Semantic duplicate reused"
                        : run.resumedFromCheckpoint
                          ? "Resumed"
                          : "New local run"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="assessment-note">No D1 local runs yet. Run a frozen fixture above.</p>
        )}
      </section>
    </section>
  )
}

function Summary({ label, value }: { readonly label: string; readonly value: number }) {
  return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article>
}

function Safety({ label, value }: { readonly label: string; readonly value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}

function statusClass(state: ProgramD1RunRecord["state"]) {
  if (state === "SUCCEEDED" || state === "NO_OP") return "status status-fresh"
  if (state === "PARTIAL" || state === "REVIEW_REQUIRED") return "status status-stale"
  if (state === "FAILED" || state === "BLOCKED_LEASE") return "status status-conflicting"
  return "status status-missing"
}
