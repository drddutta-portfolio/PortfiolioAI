/** Offline-only plan generator. Deno read/write permissions; no network or database client. */
import { APPROVED_COMPLETE_RESEARCH_MAPPINGS } from "../supabase/functions/_shared/trendlyne-complete-research-mapping.ts"
import { P7_IC_CANONICAL_REQUIREMENT_METRICS } from "../supabase/functions/_shared/p7-ic-requirement-metrics.ts"
import { planEvidenceRequirement, unwrapTrendlyneMarkdown } from "../supabase/functions/_shared/p7-ic-evidence-normalization.ts"
import { parseExactTrendlyneFields, parseOwnershipQuarterCandidates, deduplicateRequests, V14_REMEDIATION_VERSION, type SourceAnchor, type AcquisitionRequest } from "../supabase/functions/_shared/v14-evidence-remediation.ts"
import { validateObservationSeries, type InputObservation, type MetricDefinition } from "../supabase/functions/_shared/p7-ic-input-validation.ts"

const [cacheDir, frozenFile, readinessFile, outDir] = Deno.args
if (!cacheDir || !frozenFile || !readinessFile || !outDir) throw new Error("Usage: deno run --allow-read --allow-write scripts/v14-action-b-phase1-plan.ts CACHE_DIR FROZEN_JSON ACTION_A_VALIDATED_JSON OUTPUT_DIR")
const read = async (file: string) => JSON.parse(await Deno.readTextFile(file))
const digest = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer))).map(value => value.toString(16).padStart(2, "0")).join("")
const expectedHash = "79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27"
if (await digest(await Deno.readFile(frozenFile)) !== expectedHash) throw new Error("FROZEN_MANIFEST_INTEGRITY_MISMATCH")
type Member = { security_id: string; symbol: string; name: string; isin: string; frozen_value_paise: number; profile_code: string; subprofile_code: string | null }
type Raw = { id: string; source_code: string; record_kind: string; retrieved_at: string; published_at: string | null; payload_hash: string; raw_payload: { security_id?: string; provider_instrument_id?: string; result?: string; results?: Record<string, string> } }
type Item = { requirement_code: string; metric_code: string | null; required: boolean; minimum_history: number; reason_code: string; benchmark_authority: string[]; evidence_state: string; normalized_value: unknown }
const manifest = await read(frozenFile)
const members = (manifest.members as Member[]).map(member => ({ security_id: member.security_id, symbol: member.symbol, name: member.name, isin: member.isin, frozen_value_paise: member.frozen_value_paise, profile_code: member.profile_code, subprofile_code: member.subprofile_code }))
if (members.length !== 111 || new Set(members.map(m => m.security_id)).size !== 111
  || members.reduce((sum, member) => sum + BigInt(member.frozen_value_paise), 0n) !== 132585696n) throw new Error("FROZEN_COHORT_CONTRACT_MISMATCH")
const cutoff = "2026-10-05T19:25:54.019754+00:00"
const raw = await read(cacheDir + "/research-source-records.json") as Raw[]
const observations = await read(cacheDir + "/observations.json") as (InputObservation & { security_id: string })[]
const definitions = await read(cacheDir + "/metric-definitions.json") as MetricDefinition[]
const readiness = await read(readinessFile) as { securityId: string; items: Item[] }[]
const memberById = new Map(members.map(m => [m.security_id, m]))
const mappings = APPROVED_COMPLETE_RESEARCH_MAPPINGS.map(mapping => ({ metricCode: mapping.canonicalCode,
  providerLabel: mapping.providerLabel, unit: mapping.canonicalUnit, periodType: mapping.periodType }))
