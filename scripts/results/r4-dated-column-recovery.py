"""Review every missing slot against exact dated columns of accepted NSE filings."""
import argparse,importlib.util,json,os,re
from collections import Counter
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
import requests,psycopg
from r4_dated_columns import extract,tables_from_html,extract_tables
from r4_recovery_queue import task_id

spec=importlib.util.spec_from_file_location("batch",Path(__file__).with_name("r4-bse-historical-batch.py"))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def origin(url):
    u=urlparse(url)
    return u.scheme=="https" and u.hostname=="nsearchives.nseindia.com" and not u.query and not u.fragment and bool(re.fullmatch(r"/corporate/ixbrl/(?:INTEGRATED_FILING_(?:INDAS|BANKING|NBFC_INDAS|GI)|GI)_[A-Za-z0-9_]+\.html",u.path,re.I))

def required(symbol):return {"EPS_DILUTED","NET_PROFIT_QUARTER","NET_INTEREST_INCOME_QUARTER" if symbol in batch.BANKS else "NET_PREMIUM_EARNED_QUARTER" if symbol in batch.INSURERS else "OPERATING_REVENUE_QUARTER"}

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--shard",type=int,required=True);args=parser.parse_args()
    if not 0<=args.shard<4:raise RuntimeError("INVALID_SHARD")
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ.get("CLOUDFLARE_R2_BUCKET")!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    client=batch.r2_client();counts=Counter();session=requests.Session()
    session.headers.update({"User-Agent":"Mozilla/5.0","Accept-Language":"en-IN,en;q=0.8"})
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,name,periods in cohort:
            if int(task_id(sid,"DATED_COLUMNS",None,{}),16)%4!=args.shard:continue
            results={p:{"period_end":p,"candidates":[],"rejections":{}} for p in periods}
            core=required(symbol)
            with db.cursor() as cur:
                cur.execute("""SELECT d.id::text,d.source_url,d.payload_hash,d.raw_payload,
                  jsonb_object_agg(o.metric_code,jsonb_build_object('value',o.numeric_value::text,'unit',o.unit))
                  FROM fundamental_observation_decisions x JOIN fundamental_observations o ON o.id=x.selected_observation_id
                  JOIN data_source_records d ON d.id=o.source_record_id
                  WHERE x.security_id=%s AND x.period_type='QUARTER' AND o.source_code='COMPANY_EXCHANGE_FILING'
                    AND d.raw_payload->>'contract'='PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1'
                    AND x.period_end>=DATE '2025-09-30' AND x.period_end<=DATE '2026-06-30'
                    AND o.metric_code=ANY(%s::text[])
                  GROUP BY d.id HAVING count(DISTINCT o.metric_code)=3
                  ORDER BY d.retrieved_at DESC LIMIT 16""",(sid,sorted(core)))
                anchors=cur.fetchall()
            db.rollback()
            for aid,source_url,payload_hash,metadata,anchor_facts in anchors:
                try:
                    if not origin(source_url):raise ValueError("DATED_COLUMN_ORIGINAL_URL_UNPROVEN")
                    if batch.sha(batch.canonical(metadata))!=payload_hash:raise ValueError("DATED_COLUMN_ANCHOR_HASH_MISMATCH")
                    manifest=client.get_object(Bucket=batch.BUCKET,Key=metadata["r2_key"])["Body"].read()
                    if batch.sha(manifest)!=metadata["r2_manifest_sha256"] or json.loads(manifest)!={k:v for k,v in metadata.items() if k not in ("r2_key","r2_manifest_sha256")}:
                        raise ValueError("DATED_COLUMN_ANCHOR_MANIFEST_MISMATCH")
                    if metadata["symbol"]!=symbol or metadata["isin"]!=isin:raise ValueError("DATED_COLUMN_ANCHOR_IDENTITY_MISMATCH")
                    response=session.get(source_url,timeout=35);response.raise_for_status();raw=response.content
                    counts["original_filings_fetched"]+=1
                    if len(raw)>5_000_000:raise ValueError("DATED_COLUMN_ORIGINAL_SIZE_BOUND")
                    html=raw.decode("utf-8-sig");tables=tables_from_html(html)
                    anchor=extract_tables(tables,symbol,isin,metadata["period_end"],symbol in batch.BANKS,symbol in batch.INSURERS)
                    if anchor["scope"]!=metadata["consolidation_scope"] or anchor["period_start"]!=metadata["period_start"]:
                        raise ValueError("DATED_COLUMN_ANCHOR_SCOPE_OR_DATE_MISMATCH")
                    if set(anchor_facts)!=core or any(Decimal(anchor["facts"][m]["value"])!=Decimal(anchor_facts[m]["value"]) or anchor["facts"][m]["unit"]!=anchor_facts[m]["unit"] for m in core):
                        raise ValueError("DATED_COLUMN_CURRENT_ANCHOR_VALUES_DISAGREE")
                    flags=sorted(set(re.findall(r"\b(?:restated|recast|pro[ -]?forma|carve[ -]?out)\b",html,re.I)))
                    for period in periods:
                        try:
                            parsed=extract_tables(tables,symbol,isin,period,symbol in batch.BANKS,symbol in batch.INSURERS)
                            results[period]["candidates"].append({"parsed":parsed,"source_url":source_url,
                                "original_sha256_unretained":batch.sha(raw),"raw_nse_bytes_retained":False,
                                "anchor_source_id":aid,"anchor_payload_hash":payload_hash,"anchor_facts":anchor_facts,
                                "source_reporting_basis":"EXPLICIT_DATED_COLUMN_IN_LATER_ISSUER_FILING","review_basis_flags":flags})
                            counts["dated_quarter_candidates"]+=1
                        except ValueError as error:
                            code=str(error).split(":")[0];results[period]["rejections"][code]=results[period]["rejections"].get(code,0)+1
                except Exception as error:
                    code=str(error).split(":")[0] if isinstance(error,ValueError) and re.fullmatch(r"[A-Z_]+",str(error)) else type(error).__name__
                    counts["source_rejection_"+code]+=1
            for period,result in results.items():
                value={"contract":"RESULTS_R4_DATED_COLUMN_REVIEW_V1","diagnostic_only":True,"canonical_promotion_performed":False,
                    "symbol":symbol,"isin":isin,"security_id":str(sid),"anchors_checked":len(anchors),**result}
                encoded=batch.canonical(value);digest=batch.sha(encoded)
                key=batch.PREFIX+"dated-column-review/sha256="+digest+"/capture.json"
                batch.immutable_put(client,key,encoded)
                with db.cursor() as cur:
                    cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
                      VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_DATED_COLUMN_REVIEW_V1',%s,%s,%s::jsonb,%s::jsonb)
                      ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",
                      (str(sid)+":"+period,digest,encoded.decode(),'{"retention":"COMPACT_FACTS_ONLY","original_nse_bytes_retained":false,"review_only":true}'))
                db.commit();counts["slots_reviewed"]+=1
                if result["candidates"]:counts["slots_with_dated_candidates"]+=1
            print("R4_DATED_COLUMN_PROGRESS",json.dumps(dict(counts)),flush=True)
    print("R4_DATED_COLUMN_FINAL",json.dumps({"shard":args.shard,"counts":dict(counts)}),flush=True)

if __name__=="__main__":main()
