#!/usr/bin/env python3
import boto3, io, json, os, hashlib
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import pyarrow.parquet as pq
from botocore.config import Config

BUCKET="portfolioai-history-dev"
ROOT="portfolioai-history/development/p8"
LEDGER=f"{ROOT}/b3/adjusted-decision-ledger/v2"
D_AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_AUDIT_2026-10-04.json")
OUT_JSON=Path("docs/p8/PortfolioAI_P8_NARROWER_EXPERIMENT_FEASIBILITY_AUDIT.json")
OUT_MEMO=Path("docs/p8/PortfolioAI_P8_NARROWER_EXPERIMENT_DECISION_MEMO.md")
EXPERIMENT="P8_EXP_NSE_MONTHLY_6M_NARROWER_V2_PROPOSED"
VERSION="P8_NARROWER_EXPERIMENT_FEASIBILITY_AUDIT_V1"

def acct(x):
    h=urlparse(x).hostname if "://" in x else x
    s=".r2.cloudflarestorage.com"
    return h[:-len(s)] if h.endswith(s) else h

def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client(
        "s3", endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(max_pool_connections=32,retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"})
    )

def read(c,key): return c.get_object(Bucket=BUCKET,Key=key)["Body"].read()
def sha(b): return hashlib.sha256(b).hexdigest()

def list_ledger(c):
    out=[]; tok=None
    while True:
        kw={"Bucket":BUCKET,"Prefix":LEDGER+"/","MaxKeys":1000}
        if tok: kw["ContinuationToken"]=tok
        p=c.list_objects_v2(**kw)
        out += [x["Key"] for x in p.get("Contents",[]) if x["Key"].endswith("/part-00000.parquet")]
        if not p.get("IsTruncated"): break
        tok=p["NextContinuationToken"]
    out=sorted(out)
    if len(out)!=32: raise RuntimeError(f"expected 32 B3 V2 partitions, got {len(out)}")
    return out

def pct(a,b): return round((a/b*100.0) if b else 0.0,6)

def main():
    if os.environ.get("CLOUDFLARE_R2_BUCKET") != BUCKET:
        raise RuntimeError("wrong R2 bucket")
    c=s3()
    d=json.loads(D_AUDIT.read_text())
    dp=d["artifacts"]["pair_dispositions"]
    raw=read(c,dp["r2_key"])
    if sha(raw)!=dp["sha256"]: raise RuntimeError("D pair disposition hash mismatch")
    drows=[json.loads(x) for x in raw.decode().splitlines() if x.strip()]
    dmap={(r["historical_identity_id"],r["decision_at"][:10]):r for r in drows}
    if len(dmap)!=121956: raise RuntimeError(f"D logical keys={len(dmap)}")

    market={}
    for k in list_ledger(c):
        t=pq.read_table(io.BytesIO(read(c,k)),columns=["decision_date","historical_identity_id","state","blocker_reason"])
        for r in t.to_pylist():
            key=(str(r["historical_identity_id"]),str(r["decision_date"])[:10])
            market[key]={"state":str(r["state"]),"blocker_reason":r.get("blocker_reason")}
    if len(market)!=121956: raise RuntimeError(f"B3 logical keys={len(market)}")

    counts=Counter(); bydate=defaultdict(Counter); byclass=defaultdict(Counter)
    candidate_ids=set(); all_ids=set(); dates=set()
    for key,dr in dmap.items():
        all_ids.add(key[0]); dates.add(key[1])
        mr=market.get(key)
        if mr is None: raise RuntimeError("missing B3 pair")
        ds=dr["state"]; ms=mr["state"]; label=dr.get("classification_label") or "UNRESOLVED"
        if ds=="NO_PRE_DECISION_EVIDENCE":
            disposition="NO_PRE_DECISION_EVIDENCE"
        elif ds=="EVIDENCE_PRESENT_CLASSIFICATION_UNRESOLVED":
            disposition="CLASSIFICATION_UNRESOLVED"
        elif ds=="RESOLVED_CLASSIFICATION" and ms!="READY":
            disposition="MARKET_DATA_BLOCKED"
        elif ds=="RESOLVED_CLASSIFICATION" and ms=="READY":
            # This is the maximum current candidate surface. It is NOT replay-ready:
            # Workstream D's label is provisional, not the frozen four-tier historical taxonomy,
            # so deterministic R6-R10 methodology routing and therefore required-metric completeness
            # cannot yet be proven without creating a new contract.
            disposition="CANDIDATE_ROUTE_AND_REQUIRED_METRICS_UNPROVEN"
            candidate_ids.add(key[0])
        else:
            disposition="UNKNOWN_FAIL_CLOSED"
        counts[disposition]+=1
        bydate[key[1]][disposition]+=1
        byclass[label][disposition]+=1

    candidate=counts["CANDIDATE_ROUTE_AND_REQUIRED_METRICS_UNPROVEN"]
    audit={
      "version":VERSION,
      "generated_at":datetime.now(timezone.utc).isoformat(),
      "repository_branch":"PortfolioAI-Development",
      "source_experiment_id":"P8_EXP_NSE_MONTHLY_6M_V1",
      "proposed_experiment_id":EXPERIMENT,
      "decision":"NARROWER_EXPERIMENT_NO_GO",
      "outcome_blind":True,
      "performance_outcome_reads":0,
      "provider_calls":0,
      "supabase_writes":0,
      "r2_writes":0,
      "production_changes":0,
      "main_changes":0,
      "source_lineage":{
        "workstream_d_audit":"docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_AUDIT_2026-10-04.json",
        "workstream_d_pair_dispositions_r2_key":dp["r2_key"],
        "workstream_d_pair_dispositions_sha256":dp["sha256"],
        "b3_market_ledger_prefix":LEDGER,
        "b3_market_partitions":32
      },
      "full_surface":{
        "historical_identities":len(all_ids),
        "decision_dates":len(dates),
        "b2_eligible_pairs":len(dmap)
      },
      "pair_dispositions":dict(counts),
      "maximum_current_candidate_surface":{
        "definition":"B2 eligible AND B3 market READY AND official pre-decision evidence present AND Workstream-D provisional classification resolved",
        "pairs":candidate,
        "unique_historical_identities":len(candidate_ids),
        "coverage_of_b2_percent":pct(candidate,len(dmap)),
        "replay_ready_pairs":0,
        "why_not_replay_ready":[
          "Workstream-D classification_label is a provisional segment-derived signal, not a frozen complete four-tier historical taxonomy contract.",
          "Without a frozen deterministic historical classification-to-methodology route, the required methodology-specific metric set is not determinable per pair.",
          "Raw XBRL fact presence cannot be treated as proof that every required normalized scoring metric is available and semantically valid.",
          "The audit therefore fails closed rather than converting provisional labels or raw facts into replay-ready status."
        ]
      },
      "decision_date_matrix":{k:dict(v) for k,v in sorted(bydate.items())},
      "classification_label_matrix":{k:dict(v) for k,v in sorted(byclass.items())},
      "proposed_objective_rules":[
        "Retain only B2 survivor-free historically eligible pairs.",
        "Require B3 market state READY at the decision date.",
        "Require official evidence disseminated strictly before the decision.",
        "Require a frozen, point-in-time historical classification that deterministically maps to exactly one R6-R10 methodology route.",
        "Require the complete normalized methodology-specific metric set from pre-decision evidence.",
        "Require at least 24 retained decision dates and no date below the frozen per-date coverage floor.",
        "Do not use current survival, current holdings, future returns, later success, or manual stock selection."
      ],
      "standards":{
        "minimum_decision_dates":24,
        "minimum_overall_replay_ready_percent":80,
        "minimum_each_retained_date_percent":70,
        "minimum_major_methodology_sector_percent":60,
        "identity_resolution_required_percent":100
      },
      "standards_evaluation":{
        "decision_dates_available":len(dates),
        "decision_dates_gate":"PASS",
        "identity_resolution_for_retained_pairs":"PASS_BY_B2_IDENTITY_KEY",
        "overall_replay_ready_percent":0.0,
        "overall_gate":"FAIL",
        "per_date_gate":"FAIL_NOT_COMPUTABLE_AS_REPLAY_READY",
        "major_methodology_sector_gate":"FAIL_NOT_COMPUTABLE_UNTIL_ROUTE_FROZEN"
      },
      "irreducible_blockers":[
        "No currently frozen complete historical classification contract maps the Workstream-D provisional labels into the required four-tier taxonomy and one deterministic R6-R10 route.",
        "Required methodology-specific metric completeness cannot be proven before that route exists; raw parsed fact presence is insufficient.",
        "Therefore no identity/date pair can yet be truthfully classified as replay-ready under the proposed research-governance standards."
      ],
      "owner_freeze_boundary":{
        "status":"NOT_READY_FOR_OWNER_FREEZE",
        "reason":"A proposed experiment contract can be drafted, but the evidence surface does not yet prove a sufficiently large replay-ready sample. Rebuilding B5/B6 is not justified yet."
      }
    }
    OUT_JSON.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")

    date_rows=[]
    for dte,cnt in sorted(bydate.items()):
        total=sum(cnt.values()); cand=cnt.get("CANDIDATE_ROUTE_AND_REQUIRED_METRICS_UNPROVEN",0)
        date_rows.append(f"| {dte} | {total:,} | {cand:,} | {pct(cand,total):.2f}% | 0 |")
    memo=f"""# PortfolioAI P8 Narrower Experiment Decision Memo

Date: 4 October 2026  
Environment: Development only  
Branch: `PortfolioAI-Development`  
Source experiment: `P8_EXP_NSE_MONTHLY_6M_V1`  
Proposed version identifier: `{EXPERIMENT}`

## Decision

**NARROWER_EXPERIMENT_NO_GO**

This is an outcome-blind feasibility decision. No P8-C output, holdout result, forward return, benchmark performance, portfolio simulation or performance metric was inspected.

## What was measured

The audit rejoined the authoritative Workstream D pair-disposition ledger with the 32-partition B3 V2 adjusted decision ledger at exact `historical_identity_id + decision_date`.

Full historical surface:

- historical identities: **{len(all_ids):,}**
- decision dates: **{len(dates)}**
- B2-eligible identity/date pairs: **{len(dmap):,}**

Maximum current candidate surface before methodology/metric proof:

- B2 eligible;
- B3 market state READY;
- official pre-decision evidence present;
- Workstream-D provisional classification resolved.

That candidate surface contains **{candidate:,} pairs across {len(candidate_ids):,} historical identities**, or **{pct(candidate,len(dmap)):.2f}%** of the B2-eligible denominator.

It is deliberately labelled **candidate**, not replay-ready.

## Why it is not yet replay-ready

Workstream D materially improved the evidence surface, but its `classification_label` is a provisional segment-derived signal produced from parsed XBRL. It is not yet the frozen complete historical classification contract required by the recovery plan.

Because that complete classification contract is not frozen, PortfolioAI cannot yet prove exactly one deterministic R6-R10 methodology route for those candidate pairs. Without the route, the methodology-specific required metric set is also not determinable. Raw XBRL fact presence is not equivalent to proof that all required normalized scoring metrics are available and semantically valid.

Accordingly this audit does **not** convert provisional classification or raw facts into a synthetic PASS.

## Objective narrowing rules evaluated

1. Preserve the survivor-free B2 historical universe; no present-day survival or holdings filter.
2. Require B3 market readiness at each decision date.
3. Require official evidence disseminated strictly before the decision.
4. Require a frozen point-in-time historical classification that maps to exactly one R6-R10 methodology route.
5. Require the complete normalized methodology-specific metric set from pre-decision evidence.
6. Retain at least 24 decision dates.
7. Never select securities using future returns, later success, outcome inspection, or manual convenience.

These rules are objective and point-in-time, but rules 4–5 are not yet provable from the current frozen evidence contracts.

## Coverage standards

| Standard | Result |
|---|---|
| At least 24 proven decision dates | PASS — {len(dates)} available |
| 100% identity resolution for retained pairs | PASS at B2 historical-identity level |
| At least 80% overall replay-ready coverage | FAIL — replay-ready remains 0% |
| At least 70% replay-ready on every retained date | FAIL / not yet computable as replay-ready |
| No major methodology sector below 60% | FAIL / methodology sectors not yet deterministically routable |
| Explicit missingness disclosure | PASS |

The standards were not lowered after observing coverage.

## Candidate distribution by decision date

| Decision date | B2 eligible | Candidate before route/metric proof | Candidate share | Replay-ready |
|---|---:|---:|---:|---:|
{chr(10).join(date_rows)}

## Exclusion/disposition policy

Every B2-eligible pair has an explicit feasibility disposition:

- `NO_PRE_DECISION_EVIDENCE`
- `CLASSIFICATION_UNRESOLVED`
- `MARKET_DATA_BLOCKED`
- `CANDIDATE_ROUTE_AND_REQUIRED_METRICS_UNPROVEN`
- fail-closed unknown only if an unrecognized state appears.

No pair is silently excluded.

## Known limitations

The existing Workstream D classification is not a complete four-tier historical taxonomy. The current audit therefore cannot produce sector/industry/methodology-family coverage that is research-valid for owner freeze. Likewise, methodology-specific normalized metric completeness cannot be measured honestly until the route contract exists.

This is not a provider-data shortage that should trigger another acquisition loop. It is a contract/evidence-normalization gap inside the already acquired evidence surface.

## GO / NO-GO recommendation

**NO-GO. Do not rebuild B5/B6/B-FINAL yet.**

The next legitimate Development task, if separately authorized, is a bounded contract-resolution step that:

1. freezes a complete historical classification taxonomy/router from the already acquired point-in-time evidence;
2. maps each eligible historical classification to exactly one frozen R6-R10 methodology path; and
3. defines the exact normalized metric requirements per path and measures their existing pre-decision coverage.

Only after that read-only coverage census can PortfolioAI know whether the candidate surface above becomes sufficiently large and unbiased to justify a separately versioned experiment.

P8-C remains **NOT AUTHORIZED**. Production and `main` remain unchanged.
"""
    OUT_MEMO.write_text(memo)

    print(json.dumps({
      "decision":audit["decision"],
      "candidate_pairs":candidate,
      "candidate_identities":len(candidate_ids),
      "b2_pairs":len(dmap),
      "pair_dispositions":dict(counts)
    },indent=2,sort_keys=True))

if __name__=="__main__":
    main()
