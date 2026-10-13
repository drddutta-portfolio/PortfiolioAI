import type { ResultSecurity } from "./types"

export type ResultIndustryTemplate = "BANK" | "IT" | "PHARMA" | "INDUSTRIAL"

export interface IndustryTemplate {
  readonly kind: ResultIndustryTemplate
  readonly name: string
  readonly primaryMetricId: string
  readonly metricLabels: readonly string[]
  readonly guidance: string
}

const profiles: Record<ResultIndustryTemplate, IndustryTemplate> = {
  BANK: {
    kind: "BANK",
    name: "Banking",
    primaryMetricId: "nii",
    metricLabels: ["Net interest income", "Net interest margin", "ROA", "Asset quality (GNPA/NNPA)", "Credit and deposit growth", "Capital adequacy"],
    guidance: "Banking analysis requires period-qualified NII, profitability, asset quality and capital evidence. Revenue must not substitute for NII.",
  },
  IT: {
    kind: "IT",
    name: "IT services",
    primaryMetricId: "revenue",
    metricLabels: ["Revenue growth", "Operating margin", "PAT", "EPS", "Deal wins", "Client concentration"],
    guidance: "Assess growth alongside margins, demand commentary and deal conversions. Narrative drivers remain unverified until source-backed.",
  },
  PHARMA: {
    kind: "PHARMA",
    name: "Pharmaceuticals",
    primaryMetricId: "revenue",
    metricLabels: ["Revenue", "EBITDA margin", "PAT", "EPS", "Product pipeline", "Regulatory / plant risk"],
    guidance: "Profile-specific pharmaceutical evidence (API, formulations, generics, biosimilars or CDMO) is required for real analysis.",
  },
  INDUSTRIAL: {
    kind: "INDUSTRIAL",
    name: "Industrial / diversified",
    primaryMetricId: "revenue",
    metricLabels: ["Revenue", "Operating profit", "PAT", "EPS", "Order book / segment mix", "Cash conversion"],
    guidance: "Segment, order-book and cash-flow interpretation requires verified company disclosures; no generic proxy is implied.",
  },
}

export function templateForSecurity(security: ResultSecurity): IndustryTemplate {
  if (security.industry.toLowerCase().includes("bank")) return profiles.BANK
  if (security.industry.toLowerCase().includes("it services")) return profiles.IT
  if (security.industry.toLowerCase().includes("pharma")) return profiles.PHARMA
  return profiles.INDUSTRIAL
}
