import { PHARMA_SUBPROFILE_CODES, type PharmaSubprofileCode } from "./pharmaSubprofileAssignment"
import type { SecurityScoringSnapshot } from "./scoringTypes"

/** Presentation consumes the resolved canonical route; it never resolves from labels or legacy rows. */
export function canonicalPharmaPrimary(snapshot: SecurityScoringSnapshot | null): PharmaSubprofileCode | null {
  const route = snapshot?.canonicalRoute
  if (snapshot?.routeState !== "RESOLVED" || !route || route.profileCode !== "PHARMA") return null
  return PHARMA_SUBPROFILE_CODES.find(code => code === route.subprofileCode) ?? null
}
