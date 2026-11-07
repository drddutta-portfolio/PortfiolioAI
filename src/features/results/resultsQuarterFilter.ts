/**
 * Results row filtering must compare grade and NEW status on the SAME quarter.
 * Grade chips are OR'ed; the blue seven-day flag is AND'ed with those chips.
 * Without Blue, grades describe the latest displayed quarter only. Historical
 * grades never allow a company to bypass an active latest-quarter filter.
 */
export type ResultsGradeFilter = "STRONG" | "MIXED" | "WEAK" | "UNAVAILABLE"

export interface ResultsQuarterFilterCriteria {
  readonly securityId: string
  readonly quarterEnds: readonly string[] // newest first
  readonly selectedGrades: ReadonlySet<ResultsGradeFilter>
  readonly onlyNew: boolean
  readonly newlyReported: ReadonlyMap<string, number>
  readonly gradeForQuarter: (periodEnd: string) => ResultsGradeFilter
}

export function matchesResultsQuarterFilters(criteria: ResultsQuarterFilterCriteria): boolean {
  const { securityId, quarterEnds, selectedGrades, onlyNew, newlyReported, gradeForQuarter } = criteria
  if (!onlyNew && selectedGrades.size === 0) return true

  const eligibleEnds = onlyNew
    ? quarterEnds.filter(end => newlyReported.has(securityId + "|" + end))
    : quarterEnds.slice(0, 1) // current results column only; never any historical grade
  if (eligibleEnds.length === 0) return false
  if (selectedGrades.size === 0) return true

  // Green + Red + Grey means OR of grades. When Blue is enabled, the matched
  // grade must occur on a blue quarterly-result cell of the same company.
  return eligibleEnds.some(end => selectedGrades.has(gradeForQuarter(end)))
}
