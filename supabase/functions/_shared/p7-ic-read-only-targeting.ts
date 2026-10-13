/** Explicit targeting is owner-authenticated for validation or exactly P4-grant-scoped for canonical writes. */
const VALIDATE_ACTION = "P7_IC3_VALIDATE_CANONICAL_INPUTS"
const MATERIALIZE_ACTION = "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS"
const MATERIALIZE_TARGETING_MODE = "P4_GRANT_SCOPED_SECURITY_IDS_V1"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

export class ReadOnlyTargetError extends Error {
  constructor(readonly code: string, readonly status: 400 | 403) {
    super(code)
  }
}

export function readOnlySecurityIds(body: Readonly<Record<string, unknown>>): readonly string[] | undefined {
  if (body.securityIds === undefined) return undefined
  const validate=body.action===VALIDATE_ACTION
  const materialize=body.action===MATERIALIZE_ACTION&&body.targetingMode===MATERIALIZE_TARGETING_MODE
  if(!validate&&!materialize)throw new ReadOnlyTargetError("SECURITY_IDS_REQUIRE_AUTHENTICATED_VALIDATION_OR_GRANT_SCOPED_WRITE",400)
  if (body.offset !== undefined || body.limit !== undefined) throw new ReadOnlyTargetError("SECURITY_IDS_CANNOT_COMBINE_WITH_PAGINATION", 400)
  if (!Array.isArray(body.securityIds) || body.securityIds.length < 1 || body.securityIds.length > 40) {
    throw new ReadOnlyTargetError("SECURITY_IDS_REQUIRE_1_TO_40_UNIQUE_UUIDS", 400)
  }
  const ids: string[] = []
  for (const value of body.securityIds) {
    if (typeof value !== "string" || !UUID.test(value)) throw new ReadOnlyTargetError("SECURITY_ID_INVALID", 400)
    ids.push(value.toLowerCase())
  }
  if (new Set(ids).size !== ids.length) throw new ReadOnlyTargetError("SECURITY_IDS_DUPLICATED", 400)
  return ids
}

/** Eligible rows must come from this owner's portfolio's open equity holdings. */
export function selectReadOnlySecurities<T extends { readonly id: string }>(
  eligible: readonly T[], ids: readonly string[],
): T[] {
  const byId = new Map(eligible.map(row => [row.id.toLowerCase(), row]))
  return ids.map(id => {
    const row = byId.get(id)
    if (!row) throw new ReadOnlyTargetError("SECURITY_NOT_OPEN_EQUITY_IN_PORTFOLIO", 403)
    return row
  })
}
