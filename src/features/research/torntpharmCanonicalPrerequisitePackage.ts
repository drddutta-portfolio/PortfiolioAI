import { buildTorntpharmReadOnlyContentReviewDryRun } from "./torntpharmReadOnlyContentReviewDryRun"

export const TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_VERSION =
  "TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_V1" as const

export interface TorntpharmMetricDefinitionRegistrationProposal {
  readonly code: "PHARMA_EXPORT_US_REVENUE_GROWTH"
  readonly name: "Export / US Revenue Growth"
  readonly valueKind: "NUMERIC"
  readonly canonicalUnit: "PERCENT"
  readonly statementScope: "PHARMA_BUSINESS_MODEL"
  readonly freshnessSeconds: 10368000
  readonly definition: {
    readonly provider: "COMPANY_EXCHANGE_FILING"
    readonly selection: "REVIEWED"
    readonly periodType: "QUARTER"
    readonly semanticGuard: "SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY"
    readonly mappingVersion: "PHARMA_V1_GLOBAL_GENERICS_V1"
    readonly sourcePriority: readonly ["COMPANY_EXCHANGE_FILING"]
    readonly rejectedSubstitutes: readonly ["TOTAL_INTERNATIONAL_REVENUE_GROWTH_WITHOUT_COMPATIBLE_SCOPE"]
  }
  readonly isActive: true
}

export interface TorntpharmSourceRecordMaterializationProposal {
  readonly sourceCode: "COMPANY_EXCHANGE_FILING"
  readonly recordKind: "ISSUER_RESULTS_RELEASE"
  readonly externalRecordId: string
  readonly sourceUrl: string
  readonly rawPayload: {
    readonly contractVersion: "TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1"
    readonly artifactCode: string
    readonly artifactTitle: string
    readonly artifactPeriod: string
    readonly reviewState: "READ_ONLY_REVIEWED"
    readonly metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH"
    readonly observationDate: string
    readonly reviewedValue: string
    readonly unit: "PERCENT"
    readonly basis: string
    readonly provenanceSummary: string
  }
  readonly payloadHashAlgorithm: "SHA256"
  readonly payloadHashState: "COMPUTE_AT_MATERIALIZATION_FROM_CANONICAL_RAW_PAYLOAD"
  readonly payloadHash: null
  readonly termsSnapshot: {
    readonly sourceClass: "PUBLIC_PRIMARY_ISSUER"
    readonly retentionScope: "METADATA_AND_EXTRACTED_PUBLIC_FACTS_ONLY"
    readonly reviewedContentOnly: true
  }
  readonly materializationAuthorized: false
}

export interface TorntpharmCanonicalPrerequisitePackage {
  readonly packageVersion: typeof TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_VERSION
  readonly metricDefinition: TorntpharmMetricDefinitionRegistrationProposal
  readonly sourceRecords: readonly TorntpharmSourceRecordMaterializationProposal[]
  readonly sourceRegistryPrecondition: {
    readonly sourceCode: "COMPANY_EXCHANGE_FILING"
    readonly expectedActive: true
    readonly expectedEntitlementVerified: true
    readonly expectedRetentionRightsVerified: true
  }
  readonly summary: {
    readonly metricDefinitionsPrepared: 1
    readonly sourceRecordsPrepared: 4
    readonly payloadHashesMaterialized: 0
    readonly proposedWrites: 0
  }
  readonly mutationAuthorized: false
}

export function buildTorntpharmCanonicalPrerequisitePackage(): TorntpharmCanonicalPrerequisitePackage {
  const review = buildTorntpharmReadOnlyContentReviewDryRun()
  const artifacts = new Map(review.reviewedArtifacts.map((item) => [item.code, item]))
  const numericCandidates = review.proposedCandidates.filter(
    (item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH",
  )

  if (numericCandidates.length !== 4) {
    throw new Error(`Expected 4 reviewed US-growth candidates, found ${numericCandidates.length}`)
  }

  const sourceRecords = numericCandidates.map((candidate): TorntpharmSourceRecordMaterializationProposal => {
    const artifact = artifacts.get(candidate.artifactCode)
    if (!artifact) throw new Error(`Missing reviewed artifact for ${candidate.artifactCode}`)

    return {
      sourceCode: "COMPANY_EXCHANGE_FILING",
      recordKind: "ISSUER_RESULTS_RELEASE",
      externalRecordId: candidate.artifactCode,
      sourceUrl: artifact.locator,
      rawPayload: {
        contractVersion: "TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1",
        artifactCode: candidate.artifactCode,
        artifactTitle: artifact.title,
        artifactPeriod: artifact.period,
        reviewState: artifact.reviewState,
        metricCode: candidate.metricCode,
        observationDate: candidate.observationDate,
        reviewedValue: candidate.value,
        unit: candidate.unit,
        basis: candidate.basis,
        provenanceSummary: candidate.provenanceSummary,
      },
      payloadHashAlgorithm: "SHA256",
      payloadHashState: "COMPUTE_AT_MATERIALIZATION_FROM_CANONICAL_RAW_PAYLOAD",
      payloadHash: null,
      termsSnapshot: {
        sourceClass: "PUBLIC_PRIMARY_ISSUER",
        retentionScope: "METADATA_AND_EXTRACTED_PUBLIC_FACTS_ONLY",
        reviewedContentOnly: true,
      },
      materializationAuthorized: false,
    }
  })

  return {
    packageVersion: TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_VERSION,
    metricDefinition: {
      code: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      name: "Export / US Revenue Growth",
      valueKind: "NUMERIC",
      canonicalUnit: "PERCENT",
      statementScope: "PHARMA_BUSINESS_MODEL",
      freshnessSeconds: 10368000,
      definition: {
        provider: "COMPANY_EXCHANGE_FILING",
        selection: "REVIEWED",
        periodType: "QUARTER",
        semanticGuard: "SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY",
        mappingVersion: "PHARMA_V1_GLOBAL_GENERICS_V1",
        sourcePriority: ["COMPANY_EXCHANGE_FILING"],
        rejectedSubstitutes: ["TOTAL_INTERNATIONAL_REVENUE_GROWTH_WITHOUT_COMPATIBLE_SCOPE"],
      },
      isActive: true,
    },
    sourceRecords,
    sourceRegistryPrecondition: {
      sourceCode: "COMPANY_EXCHANGE_FILING",
      expectedActive: true,
      expectedEntitlementVerified: true,
      expectedRetentionRightsVerified: true,
    },
    summary: {
      metricDefinitionsPrepared: 1,
      sourceRecordsPrepared: 4,
      payloadHashesMaterialized: 0,
      proposedWrites: 0,
    },
    mutationAuthorized: false,
  }
}
