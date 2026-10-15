#!/usr/bin/env python3
"""One-time fail-closed Ashoka 2024 first-quarter Indian grouping correction.

Never erase previous observations or source manifests: retain immutable V1
evidence and rebind the six selected decisions to six independently verified V2
source observations in one guarded Development-only transaction.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from collections import defaultdict
from decimal import Decimal
from pathlib import Path
import boto3
import psycopg
from botocore.config import Config
from psycopg.rows import dict_row

REF="lrgpjimipfkyoqbpsqzz";BUCKET="portfolioai-history-dev"
KIND="RESULTS_QUARTERLY_BSE_ASHOKA_ORIGINAL_PDF_2024_V1"
REV="INDIAN_GROUPING_V2"
ORIGINAL={
  "2024-09-30":"e7635fd45c6cfe97020f09f3af616026b3321556646760b9d664a5d22c43f4f0",
  "2024-12-31":"428a23cd14a9c27574631c2d9a0384b69a353f0a10595d409a1df453dab8f615"
}
CORRECT={
 "2024-09-30":{"OPERATING_REVENUE_QUARTER":"2488.931","NET_PROFIT_QUARTER":"462.469","EPS_DILUTED":"16.28"},
 "2024-12-31":{"OPERATING_REVENUE_QUARTER":"2387.888","NET_PROFIT_QUARTER":"661.4923","EPS_DILUTED":"23.32"}
}
OLD_REV={ "2024-09-30":"488.931", "2024-12-31":"387.888" }
def require(ok,msg):
    if not ok:raise RuntimeError(msg)

def main():
    require(REF in os.getenv("SUPABASE_DB_URL",""),"NOT_DEV_DB")
    require(os.getenv("CLOUDFLARE_R2_BUCKET")==BUCKET,"NOT_DEV_R2")
    require(os.getenv("RESULTS_R3_ASHOKA_CORRECTIVE_ACK")=="INDIAN_GROUPING_TWO_QUARTERS_V2",
            "CORRECTION_NOT_AUTHORIZED")
    require(os.getenv("RESULTS_R5_LEGACY_SELECTION")=="1",
            "R4_HISTORICAL_VERIFICATION_SCOPE_MISSING")
    path=Path(__file__).with_name("r4-verify-quarterly.py")
    spec=importlib.util.spec_from_file_location("r4_ashoka_corrective",path)
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    require(mod.QUARTERS==("2024-09-30","2024-12-31"),"R4_SCOPE_MISMATCH")
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"]
    require(len(account)==32 and all(x in "0123456789abcdef" for x in account.lower()),
            "R2_ACCOUNT_FORMAT_INVALID")
    s3=boto3.client("s3",endpoint_url="https://"+account+".r2.cloudflarestorage.com",
       aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
       aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
       region_name="auto",config=Config(retries={"max_attempts":2,"mode":"standard"}))
    with psycopg.connect(os.environ["SUPABASE_DB_URL"],row_factory=dict_row) as db:
        with db.cursor() as cur:
            cur.execute("""SELECT id FROM public.securities
                           WHERE symbol='ASHOKA' AND isin='INE442H01029'
                             AND asset_class='EQUITY'""")
            row=cur.fetchone()
            require(row is not None,"CANONICAL_ASHOKA_IDENTITY_UNKNOWN")
            sid=row["id"]
            cur.execute("""SELECT d.metric_code,d.period_end::text AS period,
                      d.selected_observation_id AS selected_id,
                      f.numeric_value AS old_value,
                      r.raw_payload->>'parser_revision' AS old_revision,
                      r.raw_payload->>'original_sha256_unretained' AS original_sha
               FROM public.fundamental_observation_decisions d
               JOIN public.fundamental_observations f ON f.id=d.selected_observation_id
               JOIN public.data_source_records r ON r.id=f.source_record_id
               WHERE d.security_id=%s AND d.period_type='QUARTER'
                 AND d.period_end IN ('2024-09-30','2024-12-31')
               ORDER BY d.period_end,d.metric_code FOR UPDATE OF d""",(sid,))
            prior=cur.fetchall()
            require(len(prior)==6,"EXISTING_DECISIONS_NOT_EXACTLY_SIX")
            # Already-correct selections can be replayed idempotently.
            if all(x["old_revision"]==REV and
                    Decimal(x["old_value"])==Decimal(CORRECT[x["period"]][x["metric_code"]])
                    for x in prior):
                print(json.dumps({"status":"ALREADY_CORRECTED","decisions":6}))
                db.rollback();return
            require(all(x["original_sha"]==ORIGINAL[x["period"]] and
                        x["metric_code"] in CORRECT[x["period"]]
                        and x["old_revision"] is None
                        for x in prior),"PRIOR_DECISION_LINEAGE_MISMATCH")
            require(all((Decimal(x["old_value"])==
                         Decimal(OLD_REV[x["period"]]) if x["metric_code"]=="OPERATING_REVENUE_QUARTER"
                         else Decimal(x["old_value"])==Decimal(CORRECT[x["period"]][x["metric_code"]]))
                        for x in prior),"UNEXPECTED_PRIOR_VALUE")
            cur.execute("""SELECT f.*,r.raw_payload,r.source_url,r.payload_hash,
                                  r.retrieved_at AS source_retrieved,
                                  s.symbol,s.isin
                           FROM public.fundamental_observations f
                           JOIN public.securities s ON s.id=f.security_id
                           JOIN public.data_source_records r ON r.id=f.source_record_id
                           WHERE f.security_id=%s AND f.period_type='QUARTER'
                             AND f.period_end IN ('2024-09-30','2024-12-31')
                             AND r.record_kind=%s AND r.raw_payload->>'parser_revision'=%s
                           ORDER BY f.period_end,f.metric_code""",(sid,KIND,REV))
            candidate=cur.fetchall()
            require(len(candidate)==6,"CORRECTED_SOURCE_FACTS_NOT_SIX")
            by_source=defaultdict(list)
            for fact in candidate:
                by_source[fact["source_record_id"]].append(fact)
            require(len(by_source)==2,"CORRECTED_TWO_ORIGINAL_SOURCES_MISSING")
            for source_id,facts in by_source.items():
                r=facts[0];raw=r["raw_payload"]
                period=str(r["period_end"])
                require(raw.get("original_sha256_unretained")==ORIGINAL[period],
                        "CORRECTED_ORIGINAL_PDF_HASH_CHANGED")
                key=raw.get("r2_key")
                manifest_sha=raw.get("r2_manifest_sha256")
                require(isinstance(key,str) and key.startswith(mod.PREFIX) and
                        isinstance(manifest_sha,str),"INVALID_MANIFEST_POINTER")
                blob=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
                require(hashlib.sha256(blob).hexdigest()==manifest_sha,
                        "CORRECTED_R2_MANIFEST_HASH_MISMATCH")
                manifest=json.loads(blob)
                err=mod.check_manifest({
                   "raw_payload":raw,"payload_hash":r["payload_hash"],
                   "source_url":r["source_url"],"source_retrieved":r["source_retrieved"]
                   },manifest)
                require(err is None,"CORRECTED_SOURCE_NOT_ADMITTED:"+str(err))
                for f in facts:
                    record=dict(f)
                    record["period_end"]=f["period_end"]
                    record["period_start"]=f["period_start"]
                    err=mod.check_fact(record,manifest)
                    require(err is None,"CORRECTED_METRIC_NOT_ADMITTED:"+str(err))
                    require(Decimal(f["numeric_value"])==Decimal(CORRECT[period][f["metric_code"]]),
                            "CORRECTED_VALUE_MISMATCH")
            updated=[]
            for old in prior:
                matched=[r for r in candidate if (str(r["period_end"])==old["period"] and
                             r["metric_code"]==old["metric_code"])]
                require(len(matched)==1,"AMBIGUOUS_V2_METRIC")
                v=matched[0]
                cur.execute("""UPDATE public.fundamental_observation_decisions SET
                  selected_observation_id=%s,
                  decision_basis='EVIDENCE_PRIORITY',
                  decided_at=now(),decided_by=NULL,
                  notes='RESULTS_R3_BSE_2024_ASHOKA_INDIAN_GROUPING_V2_CORRECTIVE; ORIGINAL_ISSUER_PDF_HASH_PINNED; ALL_SIX_DECISIONS_ATOMICALLY_REBOUND; OLD_V1_EVIDENCE_RETAINED; R4_SOURCE_AND_ROWS_RECHECKED; NO_V1_4_AUTHORITY'
                  WHERE security_id=%s AND metric_code=%s AND period_end=%s
                    AND period_type='QUARTER' AND selected_observation_id=%s
                  RETURNING selected_observation_id""",
                  (v["id"],sid,old["metric_code"],old["period"],old["selected_id"]))
                require(len(cur.fetchall())==1,"CONCURRENT_SELECTION_CHANGE")
                updated.append((old["period"],old["metric_code"]))
            require(len(updated)==6 and len(set(updated))==6,"ATOMIC_SOURCE_REBIND_INCOMPLETE")
        db.commit()
        print(json.dumps({"status":"CORRECTED","decisions":6,
            "revised_revenue_crore":{"2024-09-30":"2488.931",
                                    "2024-12-31":"2387.888"},
            "old_sources_preserved":True},sort_keys=True))
if __name__=="__main__":
    main()
