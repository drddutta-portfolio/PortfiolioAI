import { lazy, Suspense } from "react"
import { useParams } from "react-router-dom"

const SampleResearchPage = lazy(async () => ({ default: (await import("./ResearchPage")).ResearchPage }))
const ExistingResearchPage = lazy(async () => ({ default: (await import("./ExistingResearchPage")).ExistingResearchPage }))

// Temporary sample rollout; methodology and data remain selected by canonical contracts.
export function StockResearchRoute() {
  const { security } = useParams()
  const sample = security === "b47b007d-1990-4504-a5a2-4391c07687c5" || security?.toUpperCase() === "HDFCBANK"
  return <Suspense fallback={<p aria-live="polite">Loading security research…</p>}>
    {sample ? <div className="research-sample-shell"><SampleResearchPage /></div> : <ExistingResearchPage />}
  </Suspense>
}
