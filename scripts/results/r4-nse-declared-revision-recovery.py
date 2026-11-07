#!/usr/bin/env python3
"""Attempt all unselected current-source conflicts against explicit NSE revisions."""
import importlib.util,json,os
from pathlib import Path
from collections import defaultdict,Counter
from datetime import datetime,timezone
from urllib.parse import urlencode
import requests,psycopg
from psycopg.rows import dict_row
from r4_nse_catalog_revision import (CONTRACT,KIND,BASE,PERIODS,CORE,PREFIX,BUCKET,
    SOURCE_CONTRACTS,origin,scope,catalog_group,parse_original,validate_proof,ref,canonical,sha)

REF='lrgpjimipfkyoqbpsqzz';PORTFOLIO='6193a4aa-3235-4057-bddc-209fcf443fc2'
HERE=Path(__file__).parent
spec=importlib.util.spec_from_file_location('batch',HERE/'r4-bse-historical-batch.py')
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)


def candidate_sources(db):
    with db.cursor() as cur:
        cur.execute("""WITH cohort AS (
          SELECT DISTINCT s.id,s.symbol,s.isin FROM transactions t JOIN securities s ON s.id=t.security_id
          WHERE t.portfolio_id=%s AND t.superseded_at IS NULL AND s.asset_class='EQUITY'),
        eligible AS (
          SELECT o.*,c.symbol,c.isin FROM fundamental_observations o JOIN cohort c ON c.id=o.security_id
          WHERE o.source_code='COMPANY_EXCHANGE_FILING' AND o.period_type='QUARTER'
            AND o.period_end=ANY(%s::date[]) AND o.metric_code=ANY(%s::text[])
            AND o.numeric_value IS NOT NULL AND o.currency='INR' AND o.evidence_status='AVAILABLE'
            AND o.unit=CASE WHEN o.metric_code='EPS_DILUTED' THEN 'INR_PER_SHARE' ELSE 'INR_CRORE' END
            AND o.consolidation_scope IN ('STANDALONE','CONSOLIDATED')
            AND NOT EXISTS(SELECT 1 FROM fundamental_observation_decisions d WHERE d.security_id=o.security_id
              AND d.period_type='QUARTER' AND d.period_end=o.period_end
              AND d.metric_code IN ('OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'))),
        conflicts AS (
          SELECT security_id,period_end,consolidation_scope FROM eligible GROUP BY 1,2,3,metric_code
          HAVING count(DISTINCT numeric_value)>1)
        SELECT DISTINCT o.security_id::text,o.symbol,o.isin,o.period_end::text,o.consolidation_scope,
          r.id::text source_record_id,r.source_url,r.raw_payload->>'contract' source_contract,
          r.raw_payload->>'original_sha256_unretained' original_hash,
          r.raw_payload->'raw_nse_bytes_retained' original_bytes_previously_retained,
          r.raw_payload->'facts' stored_facts
        FROM eligible o JOIN conflicts c USING(security_id,period_end,consolidation_scope)
          JOIN data_source_records r ON r.id=o.source_record_id
        ORDER BY o.symbol,o.period_end::text,o.consolidation_scope,r.id::text""",(PORTFOLIO,sorted(PERIODS),sorted(CORE)))
        rows=cur.fetchall()
    db.rollback();groups=defaultdict(list)
    for row in rows:groups[(row['security_id'],row['symbol'],row['isin'],row['period_end'],row['consolidation_scope'])].append(row)
    return groups


