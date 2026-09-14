import { PharmaResearchReadinessPanel } from "./PharmaResearchReadinessPanel"
import type { SecurityResearch } from "./types"

export function ProfileResearchReadinessPanel({ profileCode, research }: {
  readonly profileCode: string
  readonly research: SecurityResearch
}) {
  if (profileCode === "PHARMA_V1") return <PharmaResearchReadinessPanel research={research} />
  return null
}
