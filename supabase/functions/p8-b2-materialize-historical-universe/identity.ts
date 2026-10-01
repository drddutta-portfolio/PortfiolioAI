import {
  Admin, Json, PORTFOLIO_ID, EXPERIMENT_ID, clean, isUuid, isHash, frozenIsin,
  canonical, sha256, deterministicUuid, chunks, ownerId,
} from "./shared.ts"

const MAX_IDENTITY_BATCH = 500
const MAX_OBSERVATION_BATCH = 2000

export async function identityBatch(admin: Admin, rows: Json[]) {
  if (rows.length < 1 || rows.length > MAX_IDENTITY_BATCH) throw new Error("P8_B2_IDENTITY_BATCH_SIZE")
  const owner = await ownerId(admin)
  const canonicalIds = [...new Set(rows.map((row) => row.canonical_security_id).filter(isUuid))]
  const securities = new Map<string, Json>()
  for (const batch of chunks(canonicalIds, 400)) {
    const result = await admin.from("securities").select("id,symbol,exchange,isin,asset_class").in("id", batch)
    if (result.error) throw result.error
    for (const row of result.data ?? []) securities.set(String(row.id), row as Json)
  }

  const inserts: Json[] = []
  for (const row of rows) {
    const isin = clean(row.historical_isin).toUpperCase()
    const issuerType = clean(row.issuer_type).toUpperCase()
    const securityType = clean(row.security_type_code).toUpperCase()
    const basis = clean(row.canonical_link_basis)
    const linkEvidence = row.link_evidence && typeof row.link_evidence === "object" ? row.link_evidence : {}
    let canonicalSecurityId: string | null = null
    let canonicalLinkSymbol: string | null = null

    if (!frozenIsin(isin) || issuerType !== isin[2] || securityType !== "01") {
      throw new Error("P8_B2_IDENTITY_RULE:" + isin)
    }

    if (basis === "EXACT_ISIN") {
      if (!isUuid(row.canonical_security_id)) throw new Error("P8_B2_EXACT_LINK_ID:" + isin)
      const security = securities.get(row.canonical_security_id)
      if (!security || security.asset_class !== "EQUITY" || clean(security.isin).toUpperCase() !== isin) {
        throw new Error("P8_B2_EXACT_LINK_MISMATCH:" + isin)
      }
      canonicalSecurityId = row.canonical_security_id
    } else if (basis === "EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN") {
      if (!isUuid(row.canonical_security_id) || !clean(row.canonical_link_symbol)) {
        throw new Error("P8_B2_NULL_LINK_ID:" + isin)
      }
      const security = securities.get(row.canonical_security_id)
      if (
        !security || security.asset_class !== "EQUITY" || security.exchange !== "NSE" ||
        security.isin !== null || security.symbol !== row.canonical_link_symbol
      ) throw new Error("P8_B2_NULL_LINK_MISMATCH:" + isin)
      canonicalSecurityId = row.canonical_security_id
      canonicalLinkSymbol = clean(row.canonical_link_symbol)
    } else if (basis !== "NONE") {
      throw new Error("P8_B2_LINK_BASIS:" + isin)
    }

    const logical = {
      portfolio_id: PORTFOLIO_ID,
      experiment_id: EXPERIMENT_ID,
      historical_isin: isin,
      issuer_type: issuerType,
      security_type_code: securityType,
      canonical_security_id: canonicalSecurityId,
      canonical_link_basis: basis,
      canonical_link_symbol: canonicalLinkSymbol,
      link_evidence: linkEvidence,
    }
    const expectedHash = await sha256(logical)
    if (row.identity_hash !== expectedHash) throw new Error("P8_B2_IDENTITY_HASH:" + isin)

    inserts.push({
      id: await deterministicUuid("P8_IDENTITY|" + PORTFOLIO_ID + "|" + EXPERIMENT_ID + "|" + isin),
      ...logical,
      identity_hash: expectedHash,
      created_by: owner,
    })
  }

  const insert = await admin.from("p8_historical_security_identities").upsert(inserts, {
    onConflict: "portfolio_id,experiment_id,historical_isin",
    ignoreDuplicates: true,
  })
  if (insert.error) throw insert.error

  const isins = inserts.map((row) => String(row.historical_isin))
  const check = await admin.from("p8_historical_security_identities")
    .select("historical_isin,identity_hash,canonical_security_id,canonical_link_basis,canonical_link_symbol")
    .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID).in("historical_isin", isins)
  if (check.error) throw check.error
  const byIsin = new Map((check.data ?? []).map((row) => [String(row.historical_isin), row]))

  for (const row of inserts) {
    const stored = byIsin.get(String(row.historical_isin))
    if (
      !stored ||
      stored.identity_hash !== row.identity_hash ||
      stored.canonical_security_id !== row.canonical_security_id ||
      stored.canonical_link_basis !== row.canonical_link_basis ||
      stored.canonical_link_symbol !== row.canonical_link_symbol
    ) throw new Error("P8_B2_IDENTITY_VERIFY:" + row.historical_isin)
  }

  return { verified: inserts.length }
}

