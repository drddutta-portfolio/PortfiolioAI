import { useEffect, useState } from "react"
import { loadPharmaV1ScoringSnapshot } from "../../data/pharmaScoringRepository"
import { loadSecurityScoringSnapshot } from "../../data/scoringRepository"
import { displayError } from "../../lib/displayError"
import { isPharmaScoringContext } from "./scoringProfileResolution"
import type { SecurityScoringSnapshot } from "./scoringTypes"

const scoringCache = new Map<string, SecurityScoringSnapshot>()
const scoringListeners = new Map<string, Set<(snapshot: SecurityScoringSnapshot) => void>>()

function snapshotRank(snapshot: SecurityScoringSnapshot) {
  const methodologyRank = snapshot.profileCode === "PHARMA_V1" ? 4 : snapshot.profileCode === "BANK_NBFC" ? 3 : 2
  const profileRank = snapshot.profileSource === "REVIEWED_ASSIGNMENT" ? 3 : snapshot.profileSource === "SECTOR_RULE" ? 2 : 1
  const overallRank = snapshot.overallScore === null ? 0 : 1
  return [methodologyRank, profileRank, overallRank, snapshot.scoreReadyCoverage ?? 0, snapshot.evidenceConfidence ?? 0] as const
}

function betterSnapshot(current: SecurityScoringSnapshot | undefined, incoming: SecurityScoringSnapshot) {
  if (!current) return incoming
  const currentRank = snapshotRank(current)
  const incomingRank = snapshotRank(incoming)
  for (let index = 0; index < currentRank.length; index += 1) {
    const incomingValue = incomingRank[index]
    const currentValue = currentRank[index]
    if (incomingValue === undefined || currentValue === undefined) continue
    if (incomingValue > currentValue) return incoming
    if (incomingValue < currentValue) return current
  }
  return incoming
}

function publishSnapshot(securityId: string, incoming: SecurityScoringSnapshot) {
  const selected = betterSnapshot(scoringCache.get(securityId), incoming)
  scoringCache.set(securityId, selected)
  for (const listener of scoringListeners.get(securityId) ?? []) listener(selected)
  return selected
}

function subscribe(securityId: string, listener: (snapshot: SecurityScoringSnapshot) => void) {
  const listeners = scoringListeners.get(securityId) ?? new Set<(snapshot: SecurityScoringSnapshot) => void>()
  listeners.add(listener)
  scoringListeners.set(securityId, listeners)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) scoringListeners.delete(securityId)
  }
}

export function useSecurityScoring(securityId: string | null, sector: string | null, industry: string | null) {
  const [data, setData] = useState<SecurityScoringSnapshot | null>(() => securityId ? scoringCache.get(securityId) ?? null : null)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    if (!securityId) return () => { active = false }

    const cached = scoringCache.get(securityId)
    if (cached) setData(cached)
    const unsubscribe = subscribe(securityId, (snapshot) => { if (active) setData(snapshot) })

    setError(null)
    const loader = isPharmaScoringContext(sector, industry)
      ? loadPharmaV1ScoringSnapshot(securityId)
      : loadSecurityScoringSnapshot(securityId, sector, industry)
    void loader
      .then((value) => { if (active) setData(publishSnapshot(securityId, value)) })
      .catch((reason: unknown) => { if (active) setError(displayError(reason)) })

    return () => { active = false; unsubscribe() }
  }, [securityId, sector, industry, revision])

  return {
    data,
    error,
    isLoading: Boolean(securityId) && !data && !error,
    reload: () => setRevision(value => value + 1),
  }
}
