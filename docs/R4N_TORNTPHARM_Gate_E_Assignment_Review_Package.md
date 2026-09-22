# R4N — TORNTPHARM Gate E Assignment Review Package

**Status:** READY FOR HUMAN REVIEW — NOT PERSISTED  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Scope:** Gate E assignment review package only. This artifact does **not** authorize a production write, assignment promotion, evidence ingestion, scoring, recommendation, sizing, provider call, deployment, or scheduler change.

## 1. Read-only production identity verification

Verified against production Supabase immediately before constructing this package:

- security symbol: `TORNTPHARM`
- exchange: `NSE`
- production `security_id`: `da69b3eb-0343-44f8-912c-288b826118cc`
- existing `research_subprofile_assignments` rows for this security: `0`
- existing secondary-exposure rows attached to a TORNTPHARM assignment: `0`

Because no prior assignment exists, the proposed assignment version is `1`.

The production UUID is recorded here for review/persistence targeting only. Runtime application code must continue to resolve the current environment security identity rather than hard-coding this production UUID.

## 2. Candidate authority

The repository candidate registry currently supplies:

```text
symbol: TORNTPHARM
profile_code: PHARMA_V1
proposed_primary_subprofile_code: DOMESTIC_FORMULATIONS
candidate_review_state: PROVISIONAL
candidate_source_reference: OWNER_SUPPLIED_R4N_REVIEW_SET_2026_09_15
candidate_reason_code: OWNER_PROPOSED_REVIEW_CANDIDATE
```

Gate E evidence review upgrades confidence for the review package, but the candidate registry itself remains a provisional review set and is not the canonical stored assignment authority.

## 3. Primary-subprofile review

Proposed primary assignment:

```text
profile_code: PHARMA_V1
primary_subprofile_code: DOMESTIC_FORMULATIONS
assignment_version: 1
assignment_state: PROVISIONAL
confidence: HIGH
effective_from: 2026-03-31
effective_to: null
```

Evidence basis retained for human review:

1. `TORNTPHARM_AR_2025_26`
   - official FY2025-26 annual report;
   - India is the largest market / foundation of the branded-generics business;
   - FY2025-26 standalone India revenue is approximately 72% of standalone revenue from operations;
   - supports `DOMESTIC_FORMULATIONS` as the primary operating model.

2. `TORNTPHARM_AR_2024_25`
   - official FY2024-25 annual report;
   - corroborates the large India branded-formulations franchise, chronic/sub-chronic therapy orientation and brand leadership.

3. `TORNTPHARM_Q4_FY25_26_EARNINGS_CALL`
   - official earnings-call transcript;
   - corroborates India-focused new launches / pipeline and branded-franchise execution.

Primary evidence classification for the review builder:

```json
[
  {
    "evidenceId": "torn-primary-domestic-fy26",
    "sourceReference": "TORNTPHARM_AR_2025_26",
    "sourceRecordId": null,
    "classification": "SUBPROFILE_EVIDENCE",
    "stance": "SUPPORTS",
    "eligibleForPromotion": true,
    "summary": "FY2025-26 issuer disclosure supports DOMESTIC_FORMULATIONS as the primary business model, with India representing the dominant standalone revenue share and the core branded-generics franchise."
  },
  {
    "evidenceId": "torn-primary-domestic-fy25",
    "sourceReference": "TORNTPHARM_AR_2024_25",
    "sourceRecordId": null,
    "classification": "SUBPROFILE_EVIDENCE",
    "stance": "SUPPORTS",
    "eligibleForPromotion": true,
    "summary": "Prior-year issuer disclosure corroborates a large domestic branded-formulations franchise with chronic/sub-chronic therapy and brand leadership."
  },
  {
    "evidenceId": "torn-primary-launch-pipeline-fy26",
    "sourceReference": "TORNTPHARM_Q4_FY25_26_EARNINGS_CALL",
    "sourceRecordId": null,
    "classification": "SUBPROFILE_EVIDENCE",
    "stance": "SUPPORTS",
    "eligibleForPromotion": true,
    "summary": "Issuer earnings-call disclosure corroborates India-focused launches and branded-franchise execution."
  }
]
```

## 4. Reviewed secondary exposures

### GLOBAL_GENERICS — MATERIAL / MEDIUM

Evidence basis:

- `TORNTPHARM_AR_2025_26`
- `TORNTPHARM_Q2_FY25_26_EARNINGS_CALL`

The issuer explicitly characterizes the US and Germany businesses as generic businesses. Comparable FY2025-26 standalone US plus Germany/Malta revenue is approximately 12.05% of standalone revenue from operations. Under the owner-approved Gate E V1 materiality rule, a supported business-model exposure from 10% to <50% is `MATERIAL`.

Exact secondary assessment:

