#!/usr/bin/env python3
"""Explicit, audited standalone-to-consolidated BHARTIARTL selection correction.

Original financial observations are immutable and preserved. Only the three
December 2025 selection rows change, atomically, after paired NSE originals agree.
"""
import importlib.util,json,os
from pathlib import Path
from decimal import Decimal
import requests,psycopg
from psycopg.rows import dict_row
from r4_dated_columns import parse_html,extract_tables
from r4_nse_catalog_revision import xml_trio,canonical,sha
from r4_scope_catalog import list_filings

HERE=Path(__file__).parent
spec=importlib.util.spec_from_file_location('public_filing',HERE/'r3-live-public-filing-batch.py');public=importlib.util.module_from_spec(spec);spec.loader.exec_module(public)
SYMBOL='BHARTIARTL';ISIN='INE397D01024';PERIOD='2025-12-31';START='2025-10-01'
OLD_SOURCE='b5928597-5290-4f43-9286-3e917a7aab1c'
CORE={'OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'}
OLD_VALUES={'OPERATING_REVENUE_QUARTER':Decimal('30854.8'),'NET_PROFIT_QUARTER':Decimal('4090.7'),'EPS_DILUTED':Decimal('6.8')}

def validate_pair(html,xml):
    parsed=extract_tables(parse_html(html.decode('utf-8-sig'))[1],SYMBOL,ISIN,PERIOD)
    if parsed['scope']!='CONSOLIDATED' or parsed['period_start']!=START or set(parsed['facts'])!=CORE:raise ValueError('EXACT_CONSOLIDATED_QUARTER_REQUIRED')
    values=xml_trio(xml,{'symbol':SYMBOL,'isin':ISIN,'period_end':PERIOD,'scope':'CONSOLIDATED','issuer_name':'Bharti Airtel Limited'})
    if set(values)!=CORE or any(Decimal(parsed['facts'][k]['value'])!=values[k] for k in CORE):raise ValueError('PAIRED_ORIGINALS_DISAGREE')
    legacy,error=public.extract(html.decode('utf-8-sig'),SYMBOL,ISIN)
    if error or legacy['scope']!='CONSOLIDATED' or legacy['period_end']!=PERIOD or legacy['period_start']!=START or set(legacy['facts'])!=CORE or any(Decimal(legacy['facts'][k]['value'])!=values[k] for k in CORE):raise ValueError('CANONICAL_INGESTION_PARSER_DISAGREES')
    return legacy

def check_prior(rows,new_source):
    if len(rows)!=3 or {r['metric_code'] for r in rows}!=CORE:raise ValueError('EXISTING_SELECTION_NOT_EXACTLY_ONE_CORE_TRIO')
    if all(r['consolidation_scope']=='CONSOLIDATED' and str(r['source_record_id'])==new_source for r in rows):return 'ALREADY_REPAIRED'
    if any(r['consolidation_scope']!='STANDALONE' or str(r['source_record_id'])!=OLD_SOURCE or Decimal(str(r['numeric_value']))!=OLD_VALUES[r['metric_code']] for r in rows):raise ValueError('PRIOR_SELECTION_CHANGED_REVIEW_REQUIRED')
    return 'REPAIR_REQUIRED'

def get(session,url):
    if not url.startswith('https://nsearchives.nseindia.com/corporate/'):raise ValueError('OFFICIAL_ARCHIVE_URL_REQUIRED')
    r=session.get(url,timeout=(15,40),allow_redirects=False);r.raise_for_status()
    if r.status_code!=200 or not 1<=len(r.content)<=5_000_000:raise ValueError('SOURCE_RESPONSE_UNPROVEN')
    return r.content

