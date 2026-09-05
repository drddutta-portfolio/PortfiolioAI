import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import {
  analyzeImport,
  normalizeSourceTicker,
  type ManualSecurityMappings,
} from "../features/import/analyzeImport"
import { parseImportFile } from "../features/import/workbookParser"
import type {
  DuplicateContext,
  ImportAnalysis,
  ImportReferences,
  ImportSourceType,
  ParsedImportFile,
  StageImportResult,
} from "../features/import/types"
import {
  loadDuplicateContext,
  loadImportReferences,
  stageImport,
} from "../data/importRepository"

const EMPTY_DUPLICATE_CONTEXT: DuplicateContext = {
  duplicateOfImportBatchId: null,
  priorRowHashes: new Set<string>(),
}

function displayError(error: unknown) {
  return error instanceof Error ? error.message : "The import operation failed unexpectedly."
}

export function ImportPage() {
  const [references, setReferences] = useState<ImportReferences | null>(null)
  const [portfolioId, setPortfolioId] = useState("")
  const [sourceType, setSourceType] = useState<ImportSourceType>("PORTFOLIO_HISTORICAL_XLSX")
  const [file, setFile] = useState<File | null>(null)
  const [parsedFile, setParsedFile] = useState<ParsedImportFile | null>(null)
  const [duplicateContext, setDuplicateContext] = useState<DuplicateContext>(EMPTY_DUPLICATE_CONTEXT)
  const [manualMappings, setManualMappings] = useState<ManualSecurityMappings>({})
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null)
  const [stageResult, setStageResult] = useState<StageImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isStaging, setIsStaging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void loadImportReferences()
      .then((loaded) => {
        if (!active) return
        setReferences(loaded)
        setPortfolioId(loaded.portfolios[0]?.id ?? "")
      })
      .catch((loadError: unknown) => {
        if (active) setError(displayError(loadError))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  const unresolvedRows = useMemo(
    () => analysis?.rows.filter((row) =>
      row.source.sheetKind === "TRANSACTIONS" && row.validationStatus !== "VALID") ?? [],
    [analysis],
  )
  const selectedPortfolioReferences = useMemo<ImportReferences | null>(() => references ? {
    ...references,
    brokerAccounts: references.brokerAccounts.filter(
      (account) => account.portfolioId === portfolioId,
    ),
  } : null, [portfolioId, references])

  const resetAnalysis = () => {
    setParsedFile(null)
    setDuplicateContext(EMPTY_DUPLICATE_CONTEXT)
    setManualMappings({})
    setAnalysis(null)
    setStageResult(null)
    setError(null)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    resetAnalysis()
  }

  const handleAnalyze = async () => {
    if (!file || !portfolioId || !selectedPortfolioReferences) return
    setIsAnalyzing(true)
    setError(null)
    setStageResult(null)
    try {
      const parsed = await parseImportFile(file, sourceType)
      const duplicates = await loadDuplicateContext(
        portfolioId,
        sourceType,
        parsed.fileSha256,
        parsed.rows.map((row) => row.rawRowHash),
      )
      setParsedFile(parsed)
      setDuplicateContext(duplicates)
      setManualMappings({})
      setAnalysis(analyzeImport(parsed, selectedPortfolioReferences, {}, duplicates))
    } catch (analysisError) {
      setError(displayError(analysisError))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleManualMapping = (ticker: string, securityId: string) => {
    if (!parsedFile || !selectedPortfolioReferences) return
    const key = normalizeSourceTicker(ticker)
    const nextMappings = { ...manualMappings }
    if (securityId) nextMappings[key] = securityId
    else delete nextMappings[key]
    setManualMappings(nextMappings)
    setAnalysis(analyzeImport(parsedFile, selectedPortfolioReferences, nextMappings, duplicateContext))
    setStageResult(null)
  }

  const handleStage = async () => {
    if (!analysis || !portfolioId) return
    setIsStaging(true)
    setError(null)
    try {
      setStageResult(await stageImport({ portfolioId, sourceType, analysis }))
    } catch (stageError) {
      setError(displayError(stageError))
    } finally {
      setIsStaging(false)
    }
  }

  if (isLoading) return <div className="import-page"><p className="muted">Loading import references…</p></div>

  return (
    <section className="import-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Auditable ingestion</p>
          <h1>Data Import Centre</h1>
          <p>Parse, map, validate and reconcile source evidence before any ledger commit.</p>
        </div>
        <span className="safety-badge">Ledger writes locked</span>
      </div>

      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      {!references?.portfolios.length ? (
        <div className="notice notice-error" role="alert">
          No active portfolio is available. Create an owned portfolio before staging an import.
        </div>
      ) : null}

      <div className="import-grid">
        <section className="panel import-setup">
          <div className="panel-heading">
            <span className="step-number">1</span>
            <div><h2>Select source</h2><p>No source binary is uploaded to Supabase.</p></div>
          </div>
          <label htmlFor="portfolio">Portfolio</label>
          <select
            id="portfolio"
            value={portfolioId}
            onChange={(event) => { setPortfolioId(event.target.value); resetAnalysis() }}
          >
            {references?.portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>{portfolio.name}</option>
            ))}
          </select>
          <label htmlFor="source-type">Source type</label>
          <select
            id="source-type"
            value={sourceType}
            onChange={(event) => {
              setSourceType(event.target.value as ImportSourceType)
              setFile(null)
              resetAnalysis()
            }}
          >
            <option value="PORTFOLIO_HISTORICAL_XLSX">Portfolio Historical XLSX</option>
            <option value="GENERIC_CSV">Generic CSV</option>
          </select>
          <label htmlFor="import-file">Source file</label>
          <input
            id="import-file"
            className="file-input"
            type="file"
            accept={sourceType === "GENERIC_CSV" ? ".csv,text/csv" : ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
            onChange={handleFileChange}
          />
          <button
            className="button button-primary"
            type="button"
            disabled={!file || !portfolioId || isAnalyzing}
            onClick={() => void handleAnalyze()}
          >
            {isAnalyzing ? "Analyzing evidence…" : "Analyze locally"}
          </button>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <span className="step-number">2</span>
            <div><h2>Workbook summary</h2><p>Supported sheets are detected case-insensitively.</p></div>
          </div>
          {analysis ? (
            <>
              <dl className="metadata-list">
                <div><dt>File</dt><dd>{analysis.file.fileName}</dd></div>
                <div><dt>Format</dt><dd>{analysis.file.fileFormat}</dd></div>
                <div><dt>SHA-256</dt><dd className="hash-value">{analysis.file.fileSha256}</dd></div>
                <div><dt>Exact-file retry</dt><dd>{analysis.duplicateOfImportBatchId ? "Detected" : "No prior attempt"}</dd></div>
              </dl>
              <div className="sheet-list">
                {analysis.file.sheets.map((sheet) => (
                  <div key={sheet.originalName}>
                    <span>{sheet.originalName}</span>
                    <span className={`tag ${sheet.kind === "UNSUPPORTED" ? "tag-muted" : ""}`}>
                      {sheet.kind} · {sheet.dataRowCount} rows
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="empty-copy">Choose a file and analyze it to inspect workbook structure.</p>}
        </section>
      </div>

      {analysis ? (
        <>
          <section className="panel summary-panel">
            <div className="panel-heading">
              <span className="step-number">3</span>
              <div><h2>Validation summary</h2><p>Missing dates and brokers remain explicit nulls.</p></div>
            </div>
            <div className="metric-grid">
              <Metric label="Transactions" value={analysis.summary.parsedTransactionCount} />
              <Metric label="Valid" value={analysis.summary.validRowCount} tone="good" />
              <Metric label="Invalid" value={analysis.summary.invalidRowCount} tone={analysis.summary.invalidRowCount ? "warn" : "good"} />
              <Metric label="Ambiguous" value={analysis.summary.ambiguousRowCount} tone={analysis.summary.ambiguousRowCount ? "warn" : "good"} />
              <Metric label="Needs review" value={analysis.summary.needsReviewCount} tone={analysis.summary.needsReviewCount ? "warn" : "good"} />
              <Metric label="Possible duplicates" value={analysis.summary.duplicateRowCount} tone={analysis.summary.duplicateRowCount ? "warn" : "good"} />
              <Metric label="Missing date" value={analysis.summary.missingDateCount} />
              <Metric label="Missing broker" value={analysis.summary.missingBrokerCount} />
              <Metric label="Mapped securities" value={analysis.summary.mappedSecurityCount} />
              <Metric label="Unmapped securities" value={analysis.summary.unmappedSecurityCount} tone={analysis.summary.unmappedSecurityCount ? "warn" : "good"} />
              <Metric label="BUY" value={analysis.summary.buyCount} />
              <Metric label="SELL" value={analysis.summary.sellCount} />
            </div>
          </section>

          {analysis.unresolvedTickers.length > 0 ? (
            <section className="panel">
              <div className="panel-heading">
                <span className="step-number">4</span>
                <div><h2>Controlled security mapping</h2><p>Unresolved tickers are never used to create securities automatically.</p></div>
              </div>
              <div className="mapping-list">
                {analysis.unresolvedTickers.map((ticker) => (
                  <label key={ticker}>
                    <span>{ticker}</span>
                    <select
                      value={manualMappings[ticker] ?? ""}
                      disabled={stageResult !== null}
                      onChange={(event) => handleManualMapping(ticker, event.target.value)}
                    >
                      <option value="">Requires review</option>
                      {references?.securities.map((security) => (
                        <option key={security.id} value={security.id}>
                          {security.symbol} · {security.exchange} · {security.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-heading">
              <span className="step-number">5</span>
              <div><h2>Reconciliation</h2><p>BUY units minus SELL units versus the holdings snapshot.</p></div>
            </div>
            {!analysis.reconciliation.available ? (
              <p className="empty-copy">No holdings sheet is available; reconciliation is not claimed.</p>
            ) : (
              <>
                <div className={`reconciliation-result ${analysis.reconciliation.mismatchCount ? "has-mismatch" : "is-match"}`}>
                  <strong>{analysis.reconciliation.holdingsRowCount} holdings rows</strong>
                  <span>{analysis.reconciliation.mismatchCount} quantity mismatches</span>
                </div>
                {analysis.reconciliation.mismatchCount > 0 ? (
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Security</th><th>Transactions</th><th>Holdings</th><th>Difference</th></tr></thead>
                      <tbody>
                        {analysis.reconciliation.rows.filter((row) => !row.matches).slice(0, 100).map((row) => (
                          <tr key={row.identity}>
                            <td>{row.label}</td><td>{row.transactionQuantity ?? "Unknown"}</td>
                            <td>{row.holdingsQuantity ?? "Unknown"}</td><td>{row.difference ?? "Unknown"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span className="step-number">6</span>
              <div><h2>Unresolved and review rows</h2><p>No row is silently discarded.</p></div>
            </div>
            {unresolvedRows.length === 0 ? <p className="empty-copy">No transaction rows currently require review.</p> : (
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Sheet / row</th><th>Ticker</th><th>Status</th><th>Issues</th></tr></thead>
                  <tbody>
                    {unresolvedRows.slice(0, 100).map((row) => (
                      <tr key={`${row.source.sheetName}-${row.source.originalRowNumber}`}>
                        <td>{row.source.sheetName} · {row.source.originalRowNumber}</td>
                        <td>{row.normalized?.sourceTicker ?? "Unknown"}</td>
                        <td><span className="tag tag-muted">{row.validationStatus}</span></td>
                        <td>{[...row.validationErrors, ...row.validationWarnings].join(" ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {unresolvedRows.length > 100 ? <p className="muted">Showing the first 100 of {unresolvedRows.length} review rows.</p> : null}
              </div>
            )}
          </section>

          <section className="panel commit-panel">
            <div>
              <p className="eyebrow">Review boundary</p>
              <h2>Stage evidence, then stop</h2>
              <p>
                Staging creates an owned import batch and immutable raw source evidence. It does not write transactions.
              </p>
              {stageResult ? (
                <div className="notice notice-success" role="status">
                  Batch {stageResult.importBatchId} staged with status {stageResult.status}.
                </div>
              ) : null}
            </div>
            <div className="commit-actions">
              <button
                className="button button-secondary"
                type="button"
                disabled={isStaging || stageResult !== null}
                onClick={() => void handleStage()}
              >
                {isStaging ? "Staging evidence…" : stageResult ? "Evidence staged" : "Stage reviewed evidence"}
              </button>
              <button className="button button-primary" type="button" disabled>
                Commit to ledger unavailable
              </button>
              <small>
                {analysis.validationComplete
                  ? "Validation is complete, but the reviewed trusted commit operation does not yet exist."
                  : "Resolve invalid, ambiguous, duplicate and reconciliation issues before future commit."}
              </small>
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}

function Metric({ label, value, tone }: {
  readonly label: string
  readonly value: number
  readonly tone?: "good" | "warn"
}) {
  return <div className={`metric ${tone ? `metric-${tone}` : ""}`}><strong>{value}</strong><span>{label}</span></div>
}
