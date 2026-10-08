import { useEffect, useState } from "react"
import { loadSecurityScoringSnapshot } from "../../data/scoringRepository"
import { displayError } from "../../lib/displayError"
import type { P7CurrentEvidenceSnapshot } from "../../data/p7CurrentIntelligenceRepository"
import type { SecurityScoringSnapshot } from "./scoringTypes"

const scoringCache = new Map<string, SecurityScoringSnapshot>()
const scoringListeners = new Map<string, Set<(snapshot: SecurityScoringSnapshot) => void>>()

function snapshotRank(snapshot: SecurityScoringSnapshot) {
  const methodologyRank = snapshot.methodologyState && snapshot.methodologyState !== "AVAILABLE" ? 0 : snapshot.profileCode === "PHARMA_V1" ? 4 : snapshot.profileCode === "BANK_NBFC" ? 3 : 2
  const profileRank = snapshot.profileSource === "REVIEWED_ASSIGNMENT" ? 3 : snapshot.profileSource === "SECTOR_RULE" ? 2 : 1
  const overallRank = snapshot.overallScore === null ? 0 : 1
  return [methodologyRank, profileRank, overallRank, snapshot.scoreReadyCoverage ?? 0, snapshot.evidenceConfidence ?? 0] as const
}

function betterSnapshot(current: SecurityScoringSnapshot | undefined, incoming: SecurityScoringSnapshot) {
  if (!current) return incoming
  // Fresh canonical blocked/review states must replace any older numeric preview.
  if (incoming.canonicalRoute || incoming.routeState) return incoming
  if (incoming.methodologyState && incoming.methodologyState !== "AVAILABLE") return incoming
  if (current.methodologyState && current.methodologyState !== "AVAILABLE") return incoming
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

export function useSecurityScoring(securityId: string | null, sector: string | null, industry: string | null, portfolioId: string | null, assetClass: string | null, selection?: { readonly snapshot: P7CurrentEvidenceSnapshot | null; readonly revision?: number; readonly isLoading: boolean; readonly error: string | null }) {
  const selectedSnapshot = selection?.snapshot
  const selectionRevision = selection?.revision
  const selectionLoading = selection?.isLoading ?? false
  const selectionError = selection?.error ?? null
  const cacheKey = securityId && portfolioId && assetClass ? `${portfolioId}:${securityId}:${assetClass}${selection ? `:${selectedSnapshot?.snapshotId ?? "no-snapshot"}` : ""}` : null
  const [loaded, setLoaded] = useState<{ key: string | null; revision: number; selectedSnapshot?: P7CurrentEvidenceSnapshot | null; selectionRevision?: number; data: SecurityScoringSnapshot | null; error: string | null }>({ key: null, revision: 0, data: null, error: null })
  const [revision, setRevision] = useState(0)
  const current = !selectionLoading && !selectionError && loaded.key === cacheKey && loaded.revision === revision && loaded.selectedSnapshot === selectedSnapshot && loaded.selectionRevision === selectionRevision
  const data = current ? loaded.data : null
  const error = selectionError ?? (current ? loaded.error : null)

  useEffect(() => {
    let active = true
    if (selectionLoading || selectionError || !securityId || !portfolioId || !assetClass || !cacheKey) return () => { active = false }

    const unsubscribe = subscribe(cacheKey, (snapshot) => { if (active) setLoaded({ key: cacheKey, revision, selectedSnapshot, selectionRevision, data: snapshot, error: null }) })

    const loader = loadSecurityScoringSnapshot(securityId, sector, industry, { portfolioId, assetClass, ...(selectedSnapshot === undefined ? {} : { selectedSnapshot }) })
    void loader
      .then((value) => { if (active) setLoaded({ key: cacheKey, revision, selectedSnapshot, selectionRevision, data: publishSnapshot(cacheKey, value), error: null }) })
      .catch((reason: unknown) => { if (active) setLoaded({ key: cacheKey, revision, selectedSnapshot, selectionRevision, data: null, error: displayError(reason) }) })

    return () => { active = false; unsubscribe() }
  }, [securityId, sector, industry, portfolioId, assetClass, cacheKey, revision, selectedSnapshot, selectionLoading, selectionError, selectionRevision])

  return {
    data,
    error,
    isLoading: Boolean(cacheKey) && !data && !error,
    reload: () => setRevision(value => value + 1),
  }
}
