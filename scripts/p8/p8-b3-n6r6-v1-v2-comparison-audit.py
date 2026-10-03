#!/usr/bin/env python3
import csv
import hashlib
import io
import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path

import boto3
import pyarrow.parquet as pq
from botocore.config import Config

ROOT="portfolioai-history/development/p8"
V1_ADJ=f"{ROOT}/b3/adjusted-series/v1"
V1_LEDGER=f"{ROOT}/b3/adjusted-decision-ledger/v1"
V2_ADJ=f"{ROOT}/b3/adjusted-series/v2"
V2_LEDGER=f"{ROOT}/b3/adjusted-decision-ledger/v2"
CATALOG_KEY=f"{ROOT}/catalog/v1/catalog.json"
V1_COMPLETE=f"{ROOT}/manifests/v1/N6_COMPLETE.json"
V2_COMPLETE=f"{ROOT}/manifests/v2/N6R5_COMPLETE.json"

N6R3=Path("docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_LOCAL_POLICY_AUDIT_2026-10-03.json")
N6R4=Path("docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_AUDIT_2026-10-03.json")
N6R4_MATRIX=Path("docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_MATRIX_2026-10-03.csv")
N6R5=Path("docs/p8/PortfolioAI_P8_B3_N6R5_V2_MATERIALIZATION_AUDIT_2026-10-03.json")
OUT=Path("docs/p8/PortfolioAI_P8_B3_N6R6_V1_V2_COMPARISON_AUDIT_2026-10-03.json")

VERSION="P8_B3_N6R6_V1_V2_COMPARISON_AUDIT_V1"
POLICY="STRICT_1_BENCHMARK_DAY"

EXPECTED_V1_ADJ_FP="7f7f14c7af972baa22e0363732a285df1e4f3e0631d8134ce665ac32397c8a76"
EXPECTED_V1_LEDGER_FP="9ec30b0c8ea30e5d8068be570a8b251964efc5ef725d795165666b5223b275ae"
EXPECTED_V1_COMPLETE_FP="59992c038e74f83ccb278dce0af73ed6cbd97ba2064c67cd724e0df531a4ca12"
EXPECTED_LEDGER_ROWS=121956
EXPECTED_V1_READY=60616
EXPECTED_V1_COMPLEX=20787
EXPECTED_V1_NO_TRADE=40553
EXPECTED_CF=1177
EXPECTED_V2_READY=82504
EXPECTED_V2_BLOCKED=39452

def required(name):
    v=os.environ.get(name,"").strip()
    if not v:
        raise RuntimeError(f"Missing {name}")
    return v

def normalize_account(raw):
    raw=raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else:
        host=raw
    suffix=".r2.cloudflarestorage.com"
    return host[:-len(suffix)] if host.endswith(suffix) else host

def s3_client():
    account=normalize_account(required("CLOUDFLARE_R2_ACCOUNT_ID"))
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(
            retries={"max_attempts":10,"mode":"adaptive"},
            connect_timeout=30,
            read_timeout=180,
            s3={"addressing_style":"path"},
        ),
    )

def canonical(v):
    return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(",",":"))

def sha_json(v):
    return hashlib.sha256(canonical(v).encode()).hexdigest()

def read_obj(s3,bucket,key):
    return s3.get_object(Bucket=bucket,Key=key)["Body"].read()

def read_json_obj(s3,bucket,key):
    return json.loads(read_obj(s3,bucket,key))

def table_obj(s3,bucket,key,columns=None):
    return pq.read_table(io.BytesIO(read_obj(s3,bucket,key)),columns=columns)

def list_all(s3,bucket,prefix):
    out=[]
    token=None
    while True:
        kwargs={"Bucket":bucket,"Prefix":prefix,"MaxKeys":1000}
        if token:
            kwargs["ContinuationToken"]=token
        r=s3.list_objects_v2(**kwargs)
        out.extend(x["Key"] for x in (r.get("Contents") or []))
        if not r.get("IsTruncated"):
            break
        token=r["NextContinuationToken"]
    return out

def parse_bool(v):
    return str(v).strip().lower()=="true"

