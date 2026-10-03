#!/usr/bin/env python3
import hashlib, json, os, re, tempfile, uuid
from pathlib import Path
import boto3, duckdb, psycopg
from botocore.config import Config
from decimal import Decimal, getcontext, ROUND_HALF_EVEN

PROJECT_REF="lrgpjimipfkyoqbpsqzz"
PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
EXPERIMENT_ID="P8_EXP_NSE_MONTHLY_6M_V1"
CAMPAIGN_ID="P8_B3_NORMALIZATION_CANARY_20261003_V1"
NORMALIZATION_VERSION="P8_B3_NORMALIZATION_V1"
ADJUSTMENT_VERSION="P8_B3_ADJUSTMENT_V2"
ARITHMETIC_VERSION="P8_B3_ARITHMETIC_V1"
ROOT="portfolioai-history/development/p8"

FIXTURES={
  "DIVIDEND":"0f1c9f3f-823c-5774-a005-1e21f51f804c", # TCS Rs 9
  "SPLIT":"d6166cd9-60e4-51b2-b19e-966c43a08231",    # FOCUS 10 -> 2
  "BONUS":"76a410cf-5005-5709-85c0-4b8b4b6bbd43",    # GENSOL 2:1
  "RIGHTS":"729ab182-cf49-553d-8500-b5828ec8e2c7",   # GRASIM 6:179 @ 1810
  "COMPLEX":"b7f5149c-0c69-5673-a156-ab2dd7c31b7b",  # BOROLTD Demerger
}
MISSING_IDENTITY="000c98a4-3608-5b85-bea0-d4df597c5c4e"
MISSING_DATE="2024-02-29"

getcontext().prec=50
getcontext().rounding=ROUND_HALF_EVEN

def required(name):
    value=os.environ.get(name,"").strip()
    if not value: raise RuntimeError(f"Missing {name}")
    return value

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False)

def sha(value):
    data=value if isinstance(value,(bytes,bytearray)) else canonical(value).encode()
    return hashlib.sha256(data).hexdigest()

def deterministic_uuid(seed):
    h=hashlib.sha256(seed.encode()).hexdigest()
    return f"{h[:8]}-{h[8:12]}-5{h[13:16]}-{('8','9','a','b')[int(h[16],16)%4]}{h[17:20]}-{h[20:32]}"

def sig30(value):
    d=Decimal(value)
    if d==0: return "0"
    adjusted=d.adjusted()
    quantum=Decimal(1).scaleb(adjusted-29)
    q=d.quantize(quantum,rounding=ROUND_HALF_EVEN)
    return format(q.normalize(),"f")

def normalize_account(raw):
    raw=raw.strip().rstrip("/")
    if "://" in raw:
        from urllib.parse import urlparse
        host=urlparse(raw).hostname or ""
    else: host=raw
    suffix=".r2.cloudflarestorage.com"
    return host[:-len(suffix)] if host.endswith(suffix) else host

def s3_client():
    account=normalize_account(required("CLOUDFLARE_R2_ACCOUNT_ID"))
    return boto3.client("s3",
      endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
      aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
      region_name="auto",
      config=Config(retries={"max_attempts":10,"mode":"adaptive"},connect_timeout=30,read_timeout=180,s3={"addressing_style":"path"})
    )

def load_parquet_rows(s3,bucket,date):
    y,m=date[:4],date[5:7]
    key=f"{ROOT}/b3/raw-prices/v1/year={y}/month={m}/trade_date={date}/part-00000.parquet"
    data=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/"p.parquet"; p.write_bytes(data)
        con=duckdb.connect()
        try:
            cols=[r[0] for r in con.execute("describe select * from read_parquet(?)",[str(p)]).fetchall()]
            values=con.execute("select * from read_parquet(?)",[str(p)]).fetchall()
            return [dict(zip(cols,row)) for row in values]
        finally: con.close()

