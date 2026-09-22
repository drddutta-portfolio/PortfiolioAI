import { buildTorntpharmLocalNumericIngestionPackage } from "./torntpharmLocalNumericIngestionPackage"

export const TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_VERSION = "TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_V1" as const

export type NumericPreflightRowDisposition = "INSERT_CANDIDATE" | "ALREADY_PRESENT" | "CONFLICT" | "BLOCKED"

export interface LocalMetricDefinitionSnapshot {
  readonly code: string
  readonly valueKind: string
  readonly canonicalUnit: string
  readonly statementScope: string
  readonly isActive: boolean
}

export interface LocalSourceRecordSnapshot {
  readonly id: string
  readonly sourceCode: string
  readonly sourceArtifactCode: string
  readonly sourceReference: string
}

export interface LocalFundamentalObservationSnapshot {
  readonly metricCode: string
  readonly periodEnd: string
  readonly periodType: string
  readonly numericValue: string
  readonly unit: string
}

export interface TorntpharmLocalNumericPreflightSnapshot {
  readonly securityId: string
  readonly assignmentVersion: number
  readonly metricDefinition: LocalMetricDefinitionSnapshot | null
  readonly sourceRecords: readonly LocalSourceRecordSnapshot[]
  readonly existingObservations: readonly LocalFundamentalObservationSnapshot[]
}

export interface TorntpharmLocalNumericPreflightRowResult {
  readonly periodEnd: string
  readonly expectedValue: string
  readonly sourceArtifactCode: string
  readonly sourceRecordId: string | null
  readonly disposition: NumericPreflightRowDisposition
  readonly blockerCodes: readonly string[]
}

export interface TorntpharmLocalNumericPreflightResult {
  readonly preflightVersion: typeof TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_VERSION
  readonly rows: readonly TorntpharmLocalNumericPreflightRowResult[]
  readonly blockers: readonly string[]
  readonly summary: {
    readonly rowsChecked: 4
    readonly insertCandidates: number
    readonly alreadyPresent: number
    readonly conflicts: number
    readonly blocked: number
  }
  readonly readyForSeparateWriteApproval: boolean
  readonly writeAuthorized: false
}

export interface TorntpharmLocalNumericPreflightPlan {
  readonly preflightVersion: typeof TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_VERSION
  readonly status: "PREPARED_NOT_EXECUTED"
  readonly requiredLookups: readonly {
    readonly code: string
    readonly table: string
    readonly purpose: string
  }[]
  readonly expectedRows: readonly {
    readonly metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH"
    readonly periodEnd: string
    readonly numericValue: string
    readonly sourceArtifactCode: string
  }[]
  readonly writeAuthorized: false
}

function metricDefinitionMatches(snapshot: LocalMetricDefinitionSnapshot | null): boolean {
  return Boolean(
    snapshot &&
      snapshot.code === "PHARMA_EXPORT_US_REVENUE_GROWTH" &&
      snapshot.valueKind === "NUMERIC" &&
      snapshot.canonicalUnit === "PERCENT" &&
      snapshot.statementScope === "PHARMA_BUSINESS_MODEL" &&
      snapshot.isActive,
  )
}

function sourceRecordFor(
  sourceRecords: readonly LocalSourceRecordSnapshot[],
  artifactCode: string,
  sourceReference: string,
): LocalSourceRecordSnapshot | null {
  return sourceRecords.find(
    (row) =>
      row.sourceCode === "COMPANY_EXCHANGE_FILING" &&
      row.sourceArtifactCode === artifactCode &&
      row.sourceReference === sourceReference,
  ) ?? null
}

function existingObservationFor(
  observations: readonly LocalFundamentalObservationSnapshot[],
  periodEnd: string,
): LocalFundamentalObservationSnapshot | null {
  return observations.find(
    (row) =>
      row.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" &&
      row.periodType === "QUARTER" &&
      row.periodEnd === periodEnd,
  ) ?? null
}

