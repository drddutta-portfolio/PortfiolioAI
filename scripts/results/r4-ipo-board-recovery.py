#!/usr/bin/env python3
"""Attempt every missing current comparative using retained signed originals."""
import os,json,importlib.util,re
from pathlib import Path
from collections import defaultdict,Counter
from decimal import Decimal
import requests,psycopg,fitz
from r4_current_gap_discovery import pending_current
from r4_ipo_board_pdf import CONTRACT,KIND,qualify,PERIODS
from r4_nse_catalog_revision import canonical,sha,CORE
from r4_scope_board import extract_ipo_restated_with_scope_board,read_bridge,match_board
from r4_official_issuer import bse_inventory_sources
from r4_recovery_queue import run_with_timeout

spec=importlib.util.spec_from_file_location('board',Path(__file__).with_name('r4-scope-board-recovery.py'));board=importlib.util.module_from_spec(spec);spec.loader.exec_module(board);batch=board.batch

def replay(raw,source,identity,symbol,isin,periods,anchors):
    from r4_ocr_dated_geometry import audit_document
    groups={p:[] for p in periods};rejections=Counter();audit=None
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=40:raise ValueError('IPO_BOARD_PAGE_BOUND')
        cover=' '.join(p.get_text('text') for p in list(pdf)[:3])
        pages=[i+1 for i,p in enumerate(pdf) if re.search('revenue',p.get_text(),re.I) and re.search('diluted',p.get_text(),re.I)]
    for anchor in anchors:
        try:
            current,meeting,start,end=read_bridge(anchor['bridge'],symbol,isin,identity['issuer_name'])
            if current['scope']!='STANDALONE':continue
            match_board(cover,meeting,start,end)
        except ValueError as error:
            rejections[str(error).split(':')[0]]+=1;continue
        for period in periods:
            if period>=anchor['period']:continue
            for page in pages:
                try:
                    if audit is None:audit=audit_document(raw)
                    parsed,evidence=extract_ipo_restated_with_scope_board(raw,page,period,symbol,isin,identity['issuer_name'],anchor['bridge'],document_audit=audit)
                    groups[period].append((parsed,evidence,anchor))
                except ValueError as error:rejections[str(error).split(':')[0]]+=1
    return groups,dict(rejections)

