"""Development historical original-XBRL recovery with explicit exchange issuer lineage."""
import argparse,importlib.util,json,os,hashlib
from collections import Counter
from datetime import datetime,timezone
from decimal import Decimal
from pathlib import Path
import psycopg,requests
from r4_nse_issuer_bridge import bridge_from_sources

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(file))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
batch=load("batch","r4-bse-historical-batch.py")
legacy=load("legacy","r5-legacy-2024-xbrl.py")
integrated=load("integrated","r3-legacy-2025-xbrl.py")
legacy.PERIODS={p:values[0] for p,values in batch.WINDOWS.items()}
CONTRACT="PORTFOLIOAI_RESULTS_NSE_EXCHANGE_CODE_ISSUER_LINEAGE_V1"
KIND="RESULTS_R4_NSE_EXCHANGE_LINEAGE_XBRL_V1"

def get_json(client,key):
    try:return json.loads(client.get_object(Bucket=batch.BUCKET,Key=key)["Body"].read())
    except Exception as error:
        if getattr(error,"response",{}).get("Error",{}).get("Code") in ("404","NoSuchKey","NotFound"):return None
        raise

def persist(db,client,sid,raw,metadata,parsed,proof,header,listing):
    period=parsed["period_end"];isin=proof.canonical_isin;symbol=proof.symbol
    xmlsha=batch.sha(raw)
    original_key=batch.PREFIX+"evidence/original_version="+xmlsha+"/original-xbrl.xml"
    batch.immutable_put(client,original_key,raw)
    identity={"contract":proof.contract,"issuer_bridge":proof.payload(),"bse_header":header,
        "bse_listing":listing,"nse_catalog_record":metadata,"nse_original_sha256":xmlsha,
        "retrieved_at":datetime.now(timezone.utc).isoformat(),"historical_isin_not_inferred":True}
    identity_bytes=batch.canonical(identity);identity_sha=batch.sha(identity_bytes)
    identity_key=batch.PREFIX+"evidence/source_version="+identity_sha+"/exchange-issuer-identity.json"
    batch.immutable_put(client,identity_key,identity_bytes)
    manifest={"contract":CONTRACT,"symbol":symbol,"isin":isin,
        "period_start":parsed["period_start"],"period_end":period,
        "consolidation_scope":parsed["scope"],"issuer_filing_url":metadata["xbrl"],
        "original_sha256_retained":xmlsha,"original_r2_key":original_key,
        "original_xbrl_retained":True,"raw_nse_bytes_retained":True,"reporting_currency":"INR",
        "issuer_bridge":proof.payload(),"issuer_identity_evidence_r2_key":identity_key,
        "issuer_identity_evidence_sha256":identity_sha,"catalog_broadcast_date":metadata.get("broadCastDate"),
        "original_publication_precision":"CATALOG_ONLY_UNVERIFIED",
        "historical_eps_reporting_basis":"AS_FILED_NOT_RETROSPECTIVELY_ADJUSTED",
        "historical_share_adjustment_authorized":False,"figures_review_pending":True,"facts":parsed["facts"]}
    body=batch.canonical(manifest);version=batch.sha(body)
    key=batch.PREFIX+f"security_id={isin}/period_end={period}/source_version={version}/manifest.json"
    batch.immutable_put(client,key,body)
    payload={**manifest,"r2_key":key,"r2_manifest_sha256":version}
    encoded=batch.canonical(payload);digest=batch.sha(encoded)
    with db.cursor() as cur:
        cur.execute("""INSERT INTO data_source_records
          (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
          VALUES('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s::jsonb,%s::jsonb)
          ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",
          (KIND,symbol+":"+xmlsha,metadata["xbrl"],digest,encoded.decode(),
           '{"original":"IMMUTABLE_R2_XBRL","identity":"DATED_XML_EXCHANGE_CODE_AND_OFFICIAL_CANONICAL_ISSUER_LINK","eps":"AS_FILED_COMPARABILITY_UNPROVEN"}'))
        saved=cur.fetchone()
        if not saved:
            cur.execute("SELECT id FROM data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND external_record_id=%s AND payload_hash=%s",(KIND,symbol+":"+xmlsha,digest))
            saved=cur.fetchone()
        source_id=saved[0];inserted=0
        for metric,f in parsed["facts"].items():
            cur.execute("""INSERT INTO fundamental_observations
              (security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
               period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
              VALUES(%s,%s,%s,'COMPANY_EXCHANGE_FILING',%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
              ON CONFLICT(security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id)
              DO NOTHING RETURNING id""",(sid,metric,source_id,Decimal(f["value"]),f["unit"],
                  parsed["period_start"],period,parsed["scope"]))
            if cur.fetchone():inserted+=1
    db.commit();return inserted

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--shard",type=int,required=True);args=parser.parse_args()
    if not 0<=args.shard<8:raise RuntimeError("INVALID_SHARD")
    url=os.environ["SUPABASE_DB_URL"]
    if batch.REF not in url or os.environ["CLOUDFLARE_R2_BUCKET"]!=batch.BUCKET:raise RuntimeError("DEVELOPMENT_ONLY")
    client=batch.r2_client();counts=Counter();details=[]
    source_index={}
    seed=Path(__file__).with_name("fixtures")/"nse-2024-retained-source-index.json"
    if seed.exists():
        for item in json.loads(seed.read_text()):source_index[item["metadata"]["xbrl"]]=item
    session=requests.Session();session.headers.update({"User-Agent":"Mozilla/5.0","Accept-Language":"en-IN,en;q=0.8"})
    session.get("https://www.nseindia.com/companies-listing/corporate-filings-financial-results",timeout=30).raise_for_status()
    with psycopg.connect(url) as db,batch.PortfolioBSE() as bse:
        cohort=batch.candidates(db);db.rollback()
        cohort=[r for r in cohort if int(hashlib.sha256(str(r[2]).encode()).hexdigest(),16)%8==args.shard]
        for symbol,isin,sid,name,missing in cohort:
            entry={"symbol":symbol,"missing":missing,"results":[]}
            try:
                code=bse.get_scrip_candidate(symbol)["bse_scrip_code"]
                header=bse._bse.equityMetaInfo(code)
                listing=bse._bse.listSecurities(scripcode=code,group="")
                matches=[x for x in listing if str(x.get("SCRIP_CD"))==code and x.get("ISIN_NUMBER")==isin]
                if len(matches)!=1:raise ValueError("EXACT_BSE_LISTING_IDENTITY_UNPROVEN")
                listing=matches[0]
                for year,provider in (("2024",legacy),("2025",integrated)):
                    if not any(p.startswith(year) for p in missing):continue
                    day=datetime.now(timezone.utc).date().isoformat()
                    catalog_key=batch.PREFIX+f"nse-catalog-v1/symbol={symbol}/window={year}/retrieved_date={day}/records.json"
                    records=get_json(client,catalog_key)
                    if records is None:
                        records=provider.list_filings(session,symbol)
                        batch.immutable_put(client,catalog_key,batch.canonical(records));counts["catalog_calls"]+=1
                    else:counts["catalog_reused"]+=1
                    for item in records:
                        period=provider.dateval(item.get("toDate"))
                        if period not in missing:continue
                        original=item["xbrl"];cachekey=batch.PREFIX+"nse-source-cache/"+hashlib.sha256(original.encode()).hexdigest()+"/source.json"
                        cached=get_json(client,cachekey)
                        if cached:
                            raw=client.get_object(Bucket=batch.BUCKET,Key=cached["original_r2_key"])["Body"].read()
                            if batch.sha(raw)!=cached["sha256"]:raise RuntimeError("CACHED_NSE_ORIGINAL_HASH_MISMATCH")
                            counts["originals_reused"]+=1
                        elif original in source_index:
                            proof=source_index[original];raw=client.get_object(Bucket=batch.BUCKET,Key=proof["r2_key"])["Body"].read()
                            if batch.sha(raw)!=proof["original_sha256"]:raise RuntimeError("DIAGNOSTIC_ORIGINAL_HASH_MISMATCH")
                            counts["originals_reused"]+=1
                        else:
                            response=session.get(original,timeout=35);response.raise_for_status();raw=response.content
                            counts["originals_retrieved"]+=1
                        digest=batch.sha(raw);original_key=batch.PREFIX+"evidence/original_version="+digest+"/original-xbrl.xml"
                        batch.immutable_put(client,original_key,raw)
                        batch.immutable_put(client,cachekey,batch.canonical({"source_url":original,"sha256":digest,"original_r2_key":original_key}))
                        try:
                            proof=bridge_from_sources(raw,item,symbol,isin,header,listing)
                            # This record is a derived parser input, never the source catalog.
                            normalized={**item,"fromDate":batch.WINDOWS[period][0],"toDate":period}
                            parsed,error=legacy.extract(raw,normalized,symbol,isin,proof)
                            if error:raise ValueError(error)
                            revenue="NET_INTEREST_INCOME_QUARTER" if symbol in batch.BANKS else "NET_PREMIUM_EARNED_QUARTER" if symbol in batch.INSURERS else "OPERATING_REVENUE_QUARTER"
                            required={revenue,"NET_PROFIT_QUARTER","EPS_DILUTED"}
                            if not required.issubset(parsed["facts"]):raise ValueError("NO_COMPLETE_EXACT_QUARTER_CORE_TRIO")
                            parsed["facts"]={k:parsed["facts"][k] for k in sorted(required)}
                            new=persist(db,client,sid,raw,item,parsed,proof,header,listing)
                            counts["facts_inserted"]+=new;counts["quarter_source_candidates"]+=1
                            result={"period":period,"scope":parsed["scope"],"status":"SOURCE_WRITTEN_PENDING_R4_SELECTION",
                                "source_url":original,"facts_inserted":new,"values":{k:f["value"] for k,f in parsed["facts"].items()}}
                        except ValueError as error:
                            counts["rejected_"+str(error)[:100]]+=1
                            result={"period":period,"source_url":original,"status":"REVIEW_REQUIRED","reason":str(error)}
                        entry["results"].append(result)
            except Exception as error:
                db.rollback();entry["error"]=type(error).__name__+":"+str(error)[:200];counts["company_errors"]+=1
            details.append(entry)
            output=Path(f"tmp/results-r4/nse-lineage-shard-{args.shard}.json");output.parent.mkdir(parents=True,exist_ok=True)
            output.write_text(json.dumps({"counts":dict(counts),"details":details},sort_keys=True))
            print("R4_NSE_LINEAGE_PROGRESS",json.dumps({"symbol":symbol,"counts":dict(counts),"results":entry["results"],"error":entry.get("error")}),flush=True)
    print("R4_NSE_LINEAGE_FINAL",json.dumps({"shard":args.shard,"companies":len(details),"counts":dict(counts)}),flush=True)

if __name__=="__main__":main()
