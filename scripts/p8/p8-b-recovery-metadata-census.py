#!/usr/bin/env python3
import boto3, bisect, csv, hashlib, json, os, sys, tempfile, time
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import duckdb
import psycopg
import requests
from botocore.config import Config

VERSION="P8_B_RECOVERY_METADATA_CENSUS_V1"
EXPECTED_IDENTITIES=4524
EXPECTED_AUDIT_PAIRS=144768
EXPECTED_ELIGIBLE_PAIRS=121956
EXPERIMENT_ID="P8_EXP_NSE_MONTHLY_6M_V1"
R2_PREFIX="portfolioai-history/development/p8/b2/universe-members/v1/"
NSE_LANDING="https://www.nseindia.com/companies-listing/corporate-filings-application?id=allAnnouncements"
NSE_API="https://www.nseindia.com/api/corporate-announcements"
START=date(2021,4,1)
END=date(2026,9,30)
CHUNK_DAYS=7
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/152 Safari/537.36"
OUT=Path(os.environ.get("P8_RECOVERY_CENSUS_OUT","tmp/p8-b-recovery-metadata-census"))
DOCS=Path("docs/p8")

def normalize_account(raw):
    raw=raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else:
        host=raw
    suffix=".r2.cloudflarestorage.com"
    return host[:-len(suffix)] if host.endswith(suffix) else host

def r2():
    account=normalize_account(os.environ["CLOUDFLARE_R2_ACCOUNT_ID"])
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
        region_name="auto",
        config=Config(retries={"max_attempts":8,"mode":"adaptive"},connect_timeout=30,read_timeout=180,s3={"addressing_style":"path"}),
    )

def parse_ts(value):
    if not value: return None
    value=str(value).strip()
    formats=[
        "%d-%b-%Y %H:%M:%S",
        "%d-%b-%Y %H:%M",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
    ]
    for fmt in formats:
        try:
            dt=datetime.strptime(value,fmt)
            if dt.tzinfo is None:
                from zoneinfo import ZoneInfo
                dt=dt.replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            return dt.astimezone(timezone.utc)
        except ValueError:
            pass
    try:
        dt=datetime.fromisoformat(value.replace("Z","+00:00"))
        if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None

def classify(row):
    desc=str(row.get("desc") or "").upper()
    text=" ".join([desc,str(row.get("attchmntText") or "").upper()])
    if "INTEGRATED FILING" in text and ("FINANC" in text or "RESULT" in text):
        kind="INTEGRATED_FINANCIAL"
    elif "ANNUAL REPORT" in text:
        kind="ANNUAL_REPORT"
    elif any(x in text for x in ["RED HERRING PROSPECTUS","PROSPECTUS","INFORMATION MEMORANDUM"]):
        kind="RHP_INFORMATION_MEMORANDUM"
    elif "FINANCIAL RESULT" in text or "FINANCIALS" in text or "RESULTS" in desc:
        kind="FINANCIAL_RESULT"
    else:
        return None
    has_xbrl=str(row.get("hasXbrl") or "").strip().lower() in {"1","true","yes","y"} or bool(str(row.get("csvName") or "").strip())
    return kind,has_xbrl

def list_member_objects(s3,bucket):
    keys=[]
    token=None
    while True:
        kwargs={"Bucket":bucket,"Prefix":R2_PREFIX,"MaxKeys":1000}
        if token: kwargs["ContinuationToken"]=token
        page=s3.list_objects_v2(**kwargs)
        for obj in page.get("Contents",[]):
            key=obj["Key"]
            if key.endswith("/part-00000.parquet"): keys.append(key)
        if not page.get("IsTruncated"): break
        token=page.get("NextContinuationToken")
    keys.sort()
    if len(keys)!=32:
        raise RuntimeError(f"Expected 32 B2 member partitions, got {len(keys)}")
    return keys