```json
{
  "exposureCode": "GLOBAL_GENERICS",
  "materiality": "MATERIAL",
  "confidence": "MEDIUM",
  "evidenceReferences": [
    "TORNTPHARM_AR_2025_26",
    "TORNTPHARM_Q2_FY25_26_EARNINGS_CALL"
  ]
}
```

Review consequence: activate applicable export / regulated-market / regulatory-site evidence requirements and overlays. This exposure does not create or blend a second score.

### CDMO_CRAMS — EMERGING / MEDIUM

Evidence basis:

- `TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29`
- `TORNTPHARM_AR_2025_26`

The issuer describes the JB Pharma combination as adding / expanding international CDMO capability and a meaningful entry/expansion opportunity into the CDMO segment. The accounting line labelled contract manufacturing is **not** used as the quantitative CDMO numerator because the issuer does not explicitly map that full line to the approved `CDMO_CRAMS` business model.

The owner-approved V1 methodology permits an `EMERGING` qualitative classification when retained issuer evidence identifies a strategically significant growing operating model, provided provenance, confidence and effective date are explicit.

Exact secondary assessment:

```json
{
  "exposureCode": "CDMO_CRAMS",
  "materiality": "EMERGING",
  "confidence": "MEDIUM",
  "evidenceReferences": [
    "TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29",
    "TORNTPHARM_AR_2025_26"
  ]
}
```

Review consequence: activate only requirements explicitly designed for an `EMERGING` CDMO exposure. This exposure does not create or blend a second score.

## 5. Conditional-materiality review

Gate E V1 conditional-materiality review is complete for the current package:

- `GLOBAL_GENERICS = MATERIAL` -> applicable regulated-market/export/regulatory-site conditions are active where the composed contract defines activation for material exposure.
- `CDMO_CRAMS = EMERGING` -> only requirements explicitly designed for emerging CDMO exposure become active.
- no secondary exposure remains `UNKNOWN` in this review package.
- no secondary exposure is `DOMINANT`; therefore no primary-subprofile reclassification blocker is raised.

## 6. Exact `BuildPharmaSubprofileReviewPackageInput`

The exact human-review input represented by this artifact is:

```json
{
  "candidate": {
    "symbol": "TORNTPHARM",
    "profileCode": "PHARMA_V1",
    "proposedPrimarySubprofileCode": "DOMESTIC_FORMULATIONS",
    "reviewState": "PROVISIONAL",
    "proposedEffectiveFrom": null,
    "sourceReference": "OWNER_SUPPLIED_R4N_REVIEW_SET_2026_09_15",
    "reasonCode": "OWNER_PROPOSED_REVIEW_CANDIDATE",
    "confidence": "LOW",
    "proposedSecondaryExposures": []
  },
  "securityId": "da69b3eb-0343-44f8-912c-288b826118cc",
  "assignmentVersionCandidate": 1,
  "proposedConfidence": "HIGH",
  "effectiveFromCandidate": "2026-03-31",
  "evidenceItems": [
    {
      "evidenceId": "torn-primary-domestic-fy26",
      "sourceReference": "TORNTPHARM_AR_2025_26",
      "sourceRecordId": null,
      "classification": "SUBPROFILE_EVIDENCE",
      "stance": "SUPPORTS",
      "eligibleForPromotion": true,
      "summary": "FY2025-26 issuer disclosure supports DOMESTIC_FORMULATIONS as the primary business model, with India representing the dominant standalone revenue share and the core branded-generics franchise."
    },
    {
      "evidenceId": "torn-primary-domestic-fy25",
      "sourceReference": "TORNTPHARM_AR_2024_25",
      "sourceRecordId": null,
      "classification": "SUBPROFILE_EVIDENCE",
      "stance": "SUPPORTS",
      "eligibleForPromotion": true,
      "summary": "Prior-year issuer disclosure corroborates a large domestic branded-formulations franchise with chronic/sub-chronic therapy and brand leadership."
    },
    {
      "evidenceId": "torn-primary-launch-pipeline-fy26",
      "sourceReference": "TORNTPHARM_Q4_FY25_26_EARNINGS_CALL",
      "sourceRecordId": null,
      "classification": "SUBPROFILE_EVIDENCE",
      "stance": "SUPPORTS",
      "eligibleForPromotion": true,
      "summary": "Issuer earnings-call disclosure corroborates India-focused launches and branded-franchise execution."
    },
    {
      "evidenceId": "torn-secondary-global-generics",
      "sourceReference": "TORNTPHARM_AR_2025_26; TORNTPHARM_Q2_FY25_26_EARNINGS_CALL",
      "sourceRecordId": null,
      "classification": "CONDITION_ACTIVATION_EVIDENCE",
      "stance": "SUPPORTS",
      "eligibleForPromotion": false,
      "summary": "Issuer-defined US and Germany generic businesses support a MATERIAL GLOBAL_GENERICS secondary exposure under the approved V1 materiality rule."
    },
    {
      "evidenceId": "torn-secondary-cdmo",
      "sourceReference": "TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29; TORNTPHARM_AR_2025_26",
      "sourceRecordId": null,
      "classification": "CONDITION_ACTIVATION_EVIDENCE",
      "stance": "SUPPORTS",
      "eligibleForPromotion": false,
      "summary": "Issuer disclosure identifies CDMO as a strategically significant emerging capability; no unsupported quantitative mapping from the full contract-manufacturing accounting line is used."
    }
  ],
  "secondaryExposureAssessment": [
    {
      "exposureCode": "GLOBAL_GENERICS",
      "materiality": "MATERIAL",
      "confidence": "MEDIUM",
      "evidenceReferences": [
        "TORNTPHARM_AR_2025_26",
        "TORNTPHARM_Q2_FY25_26_EARNINGS_CALL"
      ]
    },
    {
      "exposureCode": "CDMO_CRAMS",
      "materiality": "EMERGING",
      "confidence": "MEDIUM",
      "evidenceReferences": [
        "TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29",
        "TORNTPHARM_AR_2025_26"
      ]
    }
  ],
  "secondaryExposuresReviewed": true,
  "conditionalMaterialityReviewed": true
}
```

