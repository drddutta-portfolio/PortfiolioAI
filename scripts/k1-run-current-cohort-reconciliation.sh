#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARTIFACT_DIR="${K1_ARTIFACT_DIR:-artifacts}"
CANONICAL_JSON="$ARTIFACT_DIR/k1-current-canonical-classification.json"
FROZEN_CANONICAL_JSON="docs/k1/PortfolioAI_K1_CURRENT_PORTFOLIO_CANONICAL_SNAPSHOT_2026-09-22.json"
COHORT_TXT="$ARTIFACT_DIR/k1-current-nse-equities.txt"
CANONICAL_SOURCE="${K1_CANONICAL_SOURCE:-FROZEN_CURRENT_PORTFOLIO}"
BULK_JSON="$ARTIFACT_DIR/k1-nse-bulk-primary-classification.json"
TARGETED_TXT="$ARTIFACT_DIR/k1-nse-residual-symbols.txt"
TARGETED_JSON="$ARTIFACT_DIR/k1-nse-targeted-primary-classification.json"
OFFICIAL_JSON="$ARTIFACT_DIR/k1-nse-primary-classification.json"
RECON_JSON="$ARTIFACT_DIR/k1-nse-classification-reconciliation.json"
COHORT_LIMIT="${K1_COHORT_LIMIT:-0}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need psql
need node
need jq

STATUS_ENV="$(supabase status -o env 2>/dev/null)" || die "Local Supabase is not running. Run: supabase start"
DB_URL="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^DB_URL="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$DB_URL" ]] || die "Local Supabase DB_URL was not returned by 'supabase status -o env'."

case "$DB_URL" in
  postgresql://*@127.0.0.1:*/*|postgres://*@127.0.0.1:*/*|postgresql://*@localhost:*/*|postgres://*@localhost:*/*) ;;
  *) die "Refusing to run: K1 current-cohort reconciliation requires LOCAL Supabase only." ;;
esac

mkdir -p "$ARTIFACT_DIR"

printf '\n[K1] 1/6 local-only guard\n'
printf 'Local database: PASS\n'
printf 'Database writes: NONE\n'
printf 'Production access: NONE\n'

printf '\n[K1] 2/6 prepare canonical NSE-equity classification baseline\n'

case "$CANONICAL_SOURCE" in
  FROZEN_CURRENT_PORTFOLIO)
    [[ -f "$FROZEN_CANONICAL_JSON" ]] || die "Missing frozen K1 canonical snapshot: $FROZEN_CANONICAL_JSON"
    cp "$FROZEN_CANONICAL_JSON" "$CANONICAL_JSON"
    ;;
  LOCAL)
    psql "$DB_URL" -v ON_ERROR_STOP=1 -Atf scripts/k1-current-canonical-classification.sql > "$CANONICAL_JSON"
    ;;
  *)
    die "K1_CANONICAL_SOURCE must be FROZEN_CURRENT_PORTFOLIO or LOCAL."
    ;;
esac

CANONICAL_COUNT="$(jq -r '.rowCount // (.rows | length)' "$CANONICAL_JSON")"
[[ "$CANONICAL_COUNT" =~ ^[0-9]+$ && "$CANONICAL_COUNT" -gt 0 ]] || die "Canonical snapshot contains no NSE equities."

if ! [[ "$COHORT_LIMIT" =~ ^[0-9]+$ ]]; then
  die "K1_COHORT_LIMIT must be a non-negative integer."
fi

if [[ "$COHORT_LIMIT" -gt 0 ]]; then
  jq --argjson limit "$COHORT_LIMIT" '
    .rows = (.rows[:$limit])
    | .rowCount = (.rows | length)
    | .pilot = true
    | .pilotLimit = $limit
  ' "$CANONICAL_JSON" > "$CANONICAL_JSON.tmp"
  mv "$CANONICAL_JSON.tmp" "$CANONICAL_JSON"
  CANONICAL_COUNT="$(jq -r '.rowCount' "$CANONICAL_JSON")"
fi

jq -r '.rows[].symbol' "$CANONICAL_JSON" | sed '/^[[:space:]]*$/d' | sort -u > "$COHORT_TXT"
COHORT_COUNT="$(wc -l < "$COHORT_TXT" | tr -d ' ')"
[[ "$COHORT_COUNT" == "$CANONICAL_COUNT" ]] || die "Cohort count ($COHORT_COUNT) does not match canonical row count ($CANONICAL_COUNT)."

printf 'Canonical source: %s\n' "$CANONICAL_SOURCE"
printf 'Canonical NSE equity cohort: %s\n' "$CANONICAL_COUNT"
if [[ "$COHORT_LIMIT" -gt 0 ]]; then
  printf 'Pilot mode: YES (limit=%s)\n' "$COHORT_LIMIT"
fi

if [[ "$CANONICAL_SOURCE" == "LOCAL" && "$CANONICAL_COUNT" -lt 50 ]]; then
  printf 'WARNING: local portfolio appears to be a reduced development cohort (%s equities).\n' "$CANONICAL_COUNT" >&2
  printf 'For the current K1 238-stock audit, use the default FROZEN_CURRENT_PORTFOLIO source.\n' >&2
fi

printf '\n[K1] 3/6 fetch official NSE Indices bulk primary classification\n'
node scripts/k1-fetch-nse-bulk-classification.mjs \
  --input "$CANONICAL_JSON" \
  --output "$BULK_JSON"

RESIDUAL_COUNT="$(jq -r '.residualCount // 0' "$BULK_JSON")"
[[ "$RESIDUAL_COUNT" =~ ^[0-9]+$ ]] || die "Bulk residual count is invalid."

