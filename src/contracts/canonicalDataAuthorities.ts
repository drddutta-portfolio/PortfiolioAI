export type CanonicalFactLayer = "RAW" | "NORMALIZED" | "DERIVED" | "SCORED" | "OWNER_SETTING" | "FUTURE_ENGINE"

export type CanonicalFactKey =
  | "TRANSACTIONS"
  | "OPEN_QUANTITY"
  | "AVERAGE_COST"
  | "INVESTED_AMOUNT"
  | "CURRENT_PRICE"
  | "CURRENT_VALUE"
  | "UNREALISED_PNL"
  | "PORTFOLIO_WEIGHT"
  | "SECTOR"
  | "INDUSTRY"
  | "MARKET_CAP_CATEGORY"
  | "RESEARCH_SUBPROFILE_ASSIGNMENT"
  | "PORTFOLIO_ROLE"
  | "THEMES"
  | "FUNDAMENTAL_EVIDENCE"
  | "OWNERSHIP_EVIDENCE"
  | "RESEARCH_DOCUMENTS"
  | "CURRENT_RESEARCH_EVIDENCE"
  | "DAILY_OHLCV"
  | "OFFICIAL_NEWS"
  | "DETERMINISTIC_SCORE"
  | "RECOMMENDATION"
  | "POSITION_SIZING_ASSESSMENT"
  | "CORE_HEALTH"
  | "EXIT_RISK"
  | "CANONICAL_ACTION"

export interface CanonicalDataAuthority {
  readonly fact: CanonicalFactKey
  readonly label: string
  readonly layer: CanonicalFactLayer
  readonly canonicalAuthority: string
  readonly canonicalSourceObject: string
  readonly sharedAccessPath: string
  readonly missingDataBehavior: "PRESERVE_NULL" | "PRESERVE_STATE" | "NOT_APPLICABLE_WHEN_UNSUPPORTED"
  readonly pageLocalDerivationAllowed: false
  readonly notes: string
}

const authority = (definition: CanonicalDataAuthority) => definition

/**
 * Executable architecture registry for application-wide business facts.
 *
 * This registry does not replace database provenance or domain-engine contracts.
 * It records which existing authority/application path owns a fact so UI surfaces
 * cannot silently create a second definition.
 */
