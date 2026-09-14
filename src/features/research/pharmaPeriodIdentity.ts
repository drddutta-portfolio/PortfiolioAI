import type { PharmaAnnualPeriod, PharmaQuarterPeriod } from "./pharmaHistoryNormalization"

export const TORNTPHARM_PERIOD_IDENTITY_VERSION = "TORNTPHARM_PERIOD_IDENTITY_V1" as const

export interface PeriodIdentityEvidence {
  readonly sourceCode: "COMPANY_EXCHANGE_FILING"
  readonly url: string
  readonly statement: string
}

/**
 * Repository-only reference contract. The URLs are official issuer/exchange
 * evidence used to prove TORNTPHARM's reporting calendar and latest reported
 * periods. A production pilot must persist/capture the reviewed evidence before
 * using it as lineage for canonical observations.
 */
export const TORNTPHARM_PERIOD_IDENTITY = {
  version: TORNTPHARM_PERIOD_IDENTITY_VERSION,
  symbol: "TORNTPHARM",
  fiscalYear: "01-Apr to 31-Mar",
  latestAnnualPeriodEnd: "2026-03-31",
  latestQuarterPeriodEnd: "2026-06-30",
  annual: {
    Y0: "2026-03-31",
    Y1: "2025-03-31",
    Y2: "2024-03-31",
    Y3: "2023-03-31",
    Y4: "2022-03-31",
    Y5: "2021-03-31",
  } satisfies Readonly<Record<PharmaAnnualPeriod, string>>,
  quarter: {
    Q0: "2026-06-30",
    Q1: "2026-03-31",
    Q2: "2025-12-31",
    Q3: "2025-09-30",
    Q4: "2025-06-30",
    Q5: "2025-03-31",
    Q6: "2024-12-31",
    Q7: "2024-09-30",
    Q8: "2024-06-30",
  } satisfies Readonly<Record<PharmaQuarterPeriod, string>>,
  evidence: [
    {
      sourceCode: "COMPANY_EXCHANGE_FILING",
      url: "https://www.torrentpharma.com/investors/share-holder/investor-services/",
      statement: "Issuer financial calendar states the financial year runs from 01 April to 31 March.",
    },
    {
      sourceCode: "COMPANY_EXCHANGE_FILING",
      url: "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
      statement: "Issuer annual report identifies the latest completed annual period as year ended 31 March 2026.",
    },
    {
      sourceCode: "COMPANY_EXCHANGE_FILING",
      url: "https://www.torrentpharma.com/investors/financial-info/quarterly-results/",
      statement: "Issuer Q1 FY2026-27 results identify the latest completed quarter as quarter ended 30 June 2026.",
    },
  ] satisfies readonly PeriodIdentityEvidence[],
} as const

export function torntpharmPeriodEnd(period: PharmaAnnualPeriod | PharmaQuarterPeriod) {
  if (period.startsWith("Y")) return TORNTPHARM_PERIOD_IDENTITY.annual[period as PharmaAnnualPeriod]
  return TORNTPHARM_PERIOD_IDENTITY.quarter[period as PharmaQuarterPeriod]
}