def persist(db,client,sid,symbol,isin,period,identity,source,parsed,evidence,anchor):
    manifest={'contract':CONTRACT,'symbol':symbol,'isin':isin,'security_id':str(sid),'issuer_name':identity['issuer_name'],'period_start':PERIODS[period],'period_end':period,'consolidation_scope':parsed['scope'],'reporting_currency':'INR','issuer_filing_url':source['source_url'],'original_sha256':source['original_sha256'],'original_r2_key':source['original_r2_key'],'original_pdf_retained':True,'raw_bse_bytes_retained':True,'bse_identity_reference':source['bse_identity_reference'],'scope_bridge':{**{k:v for k,v in anchor['bridge'].items() if k!='nse_original_base64'},'nse_original_r2_key':batch.PREFIX+'scope-board-primary/sha256='+anchor['bridge']['nse_original_sha256']+'/original.html'},'scope_board_evidence':evidence,'financial_page':parsed['page'],'facts':parsed['facts'],'source_reporting_basis':'AUDITED_IPO_RESTATED_COMPARATIVE','comparison_basis_unproven':True,'share_or_eps_adjustment_authorized':False}
    encoded=canonical(manifest);mh=sha(encoded);key=batch.PREFIX+'security_id='+isin+'/period_end='+period+'/source_version='+mh+'/manifest.json';batch.immutable_put(client,key,encoded)
    payload={**manifest,'r2_key':key,'r2_manifest_sha256':mh};body=canonical(payload);ph=sha(body);external=symbol+':'+period+':'+source['original_sha256']
    with db.cursor() as cur:
        cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
          VALUES('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s::jsonb,'{"retention":"PRIVATE_R2_PRIMARY_ORIGINALS; INDEPENDENT_SELECTION_REQUIRED"}'::jsonb)
          ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",(KIND,external,source['source_url'],ph,body.decode()));saved=cur.fetchone()
        if saved:source_id=saved[0]
        else:
            cur.execute("SELECT id FROM data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND external_record_id=%s AND payload_hash=%s",(KIND,external,ph));source_id=cur.fetchone()[0]
        count=0
        for metric,f in parsed['facts'].items():
            cur.execute("""INSERT INTO fundamental_observations(security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
              VALUES(%s,%s,%s,'COMPANY_EXCHANGE_FILING',%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
              ON CONFLICT(security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING RETURNING id""",(sid,metric,source_id,Decimal(f['value']),f['unit'],PERIODS[period],period,parsed['scope']))
            if cur.fetchone():count+=1
    db.commit();return count

def main():
    url=os.environ['SUPABASE_DB_URL']
    if os.environ.get('RESULTS_R4_RESTATED_DISPLAY_READY')!='1' or batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET or os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI' or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development':raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();session=requests.Session();session.headers.update({'User-Agent':'Mozilla/5.0'});counts=Counter();rejects=Counter()
    with psycopg.connect(url) as db:
        groups={}
        for symbol,isin,sid,name,periods in batch.candidates(db):groups[(sid,symbol,isin)]=set(periods)
        db.rollback()
        for (sid,symbol,isin),periods in groups.items():
            try:
                if symbol in batch.BANKS or symbol in batch.INSURERS:continue
                anchors,reasons=board.anchors_for(db,client,session,symbol,isin,sid);rejects.update(reasons)
                if not anchors:raise ValueError('IPO_BOARD_SELECTED_PRIMARY_UNAVAILABLE')
                with db.cursor() as cur:
                    cur.execute("SELECT payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY retrieved_at DESC LIMIT 16",(str(sid),));reviews=cur.fetchall()
                db.rollback();sources={};options=defaultdict(list)
                for (rh,) in reviews:
                    try:
                        raw=client.get_object(Bucket=batch.BUCKET,Key=batch.PREFIX+'bse-dated-pdf-review/sha256='+rh+'/capture.json')['Body'].read()
                        if sha(raw)!=rh:raise ValueError('IPO_BOARD_PRIVATE_REVIEW_HASH_MISMATCH')
                        review=json.loads(raw)
                        for source in bse_inventory_sources(review,rh,symbol,isin,str(sid)).values():sources.setdefault(source['original_sha256'],(source,review['bse_identity']))
                    except Exception as error:rejects[type(error).__name__]+=1
                for source,identity in sources.values():
                    try:
                        raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                        if sha(raw)!=source['original_sha256']:raise ValueError('IPO_BOARD_PRIVATE_ORIGINAL_HASH_MISMATCH')
                        counts['originals_attempted']+=1;found,reasons=run_with_timeout(replay,(raw,source,identity,symbol,isin,periods,anchors),480);rejects.update(reasons)
                        for period,items in found.items():
                            for parsed,evidence,anchor in items:options[period].append((parsed,evidence,anchor,source,identity))
                    except Exception as error:rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                for period,items in options.items():
                    vectors={tuple(sorted((k,f['value'],f['unit']) for k,f in parsed['facts'].items())) for parsed,_,_,_,_ in items}
                    if len(vectors)!=1:rejects['IPO_BOARD_CONFLICTING_ORIGINAL_TRIOS']+=1;continue
                    parsed,evidence,anchor,source,identity=sorted(items,key=lambda x:x[3]['original_sha256'])[0];board.anchor_selected(db,sid,anchor)
                    counts['observations_inserted']+=persist(db,client,sid,symbol,isin,period,identity,source,parsed,evidence,anchor)
            except Exception as error:db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
            counts['issuers_checked']+=1;print('R4_IPO_BOARD_PROGRESS',json.dumps({**dict(counts),'rejections':dict(rejects)}),flush=True)
    print('R4_IPO_BOARD_FINAL',json.dumps({**dict(counts),'rejections':dict(rejects)}),flush=True)
    if any(rejects[name] for name in ('NameError','AttributeError','TypeError')):raise RuntimeError('IPO_BOARD_PROGRAMMING_FAILURES_AFTER_ALL_ATTEMPTS')

if __name__=='__main__':main()
