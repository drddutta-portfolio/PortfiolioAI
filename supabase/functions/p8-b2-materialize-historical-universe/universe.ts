import {
  Admin, Json, PORTFOLIO_ID, EXPERIMENT_ID, UNIVERSE_VERSION, RESOLVER_VERSION,
  SELECTOR_VERSION, EXPECTED_PLAN_HASH, clean, isUuid, isHash, sha256,
  deterministicUuid, chunks, ownerId,
} from "./shared.ts"

const MAX_MEMBER_BATCH = 1000
const MAX_EVIDENCE_BATCH = 2000

async function paged<T>(
  queryFactory: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += 1000) {
    const result = await queryFactory(from, from + 999)
    if (result.error) throw result.error
    const batch = result.data ?? []
    all.push(...batch)
    if (batch.length < 1000) break
  }
  return all
}

export async function beginRun(admin: Admin, month: Json) {
  const sourceDate = clean(month.source_date)
  const decisionAt = clean(month.decision_at)
  const archiveHash = clean(month.archive_hash)
  const expectedObservationRows = Number(month.expected_observation_rows)
  const expectedEligible = Number(month.expected_eligible_identities)
  const expectedIneligible = Number(month.expected_ineligible_identities)
  const rowHashFingerprint = clean(month.row_hash_fingerprint)
  const runHash = clean(month.run_hash)

  if (!isHash(archiveHash) || !isHash(rowHashFingerprint) || !isHash(runHash)) {
    throw new Error("P8_B2_RUN_SCOPE")
  }
  if (expectedEligible + expectedIneligible !== 4524) {
    throw new Error("P8_B2_RUN_IDENTITY_TOTAL")
  }

  const archive = await admin.from("p8_historical_source_archives").select("id,available_no_later_than_at")
    .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
    .eq("source_date", sourceDate).eq("archive_hash", archiveHash).single()
  if (archive.error) throw archive.error

  if (Date.parse(String(archive.data.available_no_later_than_at)) >= Date.parse(decisionAt)) {
    throw new Error("P8_B2_RUN_AVAILABILITY")
  }

  const observationCount = await admin.from("p8_historical_listing_observations_v3")
    .select("id", { count: "exact", head: true })
    .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
    .eq("source_archive_id", archive.data.id)
  if (observationCount.error || observationCount.count !== expectedObservationRows) {
    throw new Error(
      "P8_B2_RUN_OBSERVATION_COUNT:" + observationCount.count + ":" + expectedObservationRows,
    )
  }

  const runLogical = {
    plan_hash: EXPECTED_PLAN_HASH,
    decision_date: sourceDate,
    archive_hash: archiveHash,
    row_hash_fingerprint: rowHashFingerprint,
    eligible_identity_count: expectedEligible,
    ineligible_identity_count: expectedIneligible,
    resolver_version: RESOLVER_VERSION,
    universe_version: UNIVERSE_VERSION,
  }
  if (await sha256(runLogical) !== runHash) throw new Error("P8_B2_RUN_HASH")

  const owner = await ownerId(admin)
  const runId = await deterministicUuid(
    "P8_RUN|" + PORTFOLIO_ID + "|" + EXPERIMENT_ID + "|" + decisionAt + "|" + runHash,
  )

  const insert = await admin.from("p8_historical_universe_runs_v3").upsert([{
    id: runId,
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    universe_version: UNIVERSE_VERSION,
    decision_at: decisionAt,
    decision_date: sourceDate,
    source_cutoff_at: decisionAt,
    source_archive_id: archive.data.id,
    source_date: sourceDate,
    resolver_version: RESOLVER_VERSION,
    run_state: "READY",
    global_blocker_reason: null,
    eligible_count: expectedEligible,
    ineligible_count: expectedIneligible,
    blocked_count: 0,
    run_hash: runHash,
    created_by: owner,
  }], {
    onConflict: "portfolio_id,experiment_id,universe_version,decision_at,run_hash",
    ignoreDuplicates: true,
  })
  if (insert.error) throw insert.error

  return { run_id: runId, archive_id: String(archive.data.id) }
}

