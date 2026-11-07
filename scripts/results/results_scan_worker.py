#!/usr/bin/env python3
"""Authenticated manual Results scan worker. GitHub push control branch only.

The owner-authenticated Supabase Edge Function creates the run and records the
262 transaction-derived equities. This worker consumes only the opaque run id;
it never accepts caller-supplied financial values or arbitrary source URLs.
R3 performs original source acquisition; the existing independent R4 selector
owns financial qualification. All writes are to approved Development storage.
"""
from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys

import psycopg

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
BUCKET = "portfolioai-history-dev"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
OPERATION = "RESULTS_QUARTERLY_SCAN_V2"
DOMAIN = "QUARTERLY_RESULTS"
RUN_PATH = Path(".github/scan-requests/latest.json")


def require_dev_environment() -> str:
    db = os.environ.get("SUPABASE_DB_URL", "")
    if PROJECT_REF not in db or not db.startswith("postgres"):
        raise RuntimeError("SCANNER_NOT_DEVELOPMENT_DB")
    if os.environ.get("CLOUDFLARE_R2_BUCKET") != BUCKET:
        raise RuntimeError("SCANNER_NOT_DEVELOPMENT_R2")
    return db


def read_request() -> str:
    import re
    request = json.loads(RUN_PATH.read_text())
    run_id = request.get("run_id")
    if request.get("contract") != OPERATION or not isinstance(run_id, str):
        raise RuntimeError("SCAN_REQUEST_CONTRACT_INVALID")
    if not re.fullmatch(r"[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}", run_id):
        raise RuntimeError("SCAN_RUN_ID_INVALID")
    return run_id


def inspect_run(db_url: str, run_id: str) -> int:
    with psycopg.connect(db_url, options="-c default_transaction_read_only=on") as db:
        with db.cursor() as cur:
            cur.execute("""
                SELECT status, requested_count FROM public.data_ingestion_runs
                 WHERE id=%s::uuid AND operation=%s AND portfolio_id=%s::uuid
            """, (run_id, OPERATION, PORTFOLIO_ID))
            row = cur.fetchone()
            if row is None or row[0] != "RUNNING" or row[1] < 1 or row[1] > 262:
                raise RuntimeError("SCAN_RUN_NOT_AUTHORIZED_OR_ACTIVE")
            cur.execute("""
                SELECT count(*) FROM public.data_ingestion_run_items
                WHERE ingestion_run_id=%s::uuid AND data_domain=%s
            """, (run_id, DOMAIN))
            if cur.fetchone()[0] != row[1]:
                raise RuntimeError("SCAN_RUN_ITEM_COHORT_NOT_COMPLETE")
            return row[1]


def execution(path: str, env: dict[str, str]) -> dict:
    process = subprocess.run([sys.executable, path], env=env, text=True,
                             capture_output=True, timeout=14400, check=False)
    if process.returncode:
        print("SCAN_STEP_FAILED", json.dumps({
            "source":path,"exit_code":process.returncode,
            "stderr_tail":process.stderr[-600:]}), flush=True)
        raise RuntimeError("RESULTS_ORIGINAL_PIPELINE_FAILED")
    if "r3-live-public-filing" in path:
        return json.loads(process.stdout)
    # R4 logs progress followed by its final JSON report.
    rows=[line for line in process.stdout.splitlines() if line.lstrip().startswith("{")]
    if not rows:
        raise RuntimeError("RESULTS_VERIFIER_READBACK_MISSING")
    return json.loads(rows[-1])


def read_selected_new(db_url: str, run_id: str) -> int:
    # Only source records INSERTED BY THIS RUN and subsequently independently
    # selected are counted as new qualified company/quarter results.
    with psycopg.connect(db_url, options="-c default_transaction_read_only=on") as db:
        with db.cursor() as cur:
            cur.execute("""
                SELECT count(DISTINCT (o.security_id,o.period_end))
                  FROM public.fundamental_observation_decisions d
                  JOIN public.fundamental_observations o ON o.id=d.selected_observation_id
                  JOIN public.data_source_records sr ON sr.id=o.source_record_id
                 WHERE sr.ingestion_run_id=%s::uuid
                   AND d.period_type='QUARTER' AND o.period_type='QUARTER'
                   AND d.security_id=o.security_id AND d.period_end=o.period_end
                   AND d.metric_code=o.metric_code
                   AND d.consolidation_scope=o.consolidation_scope
                   AND o.source_code='COMPANY_EXCHANGE_FILING'
            """,(run_id,))
            return int(cur.fetchone()[0])


