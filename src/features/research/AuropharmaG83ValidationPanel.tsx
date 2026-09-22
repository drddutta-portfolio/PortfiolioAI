import { PHARMA_G8_3_PORTABILITY_VALIDATION } from "./pharmaG8PortabilityIsolationValidation"
import { PHARMA_G8_RESEARCH_GAP_REGISTER } from "./pharmaG8ResearchGapRegister"

export function AuropharmaG83ValidationPanel({ symbol }: { readonly symbol: string }) {
  if (symbol.toLocaleUpperCase() !== "AUROPHARMA") return null

  const validation = PHARMA_G8_3_PORTABILITY_VALIDATION

  return <section className="pharma-persistence-package" aria-labelledby="auropharma-g8-3-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">G8.3 · Portability / isolation / leakage validation</p>
        <h3 id="auropharma-g8-3-title">Second-company portability checkpoint</h3>
        <p>The same PHARMA_V1 architecture is tested across TORNTPHARM and AUROPHARMA for cross-company, cross-role and shared-state isolation. Missing methodology is registered rather than repaired inside G8.</p>
      </div>
      <span className="pharma-workspace-lock">Owner validation pending</span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>Isolation / leakage tests</span>
        <strong>{validation.passCount}/{validation.totalCount} PASS</strong>
        <small>All locked G8.3 invariants</small>
      </div>
      <div>
        <span>Engine-change test</span>
        <strong>No material redesign</strong>
        <small>Same G7.1 adapter across both companies</small>
      </div>
      <div>
        <span>AUROPHARMA research gaps</span>
        <strong>{PHARMA_G8_RESEARCH_GAP_REGISTER.auropharmaGaps.length}</strong>
        <small>Registered for controlled follow-up</small>
      </div>
      <div>
        <span>Activation</span>
        <strong>OFF</strong>
        <small>No persistence / recommendation / sizing</small>
      </div>
    </div>

    <div className="pharma-persistence-package-grid">
      {validation.cases.map((item) => <article key={item.id}>
        <strong>{item.id} · {item.label}</strong>
        <small>PASS</small>
        <p>{item.evidence}</p>
      </article>)}
    </div>

    <p className="pharma-evidence-pilot-note"><strong>G8 closure candidate:</strong> portability is validated without redesigning G7.1. G8 remains NOT ACTIVE and cannot close until owner visual approval and the required post-visual full local validation are recorded.</p>
  </section>
}