printf '\n[K1] 4/6 targeted official NSE verification for bulk residuals\n'
if [[ "$RESIDUAL_COUNT" -gt 0 ]]; then
  jq -r '.residual[].symbol' "$BULK_JSON" > "$TARGETED_TXT"
  printf 'Residual targeted-review equities: %s\n' "$RESIDUAL_COUNT"
  set +e
  node scripts/k1-fetch-nse-primary-classification.mjs \
    --input "$TARGETED_TXT" \
    --output "$TARGETED_JSON"
  TARGETED_STATUS=$?
  set -e
  if [[ "$TARGETED_STATUS" -ne 0 && "$TARGETED_STATUS" -ne 2 ]]; then
    die "Targeted NSE classification fetch failed with status $TARGETED_STATUS."
  fi
else
  : > "$TARGETED_TXT"
  cat > "$TARGETED_JSON" <<'JSON'
{
  "contract": "PORTFOLIOAI_K1_NSE_PRIMARY_CLASSIFICATION_SNAPSHOT_V1",
  "source": "NSE_OFFICIAL_QUOTE_EQUITY_INDUSTRY_INFO",
  "requestedCount": 0,
  "resolvedCount": 0,
  "missingSectorCount": 0,
  "failureCount": 0,
  "rows": [],
  "failures": []
}
JSON
  printf 'Residual targeted-review equities: 0\n'
fi

jq -s '
  .[0] as $bulk
  | .[1] as $targeted
  | ($targeted.rows // []) as $targetedRows
  | ($targetedRows | map(.symbol) | map(ascii_upcase)) as $targetedSymbols
  | {
      contract: "PORTFOLIOAI_K1_NSE_PRIMARY_CLASSIFICATION_MERGED_V1",
      generatedAt: (now | todateiso8601),
      source: "NSE_INDICES_BULK_PLUS_NSE_QUOTE_EQUITY_TARGETED_FALLBACK",
      bulkSource: $bulk.source,
      bulkSourceUrl: $bulk.sourceUrl,
      canonicalRowCount: $bulk.canonicalRowCount,
      bulkResolvedCount: ($bulk.rows | length),
      targetedRequestedCount: ($targeted.requestedCount // 0),
      targetedResolvedCount: ($targetedRows | length),
      targetedFailureCount: ($targeted.failureCount // 0),
      rows: (
        (($bulk.rows // []) + $targetedRows)
        | unique_by(.symbol)
        | sort_by(.symbol)
      ),
      residual: [
        ($bulk.residual // [])[]
        | select((.symbol | ascii_upcase) as $s | ($targetedSymbols | index($s) | not))
      ],
      failures: ($targeted.failures // [])
    }
  | .resolvedCount = (.rows | length)
  | .residualCount = (.residual | length)
' "$BULK_JSON" "$TARGETED_JSON" > "$OFFICIAL_JSON"

printf 'Merged official NSE classification: %s/%s resolved; %s residual\n' \
  "$(jq -r '.resolvedCount' "$OFFICIAL_JSON")" \
  "$CANONICAL_COUNT" \
  "$(jq -r '.residualCount' "$OFFICIAL_JSON")"

printf '\n[K1] 5/6 deterministic official-vs-canonical reconciliation\n'
set +e
node scripts/k1-compare-nse-classification.mjs \
  --canonical "$CANONICAL_JSON" \
  --official "$OFFICIAL_JSON" \
  --output "$RECON_JSON"
COMPARE_STATUS=$?
set -e

printf '\nReconciliation summary\n'
jq -r '
  ["AGREE","DETAIL_MISSING","CHANGE_REQUIRED","REVIEW_REQUIRED","OFFICIAL_MISSING"] as $states |
  $states[] as $s |
  "\($s): \(.counts[$s] // 0)"
' "$RECON_JSON"

printf '\nExceptions requiring attention\n'
jq -r '
  .rows[]
  | select(.state != "AGREE")
  | [
      .symbol,
      .state,
      .reasonCode,
      ((.changeScopes // []) | join(",")),
      (.identity.state // "-"),
      (.canonical.sector // "-"),
      (.canonical.industry // "-"),
      (.official.sector // "-"),
      (.official.industry // "-"),
      (.official.basicIndustry // "-")
    ]
  | @tsv
' "$RECON_JSON" | awk 'BEGIN{FS="\t"; OFS="\t"; print "SYMBOL","STATE","REASON","CHANGE_SCOPES","IDENTITY_STATE","CANONICAL_SECTOR","CANONICAL_INDUSTRY","NSE_SECTOR","NSE_INDUSTRY","NSE_BASIC_INDUSTRY"} {print}'

printf '\n[K1] 6/6 result\n'
FREEZE_ELIGIBLE="$(jq -r '.freezeEligible' "$RECON_JSON")"
printf 'Freeze eligible: %s\n' "$FREEZE_ELIGIBLE"
printf 'Canonical snapshot: %s\n' "$CANONICAL_JSON"
printf 'Official bulk snapshot: %s\n' "$BULK_JSON"
printf 'Official targeted snapshot: %s\n' "$TARGETED_JSON"
printf 'Official merged snapshot: %s\n' "$OFFICIAL_JSON"
printf 'Reconciliation: %s\n' "$RECON_JSON"

if [[ "$COMPARE_STATUS" -eq 2 ]]; then
  printf '\nK1 reconciliation completed with REVIEW_REQUIRED/OFFICIAL_MISSING exceptions.\n'
  printf 'Do not freeze K4 until those exceptions are resolved.\n'
  exit 2
fi

if [[ "$COMPARE_STATUS" -ne 0 ]]; then
  die "K1 comparator failed with status $COMPARE_STATUS."
fi

printf '\nK1 CURRENT-COHORT RECONCILIATION COMPLETE\n'
printf 'No database mutation was performed.\n'