def complete(db_url: str,run_id: str,status: str, qualified: int,
             acquisition: dict | None, verification: dict | None, error: str | None) -> None:
    with psycopg.connect(db_url) as db:
        with db.cursor() as cur:
            # Every outstanding equity is explicitly incomplete on an
            # interrupted run; never display a partially attempted run as success.
            if error:
                cur.execute("""
                    UPDATE public.data_ingestion_run_items
                       SET status='FAILED',safe_reason_code='SOURCE_SCAN_INTERRUPTED',
                           completed_at=now()
                     WHERE ingestion_run_id=%s::uuid AND status IN ('PLANNED','ATTEMPTED')
                """,(run_id,))
            cur.execute("""
                SELECT status,count(*) FROM public.data_ingestion_run_items
                WHERE ingestion_run_id=%s::uuid GROUP BY status
            """,(run_id,))
            counts=dict(cur.fetchall())
            finished=sum(counts.values())
            if not error and counts.get("PLANNED",0):
                status="PARTIAL"
            meta={
                "contract":"RESULTS_QUARTERLY_SCAN_V2",
                "source":"EXCHANGE_ORIGINALS_REUSE_FIRST",
                "issuer_documents_parsed":(acquisition or {}).get("documents_parsed",0),
                "observations_inserted":(acquisition or {}).get("observations_inserted",0),
                "qualified_stock_quarters_new":qualified,
                "verifier_qualified_fact_rows":(verification or {}).get("qualified_fact_rows",0),
                "provider_access_errors":(acquisition or {}).get("blocked",[]),
                "item_status_counts":counts,
                "processed":finished-counts.get("PLANNED",0)-counts.get("ATTEMPTED",0),
                "large_evidence_location":"portfolioai-history-dev",
            }
            cur.execute("""
                UPDATE public.data_ingestion_runs
                   SET status=%s,completed_at=now(),accepted_count=%s,
                       failed_count=%s,rejected_count=%s,unchanged_count=%s,
                       fetched_count=%s,error_summary=%s,metadata=%s::jsonb
                 WHERE id=%s::uuid AND operation=%s AND portfolio_id=%s::uuid
                   AND status='RUNNING'
            """,(status, qualified,counts.get("FAILED",0),counts.get("REJECTED",0),
                 counts.get("UNCHANGED",0),meta["issuer_documents_parsed"],
                 error,json.dumps(meta),run_id,OPERATION,PORTFOLIO_ID))
            if cur.rowcount!=1:raise RuntimeError("SCAN_RUN_COMPLETION_CONFLICT")
        db.commit()
    print("RESULTS_SCAN_COMPLETED", json.dumps({
        "run_id":run_id,"status":status,"new_qualified_stock_quarters":qualified,
        "items":meta["item_status_counts"],"error":error}), flush=True)


def main() -> int:
    db_url=require_dev_environment()
    run_id=read_request()
    cohort=inspect_run(db_url,run_id)
    env=dict(os.environ)
    env["RESULTS_LIVE_SCAN_MODE"]="1"
    env["RESULTS_SCAN_RUN_ID"]=run_id
    env["RESULTS_MAX_STOCKS"]=str(cohort)
    env.pop("RESULTS_TARGET_SYMBOLS",None) # complete transaction-derived universe
    acquisition=verification=None
    qualified=0
    failure=None
    try:
        acquisition=execution("scripts/results/r3-live-public-filing-batch.py",env)
        if acquisition.get("universe_target")!=cohort:
            raise RuntimeError("SCAN_UNIVERSE_RECONCILIATION_FAILED")
        # Existing R4 independently reopens immutable source manifests, checks
        # exact company/quarter/scope/unit/value and preserves prior decisions.
        verification=execution("scripts/results/r4-verify-quarterly.py",env|{"RESULTS_R4_SOURCE_SCAN_MODE":"1"})
        if verification.get("mode")!="APPLY":
            raise RuntimeError("SCAN_VERIFIER_NOT_APPLIED")
        qualified=read_selected_new(db_url,run_id)
    except Exception as exc:
        failure=str(exc)[:90]
    complete(db_url,run_id, "SUCCEEDED" if not failure else "PARTIAL",
             qualified,acquisition,verification,failure)
    return 1 if failure else 0


if __name__=="__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print("SCAN_FATAL",type(exc).__name__,str(exc)[:100],file=sys.stderr)
        sys.exit(2)
