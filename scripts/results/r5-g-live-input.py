#!/usr/bin/env python3
"""Read-only 262-equity Development input for the ACTUAL R5 TypeScript grader.

Recompute after canonical classification recovery: newer missing-industry decisions
must flow through the same canonical enrichment view, never UI-side inference.

The JSON is transient to the private GitHub Actions runner. Do not upload this
source fact input as an artifact. Only the derived grade census is retained.
"""
import json
import os
from pathlib import Path

import psycopg

PORTFOLIO = "6193a4aa-3235-4057-bddc-209fcf443fc2"
PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
PERIODS = ("2024-09-30", "2024-12-31", "2025-03-31", "2025-06-30",
           "2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30")
CORE = ("OPERATING_REVENUE_QUARTER", "NET_INTEREST_INCOME_QUARTER",
        "NET_PREMIUM_EARNED_QUARTER", "NET_PROFIT_QUARTER", "EPS_DILUTED",
        "OPERATING_PROFIT_QUARTER", "GROSS_NPA_PERCENT", "NET_NPA_PERCENT")
OUT = Path("tmp/results-r5-g/selected-source-input.json")


def selected_fact(row, selected=True):
    (oid, sid, code, value, period_start, end, unit, currency, scope,
     source, record_id, published, retrieved, notes) = row
    return dict(
        id=str(oid), securityId=str(sid), code=code, value=str(value),
        periodStart=str(period_start) if period_start else None,
        periodEnd=str(end), unit=unit or "UNKNOWN", currency=currency,
        scope=scope, source=source,
        sourceRecordId=str(record_id) if record_id else None,
        publishedAt=published.isoformat() if published else None,
        retrievedAt=retrieved.isoformat() if retrieved else "",
        selected=selected,
        originalShareBasis="REPORTED_PRE_SPLIT_EPS_NOT_ADJUSTED" in (notes or "")
        or "HISTORICAL_ORIGINAL_EPS_COMPARABILITY_UNPROVEN" in (notes or ""),
    )


def extract(db_url):
    if PROJECT_REF not in db_url:
        raise RuntimeError("R5_G_REQUIRES_DEVELOPMENT_DATABASE")
    with psycopg.connect(db_url, options="-c default_transaction_read_only=on") as db:
        with db.cursor() as c:
            c.execute("""
              SELECT DISTINCT s.id::text, s.symbol,
                  e.sector, e.industry
              FROM public.transactions t
              JOIN public.securities s ON s.id=t.security_id
              LEFT JOIN public.current_security_enrichment_v1 e
                ON e.security_id=s.id
              WHERE t.portfolio_id=%s AND t.superseded_at IS NULL
                AND s.asset_class='EQUITY'
              ORDER BY s.symbol,s.id::text
            """, (PORTFOLIO,))
            equities = [dict(securityId=sid, symbol=symbol, sector=sector,
                            industry=industry)
                        for sid, symbol, sector, industry in c.fetchall()]
            ids = [p["securityId"] for p in equities]
            if len(equities) != 262 or len(set(ids)) != 262:
                raise RuntimeError("R5_G_EXPECTS_262_UNIQUE_EQUITY_IDENTITIES")
            c.execute("""
              SELECT o.id,o.security_id,o.metric_code,o.numeric_value,
                     o.period_start,o.period_end,o.unit,o.currency,
                     o.consolidation_scope,o.source_code,o.source_record_id,
                     o.published_at,o.retrieved_at,d.notes
              FROM public.fundamental_observation_decisions d
              JOIN public.fundamental_observations o
                ON o.id=d.selected_observation_id
               AND d.security_id=o.security_id
               AND d.metric_code=o.metric_code
               AND d.period_end=o.period_end
               AND d.consolidation_scope=o.consolidation_scope
              WHERE d.period_type='QUARTER'
                AND o.period_type='QUARTER'
                AND o.security_id=ANY(%s::uuid[])
                AND o.period_end=ANY(%s::date[])
                AND o.metric_code=ANY(%s::text[])
                AND o.evidence_status='AVAILABLE'
                AND o.numeric_value IS NOT NULL
              ORDER BY o.security_id,o.period_end,o.metric_code,o.id
            """, (ids, list(PERIODS), list(CORE)))
            observations = [selected_fact(row) for row in c.fetchall()]
            # R5 comparison-only original facts are admitted exclusively by
            # independently hash-verified, repo-pinned observation identity.
            # They are never added to R4's canonical selection.
            proof=json.loads(Path("src/features/results/resultsR5ComparisonProof.json").read_text())
            if (proof["contract"]!="R5_INDEPENDENT_ORIGINAL_COMPARISON_PROOF_V1"
                    or proof["environment"]!="Development"):
                raise RuntimeError("UNQUALIFIED_R5_COMPARISON_MANIFEST")
            desired=set(
                oid for source in proof["approvedSources"]
                for oid in source["observations"].values())
            already={row["id"] for row in observations}
            missing=sorted(desired-already)
            if missing:
                c.execute("""
                  SELECT o.id,o.security_id,o.metric_code,o.numeric_value,
                         o.period_start,o.period_end,o.unit,o.currency,
                         o.consolidation_scope,o.source_code,o.source_record_id,
                         o.published_at,o.retrieved_at,NULL::text AS notes
                  FROM public.fundamental_observations o
                  WHERE o.id=ANY(%s::uuid[])
                    AND o.security_id=ANY(%s::uuid[])
                    AND o.period_type='QUARTER'
                    AND o.evidence_status='AVAILABLE'
                    AND o.numeric_value IS NOT NULL
                    AND o.source_code='COMPANY_EXCHANGE_FILING'
                  ORDER BY o.id
                """,(missing,ids))
                alternatives=[selected_fact(row,selected=False) for row in c.fetchall()]
                if {row["id"] for row in alternatives}!=set(missing):
                    raise RuntimeError("R5_VERIFIED_ORIGINAL_IDENTITY_MISSING_OR_CHANGED")
                observations.extend(alternatives)
    if len(set(row["id"] for row in observations)) != len(observations):
        raise RuntimeError("DUPLICATE_SELECTED_OBSERVATION_ID")
    return {
        "contract":"RESULTS_R5_G_ACTUAL_ENGINE_READBACK_V1",
        "environment":"Development",
        "scope":"June 2026 quarterly source-selected R5 grade, not investment action",
        "cohort":equities,
        "observations":observations,
        "displayedFour":["2025-09-30","2025-12-31","2026-03-31","2026-06-30"],
        "evaluationQuarter":"2026-06-30",
        "noProviderCalls":True,
        "rawValuesMayNotBeUploaded":True,
    }


def main():
    payload=extract(os.environ["SUPABASE_DB_URL"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",",":"), sort_keys=True))
    print("R5_G_INPUT_READY "+json.dumps({
        "cohort":len(payload["cohort"]),
        "selectedFacts":sum(1 for row in payload["observations"] if row["selected"]),
        "r5VerifiedCandidateFacts":sum(1 for row in payload["observations"] if not row["selected"]),
        "sourceSelected":True,"securitiesWithReviewedIndustry":sum(
          bool(p["sector"] and p["industry"]) for p in payload["cohort"]),
        "rawValuesNotPublished":True},sort_keys=True))


if __name__=="__main__":
    main()
