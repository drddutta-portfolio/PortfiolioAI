import { describe, expect, it } from "vitest"
import {
  P8_B2_R2_LAYOUT,
  b2R2ObjectKey,
  eligiblePairsFromB2UniverseMembers,
  projectHistoricalAliasesFromB2,
} from "./p8BRecoveryB2R2Adapter"

describe("P8-B recovery B2 R2 adapter", () => {
  it("uses the frozen canonical R2 B2 paths", () => {
    expect(
      b2R2ObjectKey(P8_B2_R2_LAYOUT.listingObservations, "2025-01-31"),
    ).toBe(
      "portfolioai-history/development/p8/b2/listing-observations/v1/source_date=2025-01-31/part-00000.parquet",
    )
    expect(
      b2R2ObjectKey(P8_B2_R2_LAYOUT.universeMembers, "2025-01-31"),
    ).toContain("decision_date=2025-01-31")
  })

  it("projects aliases only from historical identity + B2 listing evidence", () => {
    const aliases = projectHistoricalAliasesFromB2(
      [{ id: "hist-1", historicalIsin: "INE111A01011" }],
      [
        {
          historicalIdentityId: "hist-1",
          sourceDate: "2024-01-31",
          exchange: "NSE",
          tradingSymbol: "OLD",
          instrumentName: "Alpha Limited",
          series: "EQ",
        },
        {
          historicalIdentityId: "hist-1",
          sourceDate: "2024-02-29",
          exchange: "NSE",
          tradingSymbol: "OLD",
          instrumentName: "Alpha Limited",
          series: "EQ",
        },
        {
          historicalIdentityId: "hist-1",
          sourceDate: "2024-03-28",
          exchange: "NSE",
          tradingSymbol: "NEW",
          instrumentName: "Alpha Limited",
          series: "EQ",
        },
      ],
      ["2024-01-31", "2024-02-29", "2024-03-28"],
    )

    expect(aliases).toEqual([
      {
        historicalIdentityId: "hist-1",
        historicalIsin: "INE111A01011",
        exchange: "NSE",
        symbol: "OLD",
        companyName: "Alpha Limited",
        validFrom: "2024-01-31T00:00:00.000Z",
        validTo: "2024-03-28T00:00:00.000Z",
      },
      {
        historicalIdentityId: "hist-1",
        historicalIsin: "INE111A01011",
        exchange: "NSE",
        symbol: "NEW",
        companyName: "Alpha Limited",
        validFrom: "2024-03-28T00:00:00.000Z",
        validTo: null,
      },
    ])
  })

  it("fails closed when an R2 listing row cannot be tied to a known historical identity", () => {
    expect(() =>
      projectHistoricalAliasesFromB2(
        [{ id: "hist-1", historicalIsin: "INE111A01011" }],
        [
          {
            historicalIdentityId: "missing",
            sourceDate: "2024-01-31",
            exchange: "NSE",
            tradingSymbol: "ALPHA",
            instrumentName: "Alpha Limited",
            series: "EQ",
          },
        ],
        ["2024-01-31"],
      ),
    ).toThrow("unknown historical identity")
  })

  it("extracts only B2-eligible pairs and preserves ineligible rows as non-candidates", () => {
    expect(
      eligiblePairsFromB2UniverseMembers([
        { historicalIdentityId: "h1", decisionAt: "2025-01-31T10:00:00Z", membershipState: "ELIGIBLE" },
        { historicalIdentityId: "h2", decisionAt: "2025-01-31T10:00:00Z", membershipState: "INELIGIBLE" },
        { historicalIdentityId: "h3", decisionAt: "2025-01-31T10:00:00Z", membershipState: "BLOCKED" },
      ]),
    ).toEqual([{ historicalIdentityId: "h1", decisionAt: "2025-01-31T10:00:00Z" }])
  })
})
