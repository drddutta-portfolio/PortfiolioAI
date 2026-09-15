import { researchProfileUiContract, type ResearchSnapshotGroup } from "./researchProfileUiContract"

export type { ResearchSnapshotGroup }

/**
 * Backward-compatible helper used by the Research page. Presentation policy is
 * now owned by the resolved research-profile UI contract rather than page-local
 * stock/sector conditions.
 */
export function researchSnapshotGroups(profileCode: string | null | undefined): readonly ResearchSnapshotGroup[] {
  return researchProfileUiContract(profileCode).snapshotGroups
}
