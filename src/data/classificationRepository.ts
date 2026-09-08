import type { AssignableRole, ValidatedPositionSettings } from "../features/portfolio/positionSettings"
import { supabase } from "../lib/supabase"

const numeric = (value: string | null) => value as unknown as number

function pendingClassificationSchema(error: { readonly code?: string } | null) {
  return error !== null && (error.code === "PGRST205" || error.code === "PGRST202" || error.code === "42883")
}

export interface SavePositionSettingsInput extends ValidatedPositionSettings {
  readonly portfolioId: string
  readonly securityId: string
  readonly themeIds: readonly string[]
}

export async function savePositionSettings(input: SavePositionSettingsInput) {
  const settings = await supabase.from("portfolio_security_settings").upsert({
    portfolio_id: input.portfolioId,
    security_id: input.securityId,
    portfolio_role: input.portfolioRole,
    target_weight: numeric(input.targetWeight),
    minimum_weight: numeric(input.minimumWeight),
    maximum_weight: numeric(input.maximumWeight),
    priority: input.priority,
    is_watchlisted: input.isWatchlisted,
    is_frozen: input.isFrozen,
    investment_horizon: input.investmentHorizon,
    notes: input.notes,
  }, { onConflict: "portfolio_id,security_id" })
  if (settings.error) throw settings.error

  const existing = await supabase.from("theme_securities").select("id,theme_id").eq("portfolio_id", input.portfolioId).eq("security_id", input.securityId)
  if (existing.error) throw existing.error
  const wanted = new Set(input.themeIds)
  const removeIds = (existing.data ?? []).filter((membership) => !wanted.has(membership.theme_id)).map((membership) => membership.id)
  if (removeIds.length) {
    const removed = await supabase.from("theme_securities").delete().in("id", removeIds)
    if (removed.error) throw removed.error
  }
  const existingThemeIds = new Set((existing.data ?? []).map((membership) => membership.theme_id))
  const additions = input.themeIds.filter((themeId) => !existingThemeIds.has(themeId)).map((themeId) => ({
    portfolio_id: input.portfolioId,
    security_id: input.securityId,
    theme_id: themeId,
  }))
  if (additions.length) {
    const added = await supabase.from("theme_securities").insert(additions)
    if (added.error) throw added.error
  }
}

export interface SaveThemeInput {
  readonly id?: string
  readonly portfolioId: string
  readonly name: string
  readonly description: string | null
  readonly maxAllocation: string | null
  readonly priority: number | null
  readonly isActive: boolean
}

export async function saveTheme(input: SaveThemeInput) {
  const values = {
    portfolio_id: input.portfolioId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    max_allocation: numeric(input.maxAllocation),
    priority: input.priority,
    is_active: input.isActive,
  }
  const result = input.id
    ? await supabase.from("themes").update(values).eq("id", input.id).eq("portfolio_id", input.portfolioId)
    : await supabase.from("themes").insert(values)
  if (result.error) throw result.error
}

export async function assignRole(portfolioId: string, securityId: string, portfolioRole: AssignableRole) {
  const result = await supabase.from("portfolio_security_settings").upsert({ portfolio_id: portfolioId, security_id: securityId, portfolio_role: portfolioRole }, { onConflict: "portfolio_id,security_id" })
  if (result.error) throw result.error
}

export async function saveThemeMemberships(portfolioId: string, themeId: string, securityIds: readonly string[]) {
  const existing = await supabase.from("theme_securities").select("id,security_id").eq("portfolio_id", portfolioId).eq("theme_id", themeId)
  if (existing.error) throw existing.error
  const wanted = new Set(securityIds)
  const removeIds = (existing.data ?? []).filter((membership) => !wanted.has(membership.security_id)).map((membership) => membership.id)
  if (removeIds.length) {
    const removed = await supabase.from("theme_securities").delete().in("id", removeIds)
    if (removed.error) throw removed.error
  }
  const existingIds = new Set((existing.data ?? []).map((membership) => membership.security_id))
  const additions = securityIds.filter((securityId) => !existingIds.has(securityId)).map((securityId) => ({ portfolio_id: portfolioId, theme_id: themeId, security_id: securityId }))
  if (additions.length) {
    const added = await supabase.from("theme_securities").insert(additions)
    if (added.error) throw added.error
  }
}

export async function requestSecurityClassificationCorrection(input: { readonly portfolioId: string; readonly securityId: string; readonly assetClass: string; readonly instrumentType: string; readonly reason: string; readonly evidenceReference: string }) {
  const user = await supabase.auth.getUser()
  if (user.error || !user.data.user) throw user.error ?? new Error("Authentication is required.")
  const result = await supabase.from("security_classification_correction_requests").insert({ portfolio_id: input.portfolioId, security_id: input.securityId,
    requested_by: user.data.user.id, proposed_asset_class: input.assetClass, proposed_instrument_type: input.instrumentType,
    reason: input.reason.trim(), evidence_reference: input.evidenceReference.trim() })
  if (pendingClassificationSchema(result.error)) throw new Error("Security-classification correction requests are available after the latest database migration is deployed.")
  if (result.error) throw result.error
}
