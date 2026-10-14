#!/usr/bin/env python3
"""Development-only R4. Verify R2 manifest bytes and select current-display
facts that agree with the immutable filing. Does not establish issuer publication
time, adjust historical share basis or change any investment research score."""
import argparse, hashlib, json, os
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse
import boto3, psycopg
from botocore.config import Config
from psycopg.rows import dict_row

REF="lrgpjimipfkyoqbpsqzz"
BUCKET="portfolioai-history-dev"
PREFIX="portfolioai-results/development/v1/quarterly/"
QUARTERS=("2025-09-30","2025-12-31","2026-03-31","2026-06-30")
BANKS=set("AUBANK AXISBANK BANDHANBNK BANKBARODA FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK SBIN".split())
BANK_REQUIRED={"NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"}
OTHER_REQUIRED={"OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"}
UNITS={"OPERATING_REVENUE_QUARTER":"INR_CRORE","NET_PROFIT_QUARTER":"INR_CRORE",
       "NET_INTEREST_INCOME_QUARTER":"INR_CRORE","OPERATING_PROFIT_QUARTER":"INR_CRORE",
       "EPS_DILUTED":"INR_PER_SHARE","GROSS_NPA_PERCENT":"PERCENT","NET_NPA_PERCENT":"PERCENT"}
def canonical_bytes(x):
    return json.dumps(x,sort_keys=True,separators=(",",":")).encode()
def sha(x):return hashlib.sha256(x).hexdigest()

def check_manifest(record,manifest):
    raw=record["raw_payload"]
    if not isinstance(raw,dict) or not isinstance(manifest,dict):return "MALFORMED_MANIFEST"
    if sha(canonical_bytes(raw))!=record["payload_hash"]:return "SOURCE_HASH_MISMATCH"
    if {k:v for k,v in raw.items() if k not in ("r2_key","r2_manifest_sha256")}!=manifest:return "SOURCE_MANIFEST_MISMATCH"
    if manifest.get("contract")!="PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1":return "UNAPPROVED_CONTRACT"
    if manifest.get("period_end") not in QUARTERS:return "OUTSIDE_QUARTERS"
    try:
        days=(date.fromisoformat(manifest["period_end"])-date.fromisoformat(manifest["period_start"])).days
        if not 75<=days<=100:return "NOT_SINGLE_QUARTER"
    except (KeyError,ValueError,TypeError):return "INVALID_QUARTER_DATES"
    if manifest.get("consolidation_scope") not in ("STANDALONE","CONSOLIDATED"):return "SCOPE_NOT_PROVEN"
    u=urlparse(manifest.get("issuer_filing_url",""))
    if u.scheme!="https" or u.hostname!="nsearchives.nseindia.com" or not u.path.startswith("/corporate/ixbrl/"):return "UNQUALIFIED_ORIGIN"
    if record["source_url"]!=manifest["issuer_filing_url"]:return "ORIGIN_MISMATCH"
    if not isinstance(manifest.get("original_sha256_unretained"),str) or len(manifest["original_sha256_unretained"])!=64:return "ORIGINAL_HASH_MISSING"
    if manifest.get("raw_nse_bytes_retained") is not False:return "RAW_RETENTION_UNPROVEN"
    if not record["source_retrieved"]:return "SOURCE_RETRIEVAL_UNKNOWN"
    if not isinstance(manifest.get("facts"),dict):return "FACTS_NOT_OBJECT"
    return None