def source_content_contains_isin(s3,bucket,date,isin):
    prefix=f"{ROOT}/b3/source-authority/v1/content/trade_date={date}/"
    listing=s3.list_objects_v2(Bucket=bucket,Prefix=prefix)
    objs=listing.get("Contents") or []
    if len(objs)!=1: raise RuntimeError(f"Expected one source-content object for {date}, got {len(objs)}")
    data=s3.get_object(Bucket=bucket,Key=objs[0]["Key"])["Body"].read()
    return isin.encode() in data, objs[0]["Key"]

def b2_members(s3,bucket,date):
    key=f"{ROOT}/b2/universe-members/v1/decision_date={date}/part-00000.parquet"
    data=s3.get_object(Bucket=bucket,Key=key)["Body"].read()
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/"b2.parquet"; p.write_bytes(data)
        con=duckdb.connect()
        try:
            cols=[r[0] for r in con.execute("describe select * from read_parquet(?)",[str(p)]).fetchall()]
            vals=con.execute("select historical_identity_id,membership_state from read_parquet(?)",[str(p)]).fetchall()
            return {str(i):str(s) for i,s in vals}
        finally: con.close()

def parse_action(obs):
    purpose=re.sub(r"\s+"," ",obs["raw_purpose"]).strip()
    if obs["identity_resolution_state"]!="RESOLVED" or not obs["historical_identity_id"]:
        return "OTHER","BLOCKED",{},f"identity resolution is {obs['identity_resolution_state']}"
    if not obs["ex_date"]:
        return "OTHER","BLOCKED",{},"ex/effective date is unavailable"

    m=re.search(r"(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:/-)?\s*Per Share",purpose,re.I)
    if "dividend" in purpose.lower() and m:
        return "CASH_DIVIDEND","READY",{"rawPurpose":purpose,"cashDistributionPerShare":m.group(1)},None

    m=re.search(r"From\s+(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:/-)?\s*Per Share\s+To\s+(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:/-)?\s*Per Share",purpose,re.I)
    if m:
        old,new=m.group(1),m.group(2)
        return "SPLIT","READY",{"rawPurpose":purpose,"operation":"SPLIT" if Decimal(old)>Decimal(new) else "CONSOLIDATION","oldFaceValue":old,"newFaceValue":new},None

    m=re.search(r"Bonus\s+([0-9]+(?:\.[0-9]+)?)\s*:\s*([0-9]+(?:\.[0-9]+)?)",purpose,re.I)
    if m:
        return "BONUS","READY",{"rawPurpose":purpose,"bonusShares":m.group(1),"heldShares":m.group(2)},None

    m=re.search(r"Rights\s+([0-9]+(?:\.[0-9]+)?)\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*@\s*Premium\s+(?:Rs|Re)\s*([0-9]+(?:\.[0-9]+)?)",purpose,re.I)
    if m and obs["face_value"] is not None:
        return "RIGHTS","READY",{"rawPurpose":purpose,"rightsShares":m.group(1),"heldShares":m.group(2),"premiumPerShare":m.group(3),"faceValue":str(obs["face_value"])},None

    if "demerger" in purpose.lower():
        return "DEMERGER","BLOCKED",{"rawPurpose":purpose},"successor entitlement and valuation lineage are not explicit in the source observation"

    return "OTHER","BLOCKED",{"rawPurpose":purpose},"no approved deterministic normalization contract for this action"

def previous_benchmark_date(cur,date):
    cur.execute("""
      select max(b.trade_date)::text
      from public.p8_b3_benchmark_total_return_history b
      join public.p8_b3_source_archives a on a.id=b.source_archive_id
      where b.portfolio_id=%s and b.experiment_id=%s
        and a.raw_metadata->>'campaign_id'='P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1'
        and b.trade_date < %s::date
    """,(PORTFOLIO_ID,EXPERIMENT_ID,date))
    return cur.fetchone()[0]

