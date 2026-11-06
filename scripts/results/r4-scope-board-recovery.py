#!/usr/bin/env python3
"""All-cohort, bounded Development replay of same-board scope witnesses.

One bad issuer/original/quarter never stops other attempts. Only immutable
primary originals and existing selected anchors can propose new observations;
the separate canonical selector must independently replay every proposal.
"""
import argparse,importlib.util,json,os,re
from pathlib import Path
from collections import Counter,defaultdict
from decimal import Decimal
import fitz,psycopg,requests
from r4_scope_board import CONTRACT,REVISION,CORE,CURRENT,make_bridge,read_bridge,match_board,extract_with_scope_board
from r4_scope_bridge import original_origin
from r4_dated_columns import parse_html,unique
from r4_bse_dated_proof import validate_original
from r4_official_issuer import bse_inventory_sources
from r4_recovery_queue import run_with_timeout,task_id

HERE=Path(__file__).parent
spec=importlib.util.spec_from_file_location('batch',HERE/'r4-bse-historical-batch.py')
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def replay(raw,source,identity,symbol,isin,periods,anchors):
    """Pure original replay under a hard process deadline, before any writes."""
    from r4_ocr_dated_geometry import audit_document
    groups={p:[] for p in periods};rejects=Counter();audit=None
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=40:raise ValueError('BOARD_SCOPE_PAGE_BOUND')
        cover=' '.join(p.get_text('text') for p in list(pdf)[:3])
        pages=[i+1 for i,p in enumerate(pdf) if re.search('revenue',p.get_text(),re.I) and re.search('diluted',p.get_text(),re.I)]
    for anchor in anchors:
        try:
            current,board,start,end=read_bridge(anchor['bridge'],symbol,isin,identity['issuer_name'])
            if current['scope']!='STANDALONE':continue
            match_board(cover,board,start,end)
            if audit is None:audit=audit_document(raw)
            for period in periods:
                for page in pages:
                    try:
                        parsed,evidence=extract_with_scope_board(raw,page,period,symbol,isin,identity['issuer_name'],anchor['bridge'],document_audit=audit)
                        proof={**identity,'original_sha256':batch.sha(raw),'source_url':source['source_url'],'scope_bridge':anchor['bridge'],'scope_board_evidence':evidence,'current_anchor_source_record_id':anchor['id'],'current_anchor_payload_hash':anchor['hash']}
                        basis='AS_FILED_OWN_QUARTER' if parsed['first_column_period']==period else 'LATER_FILING_REPORTED_COMPARATIVE'
                        manifest={'symbol':symbol,'isin':isin,'issuer_name':identity['issuer_name'],'bse_scrip_code':identity['bse_scrip_code'],'original_sha256_retained':batch.sha(raw),'issuer_filing_url':source['source_url'],'financial_page':page,'period_end':period,'consolidation_scope':parsed['scope'],'original_unit':parsed['unit'],'first_column_period':parsed['first_column_period'],'selected_column_period':period,'selected_column_index':parsed['column_index'],'source_reporting_basis':basis,'facts':parsed['facts'],'scope_evidence_basis':CONTRACT,'parser_revision':REVISION}
                        validate_original(raw,manifest,proof,audit)
                        groups[period].append({'parsed':parsed,'proof':proof,'basis':basis,'anchor':anchor})
                    except ValueError as error:rejects[str(error).split(':')[0]]+=1
        except ValueError as error:rejects[str(error).split(':')[0]]+=1
    return groups,dict(rejects)

