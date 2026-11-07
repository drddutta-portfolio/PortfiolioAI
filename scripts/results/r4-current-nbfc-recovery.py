#!/usr/bin/env python3
"""Attempt every missing current quarter against official NBFC XML originals."""
import os,json,importlib.util
from pathlib import Path
from datetime import datetime,timezone
from decimal import Decimal
from collections import defaultdict,Counter
from urllib.parse import urlencode
import requests,psycopg
from r4_current_gap_discovery import pending_current
from r4_current_nbfc_original import CONTRACT,KIND,PREFIX,BUCKET,PERIODS,origin,extract
from r4_nse_catalog_revision import BASE,scope,canonical,sha

spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    url=os.environ['SUPABASE_DB_URL']
    if (batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=BUCKET
        or os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI'
        or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development'):raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();session=requests.Session();session.headers.update({'User-Agent':'Mozilla/5.0','Referer':'https://www.nseindia.com/companies-listing/corporate-integrated-filing'})
    counts=Counter();rejects=Counter();captured=datetime.now(timezone.utc)
    def get(source_url):
        response=session.get(source_url,timeout=(15,45),allow_redirects=False);response.raise_for_status()
        if response.status_code!=200 or len(response.content)>5_000_000:raise ValueError('CURRENT_NBFC_SOURCE_RESPONSE_UNPROVEN')
        return response.content
    with psycopg.connect(url) as db:
        rows=pending_current(db,batch);groups={}
        for sid,symbol,isin,period,_provider in rows:groups.setdefault((sid,symbol,isin),set()).add(period)
        for (sid,symbol,isin),periods in groups.items():
            try:
                catalog_url=BASE+'?'+urlencode({'index':'equities','symbol':symbol,'type':'Integrated Filing- Financials','page':1,'size':100,'from_date':'01-01-2025','to_date':captured.strftime('%d-%m-%Y')})
                raw_catalog=get(catalog_url);data=json.loads(raw_catalog);catalog=data if isinstance(data,list) else data.get('data',data.get('records',[]))
                if isinstance(catalog,dict):catalog=catalog.get('data',[])
                if not isinstance(catalog,list) or len(catalog)>=100:raise ValueError('CURRENT_NBFC_CATALOG_COMPLETENESS_UNPROVEN')
                ck=PREFIX+'current-nbfc-catalog/sha256='+sha(raw_catalog)+'/response.json';batch.immutable_put(client,ck,raw_catalog)
                for row in catalog:
                    if row.get('symbol')!=symbol:continue
                    try:period=datetime.strptime(row.get('qe_Date',''),'%d-%b-%Y').date().isoformat()
                    except ValueError:continue
                    if period not in periods or not origin(row.get('xbrl','')):continue
                    counts['originals_attempted']+=1
                    try:
                        source_url=row['xbrl'];raw=get(source_url);sc=scope(row.get('consolidated'));legal=row.get('cmName','')
                        facts=extract(raw,symbol,isin,period,sc,legal);digest=sha(raw);original_key=PREFIX+'evidence/original_version='+digest+'/original-xbrl.xml';batch.immutable_put(client,original_key,raw)
                        manifest={'contract':CONTRACT,'security_id':str(sid),'symbol':symbol,'isin':isin,'issuer_name':legal,
                            'period_start':PERIODS[period],'period_end':period,'consolidation_scope':sc,'reporting_currency':'INR',
                            'issuer_filing_url':source_url,'original_sha256_retained':digest,'original_r2_key':original_key,
                            'raw_nse_bytes_retained':True,'original_xbrl_retained':True,'facts':facts,
                            'catalog_reference':{'source_url':catalog_url,'sha256':sha(raw_catalog),'r2_key':ck},
                            'authority':'CURRENT_DISPLAY_ONLY; NO_SHARE_REBASING_OR_HISTORICAL_PIT_AUTHORITY'}
                        encoded=canonical(manifest);mh=sha(encoded);key=PREFIX+'security_id='+isin+'/period_end='+period+'/source_version='+mh+'/manifest.json';batch.immutable_put(client,key,encoded)
                        payload={**manifest,'r2_key':key,'r2_manifest_sha256':mh};body=canonical(payload);ph=sha(body)
                        with db.cursor() as cur:
                            cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
                              VALUES('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s::jsonb,'{"retention":"ORIGINAL_NSE_XML_PRIVATE_R2; INDEPENDENT_SELECTION_REQUIRED"}'::jsonb)
                              ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",(KIND,symbol+':'+period+':'+sc+':'+digest,source_url,ph,body.decode()))
                            saved=cur.fetchone()
                            if saved:source_id=saved[0]
                            else:
                                cur.execute("SELECT id FROM data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND external_record_id=%s AND payload_hash=%s",(KIND,symbol+':'+period+':'+sc+':'+digest,ph));source_id=cur.fetchone()[0]
                            for metric,f in facts.items():
                                cur.execute("""INSERT INTO fundamental_observations(security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
                                  VALUES(%s,%s,%s,'COMPANY_EXCHANGE_FILING',%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
                                  ON CONFLICT(security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING RETURNING id""",(sid,metric,source_id,Decimal(f['value']),f['unit'],PERIODS[period],period,sc))
                                if cur.fetchone():counts['observations_inserted']+=1
                        db.commit();counts['source_trios_retained']+=1
                    except Exception as error:db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
            except Exception as error:db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
            counts['issuers_checked']+=1;print('R4_CURRENT_NBFC_PROGRESS',json.dumps({**dict(counts),'rejections':dict(rejects)}),flush=True)
    print('R4_CURRENT_NBFC_FINAL',json.dumps({**dict(counts),'rejections':dict(rejects)}),flush=True)

if __name__=='__main__':main()