def main():
    dburl=os.environ['SUPABASE_DB_URL']
    if public.PROJECT_REF not in dburl or os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI' or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development' or os.environ.get('CLOUDFLARE_R2_BUCKET')!=public.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    client=public.r2_client();client.head_bucket(Bucket=public.BUCKET)
    with requests.Session() as session:
        catalog=list_filings(session,SYMBOL)
        matches=[r for r in catalog if r.get('qe_Date','').upper()=='31-DEC-2025' and r.get('consolidated')=='Consolidated' and r.get('type_Sub')=='Original']
        if len(matches)!=1 or any(r.get('qe_Date','').upper()=='31-DEC-2025' and r.get('consolidated')=='Consolidated' and r.get('type_Sub')=='Revision' for r in catalog):raise ValueError('UNAMBIGUOUS_ORIGINAL_CATALOG_ENTRY_REQUIRED')
        row=matches[0];html=get(session,row['ixbrl']);xml=get(session,row['xbrl']);parsed=validate_pair(html,xml)
    # The existing financial record is a compact HTML contract. Its HTML bytes
    # remain unretained; a separately retained XML original backs this correction.
    xmlkey=public.R2_PREFIX+'bharti-scope-repair/sha256='+sha(xml)+'/original.xml';public.put_immutable(client,xml,xmlkey)
    retained=client.get_object(Bucket=public.BUCKET,Key=xmlkey)['Body'].read()
    if sha(retained)!=sha(xml):raise ValueError('RETAINED_XML_READBACK_MISMATCH')
    validate_pair(html,retained)
    catraw=canonical(catalog);catkey=public.R2_PREFIX+'bharti-scope-repair/sha256='+sha(catraw)+'/catalog.json';public.put_immutable(client,catraw,catkey)
    with psycopg.connect(dburl) as db:
        public.persist(db,client,parsed,row['ixbrl'],sha(html))
        with db.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT id::text FROM securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'",(SYMBOL,ISIN));security=cur.fetchone()
            if not security:raise ValueError('CANONICAL_ISSUER_REQUIRED')
            sid=security['id']
            cur.execute("SELECT id::text FROM data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND external_record_id=%s",(public.KIND,SYMBOL+':'+sha(html)));sources=cur.fetchall()
            if len(sources)!=1:raise ValueError('NEW_SOURCE_NOT_UNIQUE')
            source=sources[0]['id']
            cur.execute("SELECT id::text,metric_code,numeric_value,unit,consolidation_scope FROM fundamental_observations WHERE source_record_id=%s AND security_id=%s AND period_end=%s AND period_start=%s AND period_type='QUARTER'",(source,sid,PERIOD,START));fresh=cur.fetchall()
            if len(fresh)!=3 or {r['metric_code'] for r in fresh}!=CORE or any(r['consolidation_scope']!='CONSOLIDATED' or r['unit']!=parsed['facts'][r['metric_code']]['unit'] or Decimal(r['numeric_value'])!=Decimal(parsed['facts'][r['metric_code']]['value']) for r in fresh):raise ValueError('NEW_OBSERVATIONS_DISAGREE_WITH_BOTH_ORIGINALS')
            cur.execute("SELECT d.metric_code,d.consolidation_scope,d.selected_observation_id::text,d.decision_basis,d.decided_at::text,d.notes,o.source_record_id::text,o.numeric_value::text FROM fundamental_observation_decisions d JOIN fundamental_observations o ON o.id=d.selected_observation_id WHERE d.security_id=%s AND d.period_end=%s AND d.period_type='QUARTER' AND d.metric_code=ANY(%s) FOR UPDATE OF d",(sid,PERIOD,sorted(CORE)));prior=cur.fetchall();state=check_prior(prior,source)
            if state=='ALREADY_REPAIRED':
                expected={r['metric_code']:r['id'] for r in fresh}
                if any(r['selected_observation_id']!=expected[r['metric_code']] for r in prior):raise ValueError('REPAIRED_SELECTION_OBSERVATION_MISMATCH')
                print('BHARTI_SCOPE_REPAIR_ALREADY_APPLIED',flush=True);db.rollback();return
            proof={'contract':'BHARTI_EXPLICIT_PREFERRED_CONSOLIDATED_SCOPE_CORRECTION_V1','symbol':SYMBOL,'isin':ISIN,'period_start':START,'period_end':PERIOD,'reason':'Restore preferred consolidated reporting scope across adjacent quarters; no standalone financial figures are invalidated','prior_selections':prior,'new_source_record_id':source,'new_observation_ids':{r['metric_code']:r['id'] for r in fresh},'html_url':row['ixbrl'],'html_sha256_unretained':sha(html),'xml_url':row['xbrl'],'xml_sha256':sha(xml),'xml_r2_key':xmlkey,'catalog_r2_key':catkey,'catalog_sha256':sha(catraw),'source_commit':os.getenv('GITHUB_SHA')}
            encoded=canonical(proof);digest=sha(encoded);key=public.R2_PREFIX+'bharti-scope-repair/sha256='+digest+'/proof.json';public.put_immutable(client,encoded,key)
            if client.get_object(Bucket=public.BUCKET,Key=key)['Body'].read()!=encoded:raise ValueError('CORRECTION_PROOF_READBACK_FAILED')
            compact=canonical({'contract':proof['contract'],'symbol':SYMBOL,'isin':ISIN,'period_end':PERIOD,'r2_key':key,'proof_sha256':digest,'old_source_record_id':OLD_SOURCE,'new_source_record_id':source})
            cur.execute("INSERT INTO data_source_records(source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot) VALUES('COMPANY_EXCHANGE_FILING','RESULTS_BHARTI_SCOPE_CORRECTION_V1',%s,%s,%s,%s::jsonb,'{\"retention\":\"PRIVATE_R2_CORRECTION_PROOF; ORIGINAL_OBSERVATIONS_PRESERVED\"}'::jsonb) ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING",(SYMBOL+':'+PERIOD,row['ixbrl'],sha(compact),compact.decode()))
            old_by_metric={r['metric_code']:r for r in prior}
            for r in fresh:
                old=old_by_metric[r['metric_code']]
                notes='RESULTS_BHARTI_EXPLICIT_CONSOLIDATED_SCOPE_CORRECTION; PROOF_SHA256='+digest+'; PRIOR_SELECTED_OBSERVATION='+old['selected_observation_id']+'; PAIRED_NSE_HTML_XML_TRIO_RECONCILED; ORIGINAL_OBSERVATIONS_PRESERVED; ORIGINAL_PUBLICATION_TIMESTAMP_UNKNOWN; NO_HISTORICAL_PIT_OR_V1_4_AUTHORITY'
                cur.execute("UPDATE fundamental_observation_decisions SET consolidation_scope='CONSOLIDATED',selected_observation_id=%s,decision_basis='CORRECTION',decided_at=now(),notes=%s WHERE security_id=%s AND metric_code=%s AND period_end=%s AND period_type='QUARTER' AND consolidation_scope='STANDALONE' AND selected_observation_id=%s",(r['id'],notes,sid,r['metric_code'],PERIOD,old['selected_observation_id']))
                if cur.rowcount!=1:raise ValueError('CONCURRENT_SELECTION_CHANGE_ROLLBACK')
            cur.execute("SELECT count(*) FROM fundamental_observation_decisions WHERE security_id=%s AND period_end=%s AND period_type='QUARTER' AND consolidation_scope='CONSOLIDATED' AND selected_observation_id=ANY(%s::uuid[])",(sid,PERIOD,[r['id'] for r in fresh]))
            if cur.fetchone()['count']!=3:raise ValueError('CORRECTION_ATOMIC_READBACK_FAILED')
        db.commit()
    print('BHARTI_SCOPE_REPAIR_COMPLETE',json.dumps({'corrected_selection_rows':3,'period':PERIOD,'scope':'CONSOLIDATED','proof_sha256':digest,'facts':parsed['facts']}),flush=True)

if __name__=='__main__':main()