def anchors_for(db,client,session,symbol,isin,sid):
    with db.cursor() as cur:
        cur.execute("""SELECT d.id::text,d.payload_hash,d.raw_payload,
          jsonb_object_agg(o.metric_code,jsonb_build_object('value',o.numeric_value::text,'unit',o.unit))
          FROM fundamental_observation_decisions x JOIN fundamental_observations o ON o.id=x.selected_observation_id
          JOIN data_source_records d ON d.id=o.source_record_id
          WHERE x.security_id=%s AND x.period_type='QUARTER' AND x.period_end=ANY(%s::date[])
            AND x.consolidation_scope='STANDALONE' AND o.source_code='COMPANY_EXCHANGE_FILING' AND o.currency='INR'
            AND d.raw_payload->>'contract' IN ('PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1','PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1')
            AND o.metric_code=ANY(%s::text[])
          GROUP BY d.id HAVING count(DISTINCT o.metric_code)=3 ORDER BY d.id LIMIT 16""",(sid,sorted(CURRENT),sorted(CORE)))
        rows=cur.fetchall()
    db.rollback();out=[];rejects=Counter();catalog=None
    for aid,digest,m,facts in rows:
        try:
            if batch.sha(batch.canonical(m))!=digest or m.get('symbol')!=symbol or m.get('isin')!=isin:raise ValueError('BOARD_ANCHOR_IDENTITY_OR_HASH_MISMATCH')
            if set(facts)!=CORE or any(Decimal(m['facts'][k]['value'])!=Decimal(facts[k]['value']) or m['facts'][k]['unit']!=facts[k]['unit'] for k in CORE):raise ValueError('BOARD_ANCHOR_SELECTED_FACTS_MISMATCH')
            manifest=client.get_object(Bucket=batch.BUCKET,Key=m['r2_key'])['Body'].read()
            if batch.sha(manifest)!=m['r2_manifest_sha256'] or json.loads(manifest)!={k:v for k,v in m.items() if k not in ('r2_key','r2_manifest_sha256')}:raise ValueError('BOARD_ANCHOR_R2_MANIFEST_MISMATCH')
            primary_url=m['issuer_filing_url']
            if not original_origin(primary_url):
                if catalog is None:
                    spec=importlib.util.spec_from_file_location('current',HERE/'r3-current-quarter-integrated-xbrl.py');current=importlib.util.module_from_spec(spec);spec.loader.exec_module(current)
                    catalog=current.list_filings(session,symbol)
                    encoded=batch.canonical(catalog);batch.immutable_put(client,batch.PREFIX+'scope-board-catalog/sha256='+batch.sha(encoded)+'/catalog.json',encoded)
                urls={x.get('ixbrl') for x in catalog if x.get('xbrl')==primary_url and original_origin(x.get('ixbrl',''))}
                if len(urls)!=1:raise ValueError('BOARD_ANCHOR_PRIMARY_HTML_CATALOG_UNPROVEN')
                primary_url=urls.pop()
            response=session.get(primary_url,timeout=40,allow_redirects=False);response.raise_for_status()
            if response.status_code!=200 or len(response.content)>5_000_000:raise ValueError('BOARD_ANCHOR_PRIMARY_FETCH_UNPROVEN')
            bridge=make_bridge(response.content,primary_url,m['period_end']);current,*_=read_bridge(bridge,symbol,isin,unique(parse_html(response.content.decode('utf-8-sig'))[1],'name of company') or '')
            if current['scope']!='STANDALONE' or any(Decimal(current['facts'][k]['value'])!=Decimal(facts[k]['value']) or current['facts'][k]['unit']!=facts[k]['unit'] for k in CORE):raise ValueError('BOARD_PRIMARY_DIFFERS_FROM_SELECTED_ANCHOR')
            batch.immutable_put(client,batch.PREFIX+'scope-board-primary/sha256='+batch.sha(response.content)+'/original.html',response.content)
            out.append({'id':aid,'hash':digest,'period':m['period_end'],'bridge':bridge})
        except Exception as error:rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
    return out,rejects

def anchor_selected(db,sid,anchor):
    with db.cursor() as cur:
        cur.execute("""SELECT count(DISTINCT d.metric_code) FROM fundamental_observation_decisions d
          JOIN fundamental_observations o ON o.id=d.selected_observation_id JOIN data_source_records r ON r.id=o.source_record_id
          WHERE d.security_id=%s AND d.period_type='QUARTER' AND d.period_end=%s AND d.consolidation_scope='STANDALONE'
          AND o.source_record_id=%s AND r.payload_hash=%s AND d.metric_code=ANY(%s::text[])""",(sid,anchor['period'],anchor['id'],anchor['hash'],sorted(CORE)))
        selected=cur.fetchone()[0]
    db.rollback()
    if selected!=3:raise ValueError('BOARD_CURRENT_ANCHOR_CHANGED')