def main():
    url=os.environ['SUPABASE_DB_URL']
    if (os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI'
        or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development'
        or REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=BUCKET):raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();session=requests.Session();session.headers.update({'User-Agent':'Mozilla/5.0','Referer':'https://www.nseindia.com/companies-listing/corporate-integrated-filing'})
    cache={};counts=Counter();all_errors=Counter();asof=datetime.now(timezone.utc).isoformat()
    def fetch(url,catalog=False):
        if not catalog and not origin(url):raise ValueError('NSE_REVISION_DOWNLOAD_ORIGIN_UNPROVEN')
        if url in cache:
            if isinstance(cache[url],Exception):raise cache[url]
            return cache[url]
        try:
            response=session.get(url,timeout=(15,45),allow_redirects=False,stream=True);response.raise_for_status()
            if response.status_code!=200:raise ValueError('NSE_REVISION_ORIGINAL_REDIRECT_UNPROVEN')
            size=0;parts=[]
            for part in response.iter_content(65536):
                size+=len(part)
                if size>5_000_000:raise ValueError('NSE_REVISION_DOWNLOAD_SIZE_BOUND')
                parts.append(part)
            raw=b''.join(parts);cache[url]=raw;return raw
        except Exception as error:cache[url]=error;raise
    def retain(raw,kind):
        reference=ref(raw,kind);batch.immutable_put(client,reference['r2_key'],raw);return reference
    with psycopg.connect(url,row_factory=dict_row) as db:
        cases=candidate_sources(db)
        for (sid,symbol,isin,period,report_scope),sources in cases.items():
            counts['cases_attempted']+=1;outcome={'symbol':symbol,'security_id':sid,'period_end':period,'scope':report_scope,'status':'REVIEW_REQUIRED'}
            try:
                if any(s['source_contract'] not in SOURCE_CONTRACTS or not s['original_hash'] for s in sources):raise ValueError('NSE_REVISION_EXISTING_SOURCE_CONTRACT_UNSUPPORTED')
                catalog_url=BASE+'?'+urlencode({'index':'equities','symbol':symbol,'type':'Integrated Filing- Financials','page':1,'size':100,'from_date':'01-01-2025','to_date':datetime.fromisoformat(asof).strftime('%d-%m-%Y')})
                raw=fetch(catalog_url,True);data=json.loads(raw);rows=data if isinstance(data,list) else data.get('data',data.get('records',[]))
                if isinstance(rows,dict):rows=rows.get('data',[])
                target=datetime.strptime(period,'%Y-%m-%d').strftime('%d-%b-%Y').upper()
                legal={r['cmName'] for r in rows if r.get('symbol')==symbol and r.get('qe_Date','').upper()==target and scope(r.get('consolidated'))==report_scope}
                if len(legal)!=1:raise ValueError('NSE_REVISION_OFFICIAL_LEGAL_NAME_UNPROVEN')
                proof={'contract':CONTRACT,'security_id':sid,'symbol':symbol,'isin':isin,'period_end':period,
                    'scope':report_scope,'issuer_name':legal.pop(),'catalog_url':catalog_url,'captured_at_utc':asof,
                    'catalog':retain(raw,'catalog'),'revised_originals':{},'source_records':[]}
                chain,latest=catalog_group(raw,proof)
                for name,kind in [('xbrl','xml'),('ixbrl','html')]:
                    original=fetch(latest[name]);proof['revised_originals'][name]={**retain(original,kind),'source_url':latest[name]}
                for source in sources:
                    original=fetch(source['source_url'])
                    same=sha(original)==source['original_hash']
                    if not same and source['original_bytes_previously_retained'] is not False:
                        raise ValueError('NSE_REVISION_EXISTING_ORIGINAL_VERSION_CHANGED')
                    vector=parse_original(original,source['source_url'],proof)
                    from decimal import Decimal
                    recorded={k:Decimal(str(source['stored_facts'][k]['value'])) for k in CORE}
                    if (recorded!=vector or any(source['stored_facts'][k]['unit']!=('INR_PER_SHARE' if k=='EPS_DILUTED' else 'INR_CRORE') for k in CORE)):
                        raise ValueError('NSE_REVISION_RECAPTURED_CANONICAL_FINANCIAL_TRIO_CHANGED')
                    kind='xml' if source['source_url'].lower().endswith('.xml') else 'html'
                    proof['source_records'].append({'source_record_id':source['source_record_id'],'source_url':source['source_url'],
                        'source_contract':source['source_contract'],'recorded_original_sha256':source['original_hash'],
                        'original_bytes_previously_retained':source['original_bytes_previously_retained'],
                        'snapshot_basis':'EXACT_ORIGINAL_BYTES' if same else 'FRESH_EXCHANGE_RENDITION_FINANCIAL_TRIO_REPLAY',**retain(original,kind)})
                vectors,old,new,remark=validate_proof(proof,client)
                reference=retain(canonical(proof),'proof')
                index={'contract':CONTRACT,'security_id':sid,'symbol':symbol,'isin':isin,'period_end':period,'scope':report_scope,'proof':reference}
                encoded=canonical(index)
                with db.cursor() as cur:
                    cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
                      VALUES('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s::jsonb,'{"retention":"PRIVATE_R2_ORIGINAL_REVISION_PROOF; INDEPENDENT_SELECTION_REQUIRED"}'::jsonb)
                      ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",
                      (KIND,sid+':'+period+':'+report_scope,catalog_url,sha(encoded),encoded.decode()))
                db.commit();counts['proofs_retained']+=1;outcome.update(status='ORIGINAL_PROOF_RETAINED',superseded_source_versions=len(old),revised_source_versions=len(new))
            except Exception as error:
                db.rollback();reason=str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__;all_errors[reason]+=1;outcome['reason']=reason
            outcome.update(workflow_run_id=os.getenv('GITHUB_RUN_ID'),source_commit=os.getenv('GITHUB_SHA'))
            retain(canonical(outcome),'proof')
            print('R4_NSE_DECLARED_REVISION_PROGRESS',json.dumps({**dict(counts),'rejections':dict(all_errors)}),flush=True)
    print('R4_NSE_DECLARED_REVISION_FINAL',json.dumps({**dict(counts),'rejections':dict(all_errors)}),flush=True)

if __name__=='__main__':main()