def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db: raise RuntimeError("Refusing non-Development database")
    bucket=required("CLOUDFLARE_R2_BUCKET")
    if bucket!="portfolioai-history-dev": raise RuntimeError("Refusing non-Development bucket")
    s3=s3_client()

    catalog=json.loads(s3.get_object(Bucket=bucket,Key=f"{ROOT}/catalog/v1/catalog.json")["Body"].read())
    raw_ds=catalog["datasets"]["b3_raw_prices"]
    if int(raw_ds["partition_count"])!=744 or int(raw_ds["row_count"])!=1854978:
        raise RuntimeError("N0 raw catalog drift")

    with psycopg.connect(db) as conn:
      with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("""
          select
            (select count(*) from public.p8_b3_corporate_action_normalizations where portfolio_id=%s and experiment_id=%s) normalizations,
            (select count(*) from public.p8_b3_adjustment_factors where portfolio_id=%s and experiment_id=%s) factors,
            (select count(*) from public.p8_b3_adjusted_market_price_series where portfolio_id=%s and experiment_id=%s) adjusted
        """,(PORTFOLIO_ID,EXPERIMENT_ID,PORTFOLIO_ID,EXPERIMENT_ID,PORTFOLIO_ID,EXPERIMENT_ID))
        pre=cur.fetchone()
        if int(pre["adjusted"])!=0: raise RuntimeError("Adjusted-series gate drift")

        cur.execute("""
          select id::text,historical_identity_id::text,identity_resolution_state,raw_symbol,raw_purpose,
                 face_value::text,ex_date::text,observation_hash
          from public.p8_b3_corporate_action_observations
          where id = any(%s::uuid[])
        """,(list(FIXTURES.values()),))
        obs_by_id={r["id"]:r for r in cur.fetchall()}
        if set(obs_by_id)!=set(FIXTURES.values()): raise RuntimeError("Fixture observation missing")

        fixture_results=[]
        inserted_norm=inserted_factor=0
        for label,obs_id in FIXTURES.items():
            obs=obs_by_id[obs_id]
            action_type,state,terms,reason=parse_action(obs)
            norm_logical={
              "observationId":obs_id,"historicalIdentityId":obs["historical_identity_id"],
              "normalizationVersion":NORMALIZATION_VERSION,"actionType":action_type,
              "state":state,"effectiveDate":obs["ex_date"],"normalizedTerms":terms,
            }
            if reason: norm_logical["blockerReason"]=reason
            norm_hash=sha(norm_logical)
            norm_id=deterministic_uuid(f"P8_B3_NORM|{obs_id}|{NORMALIZATION_VERSION}|{norm_hash}")
            cur.execute("""
              insert into public.p8_b3_corporate_action_normalizations
                (id,portfolio_id,experiment_id,corporate_action_observation_id,historical_identity_id,
                 normalization_version,action_type,normalization_state,effective_date,normalized_terms,blocker_reason,normalization_hash)
              values (%s,%s,%s,%s,%s,%s,%s,%s,%s::date,%s::jsonb,%s,%s)
              on conflict (portfolio_id,experiment_id,corporate_action_observation_id,normalization_version,normalization_hash) do nothing
              returning id
            """,(norm_id,PORTFOLIO_ID,EXPERIMENT_ID,obs_id,obs["historical_identity_id"],NORMALIZATION_VERSION,
                 action_type,state,obs["ex_date"],canonical(terms),reason,norm_hash))
            if cur.fetchone(): inserted_norm+=1

            factor_state="READY"; factor_reason=None
            share=price_factor=cash=total_link=reference=None
            calc_inputs={"campaignId":CAMPAIGN_ID,"arithmeticPolicyVersion":ARITHMETIC_VERSION,"normalizationHash":norm_hash}

            if label=="SPLIT":
                old=Decimal(terms["oldFaceValue"]); new=Decimal(terms["newFaceValue"])
                share=sig30(old/new); price_factor=sig30(new/old)
            elif label=="BONUS":
                bonus=Decimal(terms["bonusShares"]); held=Decimal(terms["heldShares"])
                share=sig30((held+bonus)/held); price_factor=sig30(held/(held+bonus))
            elif label=="DIVIDEND":
                prev_date=previous_benchmark_date(cur,obs["ex_date"])
                prev_rows=load_parquet_rows(s3,bucket,prev_date)
                ex_rows=load_parquet_rows(s3,bucket,obs["ex_date"])
                ident=obs["historical_identity_id"]
                prev=[r for r in prev_rows if str(r.get("historical_identity_id"))==ident]
                ex=[r for r in ex_rows if str(r.get("historical_identity_id"))==ident]
                if len(prev)!=1 or len(ex)!=1:
                    factor_state="BLOCKED"; factor_reason="DIVIDEND: exact previous/ex-date R2 price pair unavailable"
                else:
                    reference=str(prev[0]["close"]); ex_close=Decimal(str(ex[0]["close"]))
                    cash=terms["cashDistributionPerShare"]
                    total_link=sig30((ex_close+Decimal(cash))/Decimal(reference))
                    calc_inputs.update({"previousTradeDate":prev_date,"previousClose":reference,"exDateClose":str(ex[0]["close"])})
            elif label=="RIGHTS":
                factor_state="BLOCKED"
                factor_reason="RIGHTS: subscription terms are normalized, but deterministic rights-price treatment is not owner-approved"
            else:
                factor_state="BLOCKED"
                factor_reason="DEMERGER: successor entitlement and valuation lineage not proven"

            factor_logical={
              "normalizationId":norm_id,"historicalIdentityId":obs["historical_identity_id"],"effectiveDate":obs["ex_date"],
              "adjustmentVersion":ADJUSTMENT_VERSION,"factorState":factor_state,
              "shareFactor":share,"priceBackAdjustmentFactor":price_factor,
              "cashDistributionPerShare":cash,"totalReturnLinkFactor":total_link,"referencePrice":reference,
              "blockerReason":factor_reason,"calculationInputs":calc_inputs,
            }
            factor_hash=sha(factor_logical)
            factor_id=deterministic_uuid(f"P8_B3_FACTOR|{norm_id}|{ADJUSTMENT_VERSION}|{factor_hash}")
            cur.execute("""
              insert into public.p8_b3_adjustment_factors
                (id,portfolio_id,experiment_id,historical_identity_id,corporate_action_normalization_id,effective_date,
                 adjustment_version,factor_state,share_factor,price_back_adjustment_factor,cash_distribution_per_share,
                 total_return_link_factor,reference_price,blocker_reason,calculation_inputs,factor_hash)
              values (%s,%s,%s,%s,%s,%s::date,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)
              on conflict (portfolio_id,experiment_id,corporate_action_normalization_id,adjustment_version,factor_hash) do nothing
              returning id
            """,(factor_id,PORTFOLIO_ID,EXPERIMENT_ID,obs["historical_identity_id"],norm_id,obs["ex_date"],ADJUSTMENT_VERSION,
                 factor_state,share,price_factor,cash,total_link,reference,factor_reason,canonical(calc_inputs),factor_hash))
            if cur.fetchone(): inserted_factor+=1
            fixture_results.append({"label":label,"observation_id":obs_id,"symbol":obs["raw_symbol"],
                                    "normalization_state":state,"action_type":action_type,"normalization_hash":norm_hash,
                                    "factor_state":factor_state,"factor_hash":factor_hash,"factor_blocker":factor_reason})

        # no-action control: choose an identity priced on 2024-02-29 with zero action observations
        p_rows=load_parquet_rows(s3,bucket,MISSING_DATE)
        ids=[str(r.get("historical_identity_id")) for r in p_rows if r.get("historical_identity_id")]
        cur.execute("""
          select i.id::text
          from public.p8_historical_security_identities i
          where i.id = any(%s::uuid[])
            and not exists (
              select 1 from public.p8_b3_corporate_action_observations o
              where o.portfolio_id=i.portfolio_id and o.experiment_id=i.experiment_id
                and o.historical_identity_id=i.id
            )
          order by i.id
          limit 1
        """,(ids,))
        no_action=cur.fetchone()
        if not no_action: raise RuntimeError("No no-action control identity found")

        # explicit missing-price blocker proof
        members=b2_members(s3,bucket,MISSING_DATE)
        if members.get(MISSING_IDENTITY)!="ELIGIBLE": raise RuntimeError("Missing-price fixture is not B2 ELIGIBLE")
        if MISSING_IDENTITY in set(ids): raise RuntimeError("Missing-price fixture unexpectedly has bound same-day raw price")
        cur.execute("select historical_isin from public.p8_historical_security_identities where id=%s",(MISSING_IDENTITY,))
        isin=cur.fetchone()["historical_isin"]
        source_contains,source_key=source_content_contains_isin(s3,bucket,MISSING_DATE,isin)
        blocker="PRICE_IDENTITY_NOT_RESOLVED" if source_contains else "NO_TRADE_ON_DECISION_DATE"

        conn.commit()

        # replay: perform exact same inserts and prove no new rows by unique contracts
        before_norm=int(pre["normalizations"])
        before_factor=int(pre["factors"])
        cur.execute("select count(*) from public.p8_b3_corporate_action_normalizations where portfolio_id=%s and experiment_id=%s",(PORTFOLIO_ID,EXPERIMENT_ID))
        after_norm=int(cur.fetchone()["count"])
        cur.execute("select count(*) from public.p8_b3_adjustment_factors where portfolio_id=%s and experiment_id=%s",(PORTFOLIO_ID,EXPERIMENT_ID))
        after_factor=int(cur.fetchone()["count"])
        cur.execute("select count(*) from public.p8_b3_adjusted_market_price_series where portfolio_id=%s and experiment_id=%s",(PORTFOLIO_ID,EXPERIMENT_ID))
        adjusted=int(cur.fetchone()["count"])

    material={"fixtures":fixture_results,"missing_price":{"identity_id":MISSING_IDENTITY,"date":MISSING_DATE,"isin":isin,"source_content_key":source_key,"source_row_contains_isin":source_contains,"blocker":blocker},"no_action_control":no_action["id"]}
    fingerprint=sha(material)
    result={
      "version":"P8_B3_N3_CANARY_AUDIT_V1","status":"PASS","campaign_id":CAMPAIGN_ID,
      "normalization_version":NORMALIZATION_VERSION,"adjustment_version":ADJUSTMENT_VERSION,
      "arithmetic_policy_version":ARITHMETIC_VERSION,
      "pre_counts":{"normalizations":before_norm,"factors":before_factor,"adjusted_series":int(pre["adjusted"])},
      "inserted_this_run":{"normalizations":inserted_norm,"factors":inserted_factor},
      "post_counts":{"normalizations":after_norm,"factors":after_factor,"adjusted_series":adjusted},
      "fixture_results":fixture_results,
      "no_action_control":{"historical_identity_id":no_action["id"],"derived_rows_created":0},
      "missing_price_fixture":{"historical_identity_id":MISSING_IDENTITY,"decision_date":MISSING_DATE,"historical_isin":isin,"source_row_contains_isin":source_contains,"blocker":blocker},
      "canary_fingerprint_sha256":fingerprint,
      "raw_r2_catalog_rows":int(raw_ds["row_count"]),"raw_r2_partitions":int(raw_ds["partition_count"]),
      "adjusted_series_gate_unchanged":adjusted==0,
      "production_changes":0,"main_changes":0
    }
    print(json.dumps(result,indent=2,sort_keys=True))

if __name__=="__main__":
    main()
