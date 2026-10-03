import { describe, expect, it } from "vitest"
import {
  buildMetadataOnlyFeasibilityCensus,
  filingIsStrictlyBeforeDecision,
  resolveBseFallbackIdentity,
  resolveNseFilingIdentity,
  type P8HistoricalAlias,
  type P8OfficialFilingMetadata,
} from "./p8BRecoverySourceAdapters"

const aliases: P8HistoricalAlias[] = [
  {
    historicalIdentityId: "hist-current",
    historicalIsin: "INE111A01011",
    exchange: "NSE",
    symbol: "ALPHA",
    companyName: "Alpha Limited",
    validFrom: "2023-01-01T00:00:00Z",
    validTo: null,
  },
  {
    historicalIdentityId: "hist-old",
    historicalIsin: "INE222B01022",
    exchange: "NSE",
    symbol: "OLDSYM",
    companyName: "Old Name Limited",
    validFrom: "2023-01-01T00:00:00Z",
    validTo: "2025-01-01T00:00:00Z",
  },
]

const nseExact: P8OfficialFilingMetadata = {
  exchange: "NSE",
  filingReference: "NSE-1",
  isin: "INE111A01011",
  symbol: "ALPHA",
  companyName: "Alpha Limited",
  filingType: "FINANCIAL_RESULT",
  periodEnded: "2024-12-31",
  disseminatedAt: "2025-01-20T10:00:00Z",
  revisedAt: null,
  revisionState: "ORIGINAL",
  hasStructuredFinancials: true,
  hasClassificationEvidence: true,
}

describe("P8-B recovery source adapters", () => {
  it("resolves NSE metadata by exact historical ISIN without current-security linkage", () => {
    expect(resolveNseFilingIdentity(aliases, nseExact)).toEqual({
      state: "EXACT_ISIN",
      historicalIdentityId: "hist-current",
    })
  })

  it("permits dated NSE symbol+company-name resolution only inside the alias interval", () => {
    const dated: P8OfficialFilingMetadata = {
      ...nseExact,
      filingReference: "NSE-OLD",
      isin: null,
      symbol: "OLDSYM",
      companyName: "Old Name Limited",
      disseminatedAt: "2024-06-01T10:00:00Z",
    }
    expect(resolveNseFilingIdentity(aliases, dated)).toEqual({
      state: "DATED_NSE_SYMBOL_NAME",
      historicalIdentityId: "hist-old",
    })
    expect(resolveNseFilingIdentity(aliases, { ...dated, disseminatedAt: "2025-06-01T10:00:00Z" })).toEqual({
      state: "UNRESOLVED",
    })
  })

  it("requires BSE fallback to be anchored by exact ISIN", () => {
    const bse: P8OfficialFilingMetadata = { ...nseExact, exchange: "BSE", filingReference: "BSE-1" }
    expect(resolveBseFallbackIdentity(aliases, bse)).toEqual({
      state: "BSE_ISIN_FALLBACK",
      historicalIdentityId: "hist-current",
    })
    expect(resolveBseFallbackIdentity(aliases, { ...bse, isin: null })).toEqual({ state: "UNRESOLVED" })
  })

  it("keeps equality at the decision instant ineligible", () => {
    expect(filingIsStrictlyBeforeDecision(nseExact, "2025-01-20T10:00:00Z")).toBe(false)
    expect(filingIsStrictlyBeforeDecision(nseExact, "2025-01-20T10:00:01Z")).toBe(true)
  })

  it("runs a metadata-only census with NSE-first and BSE fallback counts", () => {
    const bseFallback: P8OfficialFilingMetadata = {
      ...nseExact,
      exchange: "BSE",
      filingReference: "BSE-OLD",
      isin: "INE222B01022",
      symbol: "OLDSYM",
      companyName: "Old Name Limited",
      hasStructuredFinancials: true,
      hasClassificationEvidence: false,
    }
    const census = buildMetadataOnlyFeasibilityCensus(
      aliases,
      [
        { historicalIdentityId: "hist-current", decisionAt: "2025-01-31T15:30:00Z" },
        { historicalIdentityId: "hist-old", decisionAt: "2025-01-31T15:30:00Z" },
        { historicalIdentityId: "hist-old", decisionAt: "2024-01-01T00:00:00Z" },
      ],
      [nseExact, bseFallback],
    )
    expect(census).toEqual({
      version: "P8_B_RECOVERY_METADATA_CENSUS_V1",
      eligiblePairs: 3,
      nseMetadataResolvablePairs: 1,
      bseFallbackResolvablePairs: 1,
      noOfficialMetadataPairs: 1,
      disseminationTimestampReadyPairs: 2,
      structuredFinancialMetadataPairs: 2,
      classificationMetadataPairs: 1,
      projectedEvidenceReadyPairs: 1,
      exclusionCeilingState: "PENDING_OWNER_FREEZE",
    })
  })
})