export const CANONICAL_DATA_AUTHORITIES = {
  TRANSACTIONS: authority({
    fact: "TRANSACTIONS",
    label: "Transactions",
    layer: "RAW",
    canonicalAuthority: "PortfolioAI trusted transaction ledger",
    canonicalSourceObject: "transactions",
    sharedAccessPath: "loadPortfolioLedgerSnapshot()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "Transactions remain the accounting source of truth; pages never reconstruct a competing ledger.",
  }),
  OPEN_QUANTITY: authority({
    fact: "OPEN_QUANTITY",
    label: "Open quantity",
    layer: "DERIVED",
    canonicalAuthority: "PortfolioAI deterministic portfolio/accounting layer",
    canonicalSourceObject: "transactions/current_holdings",
    sharedAccessPath: "calculatePortfolio() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Quantity is derived once from the approved ledger semantics.",
  }),
  AVERAGE_COST: authority({
    fact: "AVERAGE_COST",
    label: "Average cost",
    layer: "DERIVED",
    canonicalAuthority: "PortfolioAI accounting engine",
    canonicalSourceObject: "transactions",
    sharedAccessPath: "calculatePortfolio() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "Accounting basis and chronology quality must remain explicit.",
  }),
  INVESTED_AMOUNT: authority({
    fact: "INVESTED_AMOUNT",
    label: "Invested amount",
    layer: "DERIVED",
    canonicalAuthority: "PortfolioAI accounting engine",
    canonicalSourceObject: "transactions",
    sharedAccessPath: "calculatePortfolio() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "Imported holdings snapshots remain reconciliation evidence only.",
  }),
  CURRENT_PRICE: authority({
    fact: "CURRENT_PRICE",
    label: "Current price",
    layer: "RAW",
    canonicalAuthority: "Angel One cached market-price authority",
    canonicalSourceObject: "approved cached market-price store",
    sharedAccessPath: "supabaseMarketPriceProvider -> loadPortfolioLedgerSnapshot() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "Provider price timestamps and stale state remain part of the evidence.",
  }),
  CURRENT_VALUE: authority({
    fact: "CURRENT_VALUE",
    label: "Current value",
    layer: "DERIVED",
    canonicalAuthority: "PortfolioAI deterministic portfolio engine",
    canonicalSourceObject: "canonical quantity + canonical current price",
    sharedAccessPath: "calculatePortfolio() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "A page must not recalculate current value from an alternate price source.",
  }),
  UNREALISED_PNL: authority({
    fact: "UNREALISED_PNL",
    label: "Unrealised P&L",
    layer: "DERIVED",
    canonicalAuthority: "PortfolioAI deterministic accounting/portfolio engine",
    canonicalSourceObject: "canonical accounting basis + canonical current price",
    sharedAccessPath: "calculatePortfolio() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "P&L quality follows the approved accounting basis and evidence coverage.",
  }),
  PORTFOLIO_WEIGHT: authority({
    fact: "PORTFOLIO_WEIGHT",
    label: "Portfolio weight",
    layer: "DERIVED",
    canonicalAuthority: "PortfolioAI deterministic portfolio engine",
    canonicalSourceObject: "canonical current values",
    sharedAccessPath: "calculatePortfolio() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "All views use the same priced-subset semantics when price coverage is incomplete.",
  }),
  SECTOR: authority({
    fact: "SECTOR",
    label: "Sector",
    layer: "NORMALIZED",
    canonicalAuthority: "PortfolioAI reviewed security enrichment",
    canonicalSourceObject: "current_security_enrichment_v1.sector selected from reviewed security_attribute_decisions",
    sharedAccessPath: "official NSE/BSE evidence -> reviewed classification decision -> loadSecurityEnrichment() / usePortfolioEnrichment() -> shared classification projection",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "Official NSE/BSE primary sector evidence is Tier-1 for operating-company equities. Research profiles/subprofiles may interpret the canonical sector but may not rewrite it; unresolved exchange evidence fails closed.",
  }),
  INDUSTRY: authority({
    fact: "INDUSTRY",
    label: "Industry",
    layer: "NORMALIZED",
    canonicalAuthority: "PortfolioAI reviewed security enrichment",
    canonicalSourceObject: "current_security_enrichment_v1.industry selected from reviewed security_attribute_decisions",
    sharedAccessPath: "official NSE/BSE evidence -> reviewed classification decision -> loadSecurityEnrichment() / usePortfolioEnrichment() -> shared classification projection",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "Industry detail follows reviewed official exchange evidence. Missing or conflicting deeper classification remains explicit and blocks any methodology that requires that detail.",
  }),
  MARKET_CAP_CATEGORY: authority({
    fact: "MARKET_CAP_CATEGORY",
    label: "Market-cap category",
    layer: "NORMALIZED",
    canonicalAuthority: "PortfolioAI reviewed security enrichment",
    canonicalSourceObject: "current_security_enrichment_v1.market_cap_category",
    sharedAccessPath: "loadSecurityEnrichment() / usePortfolioEnrichment()",
    missingDataBehavior: "PRESERVE_NULL",
    pageLocalDerivationAllowed: false,
    notes: "Large/Mid/Small-cap buckets must not be independently recalculated by pages.",
  }),
  RESEARCH_SUBPROFILE_ASSIGNMENT: authority({
    fact: "RESEARCH_SUBPROFILE_ASSIGNMENT",
    label: "Research subprofile assignment",
    layer: "NORMALIZED",
    canonicalAuthority: "PortfolioAI versioned research-subprofile assignment authority",
    canonicalSourceObject: "current_research_evidence_snapshot_lineage_v1 approved P7 assignment for current held research; research_subprofile_assignments for original reviewed detail; fixture candidates are noncanonical",
    sharedAccessPath: "loadP7CurrentEvidenceDetails() -> useStockResearchContext() -> canonical route and effective contract; resolvePharmaSubprofileAssignment() retains original review detail",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Current header, panels and R6 presentation share the selected P7 assignment. Legacy review rows cannot override or block a resolved P7 route; secondary review metadata is unavailable unless explicitly bound. Sector/industry remain owned by current_security_enrichment_v1. Missing, provisional, disputed or conflicting required subprofiles block readiness, scoring and dependent execution. Assignment resolution alone cannot qualify a score.",
  }),
  PORTFOLIO_ROLE: authority({
    fact: "PORTFOLIO_ROLE",
    label: "Portfolio role",
    layer: "OWNER_SETTING",
    canonicalAuthority: "Portfolio owner settings",
    canonicalSourceObject: "portfolio_security_settings.portfolio_role",
    sharedAccessPath: "loadPortfolioLedgerSnapshot() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Unclassified is a valid state; engines do not silently assign owner roles.",
  }),
  THEMES: authority({
    fact: "THEMES",
    label: "Themes",
    layer: "OWNER_SETTING",
    canonicalAuthority: "Portfolio owner settings",
    canonicalSourceObject: "themes + theme_securities",
    sharedAccessPath: "loadPortfolioLedgerSnapshot() -> usePortfolioView()",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Theme membership is owner-controlled and separate from primary role.",
  }),
  FUNDAMENTAL_EVIDENCE: authority({
    fact: "FUNDAMENTAL_EVIDENCE",
    label: "Fundamental evidence",
    layer: "RAW",
    canonicalAuthority: "Reviewed PortfolioAI research evidence",
    canonicalSourceObject: "fundamental_observations + fundamental_observation_decisions + metric contracts",
    sharedAccessPath: "loadSecurityResearch() / research repository",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Historical conflicts do not become zero or disappear; canonical selection/readiness remains explicit.",
  }),
  OWNERSHIP_EVIDENCE: authority({
    fact: "OWNERSHIP_EVIDENCE",
    label: "Ownership evidence",
    layer: "RAW",
    canonicalAuthority: "Reviewed PortfolioAI ownership evidence",
    canonicalSourceObject: "approved ownership observations/contracts",
    sharedAccessPath: "loadSecurityResearch() / research repository",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Provider evidence is normalized once and retains source/period provenance.",
  }),
  RESEARCH_DOCUMENTS: authority({
    fact: "RESEARCH_DOCUMENTS",
    label: "Research documents",
    layer: "RAW",
    canonicalAuthority: "PortfolioAI research document registry",
    canonicalSourceObject: "research_documents + research_document_sources",
    sharedAccessPath: "loadSecurityResearch() / research repository",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Document metadata and provenance are canonical; large binaries remain external where designed.",
  }),
  CURRENT_RESEARCH_EVIDENCE: authority({
    fact: "CURRENT_RESEARCH_EVIDENCE",
    label: "Canonical current research evidence",
    layer: "NORMALIZED",
    canonicalAuthority: "P7 IC3 canonical selection and lineage contract",
    canonicalSourceObject: "current_research_evidence_snapshot_lineage_v1",
    sharedAccessPath: "loadP7CurrentEvidenceSnapshots() -> useP7CurrentIntelligence(); loadP7CurrentEvidenceSnapshot() -> resolveCanonicalScoringProfile() -> loadSecurityScoringSnapshot() -> useSecurityScoring(); loadP7CurrentEvidenceDetails() -> useCanonicalEvidenceReadiness() -> CanonicalEvidenceReadinessPanel",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Dashboard, Intelligence and Research consume the same portfolio-scoped current snapshot lineage. Research resolves the approved IC1 assignment before classification or legacy assignments; route resolution, engine availability and evidence readiness remain separate. Missing engines/evidence cannot select GENERAL. Research reads immutable research_evidence_snapshot_items of that selected snapshot to show requirement states, history minima, approved benchmark context, source/freshness dates, normalized evidence, validation/selection and remediation reasons even when an engine is unavailable. Presentation never reselects evidence or promotes stored readiness.",
  }),
  DAILY_OHLCV: authority({
    fact: "DAILY_OHLCV",
    label: "Daily historical OHLCV",
    layer: "RAW",
    canonicalAuthority: "Angel One stored daily market history",
    canonicalSourceObject: "approved market_price_history contract",
    sharedAccessPath: "market-data repository",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Weekly/monthly series and indicators derive from this canonical daily history.",
  }),
  OFFICIAL_NEWS: authority({
    fact: "OFFICIAL_NEWS",
    label: "Official company news",
    layer: "RAW",
    canonicalAuthority: "Normalized official NSE news pipeline",
    canonicalSourceObject: "approved NSE news evidence tables",
    sharedAccessPath: "News repository/service",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Normal browsing is cache-only and does not perform live NSE fetches.",
  }),
  DETERMINISTIC_SCORE: authority({
    fact: "DETERMINISTIC_SCORE",
    label: "Deterministic score",
    layer: "SCORED",
    canonicalAuthority: "Versioned PortfolioAI scoring engine",
    canonicalSourceObject: "stock_score_runs + score lineage",
    sharedAccessPath: "scoring repository/service",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "UI calculations must not masquerade as persisted score lineage.",
  }),
  RECOMMENDATION: authority({
    fact: "RECOMMENDATION",
    label: "Recommendation",
    layer: "SCORED",
    canonicalAuthority: "Versioned PortfolioAI recommendation engine",
    canonicalSourceObject: "stock_recommendation_runs + source score lineage",
    sharedAccessPath: "recommendation repository/service",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Preview output and canonical persisted lineage remain distinguishable.",
  }),
  POSITION_SIZING_ASSESSMENT: authority({
    fact: "POSITION_SIZING_ASSESSMENT",
    label: "Position-sizing assessment",
    layer: "SCORED",
    canonicalAuthority: "D35B Position Sizing Engine",
    canonicalSourceObject: "position_sizing_assessments when production persistence is approved/applied",
    sharedAccessPath: "position-sizing repository/service",
    missingDataBehavior: "NOT_APPLICABLE_WHEN_UNSUPPORTED",
    pageLocalDerivationAllowed: false,
    notes: "Owner target/min/max settings remain separate from engine sizing guidance.",
  }),
  CORE_HEALTH: authority({
    fact: "CORE_HEALTH",
    label: "Core Health",
    layer: "FUTURE_ENGINE",
    canonicalAuthority: "Future approved PortfolioAI Core Health engine",
    canonicalSourceObject: "future versioned Core Health persistence contract",
    sharedAccessPath: "future Core Health domain service",
    missingDataBehavior: "NOT_APPLICABLE_WHEN_UNSUPPORTED",
    pageLocalDerivationAllowed: false,
    notes: "Current UI readiness surfaces must not fabricate formal engine output.",
  }),
  EXIT_RISK: authority({
    fact: "EXIT_RISK",
    label: "Exit Risk",
    layer: "FUTURE_ENGINE",
    canonicalAuthority: "Future approved PortfolioAI Exit Risk engine",
    canonicalSourceObject: "future versioned Exit Risk persistence contract",
    sharedAccessPath: "future Exit Risk domain service",
    missingDataBehavior: "NOT_APPLICABLE_WHEN_UNSUPPORTED",
    pageLocalDerivationAllowed: false,
    notes: "Current UI readiness surfaces must not fabricate formal engine output.",
  }),
  CANONICAL_ACTION: authority({
    fact: "CANONICAL_ACTION",
    label: "Canonical owner-facing action",
    layer: "SCORED",
    canonicalAuthority: "P7 IC6D action projection contract",
    canonicalSourceObject: "R7 + current R8 domains + Movement + owner context + evidence blockers",
    sharedAccessPath: "projectP7Ic6CurrentState() -> useP7CurrentIntelligence()",
    missingDataBehavior: "PRESERVE_STATE",
    pageLocalDerivationAllowed: false,
    notes: "Only ACCUMULATE/HOLD/WATCH/REDUCE/EXIT_REVIEW are canonical. Current fail-closed prerequisites emit no action; BUY/SELL are not internal states.",
  }),
} as const satisfies Record<CanonicalFactKey, CanonicalDataAuthority>

export function canonicalAuthorityFor(fact: CanonicalFactKey): CanonicalDataAuthority {
  return CANONICAL_DATA_AUTHORITIES[fact]
}
