#!/usr/bin/env python3
import boto3, hashlib, json, os, psycopg
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from botocore.config import Config

BUCKET="portfolioai-history-dev"
D_AUDIT=Path("docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_D_AUDIT_2026-10-04.json")
CONTRACT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_CANDIDATE_V1.json")
OUT=Path("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
VERSION="P8_HISTORICAL_TAXONOMY_CANARY_V1"
EXPERIMENT="P8_EXP_NSE_MONTHLY_6M_V1"

def acct(raw):
    h=urlparse(raw).hostname if "://" in raw else raw
    s=".r2.cloudflarestorage.com"
    return h[:-len(s)] if h.endswith(s) else h

def s3():
    a=acct(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip().rstrip("/"))
    return boto3.client("s3",endpoint_url=f"https://{a}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(retries={"max_attempts":8,"mode":"adaptive"},s3={"addressing_style":"path"}))

def read(c,key):
    return c.get_object(Bucket=BUCKET,Key=key)["Body"].read()

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def stable_rank(stratum,hid,decision):
    return hashlib.sha256(f"{VERSION}|{stratum}|{hid}|{decision}".encode()).hexdigest()

def db_identity_linkage():
    db=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in db:
        raise RuntimeError("wrong Supabase Development project")
    with psycopg.connect(db,connect_timeout=20) as conn, conn.cursor() as cur:
        cur.execute("""
          select id::text, historical_isin, canonical_security_id::text
          from public.p8_historical_security_identities
          where experiment_id=%s
        """,(EXPERIMENT,))
        rows=cur.fetchall()
    if len(rows)!=4524:
        raise RuntimeError(f"identity count drift: {len(rows)}")
    return {str(i):{"historical_isin":str(isin),"historical_only":cid is None} for i,isin,cid in rows}

def main():
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:
        raise RuntimeError("wrong R2 bucket")
    contract=json.loads(CONTRACT.read_text())
    d=json.loads(D_AUDIT.read_text())
    c=s3()

    pair_art=d["artifacts"]["pair_dispositions"]
    raw=read(c,pair_art["r2_key"])
    if sha256(raw)!=pair_art["sha256"]:
        raise RuntimeError("Workstream D pair-disposition hash mismatch")
    pairs=[json.loads(x) for x in raw.decode().splitlines() if x.strip()]

    src_key=d["source_manifest"]["r2_key"]
    src_raw=read(c,src_key)
    if sha256(src_raw)!=d["source_manifest"]["sha256"]:
        raise RuntimeError("source-manifest hash mismatch")
    sources=[json.loads(x) for x in src_raw.decode().splitlines() if x.strip()]
    sources=[x for x in sources if x.get("state")!="SOURCE_UNAVAILABLE" and x.get("r2_key") and x.get("sha256") and str(x["r2_key"]).lower().endswith(".xml")]

    linkage=db_identity_linkage()
    byid=defaultdict(list)
    for x in sources:
        t=str(x.get("time") or "")
        if t:
            byid[str(x.get("historical_identity_id"))].append(x)
    for hid in byid:
        byid[hid].sort(key=lambda x:(str(x.get("time")),str(x.get("sha256"))))

    records=[]
    for p in pairs:
        hid=str(p["historical_identity_id"])
        decision=str(p["decision_at"])
        eligible=[x for x in byid.get(hid,[]) if str(x.get("time")) < decision]
        if not eligible:
            continue
        latest=eligible[-1]
        label=p.get("classification_label")
        positional=bool(label and label!="DIVERSIFIED")
        diversified=label=="DIVERSIFIED"
        unresolved=p["state"]=="EVIDENCE_PRESENT_CLASSIFICATION_UNRESOLVED"
        dated_alias=latest.get("mode")=="DATED_NSE_SYMBOL_NAME"
        multi=len(eligible)>=2
        records.append({
          "historical_identity_id":hid,
          "historical_isin":linkage[hid]["historical_isin"],
          "historical_only":linkage[hid]["historical_only"],
          "decision_at":decision,
          "workstream_d_state":p["state"],
          "workstream_d_label":label,
          "latest_source":{
            "r2_key":latest["r2_key"],"sha256":latest["sha256"],"disseminated_at":latest.get("time"),
            "identity_mode":latest.get("mode"),"symbol":latest.get("symbol"),"company_name":latest.get("company_name")
          },
          "eligible_predecision_xml_source_count":len(eligible),
          "flags":{"positional":positional,"diversified":diversified,"unresolved":unresolved,"dated_alias":dated_alias,"multiple_filings":multi}
        })

    chosen=[]; used=set()
    def take(name,pred,n):
        pool=[r for r in records if pred(r) and (r["historical_identity_id"],r["decision_at"]) not in used]
        pool.sort(key=lambda r:stable_rank(name,r["historical_identity_id"],r["decision_at"]))
        got=pool[:n]
        for r in got:
            r=dict(r); r["canary_stratum"]=name; r["selection_rank_sha256"]=stable_rank(name,r["historical_identity_id"],r["decision_at"])
            chosen.append(r); used.add((r["historical_identity_id"],r["decision_at"]))
        return len(got)

    quotas=[
      ("POSITIONAL_HISTORICAL_ONLY",lambda r:r["flags"]["positional"] and r["historical_only"],4),
      ("POSITIONAL_CURRENT_LINKED",lambda r:r["flags"]["positional"] and not r["historical_only"],4),
      ("DIVERSIFIED_HISTORICAL_ONLY",lambda r:r["flags"]["diversified"] and r["historical_only"],4),
      ("DIVERSIFIED_CURRENT_LINKED",lambda r:r["flags"]["diversified"] and not r["historical_only"],4),
      ("DATED_ALIAS_CANDIDATE",lambda r:(r["flags"]["positional"] or r["flags"]["diversified"]) and r["flags"]["dated_alias"],4),
      ("MULTIPLE_PREDECISION_FILINGS",lambda r:(r["flags"]["positional"] or r["flags"]["diversified"]) and r["flags"]["multiple_filings"],4),
      ("UNRESOLVED_EVIDENCE_HISTORICAL_ONLY",lambda r:r["flags"]["unresolved"] and r["historical_only"],4),
      ("UNRESOLVED_EVIDENCE_CURRENT_LINKED",lambda r:r["flags"]["unresolved"] and not r["historical_only"],4)
    ]
    quota_result={}
    for name,pred,n in quotas:
        quota_result[name]={"requested":n,"selected":take(name,pred,n)}
    chosen.sort(key=lambda r:(r["canary_stratum"],r["selection_rank_sha256"]))

    manifest={
      "version":VERSION,
      "created_at":datetime.now(timezone.utc).isoformat(),
      "measurement_performed":False,
      "selection_is_outcome_independent":True,
      "selection_inputs":[
        "Workstream-D pair state/label only",
        "historical-only versus current-linked identity state from Development read-only identity table",
        "source identity mode",
        "number of eligible pre-decision XML source bodies",
        "stable SHA-256 ranking",
        "decision-date eligibility"
      ],
      "prohibited_selection_inputs":[
        "semantic extraction success","taxonomy mapping success","methodology route success","metric completeness",
        "current classification","returns","performance","holdout outcomes"
      ],
      "contract_version":contract["contract_version"],
      "contract_file_sha256":sha256(CONTRACT.read_bytes()),
      "source_lineage":{
        "pair_dispositions_r2_key":pair_art["r2_key"],"pair_dispositions_sha256":pair_art["sha256"],
        "source_manifest_r2_key":src_key,"source_manifest_sha256":d["source_manifest"]["sha256"]
      },
      "population_counts":{
        "eligible_pair_rows":len(pairs),
        "available_xml_source_rows":len(sources),
        "candidate_records_with_predecision_xml":sum(1 for r in records if r["flags"]["positional"] or r["flags"]["diversified"]),
        "unresolved_records_with_predecision_xml":sum(1 for r in records if r["flags"]["unresolved"])
      },
      "quota_result":quota_result,
      "canary_membership_count":len(chosen),
      "members":chosen
    }
    payload=json.dumps(manifest,sort_keys=True,separators=(",",":")).encode()
    manifest["membership_fingerprint_sha256"]=sha256(payload)
    OUT.write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"canary_membership_count":len(chosen),"quota_result":quota_result,"fingerprint":manifest["membership_fingerprint_sha256"]},indent=2))

if __name__=="__main__":
    main()