export async function memberBatch(
  admin: Admin,
  runId: string,
  decisionAt: string,
  rows: Json[],
) {
  if (!isUuid(runId) || rows.length < 1 || rows.length > MAX_MEMBER_BATCH) {
    throw new Error("P8_B2_MEMBER_BATCH")
  }

  const run = await admin.from("p8_historical_universe_runs_v3").select("id")
    .eq("id", runId).eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
    .eq("decision_at", decisionAt).single()
  if (run.error) throw run.error

  const isins = [...new Set(rows.map((row) => clean(row.historical_isin).toUpperCase()))]
  const identityMap = new Map<string, string>()
  for (const batch of chunks(isins, 400)) {
    const result = await admin.from("p8_historical_security_identities").select("id,historical_isin")
      .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID).in("historical_isin", batch)
    if (result.error) throw result.error
    for (const row of result.data ?? []) identityMap.set(String(row.historical_isin), String(row.id))
  }
  if (identityMap.size !== isins.length) throw new Error("P8_B2_MEMBER_IDENTITY_COVERAGE")

  const inserts: Json[] = []
  for (const row of rows) {
    const isin = clean(row.historical_isin).toUpperCase()
    const identityId = identityMap.get(isin)
    if (!identityId) throw new Error("P8_B2_MEMBER_IDENTITY:" + isin)

    const state = clean(row.membership_state)
    const reason = clean(row.reason_code)
    if (!["ELIGIBLE", "INELIGIBLE"].includes(state) || !reason) {
      throw new Error("P8_B2_MEMBER_CONTRACT:" + isin)
    }

    inserts.push({
      id: await deterministicUuid("P8_MEMBER|" + runId + "|" + identityId),
      universe_run_id: runId,
      portfolio_id: PORTFOLIO_ID,
      experiment_id: EXPERIMENT_ID,
      decision_at: decisionAt,
      historical_identity_id: identityId,
      membership_state: state,
      reason_code: reason,
    })
  }

  const insert = await admin.from("p8_historical_universe_members_v3").upsert(inserts, {
    onConflict: "universe_run_id,historical_identity_id",
    ignoreDuplicates: true,
  })
  if (insert.error) throw insert.error
  return { accepted: inserts.length }
}

export async function evidenceBatch(
  admin: Admin,
  runId: string,
  decisionAt: string,
  sourceDate: string,
  archiveHash: string,
  rows: Json[],
) {
  if (
    !isUuid(runId) || rows.length < 1 || rows.length > MAX_EVIDENCE_BATCH ||
    !isHash(archiveHash)
  ) throw new Error("P8_B2_EVIDENCE_BATCH")

  const archive = await admin.from("p8_historical_source_archives").select("id")
    .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
    .eq("source_date", sourceDate).eq("archive_hash", archiveHash).single()
  if (archive.error) throw archive.error

  const isins = [...new Set(rows.map((row) => clean(row.historical_isin).toUpperCase()))]
  const identityMap = new Map<string, string>()
  for (const batch of chunks(isins, 400)) {
    const result = await admin.from("p8_historical_security_identities").select("id,historical_isin")
      .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID).in("historical_isin", batch)
    if (result.error) throw result.error
    for (const row of result.data ?? []) identityMap.set(String(row.historical_isin), String(row.id))
  }

  const rowHashes = [...new Set(rows.map((row) => clean(row.row_hash)))]
  const observationMap = new Map<string, Json>()
  // SHA-256 values are 64 characters each. Keep this lookup intentionally small
  // because PostgREST encodes .in(...) filters into the request URL; large batches can
  // exceed gateway request-line limits even though the evidence payload itself is valid.
  for (const batch of chunks(rowHashes, 50)) {
    const result = await admin.from("p8_historical_listing_observations_v3")
      .select("id,row_hash,historical_identity_id")
      .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
      .eq("source_archive_id", archive.data.id).in("row_hash", batch)
    if (result.error) throw result.error
    for (const row of result.data ?? []) observationMap.set(String(row.row_hash), row as Json)
  }

  const identityIds = [...new Set(identityMap.values())]
  const memberMap = new Map<string, string>()
  for (const batch of chunks(identityIds, 400)) {
    const result = await admin.from("p8_historical_universe_members_v3")
      .select("id,historical_identity_id")
      .eq("universe_run_id", runId).in("historical_identity_id", batch)
    if (result.error) throw result.error
    for (const row of result.data ?? []) memberMap.set(String(row.historical_identity_id), String(row.id))
  }

  const inserts: Json[] = []
  for (const row of rows) {
    const isin = clean(row.historical_isin).toUpperCase()
    const rowHash = clean(row.row_hash)
    const role = clean(row.evidence_role)
    const identityId = identityMap.get(isin)
    const observation = observationMap.get(rowHash)
    const memberId = identityId ? memberMap.get(identityId) : null

    if (
      !identityId || !memberId || !observation ||
      String(observation.historical_identity_id) !== identityId ||
      !["ELIGIBILITY_SUPPORT", "SYMBOL_SERIES_VARIANT"].includes(role)
    ) throw new Error("P8_B2_EVIDENCE_RESOLUTION:" + isin + ":" + rowHash)

    inserts.push({
      id: await deterministicUuid("P8_EVIDENCE|" + memberId + "|" + observation.id + "|" + role),
      universe_member_id: memberId,
      portfolio_id: PORTFOLIO_ID,
      experiment_id: EXPERIMENT_ID,
      historical_identity_id: identityId,
      decision_at: decisionAt,
      listing_observation_id: observation.id,
      evidence_role: role,
    })
  }

  const insert = await admin.from("p8_historical_universe_member_listing_evidence_v3").upsert(
    inserts,
    {
      onConflict: "universe_member_id,listing_observation_id,evidence_role",
      ignoreDuplicates: true,
    },
  )
  if (insert.error) throw insert.error
  return { accepted: inserts.length }
}

