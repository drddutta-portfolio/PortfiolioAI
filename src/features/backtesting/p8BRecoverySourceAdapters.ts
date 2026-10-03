export type RecoveryExchange = "NSE" | "BSE"

export interface P8HistoricalAlias {
  readonly historicalIdentityId: string
  readonly historicalIsin: string
  readonly exchange: RecoveryExchange
  readonly symbol: string
  readonly companyName: string
  readonly validFrom: string
  readonly validTo: string | null
}

export interface P8OfficialFilingMetadata {
  readonly exchange: RecoveryExchange
  readonly filingReference: string
  readonly isin: string | null
  readonly symbol: string | null
  readonly companyName: string | null
  readonly filingType:
    | "FINANCIAL_RESULT"
    | "INTEGRATED_FINANCIAL"
    | "ANNUAL_REPORT"
    | "RHP_INFORMATION_MEMORANDUM"
    | "CORPORATE_ANNOUNCEMENT"
  readonly periodEnded: string | null
  readonly disseminatedAt: string | null
  readonly revisedAt: string | null
  readonly revisionState: "ORIGINAL" | "REVISED" | "UNKNOWN"
  readonly hasStructuredFinancials: boolean
  readonly hasClassificationEvidence: boolean
}

export interface P8B2EligiblePair {
  readonly historicalIdentityId: string
  readonly decisionAt: string
}

export type IdentityResolution =
  | { readonly state: "EXACT_ISIN"; readonly historicalIdentityId: string }
  | { readonly state: "DATED_NSE_SYMBOL_NAME"; readonly historicalIdentityId: string }
  | { readonly state: "BSE_ISIN_FALLBACK"; readonly historicalIdentityId: string }
  | { readonly state: "UNRESOLVED" }

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, " ").replace(/\s+/g, " ").trim()
}

function inAliasInterval(alias: P8HistoricalAlias, at: string): boolean {
  const t = Date.parse(at)
  const from = Date.parse(alias.validFrom)
  const to = alias.validTo === null ? Number.POSITIVE_INFINITY : Date.parse(alias.validTo)
  if (![t, from, to].every((value) => Number.isFinite(value) || value === Number.POSITIVE_INFINITY)) {
    throw new Error("historical alias interval contains an invalid timestamp")
  }
  return t >= from && t < to
}

export function resolveNseFilingIdentity(
  aliases: readonly P8HistoricalAlias[],
  filing: P8OfficialFilingMetadata,
): IdentityResolution {
  if (filing.exchange !== "NSE") throw new Error("NSE adapter accepts NSE metadata only")

  const isin = normalizeText(filing.isin)
  if (isin) {
    const exact = aliases.filter((alias) => normalizeText(alias.historicalIsin) === isin)
    if (exact.length === 1) return { state: "EXACT_ISIN", historicalIdentityId: exact[0]!.historicalIdentityId }
    return { state: "UNRESOLVED" }
  }

  if (!filing.disseminatedAt) return { state: "UNRESOLVED" }
  const symbol = normalizeText(filing.symbol)
  const name = normalizeText(filing.companyName)
  if (!symbol || !name) return { state: "UNRESOLVED" }

  const dated = aliases.filter(
    (alias) =>
      alias.exchange === "NSE" &&
      inAliasInterval(alias, filing.disseminatedAt!) &&
      normalizeText(alias.symbol) === symbol &&
      normalizeText(alias.companyName) === name,
  )
  return dated.length === 1
    ? { state: "DATED_NSE_SYMBOL_NAME", historicalIdentityId: dated[0]!.historicalIdentityId }
    : { state: "UNRESOLVED" }
}

export function resolveBseFallbackIdentity(
  aliases: readonly P8HistoricalAlias[],
  filing: P8OfficialFilingMetadata,
): IdentityResolution {
  if (filing.exchange !== "BSE") throw new Error("BSE fallback adapter accepts BSE metadata only")
  const isin = normalizeText(filing.isin)
  if (!isin) return { state: "UNRESOLVED" }

  const exact = aliases.filter((alias) => normalizeText(alias.historicalIsin) === isin)
  return exact.length === 1
    ? { state: "BSE_ISIN_FALLBACK", historicalIdentityId: exact[0]!.historicalIdentityId }
    : { state: "UNRESOLVED" }
}

