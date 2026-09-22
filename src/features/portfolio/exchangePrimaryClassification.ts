export const EXCHANGE_PRIMARY_CLASSIFICATION_VERSION = "EXCHANGE_PRIMARY_CLASSIFICATION_V1" as const

export type ExchangeClassificationExchange = "NSE" | "BSE"

export type ExchangeClassificationEvidenceState =
  | "AVAILABLE"
  | "STALE"
  | "CONFLICTING"
  | "REJECTED"

export interface ExchangeClassificationObservation {
  readonly exchange: ExchangeClassificationExchange
  readonly symbol: string
  readonly isin: string | null
  readonly macroEconomicSector: string | null
  readonly sector: string | null
  readonly industry: string | null
  readonly basicIndustry: string | null
  readonly observedAt: string | null
  readonly retrievedAt: string
  readonly sourceUrl: string
  readonly evidenceState: ExchangeClassificationEvidenceState
}

export type ExchangePrimaryClassificationState =
  | "RESOLVED"
  | "MISSING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type ExchangeClassificationDetailState =
  | "RESOLVED"
  | "PARTIAL"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type ExchangePrimaryClassificationBasis =
  | "ASSET_CLASS_NOT_OPERATING_EQUITY"
  | "NO_OFFICIAL_EXCHANGE_EVIDENCE"
  | "SINGLE_OFFICIAL_EXCHANGE"
  | "NSE_BSE_AGREE"
  | "NSE_BSE_SECTOR_CONFLICT"
  | "OFFICIAL_EVIDENCE_CONFLICTING"

export interface ExchangePrimaryClassificationResult {
  readonly version: typeof EXCHANGE_PRIMARY_CLASSIFICATION_VERSION
  readonly state: ExchangePrimaryClassificationState
  readonly detailState: ExchangeClassificationDetailState
  readonly primarySector: string | null
  readonly primaryIndustry: string | null
  readonly primaryBasicIndustry: string | null
  readonly macroEconomicSector: string | null
  readonly basis: ExchangePrimaryClassificationBasis
  readonly reasonCode: string
  readonly authoritativeExchanges: readonly ExchangeClassificationExchange[]
  readonly selectedObservation: ExchangeClassificationObservation | null
  readonly reviewObservations: readonly ExchangeClassificationObservation[]
}

export interface ExchangePrimaryClassificationInput {
  readonly assetClass: string
  readonly instrumentType?: string | null
  readonly symbol: string
  readonly observations: readonly ExchangeClassificationObservation[]
}

export type NewStockClassificationIntakeState =
  | "CLASSIFICATION_READY"
  | "AWAITING_OFFICIAL_EXCHANGE_CLASSIFICATION"
  | "CLASSIFICATION_REVIEW_REQUIRED"
  | "COMPANY_SECTOR_NOT_APPLICABLE"

export interface NewStockClassificationIntake {
  readonly symbol: string
  readonly state: NewStockClassificationIntakeState
  readonly primarySector: string | null
  readonly primaryIndustry: string | null
  readonly reasonCode: string
  readonly researchRoutingAllowed: boolean
}

function normalized(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
}

function timestamp(observation: ExchangeClassificationObservation) {
  const raw = observation.observedAt ?? observation.retrievedAt
  const value = Date.parse(raw)
  return Number.isFinite(value) ? value : 0
}

function latestByExchange(observations: readonly ExchangeClassificationObservation[]) {
  const latest = new Map<ExchangeClassificationExchange, ExchangeClassificationObservation>()
  for (const observation of observations) {
    if (observation.evidenceState === "REJECTED") continue
    const existing = latest.get(observation.exchange)
    if (!existing || timestamp(observation) > timestamp(existing)) latest.set(observation.exchange, observation)
  }
  return latest
}

function isOperatingCompanyEquity(assetClass: string, instrumentType: string | null | undefined) {
  const asset = normalized(assetClass)
  const instrument = normalized(instrumentType ?? null)
  if (asset !== "EQUITY") return false
  if (instrument.includes("ETF") || instrument.includes("MUTUAL_FUND") || instrument.includes("INDEX_FUND")) return false
  if (instrument.includes("REIT") || instrument.includes("INVIT")) return false
  return true
}

function richness(observation: ExchangeClassificationObservation) {
  return [
    observation.macroEconomicSector,
    observation.sector,
    observation.industry,
    observation.basicIndustry,
  ].filter((value) => Boolean(value?.trim())).length
}

