import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

const settingsDb = supabase as unknown as SupabaseClient

export type UserPortfolioRole = "CORE" | "SATELLITE" | "THEMATIC" | "ETF" | "OTHER"

export interface PositionDecisionSettings {
  readonly id: string | null
  readonly portfolioRole: UserPortfolioRole
  readonly targetWeight: string | null
  readonly targetPrice: string | null
  readonly stopLossPrice: string | null
  readonly investmentHorizon: string | null
  readonly targetPriceAlertEnabled: boolean
  readonly stopLossAlertEnabled: boolean
  readonly updatedAt: string | null
}

export interface PositionDecisionPatch {
  readonly portfolioRole: UserPortfolioRole
  readonly targetWeight: string | null
  readonly targetPrice: string | null
  readonly stopLossPrice: string | null
  readonly investmentHorizon: string | null
  readonly targetPriceAlertEnabled?: boolean
  readonly stopLossAlertEnabled?: boolean
}

function exact(value: unknown) {
  return typeof value === "number" || typeof value === "string" ? String(value) : null
}

function role(value: unknown): UserPortfolioRole {
  return value === "CORE" || value === "SATELLITE" || value === "THEMATIC" || value === "ETF" || value === "OTHER" ? value : "OTHER"
}

export async function loadPositionDecisionSettings(portfolioId: string, securityId: string): Promise<PositionDecisionSettings | null> {
  const result = await settingsDb
    .from("portfolio_security_settings")
    .select("id,portfolio_role,target_weight,target_price,stop_loss_price,investment_horizon,target_price_alert_enabled,stop_loss_alert_enabled,updated_at")
    .eq("portfolio_id", portfolioId)
    .eq("security_id", securityId)
    .maybeSingle()
  if (result.error) throw result.error
  if (!result.data) return null
  return {
    id: String(result.data.id),
    portfolioRole: role(result.data.portfolio_role),
    targetWeight: exact(result.data.target_weight),
    targetPrice: exact(result.data.target_price),
    stopLossPrice: exact(result.data.stop_loss_price),
    investmentHorizon: typeof result.data.investment_horizon === "string" ? result.data.investment_horizon : null,
    targetPriceAlertEnabled: result.data.target_price_alert_enabled !== false,
    stopLossAlertEnabled: result.data.stop_loss_alert_enabled !== false,
    updatedAt: typeof result.data.updated_at === "string" ? result.data.updated_at : null,
  }
}

export async function savePositionDecisionSettings(portfolioId: string, securityId: string, patch: PositionDecisionPatch): Promise<PositionDecisionSettings> {
  const payload = {
    portfolio_id: portfolioId,
    security_id: securityId,
    portfolio_role: patch.portfolioRole,
    target_weight: patch.targetWeight,
    target_price: patch.targetPrice,
    stop_loss_price: patch.stopLossPrice,
    investment_horizon: patch.investmentHorizon,
    target_price_alert_enabled: patch.targetPriceAlertEnabled ?? true,
    stop_loss_alert_enabled: patch.stopLossAlertEnabled ?? true,
    updated_at: new Date().toISOString(),
  }
  const result = await settingsDb
    .from("portfolio_security_settings")
    .upsert(payload, { onConflict: "portfolio_id,security_id" })
    .select("id,portfolio_role,target_weight,target_price,stop_loss_price,investment_horizon,target_price_alert_enabled,stop_loss_alert_enabled,updated_at")
    .single()
  if (result.error) throw result.error
  return {
    id: String(result.data.id),
    portfolioRole: role(result.data.portfolio_role),
    targetWeight: exact(result.data.target_weight),
    targetPrice: exact(result.data.target_price),
    stopLossPrice: exact(result.data.stop_loss_price),
    investmentHorizon: typeof result.data.investment_horizon === "string" ? result.data.investment_horizon : null,
    targetPriceAlertEnabled: result.data.target_price_alert_enabled !== false,
    stopLossAlertEnabled: result.data.stop_loss_alert_enabled !== false,
    updatedAt: typeof result.data.updated_at === "string" ? result.data.updated_at : null,
  }
}