export async function selectMonth(admin: Admin, month: Json) {
  const sourceDate = clean(month.source_date)
  const decisionAt = clean(month.decision_at)
  const archiveHash = clean(month.archive_hash)
  const runHash = clean(month.run_hash)
  const expectedObservationRows = Number(month.expected_observation_rows)
  const expectedEligible = Number(month.expected_eligible_identities)
  const expectedIneligible = Number(month.expected_ineligible_identities)
  const expectedFingerprint = clean(month.row_hash_fingerprint)

  const run = await admin.from("p8_historical_universe_runs_v3")
    .select("id,source_archive_id,eligible_count,ineligible_count,blocked_count")
    .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
    .eq("decision_at", decisionAt).eq("run_hash", runHash).single()
  if (run.error) throw run.error

  if (
    Number(run.data.eligible_count) !== expectedEligible ||
    Number(run.data.ineligible_count) !== expectedIneligible ||
    Number(run.data.blocked_count) !== 0
  ) throw new Error("P8_B2_SELECT_RUN_COUNTS")

  const archive = await admin.from("p8_historical_source_archives").select("id")
    .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
    .eq("source_date", sourceDate).eq("archive_hash", archiveHash).single()
  if (archive.error || archive.data.id !== run.data.source_archive_id) {
    throw new Error("P8_B2_SELECT_ARCHIVE")
  }

  const observations = await paged<Json>(async (from, to) => {
    const result = await admin.from("p8_historical_listing_observations_v3")
      .select("row_hash,raw_metadata")
      .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
      .eq("source_archive_id", archive.data.id)
      .order("id").range(from, to)
    return { data: (result.data ?? []) as Json[], error: result.error }
  })
  if (observations.length !== expectedObservationRows) {
    throw new Error("P8_B2_SELECT_OBSERVATION_COUNT:" + observations.length)
  }

  const ordered = [...observations].sort(
    (a, b) =>
      Number((a.raw_metadata as Json)?.source_row_number ?? 0) -
      Number((b.raw_metadata as Json)?.source_row_number ?? 0),
  )
  const fingerprint = await sha256(ordered.map((row) => String(row.row_hash)))
  if (fingerprint !== expectedFingerprint) throw new Error("P8_B2_SELECT_ROW_HASH_FINGERPRINT")

  const members = await paged<Json>(async (from, to) => {
    const result = await admin.from("p8_historical_universe_members_v3")
      .select("id,membership_state")
      .eq("universe_run_id", run.data.id).order("id").range(from, to)
    return { data: (result.data ?? []) as Json[], error: result.error }
  })
  if (members.length !== 4524) throw new Error("P8_B2_SELECT_MEMBER_COUNT:" + members.length)
  const eligibleMembers = members.filter((row) => row.membership_state === "ELIGIBLE")
  const ineligibleMembers = members.filter((row) => row.membership_state === "INELIGIBLE")
  if (
    eligibleMembers.length !== expectedEligible ||
    ineligibleMembers.length !== expectedIneligible
  ) throw new Error("P8_B2_SELECT_MEMBER_STATE_COUNTS")

  const evidence = await paged<Json>(async (from, to) => {
    const result = await admin.from("p8_historical_universe_member_listing_evidence_v3")
      .select("universe_member_id,evidence_role")
      .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
      .eq("decision_at", decisionAt).order("id").range(from, to)
    return { data: (result.data ?? []) as Json[], error: result.error }
  })
  if (evidence.length !== expectedObservationRows) {
    throw new Error("P8_B2_SELECT_EVIDENCE_COUNT:" + evidence.length)
  }

  const eligibleSupport = new Set(
    evidence
      .filter((row) => row.evidence_role === "ELIGIBILITY_SUPPORT")
      .map((row) => String(row.universe_member_id)),
  )
  if (eligibleMembers.some((row) => !eligibleSupport.has(String(row.id)))) {
    throw new Error("P8_B2_SELECT_ELIGIBLE_SUPPORT_MISSING")
  }

  const owner = await ownerId(admin)
  const selectionRunId = await deterministicUuid(
    "P8_SELECTION_RUN|" + EXPECTED_PLAN_HASH + "|" + sourceDate,
  )
  const selectionId = await deterministicUuid(
    "P8_SELECTION|" + run.data.id + "|" + selectionRunId,
  )
  const insert = await admin.from("p8_historical_universe_run_selections_v3").upsert([{
    id: selectionId,
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    decision_at: decisionAt,
    universe_run_id: run.data.id,
    selection_run_id: selectionRunId,
    selection_basis: "P8_B2_INITIAL_MATERIALIZATION",
    selector_version: SELECTOR_VERSION,
    selected_by: owner,
  }], {
    onConflict: "portfolio_id,experiment_id,selection_run_id,decision_at",
    ignoreDuplicates: true,
  })
  if (insert.error) throw insert.error

  return {
    selected: true,
    selection_id: selectionId,
    eligible: expectedEligible,
    ineligible: expectedIneligible,
    observations: expectedObservationRows,
  }
}
