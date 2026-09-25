import { buildProgramDR12FactPacket } from "./programD3R12Contract"

export async function buildProgramDR12LocalReferencePacket() {
  return buildProgramDR12FactPacket({
    portfolioId: "LOCAL_D3_PORTFOLIO",
    securityId: "LOCAL_D3_TORNTPHARM",
    symbol: "TORNTPHARM",
    company: "Torrent Pharmaceuticals",
    narrativeType: "R10_ACTION_EXPLANATION",
    asOf: "2026-09-25T13:00:00+05:30",
    fields: [
      {
        id: "overall_score",
        type: "DETERMINISTIC_STATE",
        label: "R6 overall score",
        value: 75.1575,
        provenanceId: "R6_LOCAL_REFERENCE",
      },
      {
        id: "r10_state",
        type: "DETERMINISTIC_STATE",
        label: "R10 canonical state",
        value: "MONITOR",
        provenanceId: "R10_LOCAL_REFERENCE",
      },
      {
        id: "owner_role",
        type: "OWNER_CONTEXT",
        label: "Owner portfolio role",
        value: "CORE",
        provenanceId: "OWNER_LOCAL_REFERENCE",
      },
      {
        id: "evidence_freshness",
        type: "FACT",
        label: "Evidence state",
        value: "FRESH",
        provenanceId: "EVIDENCE_LOCAL_REFERENCE",
      },
      {
        id: "uncertainty",
        type: "UNCERTAINTY",
        label: "Sizing authority",
        value: "Numeric sizing authority is absent.",
        provenanceId: null,
      },
      {
        id: "source_excerpt",
        type: "SOURCE_EXCERPT",
        label: "Display-safe source excerpt",
        value: "Reference evidence is supplied only for local R12 contract validation.",
        provenanceId: "SRC_LOCAL_1",
      },
    ],
    evidence: [
      {
        citationId: "CIT_R6",
        provenanceId: "R6_LOCAL_REFERENCE",
        label: "Deterministic R6 reference state",
        retrievedAt: "2026-09-25T12:00:00+05:30",
        freshUntil: null,
        displaySafeExcerpt: null,
      },
      {
        citationId: "CIT_R10",
        provenanceId: "R10_LOCAL_REFERENCE",
        label: "Canonical R10 Action Center state",
        retrievedAt: "2026-09-25T12:00:00+05:30",
        freshUntil: null,
        displaySafeExcerpt: null,
      },
      {
        citationId: "CIT_SRC",
        provenanceId: "SRC_LOCAL_1",
        label: "Display-safe local reference excerpt",
        retrievedAt: "2026-09-25T12:00:00+05:30",
        freshUntil: null,
        displaySafeExcerpt:
          "Reference evidence is supplied only for local R12 contract validation.",
      },
    ],
    r6: {
      state: "SCORED",
      lineage: {
        scoreRunId: "PROGRAM_B_R7_REFERENCE_LOCAL",
        methodologyId: "PHARMA_V1",
        assignmentVersion: "LOCAL_D3",
      },
    },
    r7: {
      state: "RECOMMENDATION_READY",
      lineage: {
        recommendationRunId: "PROGRAM_B_R7_LOCAL",
        policyVersion: "PHARMA_POLICY_LOCAL",
      },
    },
    r8: {
      state: "CURRENT",
      lineage: {
        r8DecisionRunId: "PROGRAM_C_R8_LOCAL",
        portfolioContextSnapshotId: "LOCAL_CONTEXT",
      },
    },
    r9: {
      state: "NO_MEANINGFUL_CHANGE",
      lineage: {
        currentObservedStateId: "PROGRAM_C_R9_LOCAL_CURRENT",
        previousObservedStateId: "PROGRAM_C_R9_LOCAL_PREVIOUS",
      },
    },
    r10: {
      state: "MONITOR",
      lineage: {
        integratedAttentionId: "PROGRAM_C_R10_LOCAL",
        precedenceVersion: "PROGRAM_C_R10_PRECEDENCE_V1",
      },
    },
    blockers: ["Real AI provider is not authorized in D3."],
    uncertainties: ["Numeric sizing authority is absent."],
    contradictions: ["No local contradiction fixture is active."],
  })
}
