export const PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET_VERSION =
  "PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET_V1_REVIEWED" as const

export interface GlobalGenericsPeer {
  readonly symbol: "DRREDDY" | "LUPIN" | "ZYDUSLIFE"
  readonly companyName: string
  readonly isin: string
  readonly reviewedPrimary: "GLOBAL_GENERICS"
  readonly evidenceThrough: string
  readonly rationale: string
  readonly officialSource: string
}

export const PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET = {
  version: PHARMA_GLOBAL_GENERICS_G10_2_PEER_SET_VERSION,
  state: "REVIEWED_NOT_PERSISTED" as const,
  referenceSymbol: "AUROPHARMA" as const,
  primary: "GLOBAL_GENERICS" as const,
  peers: [
    {
      symbol: "DRREDDY",
      companyName: "Dr. Reddy's Laboratories Limited",
      isin: "INE089A01031",
      reviewedPrimary: "GLOBAL_GENERICS",
      evidenceThrough: "2025-03-31",
      rationale: "Issuer reporting explicitly identifies Global Generics as the dominant revenue segment, with North America, Europe, India and Emerging Markets inside that segment.",
      officialSource: "https://www.drreddys.com/cms/cms/sites/default/files/2025-06/Integrated%20Annual%20Report%202024-25.pdf",
    },
    {
      symbol: "LUPIN",
      companyName: "Lupin Limited",
      isin: "INE326A01037",
      reviewedPrimary: "GLOBAL_GENERICS",
      evidenceThrough: "2026-03-31",
      rationale: "FY26 U.S. plus Other Developed and Emerging Markets formulations form the majority of global sales; U.S. generics alone contributed 42% and the API business remained small.",
      officialSource: "https://www.lupin.com/media/press-releases/lupin-fy-2026-and-q4-fy-2026-results",
    },
    {
      symbol: "ZYDUSLIFE",
      companyName: "Zydus Lifesciences Limited",
      isin: "INE010B01027",
      reviewedPrimary: "GLOBAL_GENERICS",
      evidenceThrough: "2025-06-30",
      rationale: "FY26 business-mix disclosure shows U.S. formulations plus international formulations as the majority of consolidated revenue, materially ahead of India formulations and API.",
      officialSource: "https://zyduslife.com/investor/admin/uploads/21/83/Zydus-Lifesciences-Limited-Financial-Performance-for-Q1-FY26.pdf",
    },
  ] as const satisfies readonly GlobalGenericsPeer[],
  minimumRequiredPeerCount: 3,
  peerCount: 3,
  samePrimaryRequirementSatisfied: true,
  classificationPersistencePerformed: false,
  scorePersistencePerformed: false,
} as const
