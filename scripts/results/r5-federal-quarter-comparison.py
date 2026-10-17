#!/usr/bin/env python3
"""Bind two Federal Bank FY25 previous consolidated quarters to ONE original archived issuer PDF.

Retrospective R5-only source comparisons; neither canonical R4 choices nor
any V1-4 valuation/research scores are touched. Requires the exact issuer
original SHA already R2-retained, exact issuer CIN and labelled P3 source
statement, six independently checked quarter values and no competing
existing same-scope evidence.
"""
import hashlib,json,os,re
from decimal import Decimal
from urllib.parse import urlparse
import boto3,fitz,psycopg
from botocore.config import Config
from psycopg.types.json import Jsonb

REF="lrgpjimipfkyoqbpsqzz"
BUCKET="portfolioai-history-dev"
SHA="602e0ce12375f7c4ecee8403d4c194aeb48010933d1b39fd099ee298d2c3a16d"
SYMBOL="FEDERALBNK";ISIN="INE171A01029"
ORIGINAL_KIND="RESULTS_R5_FEDERAL_2024_ORIGINAL_ARCHIVE_V1"
COMPARE_KIND="RESULTS_R5_FEDERAL_CONSOLIDATED_SOURCE_REPLAY_V1"
URL=("https://www.federal.bank.in/documents/10180/1124357561/"
     "Financial%2BResults%2B-%2BQ3%2BFY%2B25.pdf/"
     "b1e1c935-02cc-55eb-07bf-c4edd3b47123?t=1738032984384")
PREFIX=("portfolioai-results/development/v1/quarterly/security_id="
        +ISIN+"/period_end=2024-12-31/original_version="+SHA+"/")
PROOF=(
 ("2024-09-30","2024-07-01","700,566","439,345","110,446","4.43"),
 ("2024-12-31","2024-10-01","726,487","456,982","94,870","3.81"),
)
APPROVAL="R5_COMPARISON_ONLY_R2_HASH_VERIFIED_NOT_R4_SELECTION"
def sha(b): return hashlib.sha256(b).hexdigest()
def compact(z): return json.dumps(z,separators=(",",":"),sort_keys=True).encode()
def s3():
    setting=os.environ["CLOUDFLARE_R2_ACCOUNT_ID"].strip()
    if re.fullmatch("[0-9a-f]{32}",setting):
        endpoint="https://"+setting+".r2.cloudflarestorage.com"
    elif setting.startswith("https://"):
        u=urlparse(setting)
        if u.scheme!="https" or not re.fullmatch(r"[0-9a-f]{32}\.r2\.cloudflarestorage\.com",u.hostname or "") or u.path not in ("","/") or u.query:
            raise RuntimeError("BAD_R2_ENDPOINT")
        endpoint=setting.rstrip("/")
    else:raise RuntimeError("BAD_R2_CONFIG")
    return boto3.client("s3",endpoint_url=endpoint,region_name="auto",
       aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
       aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
       config=Config(retries={"max_attempts":2,"mode":"standard"}))
def validate(raw):
    if sha(raw)!=SHA or not raw.startswith(b"%PDF"):
        raise RuntimeError("FEDERAL_2024_R2_SHA_LOCK_MISMATCH")
    doc=fitz.open(stream=raw,filetype="pdf")
    if len(doc)!=6:raise RuntimeError("NOT_SIX_PAGE_SIGNED_REPORT")
    page=doc[3].get_text("text")
    flat=" ".join(page.upper().split())
    for marker in ("THE FEDERAL BANK LIMITED","L65191KL1931PLC000368",
                   "CONSOLIDATED UNAUDITED FINANCIAL RESULTS",
                   "DECEMBER 31, 2024","31.12.2024","30.09.2024",
                   "INTEREST EARNED","INTEREST EXPENDED",
                   "NET PROFIT FOR THE PERIOD","DILUTED EPS"):
        if marker not in flat:
            raise RuntimeError("FEDERAL_CONSOLIDATED_ORIGINAL_FRAGMENT_MISSING:"+marker)
    for _,_,earned,spent,profit,eps in PROOF:
        for value in (earned,spent,profit,eps):
            if value not in flat:
                raise RuntimeError("FEDERAL_CONSOLIDATED_SOURCE_VALUE_MISSING:"+value)
    if "₹ IN LAKHS" not in flat and "IN LAKHS" not in flat:
        raise RuntimeError("BANK_ORIGINAL_INR_LAKH_UNIT_MISSING")
