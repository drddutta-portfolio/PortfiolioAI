import { useEffect, useMemo, useState } from "react"
import {
  loadDashboardDailyMarketSnapshots,
  loadDashboardMonitoringSettings,
  loadDashboardNewsFeed,
  loadLatestDashboardRecommendations,
  type DashboardDailyMarketSnapshot,
  type DashboardMonitoringSetting,
  type DashboardNewsFeedItem,
  type DashboardRecommendationEvidence,
} from "../../data/dashboardEvidenceRepository"
import { displayError } from "../../lib/displayError"

interface AsyncState<T> {
  readonly key: string
  readonly data: T
  readonly error: string | null
}

function securityKey(securityIds: readonly string[]) {
  return [...securityIds].sort().join(":")
}

export function useDashboardRecommendations(portfolioId: string | null, securityIds: readonly string[]) {
  const idsKey = useMemo(() => securityKey(securityIds), [securityIds])
  const key = `${portfolioId ?? ""}|${idsKey}`
  const [state, setState] = useState<AsyncState<ReadonlyMap<string, DashboardRecommendationEvidence>> | null>(null)

  useEffect(() => {
    let active = true
    if (!portfolioId || !securityIds.length) {
      setState({ key, data: new Map(), error: null })
      return () => { active = false }
    }
    void loadLatestDashboardRecommendations(portfolioId, securityIds)
      .then((data) => { if (active) setState({ key, data, error: null }) })
      .catch((reason: unknown) => { if (active) setState({ key, data: new Map(), error: displayError(reason) }) })
    return () => { active = false }
  }, [key, portfolioId, securityIds])

  return {
    data: state?.key === key ? state.data : new Map<string, DashboardRecommendationEvidence>(),
    error: state?.key === key ? state.error : null,
    isLoading: Boolean(portfolioId && securityIds.length) && state?.key !== key,
  }
}

export function useDashboardMonitoringSettings(portfolioId: string | null, securityIds: readonly string[]) {
  const idsKey = useMemo(() => securityKey(securityIds), [securityIds])
  const key = `${portfolioId ?? ""}|${idsKey}`
  const [state, setState] = useState<AsyncState<ReadonlyMap<string, DashboardMonitoringSetting>> | null>(null)

  useEffect(() => {
    let active = true
    if (!portfolioId || !securityIds.length) {
      setState({ key, data: new Map(), error: null })
      return () => { active = false }
    }
    void loadDashboardMonitoringSettings(portfolioId, securityIds)
      .then((data) => { if (active) setState({ key, data, error: null }) })
      .catch((reason: unknown) => { if (active) setState({ key, data: new Map(), error: displayError(reason) }) })
    return () => { active = false }
  }, [key, portfolioId, securityIds])

  return {
    data: state?.key === key ? state.data : new Map<string, DashboardMonitoringSetting>(),
    error: state?.key === key ? state.error : null,
    isLoading: Boolean(portfolioId && securityIds.length) && state?.key !== key,
  }
}

export function useDashboardDailyMarketSnapshots(securityIds: readonly string[]) {
  const key = useMemo(() => securityKey(securityIds), [securityIds])
  const [state, setState] = useState<AsyncState<ReadonlyMap<string, DashboardDailyMarketSnapshot>> | null>(null)

  useEffect(() => {
    let active = true
    if (!securityIds.length) {
      setState({ key, data: new Map(), error: null })
      return () => { active = false }
    }
    void loadDashboardDailyMarketSnapshots(securityIds)
      .then((data) => { if (active) setState({ key, data, error: null }) })
      .catch((reason: unknown) => { if (active) setState({ key, data: new Map(), error: displayError(reason) }) })
    return () => { active = false }
  }, [key, securityIds])

  return {
    data: state?.key === key ? state.data : new Map<string, DashboardDailyMarketSnapshot>(),
    error: state?.key === key ? state.error : null,
    isLoading: Boolean(securityIds.length) && state?.key !== key,
  }
}

export function useDashboardNewsFeed(portfolioId: string | null, limit: number) {
  const key = `${portfolioId ?? ""}|${limit}`
  const [state, setState] = useState<AsyncState<readonly DashboardNewsFeedItem[]> | null>(null)

  useEffect(() => {
    let active = true
    if (!portfolioId) {
      setState({ key, data: [], error: null })
      return () => { active = false }
    }
    void loadDashboardNewsFeed(portfolioId, limit)
      .then((data) => { if (active) setState({ key, data, error: null }) })
      .catch((reason: unknown) => { if (active) setState({ key, data: [], error: displayError(reason) }) })
    return () => { active = false }
  }, [key, limit, portfolioId])

  return {
    data: state?.key === key ? state.data : [],
    error: state?.key === key ? state.error : null,
    isLoading: Boolean(portfolioId) && state?.key !== key,
  }
}