def load_b2_surface(s3,bucket,keys):
    OUT.mkdir(parents=True,exist_ok=True)
    files=[]
    for i,key in enumerate(keys):
        local=OUT/f"members-{i:02d}.parquet"
        s3.download_file(bucket,key,str(local))
        files.append(str(local))
    con=duckdb.connect()
    try:
        quoted=",".join("'" + x.replace("'","''") + "'" for x in files)
        rows=con.execute(
            f"""select historical_identity_id, decision_at, membership_state
                from read_parquet([{quoted}])
                order by decision_at, historical_identity_id"""
        ).fetchall()
    finally:
        con.close()
    return [(str(a),str(b),str(c)) for a,b,c in rows]

def load_identities():
    db=os.environ["SUPABASE_DB_URL"]
    if "lrgpjimipfkyoqbpsqzz" not in db:
        raise RuntimeError("Refusing non-Development database URL")
    with psycopg.connect(db,connect_timeout=20) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """select id::text,historical_isin,canonical_security_id::text
                   from public.p8_historical_security_identities
                   where experiment_id=%s
                   order by historical_isin""",
                (EXPERIMENT_ID,),
            )
            rows=cur.fetchall()
    if len(rows)!=EXPECTED_IDENTITIES:
        raise RuntimeError(f"Historical identity drift: {len(rows)}")
    return [{"id":r[0],"isin":r[1],"canonical_security_id":r[2]} for r in rows]

def fetch_nse_metadata(target_isins):
    session=requests.Session()
    session.headers.update({"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Accept-Language":"en-US,en;q=0.9","Referer":NSE_LANDING})
    landing=session.get(NSE_LANDING,timeout=30)
    if landing.status_code!=200:
        raise RuntimeError(f"NSE landing HTTP {landing.status_code}")

    by_isin=defaultdict(list)
    seen=set()
    request_count=0
    raw_rows=0
    matched_rows=0
    relevant_rows=0
    parse_timestamp_failures=0
    start=START

    while start<=END:
        stop=min(END,start+timedelta(days=CHUNK_DAYS-1))
        params={"index":"equities","from_date":start.strftime("%d-%m-%Y"),"to_date":stop.strftime("%d-%m-%Y")}
        response=None
        for attempt in range(5):
            response=session.get(NSE_API,params=params,timeout=60)
            if response.status_code==200:
                break
            if response.status_code in (401,403):
                session.get(NSE_LANDING,timeout=30)
            time.sleep(min(8,2**attempt))
        request_count+=1
        if response is None or response.status_code!=200:
            raise RuntimeError(f"NSE metadata HTTP {getattr(response,'status_code',None)} for {start}..{stop}")
        payload=response.json()
        if not isinstance(payload,list):
            raise RuntimeError("NSE metadata payload is not a list")
        raw_rows+=len(payload)

        # Fail closed if the endpoint ignores the requested date range.
        for row in payload:
            if not isinstance(row,dict): continue
            ann=parse_ts(row.get("an_dt"))
            if ann and not (start <= ann.astimezone().date() <= stop):
                # IST/UTC edge can cross a date; tolerate one calendar day at boundaries.
                if ann.date() < start-timedelta(days=1) or ann.date() > stop+timedelta(days=1):
                    raise RuntimeError(f"NSE date-range drift: {row.get('an_dt')} outside {start}..{stop}")

            isin=str(row.get("sm_isin") or "").strip().upper()
            if isin not in target_isins: continue
            matched_rows+=1
            classification=classify(row)
            if not classification: continue
            relevant_rows+=1
            disseminated=parse_ts(row.get("exchdisstime") or row.get("an_dt"))
            if disseminated is None:
                parse_timestamp_failures+=1
                continue
            kind,has_xbrl=classification
            seq=str(row.get("seq_id") or "")
            dedupe=seq or hashlib.sha256(json.dumps(row,sort_keys=True,default=str).encode()).hexdigest()
            if dedupe in seen: continue
            seen.add(dedupe)
            by_isin[isin].append({
                "kind":kind,
                "disseminated_at":disseminated,
                "has_structured_financials":bool(has_xbrl),
                "symbol":str(row.get("symbol") or "").strip(),
                "company_name":str(row.get("sm_name") or "").strip(),
                "reference":seq or str(row.get("attchmntFile") or ""),
            })
        start=stop+timedelta(days=1)
        time.sleep(0.08)

    for rows in by_isin.values():
        rows.sort(key=lambda r:r["disseminated_at"])
    return by_isin,{
        "requests":request_count,
        "raw_metadata_rows":raw_rows,
        "target_identity_metadata_rows":matched_rows,
        "relevant_filing_metadata_rows":relevant_rows,
        "relevant_rows_with_unusable_timestamp":parse_timestamp_failures,
        "unique_relevant_rows":sum(len(x) for x in by_isin.values()),
    }