def check_fact(r,m):
    if r["symbol"]!=m.get("symbol") or r["isin"]!=m.get("isin"):return "SECURITY_IDENTITY_MISMATCH"
    if str(r["period_end"])!=m.get("period_end") or str(r["period_start"])!=m.get("period_start"):return "OBS_PERIOD_MISMATCH"
    if r["consolidation_scope"]!=m.get("consolidation_scope"):return "OBS_SCOPE_MISMATCH"
    if r["evidence_status"]!="AVAILABLE" or r["source_code"]!="COMPANY_EXCHANGE_FILING":return "UNAVAILABLE_EVIDENCE"
    key=r["metric_code"]; fact=m["facts"].get(key)
    if not isinstance(fact,dict):return "MISSING_MANIFEST_METRIC"
    if r["unit"]!=UNITS.get(key) or fact.get("unit")!=r["unit"]:return "UNIT_MISMATCH"
    if r["currency"]!="INR" or not r["retrieved_at"]:return "VALUE_OR_RETRIEVAL_UNPROVEN"
    try:
        if Decimal(str(r["numeric_value"]))!=Decimal(str(fact["value"])):return "NUMERIC_MISMATCH"
    except (ValueError,InvalidOperation,KeyError,TypeError):return "INVALID_DECIMAL"
    if key=="EPS_DILUTED" and m.get("historical_identity_link"):return "PRE_SPLIT_EPS_REVIEW"
    return None

def select_quarters(rows):
    groups=defaultdict(lambda:defaultdict(list))
    for r in rows: groups[(r["security_id"],str(r["period_end"]))][r["consolidation_scope"]].append(r)
    chosen=[]; blocked=Counter();selected_quarters=defaultdict(set)
    for (security,period),scopes in groups.items():
        # A quarter must use ONE independently reconciled filing and ONE scope.
        # Prefer a COMPLETE consolidated filing; where consolidated is only
        # partial, a complete and conflict-free standalone issuer filing is
        # eligible for current display, with its scope retained in each row.
        # Never evade a conflicting consolidated revision by falling back.
        admitted=False
        conflict=False
        for scope in ("CONSOLIDATED","STANDALONE"):
            if scope not in scopes:continue
            rs=scopes[scope]
            versions=defaultdict(set)
            for r in rs:versions[r["metric_code"]].add(Decimal(str(r["numeric_value"])))
            if any(len(values)>1 for values in versions.values()):
                blocked["CONFLICTING_SAME_SCOPE_FILING_VALUES"]+=1
                conflict=True
                break
            by_record=defaultdict(list)
            for r in rs:by_record[r["source_record_id"]].append(r)
            core=BANK_REQUIRED if rs[0]["symbol"] in BANKS else OTHER_REQUIRED
            complete=[v for v in by_record.values() if core.issubset({a["metric_code"] for a in v})]
            if not complete:
                continue
            source=min(complete,key=lambda v:str(v[0]["source_record_id"]))
            chosen.extend(source)
            selected_quarters[security].add(period)
            if scope=="STANDALONE" and "CONSOLIDATED" in scopes:
                blocked["STANDALONE_COMPLETE_CONSOLIDATED_INCOMPLETE_ADMITTED"]+=1
            admitted=True
            break
        if not admitted and not conflict:
            blocked["NO_COMPLETE_SINGLE_SOURCE"]+=1
    return chosen,blocked,selected_quarters