const candidates: { source: SourceAnchor; kind: string; metricCode: string; providerLabel: string; value: string; periodEnd: string | null; periodType: string; unit: string; blockers: string[] }[] = []
const ownership: ReturnType<typeof parseOwnershipQuarterCandidates> = []
const documents: { source: SourceAnchor; documentId: string; publicationLabel: string | null; excerptPresent: boolean }[] = []
const rejected: { sourceRecordId: string; reason: string }[] = []
for (const record of raw) {
  const member = memberById.get(record.raw_payload.security_id ?? "")
  if (!member || !record.raw_payload.provider_instrument_id) continue
  if (Date.parse(record.retrieved_at) > Date.parse(cutoff)) throw new Error("CACHE_AFTER_CUTOFF")
  const source: SourceAnchor = { securityId: member.security_id, symbol: member.symbol,
    instrumentId: record.raw_payload.provider_instrument_id, recordId: record.id, payloadHash: record.payload_hash,
    provider: record.source_code, retrievedAt: record.retrieved_at, publishedAt: record.published_at }
  const results = record.raw_payload.result ? [record.raw_payload.result] : Object.values(record.raw_payload.results ?? {})
  for (const result of results) {
    try {
      if (record.record_kind.includes("OWNERSHIP")) ownership.push(...parseOwnershipQuarterCandidates(result, source))
      else if (record.record_kind.includes("DOCUMENT")) {
        const body = unwrapTrendlyneMarkdown(result)
        const lines = body.split(/\r?\n/u)
        for (let index = 0; index < lines.length; index++) {
          const fields = lines[index]!.trim().split("|")
          if (fields.length < 6 || fields[2] !== member.symbol || fields[3] !== source.instrumentId) continue
          const next = lines.findIndex((line, position) => position > index && /^\d+\|/u.test(line) && line.split("|").length >= 6)
          documents.push({ source, documentId: fields[0]!, publicationLabel: fields[5] ?? null,
            excerptPresent: lines.slice(index + 1, next < 0 ? undefined : next).join("\n").trim().length > 0 })
        }
      } else {
        for (const field of parseExactTrendlyneFields(result, source, mappings)) {
          if (field.value == null) continue
          candidates.push({ source, kind: record.record_kind, metricCode: field.mapping.metricCode,
            providerLabel: field.mapping.providerLabel, value: field.value, periodEnd: null,
            periodType: field.mapping.periodType, unit: field.mapping.unit,
            blockers: ["DATED_PERIOD_NOT_PROVEN", "REPORTING_SCOPE_NOT_PROVEN", "SOURCE_FIELD_METADATA_REVIEW_REQUIRED"] })
        }
      }
    } catch (error) { rejected.push({ sourceRecordId: record.id, reason: error instanceof Error ? error.message : "RAW_PARSE_REJECTED" }) }
  }
}
const requests: AcquisitionRequest[] = []
const jobs: Record<string, unknown>[] = []
for (const snapshot of readiness) {
  const member = memberById.get(snapshot.securityId)
  if (!member) continue
  for (const item of snapshot.items) {
    if (!item.required || item.reason_code === "IC3_LINEAGE_READY" || item.requirement_code === "READINESS_INPUT_LINEAGE") continue
    const requirement = planEvidenceRequirement(item.requirement_code, item.minimum_history)
    const metricCodes = item.metric_code ? [item.metric_code] : P7_IC_CANONICAL_REQUIREMENT_METRICS[item.requirement_code] ?? []
    const cachedRows = observations.filter(row => row.security_id === member.security_id && metricCodes.includes(row.metric_code))
    const cacheValidation = validateObservationSeries({ rows: cachedRows, definitions, minimum: item.minimum_history,
      evaluationAsOfMs: Date.parse(cutoff), sourceCutoffAtMs: Date.parse(cutoff) })
    const fieldCandidates = candidates.filter(candidate => candidate.source.securityId === member.security_id && metricCodes.includes(candidate.metricCode))
    const documentCandidates = documents.filter(document => document.source.securityId === member.security_id)
    const ownershipCandidates = ownership.filter(candidate => candidate.source.securityId === member.security_id)
    const mapped = mappings.filter(mapping => metricCodes.includes(mapping.metricCode))
    let mode = "BLOCKED_CONTRACT"
    let blocker = "EXACT_FIELD_PERIOD_OR_SCOPE_CONTRACT_NOT_PROVEN"
    let request: AcquisitionRequest | null = null
    let cacheRefs: unknown[] = []
    if (item.reason_code === "METHODOLOGY_REVIEW_REQUIRED") blocker = "FACTUAL_SUBPROFILE_REVIEW_REQUIRED_NO_PROVIDER_SUBSTITUTION"
    else if (cacheValidation.state === "FRESH") { mode = "CACHE_CANONICAL_VALIDATED"; blocker = "NONE"; cacheRefs = cacheValidation.selected.map(row => row.id) }
    else if (requirement.channels.includes("TRENDLYNE_DOCUMENTS")) {
      cacheRefs = documentCandidates.map(document => `${document.source.recordId}:document:${document.documentId}`)
      if (documentCandidates.some(document => document.excerptPresent)) { mode = "CACHE_EXCERPT_REVIEW"; blocker = "CITED_DOCUMENT_REVIEW_AND_REQUIREMENT_FACT_CONTRACT_REQUIRED" }
      else {
        mode = "ACQUIRE_RAW_THEN_REVIEW"; blocker = "DOCUMENT_REFERENCE_OR_EXCERPT_MISSING"
        const identity = raw.find(record => record.raw_payload.security_id === member.security_id && record.raw_payload.provider_instrument_id)?.raw_payload.provider_instrument_id
        if (identity) request = { provider: "TRENDLYNE", tool: "get_document_search_results", args: {
          query: `${member.name} ${member.symbol} stock id ${identity} published on or before 2026-10-05 annual report quarterly result investor presentation earnings call ${requirement.documentKeywords.join(" ")}` },
          parser: "reviewDocumentExcerpt (after owner citation review)", target: "data_source_records (raw capture only)", maxWrites: 1 }
        else { mode = "BLOCKED_CONTRACT"; blocker = "PROVIDER_IDENTITY_NOT_PROVEN" }
      }
    } else if (requirement.channels.includes("TRENDLYNE_OWNERSHIP")) {
      cacheRefs = ownershipCandidates.map(candidate => `${candidate.source.recordId}:ownership:${candidate.series}:${candidate.periodEnd}`)
      if (ownershipCandidates.length) { mode = "CACHE_QUARTER_REVIEW"; blocker = "OWNERSHIP_SERIES_DEFINITION_AND_BASIS_REVIEW_REQUIRED" }
      else { mode = "ACQUIRE_RAW_THEN_REVIEW"; blocker = "DATED_OWNERSHIP_QUARTERS_MISSING"
        request = { provider: "TRENDLYNE", tool: "get_ownership_deals_insider_sast", args: { stock_code: member.symbol, type: "shareholding" }, parser: "parseOwnershipQuarterCandidates", target: "data_source_records (raw capture only)", maxWrites: 1 } }
    } else if (requirement.channels.includes("ANGEL_ONE_STOCK_HISTORY") || requirement.channels.includes("ANGEL_ONE_BENCHMARK_HISTORY")) {
      mode = "BLOCKED_HISTORY_AUTHORITY"; blocker = item.reason_code === "BENCHMARK_MAPPING_NOT_PROVEN" ? "EXACT_BENCHMARK_AUTHORITY_OR_TOKEN_REQUIRED" : "REVIEWED_SESSION_CALENDAR_AND_ADJUSTMENT_COVERAGE_REQUIRED"
      cacheRefs = ["stock-history-inventory.json", "benchmark-history-inventory.json"]
    } else if (fieldCandidates.length || cachedRows.length) {
      mode = "CACHE_FIELD_METADATA_REVIEW"; cacheRefs = [...fieldCandidates.map(candidate => `${candidate.source.recordId}:field:${candidate.metricCode}`), ...cachedRows.map(row => `observation:${row.id}`)]
      blocker = cacheValidation.reason
    } else if (mapped.length) {
      mode = "ACQUIRE_RAW_THEN_REVIEW"; blocker = "EXACT_FIELD_MISSING_AND_RESPONSE_METADATA_UNPROVEN"
      const identity = raw.find(record => record.raw_payload.security_id === member.security_id && record.raw_payload.provider_instrument_id)?.raw_payload.provider_instrument_id
      if (identity) request = { provider: "TRENDLYNE", tool: "get_parameter_values_multi_stock", args: { type: "stock",
        query: `${member.name} ${member.symbol} instrument ${identity} ${mapped.map(field => field.providerLabel).join(", ")} as of 2026-10-05; supply ${item.minimum_history} distinct dated ${mapped.map(field => field.periodType).join("/")} reporting periods, period start/end, unit/scale, currency, consolidated/standalone scope, publication dates and source field labels; no relative-year labels as period proof` },
        parser: "parseExactTrendlyneFields → normalizeReviewedField (requires source-bound metadata proof)", target: "data_source_records (raw capture only)", maxWrites: 1 }
      else { mode = "BLOCKED_CONTRACT"; blocker = "PROVIDER_IDENTITY_NOT_PROVEN" }
    }
    if (request) requests.push(request)
    jobs.push({ jobId: `${member.security_id}:${item.requirement_code}`, member,
      mandatoryRequirement: item.requirement_code, minimumDistinctPeriods: item.minimum_history,
      exactMetricCandidates: metricCodes, periodType: mapped.map(field => field.periodType),
      knownReportingPeriods: [...new Set(cachedRows.map(row => row.period_end).filter(Boolean))].sort(),
      missingPeriodContract: "No unstated calendar/fiscal anchor may be inferred. Obtain source-dated periods before canonical append.",
      mode, blocker, originalReason: item.reason_code, cacheCanSatisfyNow: cacheValidation.state === "FRESH", cacheRefs,
      provider: request?.provider ?? null, request, expectedBlockerRemoval: request ? "Raw field/reference absence only if returned; metadata/readiness remains gated" : "Only source-bound reviewed facts can remove the stated blocker",
      metadata: ["canonical identity", "exact metric/requirement mapping", "dated period and type", "unit/scale", "currency", "reporting scope", "provider/source/field/hash lineage", "publication/retrieval/freshness", "review version/citation where required"],
      canonicalWritesBeforeReview: 0, acquisitionPrerequisite: request ? "CACHE_SOURCE_REVIEW_EXHAUSTED_AND_OWNER_REQUEST_GRANT" : null, deterministicReadyGuarantee: false })
  }
}
// Batch only the actually identified missing parameter fields for the same primary entity.
// This combines three overlapping jobs; it is not a stock-count-based acquisition estimate.
const parameterJobs = new Map<string, Record<string, unknown>[]>()
for (const job of jobs) {
  const request = job.request as AcquisitionRequest | null
  if (request?.tool !== "get_parameter_values_multi_stock") continue
  const member = job.member as Member
  const group = parameterJobs.get(member.security_id) ?? []
  group.push(job); parameterJobs.set(member.security_id, group)
}
for (const group of parameterJobs.values()) {
  const original = group[0]!.request as AcquisitionRequest
  const query = group.map(job => (job.request as AcquisitionRequest).args.query).join("; ")
  const shared = { ...original, args: { type: "stock", query } }
  for (const job of group) job.request = shared
}
requests.splice(0, requests.length, ...jobs.flatMap(job => job.request ? [job.request as AcquisitionRequest] : []))
const deduplicated = deduplicateRequests(requests)
const counts: Record<string, number> = {}
for (const job of jobs) counts[String(job.mode)] = (counts[String(job.mode)] ?? 0) + 1
const summary = { version: V14_REMEDIATION_VERSION, repositoryHead: "24fa695858583b239f8e7d8b617e0a9c460c2941",
  developmentProject: "lrgpjimipfkyoqbpsqzz", cutoff, frozenManifestHash: expectedHash, memberCount: members.length,
  frozenValuePaise: 132585696, requirementJobs: jobs.length, dispositionCounts: counts,
  trendlyneConditionalRawCaptureCallCeiling: deduplicated.filter(request => request.provider === "TRENDLYNE").length,
  angelOneRawCaptureCalls: deduplicated.filter(request => request.provider === "ANGEL_ONE").length,
  deduplicatedRawCaptureWriteCeiling: deduplicated.reduce((sum, request) => sum + request.maxWrites, 0),
  canonicalObservationWritesBeforeReview: 0, readinessMaterializationWrites: 0,
  immediateProviderCallsAfterCacheInspection: 0, requiredAcquisitionCount: null,
  requiredAcquisitionCountReason: "Source-bound cache document/field review must finish before any conditional request can be called required.",
  documentRetrievalCalls: deduplicated.filter(request => request.tool === "get_document_search_results").length,
  documentReviewRequirementJobs: counts.CACHE_EXCERPT_REVIEW ?? 0,
  uniqueCachedDocumentReferences: new Set(documents.map(document => `${document.source.securityId}:${document.documentId}`)).size,
  exactFieldCacheCandidates: candidates.length, datedOwnershipQuarterCandidates: ownership.length,
  validCanonicalCacheJobs: counts.CACHE_CANONICAL_VALIDATED ?? 0,
  unresolvedJobs: (counts.BLOCKED_CONTRACT ?? 0) + (counts.BLOCKED_HISTORY_AUTHORITY ?? 0),
  providerCallsExecuted: 0, databaseWritesExecuted: 0, phase: "V1-4 IN PROGRESS / V1-5 UNAUTHORIZED",
  executionGate: "Owner authorization plus request-scoped grant/budget required. Plan is raw-capture/review, not a ready-state or canonical-ingestion campaign.",
  writeCeilingScope: "Raw evidence append rows only. Existing dispatcher run/item/grant/usage/control bookkeeping is not included; no whole-runtime grant may use this ceiling.",
  retryPolicy: "Zero automatic retries in this plan; each retry/auth/discovery attempt needs an explicit separately budgeted contract." }