def before_index(rows,decision):
    times=[r["disseminated_at"] for r in rows]
    return bisect.bisect_left(times,decision)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    DOCS.mkdir(parents=True,exist_ok=True)
    bucket=os.environ["CLOUDFLARE_R2_BUCKET"]
    if bucket!="portfolioai-history-dev":
        raise RuntimeError("Refusing non-Development R2 bucket")

    identities=load_identities()
    by_id={x["id"]:x for x in identities}
    by_isin={x["isin"]:x for x in identities}

    s3=r2()
    keys=list_member_objects(s3,bucket)
    surface=load_b2_surface(s3,bucket,keys)
    if len(surface)!=EXPECTED_AUDIT_PAIRS:
        raise RuntimeError(f"B2 audit surface drift: {len(surface)}")
    eligible=[x for x in surface if x[2]=="ELIGIBLE"]
    if len(eligible)!=EXPECTED_ELIGIBLE_PAIRS:
        raise RuntimeError(f"B2 eligible denominator drift: {len(eligible)}")
    for hist_id,_,_ in surface:
        if hist_id not in by_id:
            raise RuntimeError("B2 member references unknown historical identity")

    filings,nse_stats=fetch_nse_metadata(set(by_isin))

    pair_counts=Counter()
    decision_counts=defaultdict(Counter)
    identity_summary={x["id"]:Counter() for x in identities}
    full_manifest=OUT/"pair-census.csv"
    with full_manifest.open("w",newline="",encoding="utf-8") as f:
        writer=csv.writer(f)
        writer.writerow([
            "historical_identity_id","historical_isin","decision_at","nse_relevant_filings_before",
            "nse_financial_candidates_before","nse_structured_candidates_before","nse_classification_candidates_before",
            "metadata_disposition",
        ])
        for hist_id,decision_text,_ in eligible:
            identity=by_id[hist_id]
            decision=parse_ts(decision_text)
            if decision is None: raise RuntimeError(f"Invalid B2 decision timestamp: {decision_text}")
            rows=filings.get(identity["isin"],[])
            n=before_index(rows,decision)
            prior=rows[:n]
            financial=sum(r["kind"] in {"FINANCIAL_RESULT","INTEGRATED_FINANCIAL"} for r in prior)
            structured=sum(r["has_structured_financials"] and r["kind"] in {"FINANCIAL_RESULT","INTEGRATED_FINANCIAL"} for r in prior)
            classification=sum(r["kind"] in {"FINANCIAL_RESULT","INTEGRATED_FINANCIAL","ANNUAL_REPORT","RHP_INFORMATION_MEMORANDUM"} for r in prior)
            if financial>0 and classification>0:
                disposition="NSE_METADATA_CANDIDATE_READY"
            elif len(prior)>0:
                disposition="NSE_METADATA_PARTIAL"
            else:
                disposition="BSE_FALLBACK_REQUIRED"
            pair_counts[disposition]+=1
            day=decision.date().isoformat()
            decision_counts[day][disposition]+=1
            identity_summary[hist_id][disposition]+=1
            writer.writerow([hist_id,identity["isin"],decision.isoformat(),len(prior),financial,structured,classification,disposition])

    identity_path=DOCS/"PortfolioAI_P8_B_RECOVERY_METADATA_CENSUS_IDENTITY_SUMMARY_2026-10-03.csv"
    with identity_path.open("w",newline="",encoding="utf-8") as f:
        writer=csv.writer(f)
        writer.writerow([
            "historical_identity_id","historical_isin","canonical_security_id","nse_relevant_metadata_rows",
            "nse_candidate_ready_pairs","nse_partial_pairs","bse_fallback_required_pairs",
        ])
        for identity in identities:
            c=identity_summary[identity["id"]]
            writer.writerow([
                identity["id"],identity["isin"],identity["canonical_security_id"] or "",
                len(filings.get(identity["isin"],[])),
                c["NSE_METADATA_CANDIDATE_READY"],c["NSE_METADATA_PARTIAL"],c["BSE_FALLBACK_REQUIRED"],
            ])

    pair_sha=hashlib.sha256(full_manifest.read_bytes()).hexdigest()
    ident_sha=hashlib.sha256(identity_path.read_bytes()).hexdigest()
    fallback=pair_counts["BSE_FALLBACK_REQUIRED"]
    audit={
        "version":VERSION,
        "generated_at":datetime.now(timezone.utc).isoformat(),
        "environment":"PortfolioAI Dev",
        "branch":"PortfolioAI-Development",
        "status":"PASS_NSE_CENSUS_BSE_FALLBACK_PENDING" if fallback else "PASS",
        "scope":{
            "historical_identities":len(identities),
            "full_audit_surface_pairs":len(surface),
            "b2_eligible_candidate_pairs":len(eligible),
            "provider_calls":0,
            "nse_metadata_requests":nse_stats["requests"],
            "attachment_downloads":0,
            "xbrl_downloads":0,
            "pdf_downloads":0,
            "filing_csv_body_downloads":0,
            "supabase_writes":0,
            "r2_writes":0,
            "hosted_b5_b6_mutations":0,
            "performance_outcome_reads":0,
        },
        "nse_metadata":nse_stats,
        "pair_dispositions":dict(pair_counts),
        "bse_fallback_required_pairs":fallback,
        "bse_fallback_transport_state":"PENDING_FOR_EXACT_NSE_GAPS" if fallback else "NOT_REQUIRED",
        "exclusion_ceiling_state":"PENDING_OWNER_FREEZE",
        "decision_date_dispositions":{k:dict(v) for k,v in sorted(decision_counts.items())},
        "artifacts":{
            "full_pair_manifest":{"path":"ACTION_ARTIFACT/pair-census.csv","rows":len(eligible),"sha256":pair_sha},
            "identity_summary":{"path":str(identity_path),"rows":len(identities),"sha256":ident_sha},
        },
        "interpretation":[
            "NSE metadata candidate readiness is a source-feasibility signal only; it does not mean B5/B6 evidence is materialized.",
            "Every filing candidate uses exchange dissemination time strictly before the B2 decision.",
            "Pairs with no relevant NSE filing metadata are routed to BSE fallback; they are not excluded.",
            "No current canonical-security linkage is required to map NSE metadata because historical ISIN is the primary key.",
            "The recovery exclusion ceiling remains pending explicit owner freeze.",
        ],
    }
    audit_path=DOCS/"PortfolioAI_P8_B_RECOVERY_METADATA_CENSUS_AUDIT_2026-10-03.json"
    audit_path.write_text(json.dumps(audit,indent=2,sort_keys=True)+"\n")
    print(json.dumps(audit,indent=2,sort_keys=True))
    return 0

if __name__=="__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        OUT.mkdir(parents=True,exist_ok=True); DOCS.mkdir(parents=True,exist_ok=True)
        failure={
            "version":VERSION,
            "generated_at":datetime.now(timezone.utc).isoformat(),
            "status":"BLOCKED_FAIL_CLOSED",
            "error":type(exc).__name__+":"+str(exc),
            "scope":{"provider_calls":0,"supabase_writes":0,"r2_writes":0,"attachment_downloads":0},
            "exclusion_ceiling_state":"PENDING_OWNER_FREEZE",
        }
        (DOCS/"PortfolioAI_P8_B_RECOVERY_METADATA_CENSUS_AUDIT_2026-10-03.json").write_text(json.dumps(failure,indent=2,sort_keys=True)+"\n")
        print(json.dumps(failure,indent=2,sort_keys=True),file=sys.stderr)
        sys.exit(2)