export function filingIsStrictlyBeforeDecision(
  filing: P8OfficialFilingMetadata,
  decisionAt: string,
): boolean {
  if (!filing.disseminatedAt) return false
  const dissemination = Date.parse(filing.disseminatedAt)
  const decision = Date.parse(decisionAt)
  if (!Number.isFinite(dissemination) || !Number.isFinite(decision)) return false
  return dissemination < decision
}

export interface P8MetadataFeasibilityCensus {
  readonly version: "P8_B_RECOVERY_METADATA_CENSUS_V1"
  readonly eligiblePairs: number
  readonly nseMetadataResolvablePairs: number
  readonly bseFallbackResolvablePairs: number
  readonly noOfficialMetadataPairs: number
  readonly disseminationTimestampReadyPairs: number
  readonly structuredFinancialMetadataPairs: number
  readonly classificationMetadataPairs: number
  readonly projectedEvidenceReadyPairs: number
  readonly exclusionCeilingState: "PENDING_OWNER_FREEZE"
}

export function buildMetadataOnlyFeasibilityCensus(
  aliases: readonly P8HistoricalAlias[],
  eligiblePairs: readonly P8B2EligiblePair[],
  filings: readonly P8OfficialFilingMetadata[],
): P8MetadataFeasibilityCensus {
  const nseByIdentity = new Map<string, P8OfficialFilingMetadata[]>()
  const bseByIdentity = new Map<string, P8OfficialFilingMetadata[]>()

  for (const filing of filings) {
    const resolution = filing.exchange === "NSE"
      ? resolveNseFilingIdentity(aliases, filing)
      : resolveBseFallbackIdentity(aliases, filing)
    if (resolution.state === "UNRESOLVED") continue
    const target = filing.exchange === "NSE" ? nseByIdentity : bseByIdentity
    const rows = target.get(resolution.historicalIdentityId) ?? []
    rows.push(filing)
    target.set(resolution.historicalIdentityId, rows)
  }

  let nseMetadataResolvablePairs = 0
  let bseFallbackResolvablePairs = 0
  let noOfficialMetadataPairs = 0
  let disseminationTimestampReadyPairs = 0
  let structuredFinancialMetadataPairs = 0
  let classificationMetadataPairs = 0
  let projectedEvidenceReadyPairs = 0

  for (const pair of eligiblePairs) {
    const nseEligible = (nseByIdentity.get(pair.historicalIdentityId) ?? [])
      .filter((row) => filingIsStrictlyBeforeDecision(row, pair.decisionAt))
    const bseEligible = (bseByIdentity.get(pair.historicalIdentityId) ?? [])
      .filter((row) => filingIsStrictlyBeforeDecision(row, pair.decisionAt))

    const selected = nseEligible.length > 0 ? nseEligible : bseEligible
    if (nseEligible.length > 0) nseMetadataResolvablePairs++
    else if (bseEligible.length > 0) bseFallbackResolvablePairs++
    else noOfficialMetadataPairs++

    if (selected.length > 0) disseminationTimestampReadyPairs++

    const hasStructured = selected.some((row) => row.hasStructuredFinancials)
    const hasClassification = selected.some((row) => row.hasClassificationEvidence)
    if (hasStructured) structuredFinancialMetadataPairs++
    if (hasClassification) classificationMetadataPairs++
    if (hasStructured && hasClassification) projectedEvidenceReadyPairs++
  }

  return {
    version: "P8_B_RECOVERY_METADATA_CENSUS_V1",
    eligiblePairs: eligiblePairs.length,
    nseMetadataResolvablePairs,
    bseFallbackResolvablePairs,
    noOfficialMetadataPairs,
    disseminationTimestampReadyPairs,
    structuredFinancialMetadataPairs,
    classificationMetadataPairs,
    projectedEvidenceReadyPairs,
    exclusionCeilingState: "PENDING_OWNER_FREEZE",
  }
}