def main():
    url=os.environ.get("SUPABASE_DB_URL","")
    if REF not in url or os.environ.get("CLOUDFLARE_R2_BUCKET")!=BUCKET:
        raise RuntimeError("DEVELOPMENT_ISOLATION_REQUIRED")
    b=s3().get_object(Bucket=BUCKET,Key=PREFIX+"issuer-original.pdf")["Body"].read()
    validate(b)
    with psycopg.connect(url) as db:
        with db.cursor() as cur:
            cur.execute("SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'",(SYMBOL,ISIN))
            data=cur.fetchall()
            if len(data)!=1:raise RuntimeError("CANONICAL_FEDERAL_IDENTITY_CHANGED")
            security_id=data[0][0]
            cur.execute("""SELECT id,raw_payload FROM public.data_source_records
                           WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s
                           AND source_url=%s""",(ORIGINAL_KIND,URL))
            source=cur.fetchall()
            if len(source)!=1 or source[0][1].get("sha256")!=SHA:
                raise RuntimeError("ISSUER_ORIGINAL_ARCHIVE_RECORD_MISMATCH")
            # Reject numeric conflicts in any earlier issuer original in the
            # same quarter/scope before adding an alternative R5 observation.
            cur.execute("""SELECT period_end,metric_code,count(DISTINCT numeric_value)
                        FROM public.fundamental_observations
                        WHERE security_id=%s AND period_end IN ('2024-09-30','2024-12-31')
                        AND consolidation_scope='CONSOLIDATED'
                        AND metric_code=ANY(%s) AND evidence_status='AVAILABLE'
                        GROUP BY period_end,metric_code HAVING count(DISTINCT numeric_value)>1""",
                        (security_id,["NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"]))
            if cur.fetchall():raise RuntimeError("COMPETING_EARLIER_CONSOLIDATED_FACTS")
            original_facts=[]
            for end,start,earned,spent,profit,eps in PROOF:
                interest=Decimal(earned.replace(",",""))
                expense=Decimal(spent.replace(",",""))
                n=interest-expense
                if n<=0:raise RuntimeError("NII_NOT_POSITIVE")
                original_facts.append(dict(period_end=end,period_start=start,
                    basis="CONSOLIDATED",sourceOriginalSHA=SHA,
                    nIIOriginalEarned=earned,nIIOriginalExpended=spent,
                    NIIINRCrore=str(n/100),
                    profitOriginalLakh=profit,profitINRCrore=str(Decimal(profit.replace(",",""))/100),
                    epsDilutedOriginal=eps,
                    meaning="NII derived as interest earned less interest expended in same signed statement; PAT original line Net Profit for period; EPS diluted original"))
            payload=dict(contract="R5_FEDERAL_CONSOLIDATED_PREVIOUS_QUARTERS_V1",
                originalSourceRecordId=str(source[0][0]),
                originalR2SHA256=SHA,sourceUrl=URL,issuer=SYMBOL,isin=ISIN,
                periods=original_facts,scope="CONSOLIDATED",
                sourceReview="R5_COMPARISON_ONLY_NON_PIT",
                canonicalR4Changed=False)
            payload_bytes=compact(payload)
            cur.execute("""INSERT INTO public.data_source_records
              (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
              VALUES ('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s,
               '{"r5_only":true,"original_hash_checked":true,"canonical_r4_selection":"UNTOUCHED","publication_timestamp":"UNKNOWN"}'::jsonb)
              ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",
               (COMPARE_KIND,SYMBOL+":"+SHA,URL,sha(payload_bytes),Jsonb(payload)))
            entry=cur.fetchone()
            if entry:source_id=entry[0]
            else:
                cur.execute("SELECT id FROM public.data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND external_record_id=%s AND payload_hash=%s",
                (COMPARE_KIND,SYMBOL+":"+SHA,sha(payload_bytes)))
                row=cur.fetchone()
                if not row:raise RuntimeError("SOURCE_R5_NOT_READBACK")
                source_id=row[0]
            observation_ids={}
            for fact in original_facts:
                date=fact["period_end"];start=fact["period_start"]
                vals={"NET_INTEREST_INCOME_QUARTER":(fact["NIIINRCrore"],"INR_CRORE"),
                   "NET_PROFIT_QUARTER":(fact["profitINRCrore"],"INR_CRORE"),
                   "EPS_DILUTED":(fact["epsDilutedOriginal"],"INR_PER_SHARE")}
                saved={}
                for code,(value,unit) in vals.items():
                    cur.execute("""INSERT INTO public.fundamental_observations
                      (security_id,metric_code,source_record_id,source_code,numeric_value,
                       currency,unit,period_start,period_end,period_type,consolidation_scope,
                       retrieved_at,fresh_until,evidence_status)
                      VALUES (%s,%s,%s,'COMPANY_EXCHANGE_FILING',%s,
                       'INR',%s,%s,%s,'QUARTER','CONSOLIDATED',now(),
                       now()+interval '120 days','AVAILABLE')
                      ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,
                        consolidation_scope,source_record_id)
                      DO NOTHING RETURNING id""",
                      (security_id,code,source_id,Decimal(value),unit,start,date))
                    written=cur.fetchone()
                    if written:obs_id=written[0]
                    else:
                        cur.execute("""SELECT id,numeric_value,unit FROM public.fundamental_observations
                              WHERE security_id=%s AND metric_code=%s AND source_record_id=%s
                              AND period_end=%s AND consolidation_scope='CONSOLIDATED'""",
                             (security_id,code,source_id,date))
                        check=cur.fetchone()
                        if not check or Decimal(check[1])!=Decimal(value) or check[2]!=unit:
                            raise RuntimeError("QUALIFIED_FACT_REPLAY_CONFLICT")
                        obs_id=check[0]
                    saved[code]=str(obs_id)
                observation_ids[date]=saved
        db.commit()
    originals=[dict(symbol=SYMBOL,securityId=str(security_id),periodEnd=end,
        scope="CONSOLIDATED",sourceRecordId=str(source_id),
        observations=observation_ids[end],approval=APPROVAL) for end,*_ in PROOF]
    outfile="src/features/results/resultsR5FederalOriginalComparisonProof.json"
    with open(outfile,"w") as output:
        json.dump(dict(contract="R5_FEDERAL_SIGNED_ISSUER_ORIGINAL_TWO_QUARTERS_V1",
            environment="Development",sourceOriginalSHA256=SHA,
            originalR2Prefix=PREFIX,scope="CONSOLIDATED",
            approvedSources=originals),output,indent=2,sort_keys=True)
        output.write("\n")
    print("R5_FEDERAL_HISTORICAL_SOURCE_ADMISSION",json.dumps({
       "issuer":SYMBOL,"periods":[x[0] for x in PROOF],
       "admissibleOriginalSHA256":SHA,"verifiedComparisonTrioCount":len(originals),
       "R4CanonicalSelectionsModified":0,"financialProviderCalls":0,
       "review":"R5_ONLY_PREVIOUS_QUARTERS_NON_PIT"}))
if __name__=="__main__":main()