## 7. Expected review-builder result

Given the currently validated Gate E review-package logic, the above input should produce:

```text
reviewDecision: READY_FOR_REVIEW
primaryModelAssessment.supportState: SUPPORTED
primaryModelAssessment.confidence: HIGH
blockers: []
proposedAssignment.assignmentState: PROVISIONAL
proposedAssignment.reviewedBy: null
proposedAssignment.reviewedAt: null
```

Expected proposed assignment payload:

```json
{
  "securityId": "da69b3eb-0343-44f8-912c-288b826118cc",
  "profileCode": "PHARMA_V1",
  "primarySubprofileCode": "DOMESTIC_FORMULATIONS",
  "assignmentVersion": 1,
  "assignmentState": "PROVISIONAL",
  "effectiveFrom": "2026-03-31",
  "effectiveTo": null,
  "sourceReference": "TORNTPHARM_AR_2025_26; TORNTPHARM_AR_2024_25; TORNTPHARM_Q4_FY25_26_EARNINGS_CALL",
  "reasonCode": "EVIDENCE_BACKED_REVIEW_READY",
  "confidence": "HIGH",
  "reviewedBy": null,
  "reviewedAt": null,
  "secondaryExposures": [
    {
      "exposureCode": "GLOBAL_GENERICS",
      "materiality": "MATERIAL",
      "confidence": "MEDIUM",
      "assignmentState": "PROVISIONAL",
      "effectiveFrom": "2026-03-31",
      "effectiveTo": null,
      "sourceReference": "TORNTPHARM_AR_2025_26; TORNTPHARM_Q2_FY25_26_EARNINGS_CALL",
      "reasonCode": "SECONDARY_EXPOSURE_REVIEWED_IN_PACKAGE",
      "reviewedBy": null,
      "reviewedAt": null
    },
    {
      "exposureCode": "CDMO_CRAMS",
      "materiality": "EMERGING",
      "confidence": "MEDIUM",
      "assignmentState": "PROVISIONAL",
      "effectiveFrom": "2026-03-31",
      "effectiveTo": null,
      "sourceReference": "TORNTPHARM_JB_PHARMA_ACQUISITION_RELEASE_2025_06_29; TORNTPHARM_AR_2025_26",
      "reasonCode": "SECONDARY_EXPOSURE_REVIEWED_IN_PACKAGE",
      "reviewedBy": null,
      "reviewedAt": null
    }
  ]
}
```

## 8. Human-review decision requested

The owner/reviewer should review the package as a whole, specifically:

1. Is `DOMESTIC_FORMULATIONS` accepted as the primary TORNTPHARM subprofile?
2. Is `HIGH` confidence accepted for the primary assignment?
3. Is `2026-03-31` accepted as the effective-from date for assignment version 1?
4. Is `GLOBAL_GENERICS = MATERIAL / MEDIUM` accepted as a secondary exposure?
5. Is `CDMO_CRAMS = EMERGING / MEDIUM` accepted as a secondary exposure?
6. Are the source references and evidence interpretations accepted for Gate E assignment purposes?

A positive human review of this document means only that the package is approved for preparation of a separately gated canonical persistence action. It does **not** itself authorize any production database write.

## 9. Persistence boundary

No SQL, migration, Edge Function, provider call, or production mutation is part of this package. If the human review is approved, the next stage must first prepare the exact persistence plan and perform an immediate read-only production preflight. A production assignment write must still require a separate, explicit owner authorization naming that exact action.