await Deno.mkdir(outDir, { recursive: true })
await Deno.writeTextFile(outDir + "/PortfolioAI_V1_4_ACTION_B_PHASE1_ACQUISITION_PLAN_2026-10-05.json", JSON.stringify({ summary, requests: deduplicated, jobs, rejectedCacheInputs: rejected }) + "\n")
const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`
await Deno.writeTextFile(outDir + "/PortfolioAI_V1_4_ACTION_B_PHASE1_ACQUISITION_PLAN_2026-10-05.csv",
  ["job_id,security_id,symbol,requirement,minimum_periods,known_periods,mode,blocker,provider,tool,request_json,write_ceiling",
    ...jobs.map(job => { const member = job.member as Member; const request = job.request as AcquisitionRequest | null
      return [job.jobId, member.security_id, member.symbol, job.mandatoryRequirement, job.minimumDistinctPeriods,
        JSON.stringify(job.knownReportingPeriods), job.mode, job.blocker, request?.provider, request?.tool,
        request ? JSON.stringify(request.args) : "", request?.maxWrites ?? 0].map(csv).join(",") })].join("\n") + "\n")
await Deno.writeTextFile(outDir + "/PortfolioAI_V1_4_ACTION_B_PHASE1_CACHE_REVIEW_CANDIDATES_2026-10-05.json", JSON.stringify({ version: V14_REMEDIATION_VERSION, cutoff, candidates, ownership, documents }) + "\n")
console.log(JSON.stringify(summary, null, 2))