function preferredObservation(
  nse: ExchangeClassificationObservation | undefined,
  bse: ExchangeClassificationObservation | undefined,
) {
  if (nse && bse) return richness(nse) >= richness(bse) ? nse : bse
  return nse ?? bse ?? null
}

function detailState(
  nse: ExchangeClassificationObservation | undefined,
  bse: ExchangeClassificationObservation | undefined,
): ExchangeClassificationDetailState {
  if (!nse && !bse) return "PARTIAL"
  if (!nse || !bse) {
    const one = nse ?? bse
    return one?.industry && one.basicIndustry ? "RESOLVED" : "PARTIAL"
  }

  const industryA = normalized(nse.industry)
  const industryB = normalized(bse.industry)
  const basicA = normalized(nse.basicIndustry)
  const basicB = normalized(bse.basicIndustry)

  if (industryA && industryB && industryA !== industryB) return "REVIEW_REQUIRED"
  if (basicA && basicB && basicA !== basicB) return "REVIEW_REQUIRED"
  if ((industryA || industryB) && (basicA || basicB)) return "RESOLVED"
  return "PARTIAL"
}

/**
 * Resolves one canonical primary exchange sector without changing the evidence.
 *
 * Official exchange evidence owns the primary classification. Secondary business
 * exposures belong to later research-subprofile/overlay logic and never create a
 * second application sector.
 *
 * The resolver is deliberately network-free. Exchange evidence must already have
 * been captured and reviewed through PortfolioAI's canonical evidence layer.
 */
export function resolveExchangePrimaryClassification(
  input: ExchangePrimaryClassificationInput,
): ExchangePrimaryClassificationResult {
  if (!isOperatingCompanyEquity(input.assetClass, input.instrumentType)) {
    return {
      version: EXCHANGE_PRIMARY_CLASSIFICATION_VERSION,
      state: "NOT_APPLICABLE",
      detailState: "NOT_APPLICABLE",
      primarySector: null,
      primaryIndustry: null,
      primaryBasicIndustry: null,
      macroEconomicSector: null,
      basis: "ASSET_CLASS_NOT_OPERATING_EQUITY",
      reasonCode: "OPERATING_COMPANY_SECTOR_NOT_APPLICABLE",
      authoritativeExchanges: [],
      selectedObservation: null,
      reviewObservations: [],
    }
  }

  const latest = latestByExchange(input.observations)
  const nse = latest.get("NSE")
  const bse = latest.get("BSE")
  const available = [nse, bse].filter((item): item is ExchangeClassificationObservation => Boolean(item))

  if (available.length === 0 || available.every((item) => !item.sector?.trim())) {
    return {
      version: EXCHANGE_PRIMARY_CLASSIFICATION_VERSION,
      state: "MISSING",
      detailState: "PARTIAL",
      primarySector: null,
      primaryIndustry: null,
      primaryBasicIndustry: null,
      macroEconomicSector: null,
      basis: "NO_OFFICIAL_EXCHANGE_EVIDENCE",
      reasonCode: "OFFICIAL_EXCHANGE_PRIMARY_SECTOR_MISSING",
      authoritativeExchanges: [],
      selectedObservation: null,
      reviewObservations: [],
    }
  }

  if (available.some((item) => item.evidenceState === "CONFLICTING")) {
    return {
      version: EXCHANGE_PRIMARY_CLASSIFICATION_VERSION,
      state: "REVIEW_REQUIRED",
      detailState: "REVIEW_REQUIRED",
      primarySector: null,
      primaryIndustry: null,
      primaryBasicIndustry: null,
      macroEconomicSector: null,
      basis: "OFFICIAL_EVIDENCE_CONFLICTING",
      reasonCode: "OFFICIAL_EXCHANGE_EVIDENCE_CONFLICTING",
      authoritativeExchanges: available.map((item) => item.exchange),
      selectedObservation: null,
      reviewObservations: available,
    }
  }

  if (nse?.sector && bse?.sector && normalized(nse.sector) !== normalized(bse.sector)) {
    return {
      version: EXCHANGE_PRIMARY_CLASSIFICATION_VERSION,
      state: "REVIEW_REQUIRED",
      detailState: "REVIEW_REQUIRED",
      primarySector: null,
      primaryIndustry: null,
      primaryBasicIndustry: null,
      macroEconomicSector: null,
      basis: "NSE_BSE_SECTOR_CONFLICT",
      reasonCode: "NSE_BSE_PRIMARY_SECTOR_DISAGREEMENT",
      authoritativeExchanges: ["NSE", "BSE"],
      selectedObservation: null,
      reviewObservations: [nse, bse],
    }
  }

  const selected = preferredObservation(nse, bse)
  if (!selected?.sector?.trim()) {
    return {
      version: EXCHANGE_PRIMARY_CLASSIFICATION_VERSION,
      state: "MISSING",
      detailState: "PARTIAL",
      primarySector: null,
      primaryIndustry: null,
      primaryBasicIndustry: null,
      macroEconomicSector: null,
      basis: "NO_OFFICIAL_EXCHANGE_EVIDENCE",
      reasonCode: "OFFICIAL_EXCHANGE_PRIMARY_SECTOR_MISSING",
      authoritativeExchanges: available.map((item) => item.exchange),
      selectedObservation: null,
      reviewObservations: available,
    }
  }

  const exchanges = available.map((item) => item.exchange)
  const details = detailState(nse, bse)
  return {
    version: EXCHANGE_PRIMARY_CLASSIFICATION_VERSION,
    state: "RESOLVED",
    detailState: details,
    primarySector: selected.sector.trim(),
    primaryIndustry: selected.industry?.trim() || (nse?.industry?.trim() ?? bse?.industry?.trim() ?? null),
    primaryBasicIndustry: selected.basicIndustry?.trim() || (nse?.basicIndustry?.trim() ?? bse?.basicIndustry?.trim() ?? null),
    macroEconomicSector: selected.macroEconomicSector?.trim() || (nse?.macroEconomicSector?.trim() ?? bse?.macroEconomicSector?.trim() ?? null),
    basis: nse && bse ? "NSE_BSE_AGREE" : "SINGLE_OFFICIAL_EXCHANGE",
    reasonCode: details === "REVIEW_REQUIRED"
      ? "PRIMARY_SECTOR_RESOLVED_DETAIL_REVIEW_REQUIRED"
      : nse && bse
        ? "NSE_BSE_PRIMARY_SECTOR_AGREEMENT"
        : "SINGLE_OFFICIAL_EXCHANGE_PRIMARY_SECTOR",
    authoritativeExchanges: exchanges,
    selectedObservation: selected,
    reviewObservations: details === "REVIEW_REQUIRED" ? available : [],
  }
}