def main():
    p=argparse.ArgumentParser();p.add_argument('--shard',type=int,required=True);args=p.parse_args()
    url=os.environ['SUPABASE_DB_URL']
    if (not 0<=args.shard<4 or batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET
        or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development'
        or os.environ.get('RESULTS_R4_DATED_PDF_ACK')!='EXPLICIT_QUARTER_ORIGINAL_REPLAY'):raise RuntimeError('DEVELOPMENT_WRITE_GUARD')
    client=batch.r2_client();counts=Counter();all_rejects=Counter();session=requests.Session();session.headers.update({'User-Agent':'Mozilla/5.0','Accept-Language':'en-IN,en;q=0.8'})
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,name,periods in cohort:
            if int(task_id(sid,'SCOPE_BOARD_V2',None,{}),16)%4!=args.shard:continue
            rejects=Counter();groups={p:defaultdict(list) for p in periods};sources_attempted=inserted=0
            try:
                if symbol in batch.BANKS or symbol in batch.INSURERS:raise ValueError('BOARD_SCOPE_SECTOR_UNSUPPORTED')
                anchors,reasons=anchors_for(db,client,session,symbol,isin,sid);rejects.update(reasons)
                if not anchors:raise ValueError('BOARD_SCOPE_SELECTED_PRIMARY_ANCHOR_UNAVAILABLE')
                with db.cursor() as cur:
                    # Fetch hashes only; bulky original inventories remain in R2.
                    cur.execute("SELECT payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY retrieved_at DESC LIMIT 16",(str(sid),));reviews=cur.fetchall()
                db.rollback();sources={}
                for (digest,) in reviews:
                    try:
                        raw=client.get_object(Bucket=batch.BUCKET,Key=batch.PREFIX+'bse-dated-pdf-review/sha256='+digest+'/capture.json')['Body'].read()
                        if batch.sha(raw)!=digest:raise ValueError('BOARD_PRIVATE_REVIEW_HASH_MISMATCH')
                        review=json.loads(raw)
                        for u,source in bse_inventory_sources(review,digest,symbol,isin,str(sid)).items():sources.setdefault(source['original_sha256'],(source,review['bse_identity']))
                    except Exception as error:rejects[type(error).__name__]+=1
                for source,identity in sources.values():
                    try:
                        raw=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                        if batch.sha(raw)!=source['original_sha256']:raise ValueError('BOARD_ORIGINAL_HASH_MISMATCH')
                        sources_attempted+=1
                        options,reasons=run_with_timeout(replay,(raw,source,identity,symbol,isin,periods,anchors),480)
                        rejects.update(reasons)
                        for period,items in options.items():
                            for item in items:groups[period][item['parsed']['scope']].append((item,source,identity))
                    except Exception as error:rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                for period,scopes in groups.items():
                    for scope,options in scopes.items():
                        vectors={tuple(sorted((k,f['value'],f['unit']) for k,f in item['parsed']['facts'].items())) for item,_,_ in options}
                        if len(vectors)!=1:rejects['BOARD_CONFLICTING_ORIGINAL_FINANCIAL_TRIOS']+=1;continue
                        item,source,identity=sorted(options,key=lambda x:x[1]['original_sha256'])[0];anchor_selected(db,sid,item['anchor'])
                        encoded=batch.canonical(item['proof']);digest=batch.sha(encoded);key=batch.PREFIX+'bse-dated-identity/sha256='+digest+'/proof.json';batch.immutable_put(client,key,encoded)
                        parsed=item['parsed'];parsed.update(parser_revision=REVISION,scope_evidence_basis=CONTRACT,original_r2_key=source['original_r2_key'],selected_column_index=parsed['column_index'],issuer_identity_evidence_r2_key=key,issuer_identity_evidence_sha256=digest,source_reporting_basis=item['basis'])
                        original=client.get_object(Bucket=batch.BUCKET,Key=source['original_r2_key'])['Body'].read()
                        inserted+=batch.persist(db,client,(symbol,isin,sid,identity['issuer_name'],identity['bse_scrip_code']),period,source,original,parsed,None)
            except Exception as error:
                db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
            audit={'contract':'RESULTS_R4_SCOPE_BOARD_COHORT_AUDIT_V2','symbol':symbol,'security_id':str(sid),'periods':periods,'originals_attempted':sources_attempted,'observations_inserted':inserted,'rejections':dict(rejects),'source_commit':os.getenv('GITHUB_SHA'),'workflow_run_id':os.getenv('GITHUB_RUN_ID')}
            encoded=batch.canonical(audit);digest=batch.sha(encoded);batch.immutable_put(client,batch.PREFIX+'scope-board-audit/sha256='+digest+'/audit.json',encoded)
            counts.update(issuers_attempted=1,slots_attempted=len(periods),originals_attempted=sources_attempted,observations_inserted=inserted)
            all_rejects.update(rejects)
            print('R4_SCOPE_BOARD_PROGRESS',json.dumps({**dict(counts),'rejection_counts':dict(all_rejects)}),flush=True)
    print('R4_SCOPE_BOARD_FINAL',json.dumps(dict(counts)),flush=True)

if __name__=='__main__':main()
