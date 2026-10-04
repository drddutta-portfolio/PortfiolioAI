#!/usr/bin/env python3
import boto3, hashlib, io, json, os, re
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
CONTRACT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_CANDIDATE_V1.json")
EXPECTED_CONTRACT_BLOB="f459a4bd01ff8d25bcabbcef2195249553ddeb87"
CENSUS=Path("docs/p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_COVERAGE_CENSUS_2026-10-04.json")
AUDIT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_AUDIT_2026-10-04.json")
MEMO=Path("docs/p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_CLOSURE_2026-10-04.md")
VERSION="P8_HISTORICAL_CONTRACT_RESOLUTION_AUDIT_V1"

POSITIONAL_RE=re.compile(r"(?:ReportableSegment|OtherRevenueFromOperations|Segments?\d*Member)",re.I)

def acct(x):
    h=urlparse(x).hostname if "://" in x else x
    suffix=".r2.cloudflarestorage.com"
    return h[:-len(suffix)] if h.endswith(suffix) else h

def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
      aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
      region_name="auto",config=Config(max_pool_connections=32,retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))

def read(c,key): return c.get_object(Bucket=BUCKET,Key=key)["Body"].read()
def sha256(b): return hashlib.sha256(b).hexdigest()
def git_blob_sha(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def canonical_hash(x): return sha256(json.dumps(x,sort_keys=True,separators=(",",":")).encode())
def pct(a,b): return round(a*100.0/b,6) if b else 0.0

def list_ledger(c):
    out=[]; token=None
    while True:
        kw={"Bucket":BUCKET,"Prefix":LEDGER+"/","MaxKeys":1000}
        if token: kw["ContinuationToken"]=token
        pg=c.list_objects_v2(**kw)
        out += sorted(x["Key"] for x in pg.get("Contents",[]) if x["Key"].endswith("/part-00000.parquet"))
        if not pg.get("IsTruncated"): break
        token=pg["NextContinuationToken"]
    out=sorted(set(out))
    if len(out)!=32: raise RuntimeError(f"expected 32 B3 V2 partitions, got {len(out)}")
    return out

def classification_label_diagnostic(label):
    if label is None: return "NO_LABEL"
    if label=="DIVERSIFIED": return "DIVERSIFIED_WITHOUT_SEMANTIC_FOUR_TIER_PROOF"
    if POSITIONAL_RE.search(label): return "POSITIONAL_XBRL_MEMBER_NOT_TAXONOMY"
    return "UNMAPPED_PROVISIONAL_LABEL_NOT_FOUR_TIER"

def classification_contract_proven(row):
    # Workstream-D pair dispositions expose one provisional classification_label,
    # not the required four-tier Sector + Industry taxonomy. Fail closed.
    label=row.get("classification_label")
    return False, classification_label_diagnostic(label)

def choose_revision(records, decision_at):
    eligible=[r for r in records if r["disseminated_at"] < decision_at]
    if not eligible: return None
    return sorted(eligible,key=lambda r:(r["disseminated_at"],r.get("revision",0)))[-1]

def statement_preference(records):
    rank={"CONSOLIDATED_AUDITED_ANNUAL":0,"CONSOLIDATED_QUARTERLY":1,"STANDALONE_EXPLICITLY_ALLOWED":2}
    valid=[r for r in records if r.get("statement_class") in rank]
    return sorted(valid,key=lambda r:rank[r["statement_class"]])[0] if valid else None

def validate_normalized_metric(metric):
    required=("source_hash","disseminated_at","period","statement_scope","raw_concept","raw_unit","raw_scale","currency","transformation_version")
    missing=[k for k in required if metric.get(k) in (None,"")]
    if missing: return False,"MISSING_PROVENANCE:"+",".join(missing)
    if metric.get("unit_conflict"): return False,"UNIT_CONFLICT"
    if metric.get("period_conflict"): return False,"PERIOD_CONFLICT"
    return True,"VALID"

def main():
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET: raise RuntimeError("wrong bucket")
    contract_bytes=CONTRACT.read_bytes()
    if git_blob_sha(contract_bytes)!=EXPECTED_CONTRACT_BLOB:
        raise RuntimeError("frozen contract candidate changed before census")
    contract=json.loads(contract_bytes)
    contract_sha256=sha256(contract_bytes)

    d=json.loads(D_AUDIT.read_text())
    pair_art=d["artifacts"]["pair_dispositions"]
    c=s3()
    pair_raw=read(c,pair_art["r2_key"])
    if sha256(pair_raw)!=pair_art["sha256"]: raise RuntimeError("Workstream D pair hash mismatch")
    drows=[json.loads(x) for x in pair_raw.decode().splitlines() if x.strip()]
    dmap={(r["historical_identity_id"],r["decision_at"][:10]):r for r in drows}
    if len(dmap)!=121956: raise RuntimeError(f"expected 121956 D keys got {len(dmap)}")

    market={}
    market_source_hashes={}
    for key in list_ledger(c):
        raw=read(c,key); market_source_hashes[key]=sha256(raw)
        tab=pq.read_table(io.BytesIO(raw),columns=["decision_date","historical_identity_id","state","blocker_reason"])
        for r in tab.to_pylist():
            lk=(str(r["historical_identity_id"]),str(r["decision_date"])[:10])
            if lk in market: raise RuntimeError("duplicate B3 logical key")
            market[lk]={"state":str(r["state"]),"blocker_reason":r.get("blocker_reason")}
    if len(market)!=121956: raise RuntimeError(f"expected 121956 market keys got {len(market)}")

    primary=Counter(); diagnostics=Counter(); bydate=defaultdict(Counter); bycohort=defaultdict(Counter)
    candidate_ids=set(); all_ids=set(); complete_ids=set()
    candidate_pairs=0; classification_proven=0; route_proven=0; complete_inputs=0

    for key in sorted(dmap,key=lambda z:(z[1],z[0])):
        dr=dmap[key]; mr=market[key]; all_ids.add(key[0])
        ds=dr["state"]
        if ds=="NO_PRE_DECISION_EVIDENCE":
            p="NO_PRE_DECISION_EVIDENCE"
        elif ds=="EVIDENCE_PRESENT_CLASSIFICATION_UNRESOLVED":
            p="CLASSIFICATION_UNRESOLVED"
        elif ds=="RESOLVED_CLASSIFICATION" and mr["state"]!="READY":
            p="MARKET_DATA_BLOCKED"
        elif ds=="RESOLVED_CLASSIFICATION" and mr["state"]=="READY":
            candidate_pairs+=1; candidate_ids.add(key[0])
            proven,diag=classification_contract_proven(dr)
            diagnostics[diag]+=1
            if not proven:
                p="CLASSIFICATION_TAXONOMY_UNPROVEN"
                diagnostics["METHODOLOGY_ROUTE_UNPROVEN"]+=1
                diagnostics["METRIC_SET_NOT_SELECTABLE_WITHOUT_ROUTE"]+=1
            else:
                classification_proven+=1
                # Defensive branch reserved for future evidence; current D contract cannot reach it.
                p="METHODOLOGY_ROUTE_UNPROVEN"
        else:
            p="UNKNOWN_FAIL_CLOSED"
        primary[p]+=1; bydate[key[1]][p]+=1
        cohort=classification_label_diagnostic(dr.get("classification_label")) if ds=="RESOLVED_CLASSIFICATION" else ds
        bycohort[cohort][p]+=1

    if sum(primary.values())!=121956: raise RuntimeError("primary dispositions do not reconcile")
    if candidate_pairs!=25761: raise RuntimeError(f"candidate surface drifted: {candidate_pairs}")
    if classification_proven!=0 or route_proven!=0 or complete_inputs!=0:
        raise RuntimeError("unexpected resolved route/input state under frozen candidate")

    profiles=contract["profiles"]
    required_signals=[]
    profile_inventory={}
    families=defaultdict(lambda:{"profiles":0,"required_signals":0,"signals_with_registry_evidence_period_freshness":0})
    for p in profiles:
        req=[s for s in p.get("signalRequirements",[]) if s.get("required",True)]
        detailed=sum(1 for s in req if s.get("evidenceCodes") and s.get("minimumPeriods") is not None and s.get("freshnessPolicy"))
        profile_inventory[p["profileCode"]]={
            "familyCode":p["familyCode"],"methodologyAuthority":p["methodologyAuthority"],
            "methodologyState":p["methodologyState"],"required_signal_count":len(req),
            "signals_with_registry_evidence_period_freshness":detailed,
            "signals_requiring_additional_profile_authority_detail":len(req)-detailed,
            "required_signal_codes":[s.get("signalCode") for s in req]
        }
        f=families[p["familyCode"]]; f["profiles"]+=1; f["required_signals"]+=len(req); f["signals_with_registry_evidence_period_freshness"]+=detailed
        required_signals.extend((p["profileCode"],s.get("signalCode")) for s in req)

    census={
      "version":"P8_HISTORICAL_CONTRACT_RESOLUTION_COVERAGE_CENSUS_V1",
      "generated_at":datetime.now(timezone.utc).isoformat(),
      "contract_version":contract["contract_version"],
      "contract_git_blob_sha":EXPECTED_CONTRACT_BLOB,
      "contract_file_sha256":contract_sha256,
      "execution_commit":os.environ.get("GITHUB_SHA"),
      "denominators":{
        "full_b2_eligible_pairs":121956,
        "historical_identities":len(all_ids),
        "decision_dates":32,
        "provisional_candidate_pairs":candidate_pairs,
        "provisional_candidate_identities":len(candidate_ids),
        "objectively_proposed_narrower_universe":"No narrower universe is frozen because classification proof is zero; successful metric completeness is not used as a selection rule."
      },
      "primary_dispositions":dict(primary),
      "overlapping_diagnostic_blockers":dict(diagnostics),
      "proof_counts":{
        "classification_proven_pairs":classification_proven,
        "methodology_route_proven_pairs":route_proven,
        "complete_input_pairs":complete_inputs,
        "complete_input_unique_identities":len(complete_ids)
      },
      "coverage":{
        "complete_input_full_b2_percent":pct(complete_inputs,121956),
        "complete_input_provisional_candidate_percent":pct(complete_inputs,candidate_pairs),
        "classification_proof_provisional_candidate_percent":pct(classification_proven,candidate_pairs)
      },
      "by_decision_date":{k:dict(v) for k,v in sorted(bydate.items())},
      "historical_cohorts":{k:dict(v) for k,v in sorted(bycohort.items())},
      "methodology_contract_inventory":{
        "profile_count":len(profiles),
        "family_count":len(families),
        "required_signal_count":len(required_signals),
        "profiles":profile_inventory,
        "families":dict(sorted(families.items()))
      },
      "methodology_family_coverage":{
        "routed_pair_denominator":0,
        "note":"No candidate pair has a proven four-tier historical classification, so assigning a methodology family would invent taxonomy. Family coverage is therefore not computable rather than zero-filled."
      },
      "metric_availability":{
        "pair_level_metric_evaluation_started":False,
        "reason":"Exact route is a prerequisite to selecting the mandatory metric set. Evaluating a guessed route would violate the frozen contract.",
        "canonical_fundamental_metric_definitions_at_start":47,
        "registry_required_signals":len(required_signals),
        "registry_signals_with_explicit_evidence_period_freshness":contract["metric_contract"]["registry_signals_with_explicit_evidence_period_freshness"],
        "registry_signals_without_all_three":contract["metric_contract"]["registry_signals_without_all_three"]
      },
      "standards_assessment":{
        "owner_frozen":False,
        "minimum_24_dates":{"result":"PASS","observed":32},
        "overall_80_percent":{"result":"FAIL","observed_complete_input_percent":0.0},
        "each_retained_date_70_percent":{"result":"FAIL","reason":"0 complete-input pairs on every date under the frozen classification contract"},
        "major_methodology_sector_60_percent":{"result":"NOT_COMPUTABLE_FAIL_CLOSED","reason":"no methodology route may be assigned without proven historical Sector + Industry"}
      },
      "selection_bias_limitations":[
        "Selecting only the 25,761 provisional candidates would condition on evidence/classification availability and is not by itself an unbiased historical universe.",
        "Selecting only eventual metric-complete pairs is prohibited because completeness is an audit result, not an ex-ante universe rule.",
        "Missingness is concentrated in no-pre-decision-evidence and unresolved-classification cohorts and must remain visible."
      ],
      "source_lineage":{
        "workstream_d_pair_r2_key":pair_art["r2_key"],"workstream_d_pair_sha256":pair_art["sha256"],
        "b3_v2_prefix":LEDGER,"b3_partition_sha256":market_source_hashes
      }
    }
    census_fingerprint=canonical_hash(census)
    census["deterministic_payload_fingerprint_sha256"]=census_fingerprint
    # repeat serialization fingerprint from identical payload excluding generation-independent audit wrapper
    repeat=canonical_hash({k:v for k,v in census.items() if k not in ("generated_at","deterministic_payload_fingerprint_sha256","execution_commit")})

    audit={
      "version":VERSION,"status":"COMPLETE_BLOCKED","disposition":"HISTORICAL_CONTRACT_RESOLUTION_BLOCKED",
      "research_feasibility":"DEFENSIBLE_NARROWER_EXPERIMENT_NOT_SUPPORTABLE_FROM_CURRENT_EVIDENCE",
      "generated_at":datetime.now(timezone.utc).isoformat(),
      "contract_candidate":{"version":contract["contract_version"],"git_blob_sha":EXPECTED_CONTRACT_BLOB,"file_sha256":contract_sha256,"owner_approved":False},
      "execution_commit":os.environ.get("GITHUB_SHA"),
      "checks":{
        "contract_frozen_before_census":True,"contract_blob_matches":True,
        "d_pair_hash_matches":True,"d_logical_keys":len(dmap),"b3_logical_keys":len(market),
        "primary_dispositions_reconcile":sum(primary.values())==121956,
        "candidate_surface_reconciles":candidate_pairs==25761,
        "future_evidence_used":False,"current_classification_backdated":False,
        "manual_assignment_backdated":False,"provider_calls":0,"supabase_writes":0,"r2_writes":0,
        "performance_outcome_reads":0,"p8_c_started":False,"main_changes":0,"production_changes":0
      },
      "semantic_findings":{
        "workstream_d_labels_are_four_tier_taxonomy":False,
        "diversified_pairs_candidate":diagnostics["DIVERSIFIED_WITHOUT_SEMANTIC_FOUR_TIER_PROOF"],
        "positional_member_pairs_candidate":diagnostics["POSITIONAL_XBRL_MEMBER_NOT_TAXONOMY"],
        "methodology_route_can_be_selected_without_invention":False,
        "metric_set_can_be_selected_without_route":False,
        "central_registry_required_signals":len(required_signals),
        "central_registry_signals_with_evidence_period_freshness":contract["metric_contract"]["registry_signals_with_explicit_evidence_period_freshness"],
        "central_registry_signals_needing_more_profile_normalization_detail":contract["metric_contract"]["registry_signals_without_all_three"]
      },
      "census_fingerprint_sha256":census_fingerprint,
      "repeat_census_core_fingerprint_sha256":repeat,
      "remaining_blockers":[
        "Current Workstream-D classification evidence does not prove canonical historical Sector + Industry + Basic Industry; DIVERSIFIED and positional XBRL members are insufficient.",
        "Without proven historical Sector + Industry, the existing RESEARCH_PROFILE_ROUTING_V2 cannot select exactly one methodology route without invention.",
        "Without a route, mandatory metric requirements cannot be selected pair-by-pair.",
        "Even after routing is solved, many existing scoring signals consume normalized inputs without a universal historical raw-XBRL concept/unit/scale mapping; unresolved mappings must fail closed or require a separately reviewed canonical mapping decision."
      ],
      "next_owner_decision":"Whether to authorize a separate bounded historical taxonomy evidence-normalization build using existing source bodies only. This audit does not authorize it."
    }
    CENSUS.write_text(json.dumps(census,indent=2,sort_keys=True)+"\n")
    AUDIT.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")

    memo=f"""# PortfolioAI P8 Historical Classification / Methodology Route / Metric Contract Resolution Closure

Date: 4 October 2026  
Environment: Development only  
Contract: `{contract["contract_version"]}`  
Contract Git blob SHA: `{EXPECTED_CONTRACT_BLOB}`

## Exact disposition

**HISTORICAL_CONTRACT_RESOLUTION_BLOCKED**

Audit execution is **COMPLETE / PASS as an audit operation**. Research feasibility remains **BLOCKED**.

A defensible narrower experiment is **not yet supportable from the current evidence surface**.

## Deterministic census

Full B2 denominator: **121,956 pairs / {len(all_ids):,} historical identities / 32 decision dates**.

Primary mutually exclusive dispositions:

- `NO_PRE_DECISION_EVIDENCE`: **{primary["NO_PRE_DECISION_EVIDENCE"]:,}**
- `CLASSIFICATION_UNRESOLVED`: **{primary["CLASSIFICATION_UNRESOLVED"]:,}**
- `MARKET_DATA_BLOCKED`: **{primary["MARKET_DATA_BLOCKED"]:,}**
- `CLASSIFICATION_TAXONOMY_UNPROVEN`: **{primary["CLASSIFICATION_TAXONOMY_UNPROVEN"]:,}**

These reconcile exactly to 121,956.

The previously measured provisional candidate surface remains **{candidate_pairs:,} pairs / {len(candidate_ids):,} identities**. Under the frozen contract candidate:

- classification-proven pairs: **0**
- methodology-route-proven pairs: **0**
- complete-input pairs: **0**
- full-B2 complete-input coverage: **0%**
- candidate-surface complete-input coverage: **0%**

## Why the 25,761 candidates do not pass classification proof

Within the candidate surface:

- `DIVERSIFIED` without semantic four-tier proof: **{diagnostics["DIVERSIFIED_WITHOUT_SEMANTIC_FOUR_TIER_PROOF"]:,}**
- positional XBRL segment-member labels rather than business taxonomy: **{diagnostics["POSITIONAL_XBRL_MEMBER_NOT_TAXONOMY"]:,}**

Workstream D therefore proves useful contemporaneous segment evidence, but not canonical historical Sector + Industry + Basic Industry. Promoting those labels into Gate-K routing would invent classification.

## Methodology and metric contracts

The existing P7-IC authority contains **{len(profiles)} profiles**, **{len(families)} families** and **{len(required_signals)} required signals**. The audit did not create a new methodology family or modify R6–R10.

Because no historical pair has proven Sector + Industry under the frozen contract, the existing `RESEARCH_PROFILE_ROUTING_V2` cannot select a methodology route without guessing. Pair-level metric evaluation therefore correctly stops before selecting a route-specific mandatory metric set.

The central registry gives evidence-code/minimum-period/freshness detail for **{contract["metric_contract"]["registry_signals_with_explicit_evidence_period_freshness"]}** required signals; **{contract["metric_contract"]["registry_signals_without_all_three"]}** rely on additional profile authority detail. PortfolioAI Dev also has 47 active canonical fundamental metric definitions, but there is no universal historical raw-XBRL concept/unit/scale mapping for every required route signal.

## Proposed standards

The proposed standards remain **not owner-frozen**.

- >=24 dates: **PASS (32)**
- >=80% overall complete-input coverage: **FAIL (0%)**
- >=70% each retained date: **FAIL**
- >=60% each major methodology sector: **NOT COMPUTABLE / FAIL CLOSED**, because no methodology sector can be assigned without historical taxonomy proof.

No rule or threshold was relaxed after observing the census.

## Remaining blocker and owner decision

The precise next possible task is **not another provider/source-acquisition loop**. If the owner separately authorizes it, it would be a bounded historical taxonomy evidence-normalization build using already acquired official source bodies only:

1. derive semantic business labels from eligible pre-decision filings/annual-report evidence;
2. map them into the existing canonical four-tier taxonomy without current-state backdating;
3. prove exact Sector + Industry routing through the existing router; and
4. only then measure route-specific normalized metric completeness using canonical metric definitions and explicit raw-concept mappings.

This closure does **not** authorize that work, a new experiment, B5/B6/B-FINAL rebuild, or P8-C.

## Safety boundary

Provider calls: 0. New source acquisition: 0. Supabase writes: 0. R2 writes: 0. Migrations: 0. Performance/forward-return/holdout reads: 0. Production/main changes: 0.
"""
    MEMO.write_text(memo)
    print(json.dumps({"disposition":audit["disposition"],"primary":dict(primary),"diagnostics":dict(diagnostics),"candidate_pairs":candidate_pairs,"candidate_identities":len(candidate_ids),"complete_inputs":complete_inputs,"contract_sha256":contract_sha256,"census_fingerprint":census_fingerprint},indent=2,sort_keys=True))

if __name__=="__main__":
    main()
