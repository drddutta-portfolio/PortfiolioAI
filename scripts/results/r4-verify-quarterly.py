#!/usr/bin/env python3
"""Development-only R4. Verify R2 manifest bytes and select current-display
facts that agree with the immutable filing. Does not establish issuer publication
time, adjust historical share basis or change any investment research score."""
import argparse, hashlib, json, os, re
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
# The base R4 gate retains its original four-quarter authority. R5 may
# additionally select separately validated historical comparison facts only.
R5_COMPARISON_MODE=os.getenv("RESULTS_R5_COMPARISON_SELECTION","0")=="1"
R5_LEGACY_MODE=os.getenv("RESULTS_R5_LEGACY_SELECTION","0")=="1"
QUARTERS=(("2024-09-30","2024-12-31") if R5_LEGACY_MODE else
          ("2025-03-31","2025-06-30") if R5_COMPARISON_MODE
          else ("2025-09-30","2025-12-31","2026-03-31","2026-06-30"))
BANKS=set("AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK RBLBANK SBIN UNIONBANK".split())
BANK_REQUIRED={"NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"}
OTHER_REQUIRED={"OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"}
UNITS={"OPERATING_REVENUE_QUARTER":"INR_CRORE","NET_PROFIT_QUARTER":"INR_CRORE",
       "NET_INTEREST_INCOME_QUARTER":"INR_CRORE","OPERATING_PROFIT_QUARTER":"INR_CRORE",
       "EPS_DILUTED":"INR_PER_SHARE","GROSS_NPA_PERCENT":"PERCENT","NET_NPA_PERCENT":"PERCENT"}
def canonical_bytes(x):
    return json.dumps(x,sort_keys=True,separators=(",",":")).encode()
def sha(x):return hashlib.sha256(x).hexdigest()

# Only specific original reported share bases documented by original NSE
# iXBRL identity and the official exchange split/ISIN circulars qualify.
# No EPS adjustment; cross-split comparisons remain prohibited.
APPROVED_SPLIT_ISINS={
"E2E":("INE255Z01019","INE255Z01027","2026-06-05","10","MSE/LIST/19135/2026"),
"POCL":("INE063E01053","INE063E01061","2026-07-21","2.5","NSE change in ISIN notice 2026-07-17"),
"BECTORFOOD":("INE495P01012","INE495P01020","2025-12-12","5","MSE/LIST/18238/2025"),
"V2RETAIL":("INE945H01013","INE945H01021","2026-03-25","10","BSE DR-847/2025-2026"),
"KOTAKBANK":("INE237A01028","INE237A01036","2026-01-14","5","Kotak Mahindra Bank issuer split disclosure 2026-01-16")}
def historical_original_eps_proof(m):
    link=m.get("historical_identity_link")
    if not link:return None
    if not isinstance(link,dict):return "HISTORICAL_IDENTITY_MALFORMED"
    known=APPROVED_SPLIT_ISINS.get(m.get("symbol"))
    if not known:return "HISTORICAL_IDENTITY_NOT_APPROVED"
    old,new,exdate,factor,circular=known
    if (m.get("source_isin")!=old or m.get("isin")!=new
        or link.get("source_isin")!=old or link.get("current_isin")!=new
        or link.get("ex_date")!=exdate or str(link.get("split_new_per_old"))!=factor):
        return "HISTORICAL_IDENTITY_MISMATCH"
    if circular not in link.get("evidence",""):return "HISTORICAL_SPLIT_CIRCULAR_MISSING"
    if (m.get("period_end") is None or m["period_end"]>=exdate
        or m.get("eps_as_originally_reported_before_split") is not True):
        return "HISTORICAL_ORIGINAL_EPS_UNPROVEN"
    return None