/**
 * New-stock intake contract used when a security first enters PortfolioAI.
 *
 * A new operating-company equity does not inherit a sector from its name, theme,
 * peer or nearest methodology. Research routing remains blocked until official
 * exchange classification evidence resolves its primary sector.
 */
export function buildNewStockClassificationIntake(
  input: ExchangePrimaryClassificationInput,
): NewStockClassificationIntake {
  const resolved = resolveExchangePrimaryClassification(input)

  if (resolved.state === "NOT_APPLICABLE") {
    return {
      symbol: input.symbol,
      state: "COMPANY_SECTOR_NOT_APPLICABLE",
      primarySector: null,
      primaryIndustry: null,
      reasonCode: resolved.reasonCode,
      researchRoutingAllowed: false,
    }
  }

  if (resolved.state === "MISSING") {
    return {
      symbol: input.symbol,
      state: "AWAITING_OFFICIAL_EXCHANGE_CLASSIFICATION",
      primarySector: null,
      primaryIndustry: null,
      reasonCode: resolved.reasonCode,
      researchRoutingAllowed: false,
    }
  }

  if (resolved.state === "REVIEW_REQUIRED") {
    return {
      symbol: input.symbol,
      state: "CLASSIFICATION_REVIEW_REQUIRED",
      primarySector: null,
      primaryIndustry: null,
      reasonCode: resolved.reasonCode,
      researchRoutingAllowed: false,
    }
  }

  return {
    symbol: input.symbol,
    state: resolved.detailState === "REVIEW_REQUIRED" ? "CLASSIFICATION_REVIEW_REQUIRED" : "CLASSIFICATION_READY",
    primarySector: resolved.primarySector,
    primaryIndustry: resolved.primaryIndustry,
    reasonCode: resolved.reasonCode,
    researchRoutingAllowed: resolved.detailState !== "REVIEW_REQUIRED",
  }
}
