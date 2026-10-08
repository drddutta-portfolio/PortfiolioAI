import type { P7EvidenceRequirement } from "../../data/p7CurrentIntelligenceRepository"
import { retainedResultState } from "./selectedResearchPresentation"

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
}
function field(value: unknown) { return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : null }

/** Exact retained observations only; no trend calculation, unit conversion or series pooling. */
export function ResearchRetainedResult({ item }: { readonly item: P7EvidenceRequirement }) {
  const raw = record(item.normalized_value)
  const series = Array.isArray(raw?.series) ? raw.series : raw ? [raw] : []
  const observations = series.flatMap(value => {
    const row = record(value)
    if (!row) return []
    const result = field(row.numeric_value ?? row.value ?? row.text_value ?? row.boolean_value ?? row.date_value)
    if (result === null) return []
    return [{ value: result, unit: field(row.unit), currency: field(row.currency), scope: field(row.consolidation_scope ?? row.scope), start: field(row.period_start), end: field(row.period_end), type: field(row.period_type), source: field(row.source_record_id), published: field(row.published_at) }]
  })
  return <div className="retained-research-result">
    <p><strong>Result qualification:</strong> {retainedResultState(item).replaceAll("_", " ")}</p>
    {!observations.length ? <p>No interpretable retained observation. Complete retained source payload remains in the disclosure below.</p> : <details>
      <summary>Retained observations ({observations.length}) · {item.evidence_state.replaceAll("_", " ").toLowerCase()}</summary>
      <p>Source observations only. Each row keeps its own unit, period and scope; rows are not combined into a trend or score.</p>
      <div className="retained-result-table" tabIndex={0} role="region" aria-label="Retained observation values"><table><thead><tr><th>Source value</th><th>Unit / currency</th><th>Reporting period</th><th>Scope</th><th>Source / publication</th></tr></thead><tbody>{observations.map((row, index) => {
        const monetary = /CURRENCY|INR|CRORE|MILLION|BILLION/u.test(row.unit ?? "")
        const interpretable = row.unit && row.end && row.type && row.scope && (!monetary || row.currency)
        return <tr key={index}><td>{interpretable ? row.value : "Unavailable — incomplete value basis"}</td><td>{row.unit ?? "Unit unavailable"} / {row.currency ?? "Currency not supplied"}</td><td>{row.type ?? "Period type unavailable"} · {row.start ?? "Start not supplied"} → {row.end ?? "End unavailable"}</td><td>{row.scope ?? "Scope unavailable"}</td><td>{row.source ?? item.raw_source_record_id ?? "Source unavailable"} · {row.published ?? "Publication unavailable"}</td></tr>
      })}</tbody></table></div>
    </details>}
    <p>No numeric score or Core/Satellite recommendation is established by this retained result.</p>
  </div>
}