def main():
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")
    s3=s3_client()

    n3=json.loads(N6R3.read_text())["summary"]
    n4=json.loads(N6R4.read_text())["summary"]
    n5=json.loads(N6R5.read_text())["summary"]
    if not (n3["status"]=="PASS" and n4["status"]=="PASS" and n5["status"]=="PASS"):
        raise RuntimeError("Frozen N6R3/N6R4/N6R5 PASS evidence required")
    if n5["policy"]!=POLICY:
        raise RuntimeError("Unexpected N6R5 policy")

    v1=read_json_obj(s3,bucket,V1_COMPLETE)
    v2=read_json_obj(s3,bucket,V2_COMPLETE)
    catalog=read_json_obj(s3,bucket,CATALOG_KEY)

    # Frozen V1 invariants.
    if v1["adjusted_series"]["aggregate_fingerprint_sha256"]!=EXPECTED_V1_ADJ_FP:
        raise RuntimeError("V1 adjusted fingerprint drift")
    if v1["decision_ledger"]["aggregate_fingerprint_sha256"]!=EXPECTED_V1_LEDGER_FP:
        raise RuntimeError("V1 ledger fingerprint drift")
    if v1["completion_fingerprint_sha256"]!=EXPECTED_V1_COMPLETE_FP:
        raise RuntimeError("V1 completion fingerprint drift")
    if v1["adjusted_series"]["row_count"]!=1854978:
        raise RuntimeError("V1 adjusted row count drift")
    if v1["decision_ledger"]["row_count"]!=EXPECTED_LEDGER_ROWS:
        raise RuntimeError("V1 ledger row count drift")

    # Current raw catalog entry must still match the immutable raw fingerprint frozen by N6.
    raw_fp=sha_json(catalog["datasets"]["b3_raw_prices"])
    if raw_fp!=v1["raw_catalog_dataset_fingerprint"]:
        raise RuntimeError("Raw R2 catalog dataset drift since N6 V1")

    # R2 V2 completion must match the repository N6R5 audit.
    if v2["completion_fingerprint_sha256"]!=n5["completion_fingerprint_sha256"]:
        raise RuntimeError("R2 N6R5 completion fingerprint differs from repo audit")
    if v2["v2_adjusted_series"]["aggregate_fingerprint_sha256"]!=n5["v2_adjusted_series"]["aggregate_fingerprint_sha256"]:
        raise RuntimeError("V2 adjusted fingerprint mismatch")
    if v2["v2_decision_ledger"]["aggregate_fingerprint_sha256"]!=n5["v2_decision_ledger"]["aggregate_fingerprint_sha256"]:
        raise RuntimeError("V2 ledger fingerprint mismatch")

    # Independently recompute V2 aggregate fingerprints from every manifest.
    adj_manifest_keys=sorted(
        k for k in list_all(s3,bucket,f"{V2_ADJ}/")
        if k.endswith("/manifest.json")
    )
    ledger_manifest_keys=sorted(
        k for k in list_all(s3,bucket,f"{V2_LEDGER}/")
        if k.endswith("/manifest.json")
    )
    if len(adj_manifest_keys)!=744:
        raise RuntimeError(f"Expected 744 V2 adjusted manifests, got {len(adj_manifest_keys)}")
    if len(ledger_manifest_keys)!=32:
        raise RuntimeError(f"Expected 32 V2 ledger manifests, got {len(ledger_manifest_keys)}")

    adj_manifest_rows=[]
    adj_rows=adj_ready=adj_blocked=0
    for key in adj_manifest_keys:
        m=read_json_obj(s3,bucket,key)
        adj_manifest_rows.append([
            m["trade_date"],m["row_count"],m["normalized_fingerprint_sha256"],m["parquet_sha256"]
        ])
        adj_rows+=int(m["row_count"])
        adj_ready+=int(m["ready_rows"])
        adj_blocked+=int(m["blocked_rows"])
    adj_aggregate=sha_json(adj_manifest_rows)

    ledger_manifest_rows=[]
    ledger_manifest_total=ledger_manifest_ready=ledger_manifest_blocked=0
    for key in ledger_manifest_keys:
        m=read_json_obj(s3,bucket,key)
        ledger_manifest_rows.append([
            m["decision_date"],m["row_count"],m["normalized_fingerprint_sha256"],m["parquet_sha256"]
        ])
        ledger_manifest_total+=int(m["row_count"])
        ledger_manifest_ready+=int(m["ready_rows"])
        ledger_manifest_blocked+=int(m["blocked_rows"])
    ledger_aggregate=sha_json(ledger_manifest_rows)

    if adj_aggregate!=n5["v2_adjusted_series"]["aggregate_fingerprint_sha256"]:
        raise RuntimeError("Independent V2 adjusted manifest aggregate mismatch")
    if ledger_aggregate!=n5["v2_decision_ledger"]["aggregate_fingerprint_sha256"]:
        raise RuntimeError("Independent V2 ledger manifest aggregate mismatch")

    # Load exact N6R4 no-trade evidence for strict-threshold accounting.
    n4_by_pair={}
    with N6R4_MATRIX.open(newline="",encoding="utf-8") as f:
        for r in csv.DictReader(f):
            key=(r["decision_date"],r["historical_identity_id"])
            if key in n4_by_pair:
                raise RuntimeError(f"Duplicate N6R4 pair {key}")
            n4_by_pair[key]=r
    if len(n4_by_pair)!=EXPECTED_V1_NO_TRADE:
        raise RuntimeError(f"N6R4 matrix count {len(n4_by_pair)}")

    # Discover frozen V1/V2 ledger partitions.
    def decision_map(prefix):
        result={}
        for key in list_all(s3,bucket,prefix):
            m=re.search(r"decision_date=(\d{4}-\d{2}-\d{2})/part-00000\.parquet$",key)
            if m:
                result[m.group(1)]=key
        return result

    v1_parts=decision_map(f"{V1_LEDGER}/")
    v2_parts=decision_map(f"{V2_LEDGER}/")
    if len(v1_parts)!=32 or set(v1_parts)!=set(v2_parts):
        raise RuntimeError("V1/V2 ledger partition mismatch")

    # Cache selected V2 price partitions only when lineage needs them.
    price_cache={}
    def selected_price(key,row_id):
        if key not in price_cache:
            t=table_obj(s3,bucket,key)
            price_cache[key]={str(r["id"]):r for r in t.to_pylist()}
        return price_cache[key].get(str(row_id))

    transitions=Counter()
    v1_states=Counter()
    v2_states=Counter()
    v2_blockers=Counter()
    carry_forward_rows=0
    exact_decision_rows=0
    selected_lineage_rows=0
    raw_conflict_complex=0
    event_boundary_complex=0
    blocked_no_trade_decomp=Counter()
    no_trade_recovered_pairs=set()
    seen_pairs=set()

    for d in sorted(v1_parts):
        v1t=table_obj(s3,bucket,v1_parts[d]).to_pylist()
        v2t=table_obj(s3,bucket,v2_parts[d]).to_pylist()
        old={str(r["historical_identity_id"]):r for r in v1t}
        new={str(r["historical_identity_id"]):r for r in v2t}
        if set(old)!=set(new):
            raise RuntimeError(f"V1/V2 identity set mismatch on {d}")

        for ident in sorted(old):
            pair=(d,ident)
            if pair in seen_pairs:
                raise RuntimeError(f"Duplicate decision pair {pair}")
            seen_pairs.add(pair)

            a=old[ident]
            b=new[ident]
            astate=str(a["state"])
            areason=a.get("blocker_reason")
            bstate=str(b["state"])
            breason=b.get("blocker_reason")

            if astate=="READY":
                v1_states["READY"]+=1
                aclass="READY"
            elif areason=="COMPLEX_CORPORATE_ACTION_BLOCKER":
                v1_states["COMPLEX_CORPORATE_ACTION_BLOCKER"]+=1
                aclass="COMPLEX_CORPORATE_ACTION_BLOCKER"
            elif areason=="NO_TRADE_ON_DECISION_DATE":
                v1_states["NO_TRADE_ON_DECISION_DATE"]+=1
                aclass="NO_TRADE_ON_DECISION_DATE"
            else:
                raise RuntimeError(f"Unexpected V1 state {astate}/{areason}")

            if bstate=="READY":
                v2_states["READY"]+=1
                bclass="READY"
            else:
                v2_states["BLOCKED"]+=1
                v2_blockers[str(breason)]+=1
                bclass=str(breason)

            transitions[(aclass,bclass)]+=1

            lineage=json.loads(b["lineage_json"])
            if lineage.get("v1LedgerRowId")!=str(a["id"]):
                raise RuntimeError(f"V1 row-id lineage mismatch {pair}")
            if lineage.get("v1LedgerRowHash")!=str(a["row_hash"]):
                raise RuntimeError(f"V1 row-hash lineage mismatch {pair}")
            if lineage.get("decisionDate")!=d:
                raise RuntimeError(f"Decision-date lineage mismatch {pair}")

            if bstate=="READY":
                source=lineage.get("selectionSource")
                pkey=lineage.get("adjustedPartitionKey")
                sid=b.get("adjusted_series_row_id")
                if not pkey or not sid:
                    raise RuntimeError(f"READY row missing selected price lineage {pair}")
                pr=selected_price(pkey,sid)
                if pr is None:
                    raise RuntimeError(f"Selected V2 price row not found {pair}")
                if str(pr["historical_identity_id"])!=ident:
                    raise RuntimeError(f"Selected price identity mismatch {pair}")
                if pr["series_state"]!="READY":
                    raise RuntimeError(f"Selected price is not READY {pair}")
                if str(pr["adjusted_close"])!=str(b["adjusted_close"]):
                    raise RuntimeError(f"Selected close mismatch {pair}")
                if str(pr["total_return_index"])!=str(b["total_return_index"]):
                    raise RuntimeError(f"Selected TRI mismatch {pair}")
                selected_lineage_rows+=1

                if source=="EXACT_DECISION_DATE":
                    if pr["trade_date"]!=d:
                        raise RuntimeError(f"Exact selection not on decision date {pair}")
                    exact_decision_rows+=1
                elif source=="STRICT_1_DAY_CARRY_FORWARD":
                    ev=n4_by_pair.get(pair)
                    if ev is None:
                        raise RuntimeError(f"Carry-forward pair absent from N6R4 {pair}")
                    if not parse_bool(ev["eligible_for_threshold_review"]):
                        raise RuntimeError(f"Carry-forward was not threshold-eligible {pair}")
                    stale=int(ev["benchmark_trading_day_staleness"])
                    if stale!=1:
                        raise RuntimeError(f"Carry-forward staleness not exactly 1 day {pair}: {stale}")
                    if lineage.get("carryForwardTradeDate")!=ev["prior_trade_date"]:
                        raise RuntimeError(f"Carry-forward prior-date mismatch {pair}")
                    if pr["trade_date"]!=ev["prior_trade_date"]:
                        raise RuntimeError(f"Selected carry-forward row date mismatch {pair}")
                    carry_forward_rows+=1
                    no_trade_recovered_pairs.add(pair)
                else:
                    raise RuntimeError(f"Unexpected READY selection source {source} {pair}")

            if aclass=="NO_TRADE_ON_DECISION_DATE" and bstate!="READY":
                ev=n4_by_pair[pair]
                primary=ev["primary_exclusion_reason"]
                if primary=="NO_PRIOR_PRICE":
                    blocked_no_trade_decomp["NO_PRIOR_PRICE"]+=1
                elif primary=="CORPORATE_ACTION_BOUNDARY":
                    blocked_no_trade_decomp["CORPORATE_ACTION_BOUNDARY"]+=1
                elif primary=="ELIGIBLE_FOR_THRESHOLD_REVIEW":
                    stale=int(ev["benchmark_trading_day_staleness"])
                    if stale<=1:
                        raise RuntimeError(f"Strict-eligible no-trade pair remained blocked {pair}")
                    blocked_no_trade_decomp["STALE_GT_1_BENCHMARK_DAY"]+=1
                else:
                    raise RuntimeError(f"Unexpected N6R4 primary exclusion {primary}")

            if aclass=="COMPLEX_CORPORATE_ACTION_BLOCKER" and bstate!="READY":
                # Localized raw conflict is proven directly by the V2 exact-date series.
                key=f"{V2_ADJ}/year={d[:4]}/month={d[5:7]}/trade_date={d}/part-00000.parquet"
                if key not in price_cache:
                    t=table_obj(s3,bucket,key)
                    price_cache[key]={str(r["id"]):r for r in t.to_pylist()}
                rows=[r for r in price_cache[key].values() if str(r["historical_identity_id"])==ident]
                if rows and all(r["series_state"]=="BLOCKED" and r["blocker_reason"]=="RAW_PRICE_ECONOMICS_CONFLICT" for r in rows):
                    raw_conflict_complex+=1
                else:
                    event_boundary_complex+=1

    if len(seen_pairs)!=EXPECTED_LEDGER_ROWS:
        raise RuntimeError(f"Decision pair accounting {len(seen_pairs)}")

    # Expected V1 and V2 totals.
    if v1_states["READY"]!=EXPECTED_V1_READY:
        raise RuntimeError(f"V1 READY drift {v1_states}")
    if v1_states["COMPLEX_CORPORATE_ACTION_BLOCKER"]!=EXPECTED_V1_COMPLEX:
        raise RuntimeError(f"V1 complex drift {v1_states}")
    if v1_states["NO_TRADE_ON_DECISION_DATE"]!=EXPECTED_V1_NO_TRADE:
        raise RuntimeError(f"V1 no-trade drift {v1_states}")
    if v2_states["READY"]!=EXPECTED_V2_READY or v2_states["BLOCKED"]!=EXPECTED_V2_BLOCKED:
        raise RuntimeError(f"V2 ledger totals drift {v2_states}")
    if carry_forward_rows!=EXPECTED_CF:
        raise RuntimeError(f"Strict carry-forward recovery count {carry_forward_rows}")

    # Exact transition matrix frozen by N6R5.
    expected_transitions={
        ("READY","READY"):60616,
        ("COMPLEX_CORPORATE_ACTION_BLOCKER","READY"):20711,
        ("COMPLEX_CORPORATE_ACTION_BLOCKER","COMPLEX_CORPORATE_ACTION_BLOCKER"):76,
        ("NO_TRADE_ON_DECISION_DATE","READY"):1177,
        ("NO_TRADE_ON_DECISION_DATE","NO_TRADE_ON_DECISION_DATE"):39376,
    }
    if dict(transitions)!=expected_transitions:
        raise RuntimeError(f"Unexpected V1->V2 transition matrix: {dict(transitions)}")

    expected_no_trade_decomp={
        "NO_PRIOR_PRICE":34354,
        "CORPORATE_ACTION_BOUNDARY":2,
        "STALE_GT_1_BENCHMARK_DAY":5020,
    }
    if dict(blocked_no_trade_decomp)!=expected_no_trade_decomp:
        raise RuntimeError(f"No-trade blocker decomposition drift {dict(blocked_no_trade_decomp)}")
    if raw_conflict_complex!=67 or event_boundary_complex!=9:
        raise RuntimeError(f"Complex blocker decomposition drift raw={raw_conflict_complex} event={event_boundary_complex}")

    structural_or_evidence_blockers=(
        blocked_no_trade_decomp["NO_PRIOR_PRICE"]
        + blocked_no_trade_decomp["CORPORATE_ACTION_BOUNDARY"]
        + raw_conflict_complex
        + event_boundary_complex
    )
    strict_policy_staleness_blockers=blocked_no_trade_decomp["STALE_GT_1_BENCHMARK_DAY"]
    if structural_or_evidence_blockers+strict_policy_staleness_blockers!=EXPECTED_V2_BLOCKED:
        raise RuntimeError("Final blocker decomposition does not reconcile")

    # Replay stability: successful N6R5 replay produced no new objects and verified all immutable V2 objects.
    replay_stable=(int(n5["created_objects"])==0 and int(n5["unchanged_objects"])==1553)
    if not replay_stable:
        raise RuntimeError("N6R5 deterministic replay evidence is not stable")

    summary={
        "version":VERSION,
        "status":"PASS",
        "environment":"PortfolioAI Dev",
        "scope":{
            "decision_pairs_compared":len(seen_pairs),
            "v2_adjusted_manifests_recomputed":len(adj_manifest_keys),
            "v2_ledger_manifests_recomputed":len(ledger_manifest_keys),
            "selected_v2_price_lineages_verified":selected_lineage_rows,
        },
        "frozen_v1":{
            "adjusted_series_fingerprint":EXPECTED_V1_ADJ_FP,
            "decision_ledger_fingerprint":EXPECTED_V1_LEDGER_FP,
            "completion_fingerprint":EXPECTED_V1_COMPLETE_FP,
            "raw_catalog_dataset_fingerprint":raw_fp,
            "unchanged":True,
        },
        "v2_fingerprints":{
            "adjusted_series_aggregate":adj_aggregate,
            "decision_ledger_aggregate":ledger_aggregate,
            "completion_fingerprint":v2["completion_fingerprint_sha256"],
            "manifest_accounting":{
                "adjusted_rows":adj_rows,
                "adjusted_ready":adj_ready,
                "adjusted_blocked":adj_blocked,
                "decision_rows":ledger_manifest_total,
                "decision_ready":ledger_manifest_ready,
                "decision_blocked":ledger_manifest_blocked,
            },
        },
        "v1_to_v2_transition_matrix":{
            "V1_READY_to_V2_READY":transitions[("READY","READY")],
            "V1_COMPLEX_to_V2_READY":transitions[("COMPLEX_CORPORATE_ACTION_BLOCKER","READY")],
            "V1_COMPLEX_to_V2_BLOCKED":transitions[("COMPLEX_CORPORATE_ACTION_BLOCKER","COMPLEX_CORPORATE_ACTION_BLOCKER")],
            "V1_NO_TRADE_to_V2_READY":transitions[("NO_TRADE_ON_DECISION_DATE","READY")],
            "V1_NO_TRADE_to_V2_BLOCKED":transitions[("NO_TRADE_ON_DECISION_DATE","NO_TRADE_ON_DECISION_DATE")],
        },
        "recovery_deltas":{
            "complex_recovered":20711,
            "strict_1_day_no_trade_recovered":carry_forward_rows,
            "total_new_ready_vs_v1":EXPECTED_V2_READY-EXPECTED_V1_READY,
            "v1_ready_regressions":0,
        },
        "remaining_blockers":{
            "total":EXPECTED_V2_BLOCKED,
            "structural_or_evidence_boundary_total":structural_or_evidence_blockers,
            "strict_policy_staleness_total":strict_policy_staleness_blockers,
            "decomposition":{
                "NO_PRIOR_PRICE":blocked_no_trade_decomp["NO_PRIOR_PRICE"],
                "CORPORATE_ACTION_BOUNDARY_NO_TRADE":blocked_no_trade_decomp["CORPORATE_ACTION_BOUNDARY"],
                "STALE_GT_1_BENCHMARK_DAY":strict_policy_staleness_blockers,
                "RAW_PRICE_ECONOMICS_CONFLICT_COMPLEX":raw_conflict_complex,
                "UNRESOLVED_EVENT_BOUNDARY_COMPLEX":event_boundary_complex,
            },
            "interpretation":{
                "structural_or_evidence_boundary_blockers_require_new_evidence_or_separate_remediation_to_change":True,
                "staleness_blockers_are_policy_held_by_frozen_strict_1_day_threshold":True,
                "all_remaining_blockers_are_fully_accounted":True,
                "claim_all_remaining_blockers_are_fundamentally_irreducible":False,
            },
        },
        "lineage_and_imputation":{
            "ready_rows_with_selected_price_verified":selected_lineage_rows,
            "exact_decision_date_selections":exact_decision_rows,
            "strict_1_day_carry_forward_selections":carry_forward_rows,
            "unexpected_selection_sources":0,
            "silent_imputation_detected":False,
            "v1_row_id_and_hash_lineage_verified_for_all_pairs":True,
        },
        "determinism":{
            "n6r5_replay_created_objects":int(n5["created_objects"]),
            "n6r5_replay_unchanged_objects":int(n5["unchanged_objects"]),
            "immutable_replay_stable":replay_stable,
        },
        "closure_gate":{
            "n6r6_complete":True,
            "comparison_audit_passed":True,
            "ready_for_b3_closure_decision":True,
            "b3_closed_by_this_stage":False,
            "new_remediation_authorized":False,
        },
        "mutations":{
            "r2_writes":0,
            "supabase_writes":0,
            "production_changes":0,
            "main_changes":0,
        },
    }
    summary["audit_fingerprint_sha256"]=sha_json(summary)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({"summary":summary},indent=2,sort_keys=True)+"\n")
    print(json.dumps(summary,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
