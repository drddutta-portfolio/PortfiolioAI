import { buildTorntpharmCandidateToIngestionProposal } from "./torntpharmCandidateToIngestionProposal"
import { buildTorntpharmReadOnlyContentReviewDryRun } from "./torntpharmReadOnlyContentReviewDryRun"

export const TORNTPHARM_LOCAL_NUMERIC_INGESTION_PACKAGE_VERSION = "TORNTPHARM_LOCAL_NUMERIC_INGESTION_V1" as const

export interface TorntpharmLocalNumericIngestionRow {
  readonly metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH"
  readonly periodEnd: string
  readonly periodType: "QUARTER"
  readonly numericValue: string
  readonly unit: "PERCENT"
  readonly consolidationScope: "UNKNOWN"
  readonly sourceCode: "COMPANY_EXCHANGE_FILING"
  readonly sourceArtifactCode: string
  readonly sourceReference: string
  readonly lineage: "DIRECT_OFFICIAL"
  readonly canonicalTarget: "fundamental_observations"
}

export interface TorntpharmLocalNumericIngestionPackage {
  readonly packageVersion: typeof TORNTPHARM_LOCAL_NUMERIC_INGESTION_PACKAGE_VERSION
  readonly rows: readonly TorntpharmLocalNumericIngestionRow[]
  readonly metricDefinitionProposal: {
    readonly code: "PHARMA_EXPORT_US_REVENUE_GROWTH"
    readonly name: "Export / US Revenue Growth"
    readonly valueKind: "NUMERIC"
    readonly canonicalUnit: "PERCENT"
    readonly statementScope: "PHARMA_BUSINESS_MODEL"
    readonly freshnessSeconds: 10368000
    readonly definition: {
      readonly selection: "REVIEWED"
      readonly periodType: "QUARTER"
      readonly mappingVersion: "PHARMA_V1_GLOBAL_GENERICS_V1"
      readonly semanticGuard: "SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY"
      readonly sourcePriority: readonly ["COMPANY_EXCHANGE_FILING"]
      readonly rejectedSubstitutes: readonly ["TOTAL_INTERNATIONAL_REVENUE_GROWTH_WITHOUT_COMPATIBLE_SCOPE"]
    }
  }
  readonly prerequisites: readonly {
    readonly code: string
    readonly required: true
    readonly satisfiedByPackage: boolean
    readonly detail: string
  }[]
  readonly summary: {
    readonly validatorAcceptedRows: 4
    readonly observationRowsPrepared: 4
    readonly sourceRecordsRequired: 4
    readonly metricDefinitionRegistrationRequired: 1
    readonly proposedWrites: 0
  }
  readonly dryRunOnly: true
  readonly writeAuthorized: false
}

export function buildTorntpharmLocalNumericIngestionPackage(
  securityId: string,
  assignmentVersion: number,
): TorntpharmLocalNumericIngestionPackage {
  const proposal = buildTorntpharmCandidateToIngestionProposal(securityId, assignmentVersion)
  const review = buildTorntpharmReadOnlyContentReviewDryRun()
  const artifacts = new Map(review.reviewedArtifacts.map((item) => [item.code, item]))

  const acceptedNumeric = proposal.items.filter(
    (item) =>
      item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" &&
      item.disposition === "SEPARATE_INGESTION_APPROVAL_REQUIRED" &&
      item.validatorIssueCodes.length === 0,
  )

  if (acceptedNumeric.length !== 4) {
    throw new Error(`Expected 4 validator-accepted US-growth candidates, found ${acceptedNumeric.length}`)
  }

  const rows = acceptedNumeric.map((item): TorntpharmLocalNumericIngestionRow => {
    const artifact = artifacts.get(item.artifactCode)
    if (!artifact) throw new Error(`Missing reviewed artifact metadata for ${item.artifactCode}`)
    return {
      metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      periodEnd: item.observationDate,
      periodType: "QUARTER",
      numericValue: item.value,
      unit: "PERCENT",
      consolidationScope: "UNKNOWN",
      sourceCode: "COMPANY_EXCHANGE_FILING",
      sourceArtifactCode: item.artifactCode,
      sourceReference: artifact.locator,
      lineage: "DIRECT_OFFICIAL",
      canonicalTarget: "fundamental_observations",
    }
  })

  return {
    packageVersion: TORNTPHARM_LOCAL_NUMERIC_INGESTION_PACKAGE_VERSION,
    rows,
    metricDefinitionProposal: {
      code: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      name: "Export / US Revenue Growth",
      valueKind: "NUMERIC",
      canonicalUnit: "PERCENT",
      statementScope: "PHARMA_BUSINESS_MODEL",
      freshnessSeconds: 10368000,
      definition: {
        selection: "REVIEWED",
        periodType: "QUARTER",
        mappingVersion: "PHARMA_V1_GLOBAL_GENERICS_V1",
        semanticGuard: "SEPARATELY_DISCLOSED_US_OR_EXPORT_REVENUE_GROWTH_ONLY",
        sourcePriority: ["COMPANY_EXCHANGE_FILING"],
        rejectedSubstitutes: ["TOTAL_INTERNATIONAL_REVENUE_GROWTH_WITHOUT_COMPATIBLE_SCOPE"],
      },
    },
    prerequisites: [
      {
        code: "SECURITY_IDENTITY_RESOLVED",
        required: true,
        satisfiedByPackage: Boolean(securityId),
        detail: "The local target security id must be resolved explicitly; never infer or reuse a production UUID.",
      },
      {
        code: "REVIEWED_SUBPROFILE_ASSIGNMENT_MATCHES",
        required: true,
        satisfiedByPackage: assignmentVersion > 0,
        detail: "The local reviewed PHARMA_V1 + Domestic Formulations assignment version must match the package.",
      },
      {
        code: "METRIC_DEFINITION_REGISTERED",
        required: true,
        satisfiedByPackage: false,
        detail: "fundamental_metric_definitions must contain PHARMA_EXPORT_US_REVENUE_GROWTH with canonical unit PERCENT before any observation insert.",
      },
      {
        code: "SOURCE_RECORDS_MATERIALIZED",
        required: true,
        satisfiedByPackage: false,
        detail: "Four immutable data_source_records rows must exist for the reviewed Q1-Q4 FY26 issuer releases; source_record_id is mandatory in fundamental_observations.",
      },
      {
        code: "EXISTING_FACT_CONFLICT_CHECK",
        required: true,
        satisfiedByPackage: false,
        detail: "Local preflight must compare security + metric + quarter identities and abort on conflicting existing values.",
      },
      {
        code: "SEPARATE_WRITE_APPROVAL",
        required: true,
        satisfiedByPackage: false,
        detail: "This package is preparation only. A local write requires a separate explicit owner approval.",
      },
    ],
    summary: {
      validatorAcceptedRows: 4,
      observationRowsPrepared: 4,
      sourceRecordsRequired: 4,
      metricDefinitionRegistrationRequired: 1,
      proposedWrites: 0,
    },
    dryRunOnly: true,
    writeAuthorized: false,
  }
}
