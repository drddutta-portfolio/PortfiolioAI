import { supabase } from "../lib/supabase"

export interface DashboardRecommendationEvidence {
  readonly securityId: string
  readonly overallScore: string | null
  readonly scoreReadyCoverage: string | null
  readonly evidenceConfidence: string | null
  readonly suggestedRole: string | null
  readonly actionBias: string | null
  readonly currentUserRole: string | null
  readonly changeSignal: string | null
  readonly transitionStatus: string | null
  readonly persistenceCount: number | null
  readonly createdAt: string
}

export interface DashboardMonitoringSetting {
  readonly securityId: string
  readonly targetPrice: string | null
  readonly stopLossPrice: string | null
  readonly targetPriceAlertEnabled: boolean | null
  readonly stopLossAlertEnabled: boolean | null
}

export interface DashboardDailyMarketSnapshot {
  readonly securityId: string
  readonly price: string
  readonly previousClose: string | null
  readonly priceTimestamp: string | null
  readonly retrievedAt: string
  readonly marketSessionStatus: string
}

export interface DashboardNewsFeedItem {
  readonly newsItemId: string
  readonly securityId: string
  readonly symbol: string
  readonly companyName: string
  readonly headline: string
  readonly category: string
  readonly importanceState: string
  readonly toneState: string
  readonly publishedAt: string | null
  readonly sourceName: string
  readonly sourceUrl: string
}

function exact(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value)
  return null
}

export async function loadLatestDashboardRecommendations(
  portfolioId: string,
  securityIds: readonly string[],
): Promise<ReadonlyMap<string, DashboardRecommendationEvidence>> {
  if (!securityIds.length) return new Map()
  const result = await supabase
    .from("stock_recommendation_runs")
    .select("security_id,overall_score,score_ready_coverage,evidence_confidence,suggested_role,action_bias,current_user_role,change_signal,transition_status,persistence_count,created_at")
    .eq("portfolio_id", portfolioId)
    .in("security_id", [...securityIds])
    .order("created_at", { ascending: false })
  if (result.error) throw result.error

  const latest = new Map<string, DashboardRecommendationEvidence>()
  for (const row of result.data ?? []) {
    if (latest.has(row.security_id)) continue
    latest.set(row.security_id, {
      securityId: row.security_id,
      overallScore: exact(row.overall_score),
      scoreReadyCoverage: exact(row.score_ready_coverage),
      evidenceConfidence: exact(row.evidence_confidence),
      suggestedRole: row.suggested_role,
      actionBias: row.action_bias,
      currentUserRole: row.current_user_role,
      changeSignal: row.change_signal,
      transitionStatus: row.transition_status,
      persistenceCount: row.persistence_count,
      createdAt: row.created_at,
    })
  }
  return latest
}

export async function loadDashboardMonitoringSettings(
  portfolioId: string,
  securityIds: readonly string[],
): Promise<ReadonlyMap<string, DashboardMonitoringSetting>> {
  if (!securityIds.length) return new Map()
  const result = await supabase
    .from("portfolio_security_settings")
    .select("security_id,target_price,stop_loss_price,target_price_alert_enabled,stop_loss_alert_enabled")
    .eq("portfolio_id", portfolioId)
    .in("security_id", [...securityIds])
  if (result.error) throw result.error

  return new Map((result.data ?? []).map((row) => [row.security_id, {
    securityId: row.security_id,
    targetPrice: exact(row.target_price),
    stopLossPrice: exact(row.stop_loss_price),
    targetPriceAlertEnabled: row.target_price_alert_enabled,
    stopLossAlertEnabled: row.stop_loss_alert_enabled,
  }]))
}

export async function loadDashboardDailyMarketSnapshots(
  securityIds: readonly string[],
): Promise<ReadonlyMap<string, DashboardDailyMarketSnapshot>> {
  if (!securityIds.length) return new Map()
  const result = await supabase
    .from("market_price_latest")
    .select("security_id,price,previous_close,price_timestamp,retrieved_at,market_session_status")
    .eq("provider_code", "ANGEL_ONE")
    .in("security_id", [...securityIds])
  if (result.error) throw result.error

  const rows = new Map<string, DashboardDailyMarketSnapshot>()
  for (const row of result.data ?? []) {
    const price = exact(row.price)
    if (price === null) continue
    rows.set(row.security_id, {
      securityId: row.security_id,
      price,
      previousClose: exact(row.previous_close),
      priceTimestamp: row.price_timestamp,
      retrievedAt: row.retrieved_at,
      marketSessionStatus: row.market_session_status,
    })
  }
  return rows
}

export async function loadDashboardNewsFeed(
  portfolioId: string,
  limit: number,
): Promise<readonly DashboardNewsFeedItem[]> {
  const result = await supabase.rpc("get_portfolio_news_feed_v2", {
    p_portfolio_id: portfolioId,
    p_security_ids: null,
    p_limit: limit,
    p_before: null,
  })
  if (result.error) throw result.error
  if (!Array.isArray(result.data)) return []

  return result.data.map((raw) => {
    const row = raw as Record<string, unknown>
    return {
      newsItemId: String(row.news_item_id ?? ""),
      securityId: String(row.security_id ?? ""),
      symbol: String(row.symbol ?? ""),
      companyName: String(row.company_name ?? ""),
      headline: String(row.headline ?? ""),
      category: String(row.category ?? "UNCLASSIFIED"),
      importanceState: String(row.importance_state ?? "UNCLASSIFIED"),
      toneState: String(row.tone_state ?? "UNCLASSIFIED"),
      publishedAt: typeof row.published_at === "string" ? row.published_at : null,
      sourceName: String(row.source_name ?? "NSE"),
      sourceUrl: String(row.source_url ?? ""),
    }
  })
}