def check_manifest(record,manifest):
    raw=record["raw_payload"]
    if not isinstance(raw,dict) or not isinstance(manifest,dict):return "MALFORMED_MANIFEST"
    if sha(canonical_bytes(raw))!=record["payload_hash"]:return "SOURCE_HASH_MISMATCH"
    if {k:v for k,v in raw.items() if k not in ("r2_key","r2_manifest_sha256")}!=manifest:return "SOURCE_MANIFEST_MISMATCH"
    contract=manifest.get("contract")
    if contract not in ("PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1",
                         "PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1"):
        return "UNAPPROVED_CONTRACT"
    if manifest.get("period_end") not in QUARTERS:return "OUTSIDE_QUARTERS"
    try:
        days=(date.fromisoformat(manifest["period_end"])-date.fromisoformat(manifest["period_start"])).days
        if not 75<=days<=100:return "NOT_SINGLE_QUARTER"
    except (KeyError,ValueError,TypeError):return "INVALID_QUARTER_DATES"
    if manifest.get("consolidation_scope") not in ("STANDALONE","CONSOLIDATED"):return "SCOPE_NOT_PROVEN"
    u=urlparse(manifest.get("issuer_filing_url",""))
    if contract=="PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1":
        approved={"COFORGE":("www.coforge.com","/hubfs/Outcome-of-Board-Meeting-Q3-FY2026.pdf"),
                  "SHAILY":("static.shaily.com","/y7GuSh95RsG5gOUUnd6i-covering-letter-reg-33-30092025-signed-pdf"),
                  "HBLENGINE":("www.hbl.in","/reports/results_sep2025.pdf")}
        expected=approved.get(manifest.get("symbol"))
        if not expected or u.scheme!="https" or (u.hostname,u.path)!=expected or u.query or u.fragment:
            return "UNAPPROVED_ORIGINAL_ISSUER_PDF"
        original=manifest.get("original_sha256_retained")
        original_key=manifest.get("original_r2_key")
        if (not isinstance(original,str) or len(original)!=64
            or not isinstance(original_key,str) or not original_key.startswith(PREFIX)
            or not original_key.endswith("/issuer-original.pdf")
            or "/original_version="+original+"/" not in original_key):
            return "INVALID_RETAINED_ORIGINAL_REFERENCE"
        if manifest.get("original_pdf_retained") is not True:return "ORIGINAL_PDF_NOT_RETAINED"
    elif contract=="PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1" and (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com" or not u.path.startswith("/corporate/ixbrl/")):
        return "UNQUALIFIED_ORIGIN"
    if contract=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1":
        if (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com"
            or not re.fullmatch(r"/corporate/xbrl/[A-Za-z0-9_.-]+\.xml",u.path)
            or u.query or u.fragment):
            return "UNQUALIFIED_LEGACY_ORIGINAL_XBRL"
        original=manifest.get("original_sha256_retained")
        original_key=manifest.get("original_r2_key")
        if (not isinstance(original,str) or not re.fullmatch(r"[a-f0-9]{64}",original)
            or not isinstance(original_key,str) or not original_key.startswith(PREFIX)
            or not original_key.endswith("/original-xbrl.xml")
            or "/original_version="+original+"/" not in original_key
            or manifest.get("original_xbrl_retained") is not True
            or manifest.get("reporting_currency")!="INR"):
            return "INVALID_RETAINED_LEGACY_XBRL_REFERENCE"
    if contract=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1":
        if (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com"
            or not re.fullmatch(r"/corporate/xbrl/INTEGRATED_FILING_(?:INDAS|BANKING)_[A-Za-z0-9_]+\.xml",u.path,re.I)
            or u.query or u.fragment
            or not re.fullmatch(r"[a-f0-9]{64}",str(manifest.get("original_sha256_unretained","")))
            or manifest.get("original_xbrl_retained") is not False
            or manifest.get("raw_nse_bytes_retained") is not False
            or manifest.get("reporting_currency")!="INR"):
            return "UNQUALIFIED_2025_ORIGINAL_XBRL"
    if contract=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1":
        if (u.scheme!="https" or u.hostname!="nsearchives.nseindia.com"
            or not re.fullmatch(r"/corporate/xbrl/[A-Za-z0-9_.-]+\.xml",u.path)
            or u.query or u.fragment
            or not re.fullmatch(r"[a-f0-9]{64}",str(manifest.get("original_sha256_unretained","")))
            or manifest.get("original_xbrl_retained") is not False
            or manifest.get("raw_nse_bytes_retained") is not False
            or manifest.get("reporting_currency")!="INR"):
            return "UNQUALIFIED_2024_COMPACT_ORIGINAL"
    if record["source_url"]!=manifest["issuer_filing_url"]:return "ORIGIN_MISMATCH"
    if contract=="PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1":
        if not isinstance(manifest.get("original_sha256_unretained"),str) or len(manifest["original_sha256_unretained"])!=64:return "ORIGINAL_HASH_MISSING"
        if manifest.get("raw_nse_bytes_retained") is not False:return "RAW_RETENTION_UNPROVEN"
    elif contract in ("PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1"):
        pass
    elif manifest.get("reporting_currency")!="INR":
        return "PDF_CURRENCY_UNKNOWN"
    if not record["source_retrieved"]:return "SOURCE_RETRIEVAL_UNKNOWN"
    if not isinstance(manifest.get("facts"),dict):return "FACTS_NOT_OBJECT"
    historical_error=historical_original_eps_proof(manifest)
    if historical_error:return historical_error
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
    if m.get("contract") in ("PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2025_XBRL_V1","PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_2024_COMPACT_V1"):
        original_fact=m["facts"][key]
        if not isinstance(original_fact,dict):return "LEGACY_FACT_MALFORMED"
        contexts=original_fact.get("context_ids",original_fact.get("component_context_ids"))
        if (not isinstance(contexts,list) or not contexts
            or not all(isinstance(x,str) and len(x)<100 for x in contexts)):
            return "LEGACY_FINANCIAL_CONTEXT_NOT_PROVEN"
    if key=="EPS_DILUTED" and m.get("historical_identity_link"):
        if (m.get("eps_as_originally_reported_before_split") is not True
            or fact.get("original_unit")!="INR_PER_SHARE"):
            return "HISTORICAL_EPS_ORIGINAL_VALUE_UNPROVEN"
    return None

# Corrected issuer-filed financial results are admitted ONLY with an
# immutable original NSE correction notice, source-version identity and
# exact revised metrics. Never resolve conflicts by "latest filing" alone.
EXIDE_CORRECTION_SHA="0f62c1e6611a4ff318e53c725c2e3e117283547b5ff6b5f0628cbf6eba10d435"
EXIDE_OLD_SOURCE="383002e5-7e7c-4782-9906-5493eeae0fb1"
EXIDE_REVISED_SOURCE="ace1b679-2cc7-46e9-854b-c117eb1ee37c"
EXIDE_CORRECTION_KEY=(PREFIX+"security_id=INE302A01020/period_end=2025-12-31/"
    "original_version="+EXIDE_CORRECTION_SHA+"/issuer-correction.pdf")
def qualify_exide_correction(facts,s3):
    relevant=[r for r in facts if r["symbol"]=="EXIDEIND"
        and str(r["period_end"])=="2025-12-31"
        and r["consolidation_scope"]=="CONSOLIDATED"
        and str(r["source_record_id"]) in(EXIDE_OLD_SOURCE,EXIDE_REVISED_SOURCE)]
    if len(relevant)!=6:
        return facts,False
    by_source=defaultdict(dict)
    for r in relevant:
        if r["isin"]!="INE302A01020":return facts,False
        by_source[str(r["source_record_id"])][r["metric_code"]]=Decimal(str(r["numeric_value"]))
    correct={"OPERATING_REVENUE_QUARTER":Decimal("4200.59"),
             "NET_PROFIT_QUARTER":Decimal("194.97"),
             "EPS_DILUTED":Decimal("2.29")}
    original=dict(correct);original["EPS_DILUTED"]=Decimal("0")
    if by_source.get(EXIDE_OLD_SOURCE)!=original or by_source.get(EXIDE_REVISED_SOURCE)!=correct:
        return facts,False
    try:
        notice=s3.get_object(Bucket=BUCKET,Key=EXIDE_CORRECTION_KEY)["Body"].read()
    except Exception:return facts,False
    if not notice.startswith(b"%PDF") or sha(notice)!=EXIDE_CORRECTION_SHA:
        return facts,False
    return [r for r in facts if not (
        r["symbol"]=="EXIDEIND" and str(r["period_end"])=="2025-12-31"
        and r["consolidation_scope"]=="CONSOLIDATED"
        and str(r["source_record_id"])==EXIDE_OLD_SOURCE)],True

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
AND d.record_kind IN ('RESULTS_QUARTERLY_NSE_DISCOVERY_V1','RESULTS_QUARTERLY_ISSUER_PDF_V1','RESULTS_QUARTERLY_NSE_LEGACY_XBRL_V1','RESULTS_QUARTERLY_NSE_LEGACY_2025_XBRL_V1','RESULTS_QUARTERLY_NSE_LEGACY_2024_COMPACT_V1')
AND f.metric_code=ANY(%s) AND f.numeric_value IS NOT NULL
ORDER BY f.source_record_id,f.metric_code"""
def verify(db,s3,apply):
    invalid=Counter();cache={};facts=[]
    with psycopg.connect(db,row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(SQL,(list(QUARTERS),list(UNITS)))
            observations=cur.fetchall()
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
            if not error and document.get("contract")=="PORTFOLIOAI_RESULTS_VERIFIED_ISSUER_PDF_V1":
                try:
                    original_bytes=s3.get_object(
                        Bucket=BUCKET,Key=document["original_r2_key"])["Body"].read()
                    if (not original_bytes.startswith(b"%PDF")
                        or sha(original_bytes)!=document["original_sha256_retained"]):
                        error="R2_RETAINED_ORIGINAL_PDF_HASH_MISMATCH"
                except Exception:
                    error="R2_RETAINED_ORIGINAL_PDF_UNAVAILABLE"
            if not error and document.get("contract")=="PORTFOLIOAI_RESULTS_VERIFIED_NSE_LEGACY_XBRL_V1":
                try:
                    original_bytes=s3.get_object(
                        Bucket=BUCKET,Key=document["original_r2_key"])["Body"].read()
                    if (sha(original_bytes)!=document["original_sha256_retained"]
                        or b"xbrl" not in original_bytes[:1000].lower()
                        or b"<!DOCTYPE" in original_bytes.upper()):
                        error="R2_RETAINED_ORIGINAL_XBRL_HASH_MISMATCH"
                except Exception:
                    error="R2_RETAINED_ORIGINAL_XBRL_UNAVAILABLE"
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
        facts,exide_corrected=qualify_exide_correction(facts,s3)
        selections,blocked,quarters=select_quarters(facts);invalid.update(blocked)
        if exide_corrected:invalid["EXIDE_CORRECTED_EPS_SUPPORTED_BY_NSE_ORIGINAL"]+=1
        inserted=unchanged=protected=0
        if apply:
            proposals=[{"security_id":str(r["security_id"]),
                        "metric_code":r["metric_code"],
                        "period_end":str(r["period_end"]),
                        "consolidation_scope":r["consolidation_scope"],
                        "selected_observation_id":str(r["id"]),
                        "original_share_basis":bool(
                            r["metric_code"]=="EPS_DILUTED" and
                            r["raw_payload"].get("historical_identity_link")),
                        "issuer_correction":bool(
                            exide_corrected and str(r["source_record_id"])==EXIDE_REVISED_SOURCE)
                        } for r in selections]
            payload=json.dumps(proposals,separators=(",",":"))
            fields="""SELECT * FROM jsonb_to_recordset(%s::jsonb)
                AS x(security_id uuid,metric_code text,period_end date,
                     consolidation_scope text,selected_observation_id uuid,original_share_basis boolean,issuer_correction boolean)"""
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
                               CASE WHEN p.issuer_correction THEN
                                 'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; EXIDE_OFFICIAL_NSE_CORRECTION_2026_02_17; CORRECTED_QUARTER_EPS_2.29; ORIGINAL_CORRECTION_R2_HASH_CHECKED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                               WHEN p.original_share_basis THEN
                                 'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; REPORTED_PRE_SPLIT_EPS_NOT_ADJUSTED; DO_NOT_COMPARE_EPS_ACROSS_SPLIT; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                               ELSE 'RESULTS_R4_CURRENT_DISPLAY_R2_SOURCE_RECONCILED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY' END
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
    if R5_LEGACY_MODE and os.environ.get("RESULTS_R5_LEGACY_ACK")!="2024_SEP_DEC_ORIGINAL_XBRL":
        raise SystemExit("R5_LEGACY_SELECTION_SCOPE_NOT_APPROVED")
    if R5_LEGACY_MODE and R5_COMPARISON_MODE:
        raise SystemExit("R5_COMPARISON_SCOPE_CONFLICT")
    if R5_COMPARISON_MODE and os.environ.get("RESULTS_R5_HISTORICAL_ACK")!="2025_MAR_JUN_ONLY":
        raise SystemExit("R5_HISTORICAL_SELECTION_SCOPE_NOT_APPROVED")
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
