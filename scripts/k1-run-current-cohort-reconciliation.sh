#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARTIFACT_DIR="${K1_ARTIFACT_DIR:-artifacts}"
CANONICAL_JSON="$ARTIFACT_DIR/k1-current-canonical-classification.json"
COHORT_TXT="$ARTIFACT_DIR/k1-current-nse-equities.txt"
OFFICIAL_JSON="$ARTIFACT_DIR/k1-nse-primary-classification.json"
RECON_JSON="$ARTIFACT_DIR/k1-nse-classification-reconciliation.json"
DELAY_MS="${K1_NSE_DELAY_MS:-350}"

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

printf '\n[K1] 1/5 local-only guard\n'
printf 'Local database: PASS\n'
printf 'Database writes: NONE\n'
printf 'Production access: NONE\n'

printf '\n[K1] 2/5 snapshot current canonical NSE-equity classification\n'
psql "$DB_URL" -v ON_ERROR_STOP=1 -Atf scripts/k1-current-canonical-classification.sql > "$CANONICAL_JSON"

CANONICAL_COUNT="$(jq -r '.rowCount // (.rows | length)' "$CANONICAL_JSON")"
[[ "$CANONICAL_COUNT" =~ ^[0-9]+$ && "$CANONICAL_COUNT" -gt 0 ]] || die "Canonical snapshot contains no NSE equities."

jq -r '.rows[].symbol' "$CANONICAL_JSON" | sed '/^[[:space:]]*$/d' | sort -u > "$COHORT_TXT"
COHORT_COUNT="$(wc -l < "$COHORT_TXT" | tr -d ' ')"
[[ "$COHORT_COUNT" == "$CANONICAL_COUNT" ]] || die "Cohort count ($COHORT_COUNT) does not match canonical row count ($CANONICAL_COUNT)."

printf 'Canonical NSE equity cohort: %s\n' "$CANONICAL_COUNT"

printf '\n[K1] 3/5 fetch read-only official NSE primary classification\n'
node scripts/k1-fetch-nse-primary-classification.mjs \
  --input "$COHORT_TXT" \
  --output "$OFFICIAL_JSON" \
  --delay-ms "$DELAY_MS"

printf '\n[K1] 4/5 deterministic official-vs-canonical reconciliation\n'
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
      (.canonical.sector // "-"),
      (.canonical.industry // "-"),
      (.official.sector // "-"),
      (.official.industry // "-"),
      (.official.basicIndustry // "-")
    ]
  | @tsv
' "$RECON_JSON" | awk 'BEGIN{FS="\t"; OFS="\t"; print "SYMBOL","STATE","REASON","CANONICAL_SECTOR","CANONICAL_INDUSTRY","NSE_SECTOR","NSE_INDUSTRY","NSE_BASIC_INDUSTRY"} {print}'

printf '\n[K1] 5/5 result\n'
FREEZE_ELIGIBLE="$(jq -r '.freezeEligible' "$RECON_JSON")"
printf 'Freeze eligible: %s\n' "$FREEZE_ELIGIBLE"
printf 'Canonical snapshot: %s\n' "$CANONICAL_JSON"
printf 'Official snapshot:  %s\n' "$OFFICIAL_JSON"
printf 'Reconciliation:      %s\n' "$RECON_JSON"

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
