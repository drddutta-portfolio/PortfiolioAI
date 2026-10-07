import { lazy, Suspense } from "react"
import { useParams } from "react-router-dom"

const ResearchPage = lazy(async () => ({ default: (await import("./ResearchPage")).ResearchPage }))

// Identity selects canonical data; every stock uses the same presentation shell.
export function StockResearchRoute() {
  const { security } = useParams()
  return <div className="research-workspace-shell"><Suspense fallback={<p aria-live="polite">Loading security research…</p>}>
    <ResearchPage key={security} />
  </Suspense></div>
}