export async function beginMonth(admin: Admin, archive: Json) {
  const owner = await ownerId(admin)
  const logical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    source_code: clean(archive.source_code),
    source_date: clean(archive.source_date),
    source_url: clean(archive.source_url),
    source_file_name: clean(archive.source_file_name),
    csv_sha256: clean(archive.csv_sha256),
    gzip_sha256: clean(archive.gzip_sha256),
    source_published_at: null,
    available_no_later_than_at: clean(archive.available_no_later_than_at),
    availability_proof_basis: clean(archive.availability_proof_basis),
    availability_proof_reference: clean(archive.availability_proof_reference),
    retrieved_at: clean(archive.retrieved_at),
    raw_metadata: archive.raw_metadata && typeof archive.raw_metadata === "object" ? archive.raw_metadata : {},
  }

  if (
    logical.source_code !== "NSE_CM_MII_SECURITY_MASTER" ||
    logical.availability_proof_basis !== "NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS" ||
    !isHash(logical.csv_sha256) || !isHash(logical.gzip_sha256)
  ) throw new Error("P8_B2_ARCHIVE_CONTRACT")

  const expectedHash = await sha256(logical)
  if (archive.archive_hash !== expectedHash) throw new Error("P8_B2_ARCHIVE_HASH")

  const result = await admin.rpc("append_p8_historical_source_archive_v1", {
    p_archive: { ...logical, archive_hash: expectedHash, created_by: owner },
  })
  if (result.error) throw result.error
  return { archive_id: String(result.data) }
}

export async function observationBatch(
  admin: Admin,
  sourceDate: string,
  archiveHash: string,
  rows: Json[],
) {
  if (rows.length < 1 || rows.length > MAX_OBSERVATION_BATCH || !isHash(archiveHash)) {
    throw new Error("P8_B2_OBSERVATION_BATCH")
  }

  const archive = await admin.from("p8_historical_source_archives").select("id,csv_sha256")
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
  if (identityMap.size !== isins.length) throw new Error("P8_B2_OBSERVATION_IDENTITY_COVERAGE")

  const inserts: Json[] = []
  for (const row of rows) {
    const isin = clean(row.historical_isin).toUpperCase()
    const identityId = identityMap.get(isin)
    if (!identityId) throw new Error("P8_B2_OBSERVATION_IDENTITY:" + isin)

    const sourceRowNumber = Number(row.source_row_number)
    const logical = {
      source_date: sourceDate,
      source_row_number: sourceRowNumber,
      historical_isin: isin,
      exchange: "NSE",
      trading_symbol: clean(row.trading_symbol),
      series: clean(row.series) || null,
      instrument_id: clean(row.instrument_id),
      instrument_name: clean(row.instrument_name),
      source_presence_state: "PRESENT_IN_SECURITY_MASTER",
      source_csv_sha256: String(archive.data.csv_sha256),
    }
    if (
      !Number.isInteger(sourceRowNumber) || sourceRowNumber < 2 ||
      !logical.trading_symbol || !logical.instrument_id || !logical.instrument_name
    ) throw new Error("P8_B2_OBSERVATION_CONTRACT:" + isin)

    const expectedHash = await sha256(logical)
    if (row.row_hash !== expectedHash) {
      throw new Error("P8_B2_OBSERVATION_HASH:" + isin + ":" + sourceRowNumber)
    }

    inserts.push({
      id: await deterministicUuid(
        "P8_OBSERVATION|" + archive.data.id + "|" + identityId + "|" + expectedHash,
      ),
      portfolio_id: PORTFOLIO_ID,
      experiment_id: EXPERIMENT_ID,
      historical_identity_id: identityId,
      source_archive_id: archive.data.id,
      source_date: sourceDate,
      exchange: "NSE",
      trading_symbol: logical.trading_symbol,
      series: logical.series,
      instrument_id: logical.instrument_id,
      instrument_name: logical.instrument_name,
      source_presence_state: "PRESENT_IN_SECURITY_MASTER",
      row_hash: expectedHash,
      raw_metadata: { source_row_number: sourceRowNumber, historical_isin: isin },
    })
  }

  const insert = await admin.from("p8_historical_listing_observations_v3").upsert(inserts, {
    onConflict: "portfolio_id,experiment_id,source_archive_id,historical_identity_id,row_hash",
    ignoreDuplicates: true,
  })
  if (insert.error) throw insert.error
  return { accepted: inserts.length }
}