export function buildTorntpharmLocalNumericPreflightPlan(
  securityId: string,
  assignmentVersion: number,
): TorntpharmLocalNumericPreflightPlan {
  const pkg = buildTorntpharmLocalNumericIngestionPackage(securityId, assignmentVersion)
  return {
    preflightVersion: TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_VERSION,
    status: "PREPARED_NOT_EXECUTED",
    requiredLookups: [
      {
        code: "METRIC_DEFINITION_LOOKUP",
        table: "fundamental_metric_definitions",
        purpose: "Confirm PHARMA_EXPORT_US_REVENUE_GROWTH is active with NUMERIC/PERCENT/PHARMA_BUSINESS_MODEL semantics.",
      },
      {
        code: "SOURCE_RECORD_LOOKUP",
        table: "data_source_records",
        purpose: "Resolve one immutable COMPANY_EXCHANGE_FILING source record for each reviewed Q1-Q4 FY26 artifact.",
      },
      {
        code: "EXISTING_FACT_LOOKUP",
        table: "fundamental_observations",
        purpose: "Detect exact existing facts versus conflicting quarter values before any insert is proposed.",
      },
      {
        code: "ASSIGNMENT_LOOKUP",
        table: "research_subprofile_assignments",
        purpose: "Confirm the local reviewed assignment version still matches the package.",
      },
    ],
    expectedRows: pkg.rows.map((row) => ({
      metricCode: row.metricCode,
      periodEnd: row.periodEnd,
      numericValue: row.numericValue,
      sourceArtifactCode: row.sourceArtifactCode,
    })),
    writeAuthorized: false,
  }
}

export function evaluateTorntpharmLocalNumericPreflight(
  snapshot: TorntpharmLocalNumericPreflightSnapshot,
): TorntpharmLocalNumericPreflightResult {
  const pkg = buildTorntpharmLocalNumericIngestionPackage(snapshot.securityId, snapshot.assignmentVersion)
  const blockers: string[] = []

  if (!metricDefinitionMatches(snapshot.metricDefinition)) blockers.push("METRIC_DEFINITION_MISSING_OR_MISMATCHED")
  if (snapshot.assignmentVersion <= 0) blockers.push("ASSIGNMENT_VERSION_INVALID")

  const rows = pkg.rows.map((row): TorntpharmLocalNumericPreflightRowResult => {
    const rowBlockers: string[] = []
    const source = sourceRecordFor(snapshot.sourceRecords, row.sourceArtifactCode, row.sourceReference)
    if (!source) rowBlockers.push("SOURCE_RECORD_MISSING")

    const existing = existingObservationFor(snapshot.existingObservations, row.periodEnd)
    let disposition: NumericPreflightRowDisposition = "INSERT_CANDIDATE"

    if (existing) {
      if (existing.numericValue === row.numericValue && existing.unit === row.unit) disposition = "ALREADY_PRESENT"
      else {
        disposition = "CONFLICT"
        rowBlockers.push("CONFLICTING_EXISTING_FACT")
      }
    }

    if (!metricDefinitionMatches(snapshot.metricDefinition) || snapshot.assignmentVersion <= 0 || !source) {
      if (disposition !== "CONFLICT") disposition = "BLOCKED"
    }

    return {
      periodEnd: row.periodEnd,
      expectedValue: row.numericValue,
      sourceArtifactCode: row.sourceArtifactCode,
      sourceRecordId: source?.id ?? null,
      disposition,
      blockerCodes: rowBlockers,
    }
  })

  const conflicts = rows.filter((row) => row.disposition === "CONFLICT").length
  const blocked = rows.filter((row) => row.disposition === "BLOCKED").length
  const insertCandidates = rows.filter((row) => row.disposition === "INSERT_CANDIDATE").length
  const alreadyPresent = rows.filter((row) => row.disposition === "ALREADY_PRESENT").length

  if (rows.some((row) => row.blockerCodes.includes("SOURCE_RECORD_MISSING"))) blockers.push("SOURCE_RECORDS_INCOMPLETE")
  if (conflicts) blockers.push("EXISTING_FACT_CONFLICT")

  return {
    preflightVersion: TORNTPHARM_LOCAL_NUMERIC_PREFLIGHT_VERSION,
    rows,
    blockers: [...new Set(blockers)],
    summary: {
      rowsChecked: 4,
      insertCandidates,
      alreadyPresent,
      conflicts,
      blocked,
    },
    readyForSeparateWriteApproval: blockers.length === 0 && conflicts === 0 && blocked === 0,
    writeAuthorized: false,
  }
}
