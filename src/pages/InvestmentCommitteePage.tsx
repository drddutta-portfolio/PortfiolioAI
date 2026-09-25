import { useState } from "react"
import { buildProgramDR12LocalReferencePacket } from "../features/operations/programD3R12Fixtures"
import { createBrowserProgramDR12Cache } from "../features/operations/programD3R12Cache"
import { generateProgramDR12LocalNarrative } from "../features/operations/programD3R12Runtime"
import {
  PROGRAM_D_R12_D3_COST_CEILING,
  type ProgramDR12FactPacket,
  type ProgramDR12Result,
} from "../features/operations/programD3R12Contract"
import {
  buildProgramD4ValidationSummary,
  type ProgramD4ValidationResult,
} from "../features/operations/programD4R12Validation"
import "../features/operations/programD3R12.css"

export function InvestmentCommitteePage() {
  const [packet, setPacket] = useState<ProgramDR12FactPacket | null>(null)
  const [result, setResult] = useState<ProgramDR12Result | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [d4Results, setD4Results] = useState<readonly ProgramD4ValidationResult[]>([])
  const [d4Running, setD4Running] = useState(false)

  const runD4Validation = async () => {
    setD4Running(true)
    setError(null)
    try {
      const summary = await buildProgramD4ValidationSummary()
      setD4Results(summary.results)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "D4 R12 validation failed.")
    } finally {
      setD4Running(false)
    }
  }

  const runLocal = async () => {
    setRunning(true)
    setError(null)
    try {
      const nextPacket = await buildProgramDR12LocalReferencePacket()
      const nextResult = await generateProgramDR12LocalNarrative(
        nextPacket,
        createBrowserProgramDR12Cache(window.localStorage),
      )
      setPacket(nextPacket)
      setResult(nextResult)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Local R12 generation failed.")
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="r12-page">
      <div className="portfolio-hero compact-hero">
        <div>
          <p className="eyebrow">Program D · D3 optional R12</p>
          <h1>Investment Committee</h1>
          <p>
            Bounded on-demand interpretation of a versioned deterministic fact packet.
            This local D3 implementation uses no external AI provider and cannot alter
            R6–R10, owner settings, sizing, or trading.
          </p>
        </div>
        <span className="status status-stale">LOCAL MOCK / ON DEMAND</span>
      </div>

      <section className="summary-grid" aria-label="R12 D3 safety summary">
        <Summary label="External AI calls" value="0" />
        <Summary label="External AI cost" value="0" />
        <Summary label="Scheduled AI" value="Disabled" />
        <Summary label="Deterministic authority" value="R6–R10 unchanged" />
      </section>

      <section className="panel r12-boundary-panel">
        <div>
          <p className="eyebrow">Authority boundary</p>
          <h2>AI interpretation is downstream and non-authoritative</h2>
          <p>
            R10 remains the sole canonical Action Center authority. R12 can explain supplied
            deterministic state, contradictions, uncertainty, and monitoring questions only.
          </p>
        </div>
        <div className="operations-safety-grid">
          <Safety label="Provider mode" value={PROGRAM_D_R12_D3_COST_CEILING.mode} />
          <Safety label="Concurrency" value="1 local generation" />
          <Safety label="Retries" value="At most 1 transient" />
          <Safety label="Real AI provider" value="Not authorized" />
          <Safety label="Numeric sizing" value="None" />
          <Safety label="Trade/order path" value="Prohibited" />
        </div>
      </section>

      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">D4 grounding / adversarial validation</p>
            <h2>Validate R12 fail-closed behavior</h2>
            <p>
              Exercises the frozen D4 matrix locally. No external AI provider is called and
              deterministic R6–R10 state remains available even when AI is simulated as unavailable.
            </p>
          </div>
          <button
            className="button button-primary"
            type="button"
            disabled={d4Running}
            onClick={() => void runD4Validation()}
          >
            {d4Running ? "Validating…" : "Run D4 adversarial validation"}
          </button>
        </div>
        {d4Results.length ? (
          <div className="r12-validation-grid">
            {d4Results.map((result) => (
              <article className="r12-validation-card" key={result.code}>
                <span className={result.state === "PASS" ? "status status-fresh" : "status status-conflicting"}>
                  {result.state}
                </span>
                <strong>{result.label}</strong>
                <small>{result.code}</small>
                <p>{result.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="assessment-note">D4 adversarial validation has not been run in this browser session yet.</p>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bounded reference packet</p>
            <h2>Run local Investment Committee interpretation</h2>
            <p>
              Uses a frozen local TORNTPHARM packet to validate the R12 contract.
              Repeating the same packet reuses the cached narrative.
            </p>
          </div>
          <button className="button button-primary" type="button" disabled={running} onClick={() => void runLocal()}>
            {running ? "Generating locally…" : "Generate local interpretation"}
          </button>
        </div>
      </section>

      {packet ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Deterministic fact packet</p>
              <h2>{packet.symbol} · {packet.narrativeType.replaceAll("_", " ")}</h2>
            </div>
            <code>{packet.packetId.slice(0, 16)}…</code>
          </div>
          <div className="r12-stage-grid">
            <Stage label="R6" state={packet.r6.state} />
            <Stage label="R7" state={packet.r7.state} />
            <Stage label="R8" state={packet.r8.state} />
            <Stage label="R9" state={packet.r9.state} />
            <Stage label="R10" state={packet.r10.state} />
          </div>
          <div className="r12-fields">
            {packet.fields.map((field) => (
              <div key={field.id}>
                <span>{field.type}</span>
                <strong>{field.label}</strong>
                <p>{String(field.value ?? "Not available")}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="panel r12-result-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI interpretation · non-authoritative</p>
              <h2>Local R12 narrative</h2>
            </div>
            <div className="r12-result-badges">
              <span className={result.validationStatus === "VALID" ? "status status-fresh" : "status status-conflicting"}>
                {result.validationStatus}
              </span>
              <span className="status status-missing">{result.cached ? "CACHE REUSED" : "NEW LOCAL MOCK"}</span>
            </div>
          </div>

          <article className="r12-narrative-card">
            <h3>Deterministic state summary</h3>
            <p>{result.narrative.deterministicStateSummary}</p>
          </article>
          <article className="r12-narrative-card">
            <h3>AI interpretation</h3>
            <p>{result.narrative.aiInterpretation}</p>
          </article>

          <div className="r12-columns">
            <ListCard title="Source-bound factual claims" values={result.narrative.factualClaims.map((claim) => claim.text)} />
            <ListCard title="Supporting evidence" values={result.narrative.supportingEvidence} />
            <ListCard title="Contradictory evidence" values={result.narrative.contradictoryEvidence} />
            <ListCard title="Uncertainties" values={result.narrative.uncertainties} />
            <ListCard title="Blocked questions" values={result.narrative.blockedQuestions} />
            <ListCard title="Monitoring questions" values={result.narrative.monitoringQuestions} />
            <ListCard title="Citations" values={result.narrative.citations} />
          </div>

          <p className="assessment-note">
            Provider: {result.provider} · External cost: {result.usage.externalCost} ·
            Input tokens estimated: {result.usage.inputTokensEstimated} ·
            Output tokens estimated: {result.usage.outputTokensEstimated}
          </p>
        </section>
      ) : null}
    </section>
  )
}

function Summary({ label, value }: { readonly label: string; readonly value: string }) {
  return <article className="summary-card"><span>{label}</span><strong>{value}</strong></article>
}

function Safety({ label, value }: { readonly label: string; readonly value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}

function Stage({ label, state }: { readonly label: string; readonly state: string | null }) {
  return <article><span>{label}</span><strong>{state ?? "Not available"}</strong></article>
}

function ListCard({ title, values }: { readonly title: string; readonly values: readonly string[] }) {
  return (
    <article className="r12-list-card">
      <h3>{title}</h3>
      {values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>None supplied.</p>}
    </article>
  )
}