SQL="""SELECT f.id,f.security_id,s.symbol,s.isin,f.metric_code,f.numeric_value,f.unit,
f.currency,f.period_start,f.period_end,f.consolidation_scope,f.source_record_id,
f.evidence_status,f.retrieved_at,f.source_code,d.raw_payload,d.source_url,
d.payload_hash,d.retrieved_at AS source_retrieved
FROM public.fundamental_observations f
JOIN public.securities s ON s.id=f.security_id AND s.asset_class='EQUITY'
JOIN public.data_source_records d ON d.id=f.source_record_id
WHERE f.period_type='QUARTER' AND f.period_end=ANY(%s::date[])
AND f.source_code='COMPANY_EXCHANGE_FILING' AND d.source_code=f.source_code
AND d.record_kind='RESULTS_QUARTERLY_NSE_DISCOVERY_V1'
AND f.metric_code=ANY(%s) AND f.numeric_value IS NOT NULL
ORDER BY f.source_record_id,f.metric_code"""
def verify(db,s3,apply):
    invalid=Counter();cache={};facts=[]
    with psycopg.connect(db,row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(SQL,(list(QUARTERS),list(UNITS)))
            observations=cur.fetchall()
        # Read-only inspection of a legacy issuer manifest. The prior R3
        # recovery format must not enter R4 merely because a source says
        # "R2 verified"; inspect actual archived bytes independently.
        with conn.cursor() as cur:
            cur.execute("""SELECT raw_payload,source_url
                FROM public.data_source_records WHERE source_code=%s
                  AND record_kind='RESULTS_QUARTERLY_ISSUER_IXBRL_FACTS'
                  AND raw_payload->>'security_symbol'='HCLTECH'
                  AND raw_payload->>'reporting_period_end'='2026-06-30'
                LIMIT 1""",("COMPANY_EXCHANGE_FILING",))
            legacy=cur.fetchone()
        if legacy:
            try:
                record=legacy["raw_payload"]
                body=s3.get_object(Bucket=BUCKET,Key=record["r2_key"])["Body"].read()
                candidate=json.loads(body)
                print("R4_LEGACY_SOURCE_DIAGNOSTIC",json.dumps({
                    "r2_hash_matches":sha(body)==record.get("r2_manifest_sha256"),
                    "manifest_keys":sorted(candidate.keys()),
                    "values":{k:candidate.get(k) for k in (
                        "security_symbol","isin","source_kind","source_url",
                        "reporting_period_start","reporting_period_end",
                        "reporting_basis","original_financial_unit",
                        "original_revenue_lakhs","original_total_profit_lakhs",
                        "original_diluted_eps_inr","source_bytes_stored",
                        "extraction_method")},
                    "source_url_matches":record.get("source_url")==legacy["source_url"]
                },sort_keys=True))
            except Exception as error:
                print("R4_LEGACY_SOURCE_DIAGNOSTIC",json.dumps({"error_type":type(error).__name__}))
        # Bound R2 reads without making any concurrent database writes. S3
        # clients support concurrent GET; each source is fetched at most once.
        by_id={str(r["source_record_id"]):r for r in observations}
        def check_one(pair):
            k,r=pair
            raw=r["raw_payload"];pointer=raw.get("r2_key") if isinstance(raw,dict) else None
            expected=raw.get("r2_manifest_sha256") if isinstance(raw,dict) else None
            document=None;error=None
            if not isinstance(pointer,str) or not pointer.startswith(PREFIX) or not isinstance(expected,str) or "/source_version="+expected+"/" not in pointer:
                error="INVALID_R2_POINTER"
            else:
                try:
                    b=s3.get_object(Bucket=BUCKET,Key=pointer)["Body"].read()
                    if sha(b)!=expected:error="R2_READBACK_HASH_MISMATCH"
                    else:document=json.loads(b)
                except Exception as exc:
                    response=getattr(exc,"response",{})
                    code=response.get("Error",{}).get("Code","") if isinstance(response,dict) else ""
                    error="R2_OBJECT_UNAVAILABLE_"+type(exc).__name__+("_"+str(code) if code else "")
            if not error:error=check_manifest(r,document)
            return k,(document,error)
        with ThreadPoolExecutor(max_workers=12) as pool:
            for k,validated in pool.map(check_one,by_id.items()):
                cache[k]=validated
        for r in observations:
            k=str(r["source_record_id"])
            doc,error=cache[k]
            if error:invalid[error]+=1;continue
            reason=check_fact(r,doc)
            if reason:invalid[reason]+=1;continue
            facts.append(r)
        selections,blocked,quarters=select_quarters(facts);invalid.update(blocked)
        inserted=unchanged=protected=0
        if apply:
            proposals=[{"security_id":str(r["security_id"]),
                        "metric_code":r["metric_code"],
                        "period_end":str(r["period_end"]),
                        "consolidation_scope":r["consolidation_scope"],
                        "selected_observation_id":str(r["id"])} for r in selections]
            payload=json.dumps(proposals,separators=(",",":"))
            fields="""SELECT * FROM jsonb_to_recordset(%s::jsonb)
                AS x(security_id uuid,metric_code text,period_end date,
                     consolidation_scope text,selected_observation_id uuid)"""
            with conn.cursor() as cur:
                cur.execute("""WITH proposals AS ("""+fields+""")
                    SELECT count(*) FILTER (WHERE d.selected_observation_id<>p.selected_observation_id) AS conflicts,
                           count(*) FILTER (WHERE d.selected_observation_id=p.selected_observation_id) AS unchanged
                    FROM proposals p JOIN public.fundamental_observation_decisions d
                      ON d.security_id=p.security_id
                     AND d.metric_code=p.metric_code
                     AND d.period_end=p.period_end
                     AND d.period_type='QUARTER'
                     AND d.consolidation_scope=p.consolidation_scope
                    """,(payload,))
                outcome=cur.fetchone()
                protected=int(outcome["conflicts"] or 0)
                unchanged=int(outcome["unchanged"] or 0)
                if protected:
                    conn.rollback()
                else:
                    cur.execute("""WITH proposals AS ("""+fields+""")
                        INSERT INTO public.fundamental_observation_decisions
                        (security_id,metric_code,period_end,period_type,
                         consolidation_scope,selected_observation_id,decision_basis,
                         decided_at,decided_by,notes)
                        SELECT p.security_id,p.metric_code,p.period_end,'QUARTER',
                               p.consolidation_scope,p.selected_observation_id,
                               'EVIDENCE_PRIORITY',now(),NULL,
                               'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                        FROM proposals p
                        WHERE TRUE
                        ON CONFLICT DO NOTHING RETURNING selected_observation_id""",(payload,))
                    inserted=len(cur.fetchall())
                    if inserted+unchanged!=len(proposals):
                        protected=len(proposals)-inserted-unchanged
                        conn.rollback()
                    else:
                        conn.commit()
        else:conn.rollback()
    report={"mode":"APPLY" if apply else "DRY_RUN",
            "source_observations":len(observations),"r2_sources_checked":len(cache),
            "qualified_fact_rows":len(facts),"selected_candidate_facts":len(selections),
            "selected_stock_quarters":sum(map(len,quarters.values())),
            "selected_equities":len(quarters),
            "four_quarters_selected_equities":sum(len(x)==4 for x in quarters.values()),
            "created_decisions":inserted if not protected else 0,
            "unchanged_decisions":unchanged,"conflicting_existing_decisions":protected,
            "exceptions":dict(sorted(invalid.items())),
            "publication_precision":"UNKNOWN; only current display, never historical point-in-time"}
    if protected:raise RuntimeError("R4_PRIOR_SELECTION_CONFLICT_ROLLED_BACK:"+json.dumps(report))
    if observations and not facts:
        raise RuntimeError("R4_ZERO_VALID_SOURCES_FAIL_CLOSED:"+json.dumps(report["exceptions"]))
    return report
def main():
    parser=argparse.ArgumentParser();parser.add_argument("--apply",action="store_true")
    options=parser.parse_args()
    db=os.environ.get("SUPABASE_DB_URL","")
    if REF not in db:raise SystemExit("NOT_DEVELOPMENT_DATABASE")
    if os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:raise SystemExit("NOT_DEVELOPMENT_BUCKET")
    account=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    from urllib.parse import urlparse
    import re
    if re.fullmatch(r"[a-f0-9]{32}",account):
        endpoint="https://"+account+".r2.cloudflarestorage.com"
    elif account.startswith("https://"):
        u=urlparse(account)
        if not re.fullmatch(r"[a-f0-9]{32}\.r2\.cloudflarestorage\.com",u.hostname or "") or u.port or u.path not in ("","/") or u.query or u.fragment:
            raise SystemExit("INVALID_R2_ENDPOINT")
        endpoint=account.rstrip("/")
    else:
        raise SystemExit("INVALID_R2_ACCOUNT_SETTING")
    s3=boto3.client("s3",endpoint_url=endpoint,
                    aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
                    aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
                    region_name="auto",config=Config(retries={"max_attempts":2,"mode":"standard"}))
    result=verify(db,s3,options.apply)
    os.makedirs("tmp/results-r4",exist_ok=True)
    with open("tmp/results-r4/readback.json","w") as f:json.dump(result,f,indent=2,sort_keys=True)
    print(json.dumps(result,sort_keys=True))
if __name__=="__main__":main()
