"""Development-only official issuer collection; isolated original failures."""
import argparse,importlib.util,json,os,re,html,time
from collections import Counter
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlparse
from r4_official_issuer import CONTRACT,KIND,ISSUERS,PERIODS,SPLIT_AUTHORITIES,CURRENT_DISPLAY_POLICY,split_reference,approved_url,extract_original,canonical,sha,discover,get,resume_issuer_order,bse_inventory_sources
from r4_recovery_queue import run_with_timeout

def load_runtime():
    spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'))
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

def active_basis_policy():
    # Enable only after the Development app's comparison guard is deployed.
    return CURRENT_DISPLAY_POLICY if os.environ.get('RESULTS_R4_RESTATED_DISPLAY_READY')=='1' else None

def replay_engine(directory=None):
    root=Path(directory) if directory is not None else Path(__file__).parent
    names=('r4-official-issuer-recovery.py','r4_official_issuer.py','r4_pdf_geometry.py',
        'r4_ocr_dated_geometry.py','r4_ocr_geometry.py','r4_ocr_cli.py','r4_issuer_name.py')
    return sha(b'\0'.join((root/name).read_bytes() for name in names)+b'\0'+(active_basis_policy() or 'LEGACY_ORIGINAL_ONLY').encode())

def download_original(session,symbol,url):
    approved_url(symbol,url)
    if urlparse(url).hostname=='www.bseindia.com':
        with batch.PortfolioBSE() as bse:
            raw,origin=bse.retrieve_original_pdf(urlparse(url).path.rsplit('/',1)[-1],max_bytes=32_000_000)
        approved_url(symbol,origin['source_url'])
        return raw,origin['source_url']
    raw,final_url=get(session,symbol,url,32_000_000)
    if not raw.startswith(b'%PDF'):raise ValueError('OFFICIAL_ORIGINAL_NOT_PDF')
    return raw,final_url

def retain_split_authority(session,client,symbol):
    authority=SPLIT_AUTHORITIES[symbol]
    with session.get(authority['url'],timeout=(15,45),allow_redirects=False,stream=True) as response:
        response.raise_for_status()
        if response.status_code!=200:raise ValueError('OFFICIAL_SPLIT_AUTHORITY_REDIRECT_UNAPPROVED')
        parts=[];size=0
        for chunk in response.iter_content(65536):
            size+=len(chunk)
            if size>2_000_000:raise ValueError('OFFICIAL_SPLIT_AUTHORITY_SIZE_BOUND')
            parts.append(chunk)
    raw=b''.join(parts);reference=split_reference(raw,symbol)
    batch.immutable_put(client,reference['r2_key'],raw)
    return reference

def extract_all(raw,symbol,periods,native_only=False,document_audit=None):
    import fitz
    from r4_ocr_dated_geometry import audit_document,extract_dated_periods
    preflight_identity(raw,symbol)
    audit=document_audit if document_audit is not None else audit_document(raw,max_pages=120)
    if audit.get('original_sha256')!=sha(raw):raise ValueError('OFFICIAL_DOCUMENT_AUDIT_ORIGINAL_MISMATCH')
    out={p:[] for p in periods};rejects=Counter();policy=active_basis_policy()
    for period in periods:
        try:out[period]=extract_original(raw,symbol,period,document_audit=audit,basis_policy=policy)
        except ValueError as error:rejects[str(error).split(':')[0]]+=1
        if not out[period]:
            try:out[period]=extract_original(raw,symbol,period,'NATIVE_STATEMENT_LAYOUT',document_audit=audit,basis_policy=policy)
            except ValueError as error:rejects[str(error).split(':')[0]]+=1
        if not out[period]:
            try:out[period]=extract_original(raw,symbol,period,'NATIVE_STATEMENT_LAYOUT_V5',document_audit=audit,basis_policy=policy)
            except ValueError as error:rejects[str(error).split(':')[0]]+=1
    if native_only:return {'periods':out,'rejections':dict(rejects),'document_audit':audit}
    pending=[p for p in periods if not out[p]]
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        native_pages=[page.get_text('text') for page in pdf]
    # A split statutory table needs two separately rendered, repeated headers.
    # Only label text locates it; no audit/native numeric value supplies OCR facts.
    if symbol=='TATACAP' and policy==CURRENT_DISPLAY_POLICY:
        for index in range(len(native_pages)-1):
            if not pending:break
            first=native_pages[index]+' '+audit['pages'][index]
            following=native_pages[index+1]+' '+audit['pages'][index+1]
            if not re.search(r'revenue.*operations',first,re.I|re.S) or not re.search(r'diluted',following,re.I):continue
            for period in pending[:]:
                for pair in ((300,450),(200,400)):
                    try:
                        out[period]=extract_original(raw,symbol,period,'OCR_CONTINUATION',index+1,pair,3,audit,basis_policy=policy)
                        if out[period]:pending.remove(period);break
                    except ValueError as error:rejects[str(error).split(':')[0]]+=1
    for n,text in enumerate(audit['pages'],1):
        if not pending:break
        # The low-resolution audit locates candidates; it is not financial
        # qualification. Native labels can locate a table when audit OCR loses
        # a label. All figures still require independent paired-render replay.
        text=text+' '+native_pages[n-1]
        if not re.search('diluted',text,re.I) or not re.search(r'revenue|premium.*earned',text,re.I):continue
        # Versioned layout replay keeps dates, amounts and signs explicit.
        # Existing receipt methods remain independently replayable unchanged.
        proofs=extract_dated_periods(raw,n,pending,False,symbol=='STARHEALTH',
            header_region=True,label_region=True,statement_layout=True,advanced_statement_layout=True)
        for period in pending[:]:
            proof=proofs[period]
            if proof.get('rejection'):rejects[proof['rejection']]+=1;continue
            parsed=proof['parsed']
            try:
                out[period]=extract_original(raw,symbol,period,'OCR_STATEMENT_LAYOUT_V5',n,parsed['ocr_render_dpi'],parsed['ocr_segmentation_mode'],audit,basis_policy=policy)
                if out[period]:pending.remove(period)
            except ValueError as error:rejects[str(error).split(':')[0]]+=1
    return {'periods':out,'rejections':dict(rejects)}

def replay_with_native_checkpoint(raw,symbol,periods,load_native,save_native,checkpoint_native,timeout=480):
    """Commit complete native proposals before a bounded OCR fallback can fail."""
    started=time.monotonic()
    def remaining():
        duration=timeout-(time.monotonic()-started)
        if duration<=0:raise TimeoutError('PER_ORIGINAL_PROCESSING_TIMEOUT')
        return duration
    native=load_native()
    if native is None:
        native=run_with_timeout(extract_all,(raw,symbol,periods,True),remaining())
        save_native(native)
    if (set(native.get('periods',{}))!=set(periods)
        or native.get('document_audit',{}).get('original_sha256')!=sha(raw)):
        raise ValueError('NATIVE_CHECKPOINT_ORIGINAL_OR_QUARTER_MISMATCH')
    checkpoint_native(native)
    pending=[period for period in periods if not native['periods'][period]]
    output={'periods':dict(native['periods']),'rejections':dict(native['rejections'])}
    if pending:
        later=run_with_timeout(extract_all,(raw,symbol,pending,False,native['document_audit']),remaining())
        output['periods'].update(later['periods'])
        rejects=Counter(output['rejections']);rejects.update(later['rejections']);output['rejections']=dict(rejects)
    return output

def preflight_identity(raw,symbol):
    """Reject unrelated originals before expensive full-document financial replay.

    This repeats the qualifier's exact first-three-page identity condition.
    Passing only permits a full audit; it never qualifies any financial fact.
    """
    import fitz
    from r4_issuer_name import exact_legal_identity
    from r4_ocr_geometry import OCRPage
    with fitz.open(stream=raw,filetype='pdf') as pdf:
        if not 1<=len(pdf)<=120:raise ValueError('OFFICIAL_DOCUMENT_PAGE_BOUND')
        pages=[pdf[i] for i in range(min(3,len(pdf)))]
        if exact_legal_identity(ISSUERS[symbol]['legal'],' '.join(p.get_text('text') for p in pages)):return
        if exact_legal_identity(ISSUERS[symbol]['legal'],' '.join(OCRPage(p,150).get_text('text') for p in pages)):return
    raise ValueError('OFFICIAL_COMPLETE_ISSUER_IDENTITY_UNPROVEN')

def prioritize_originals(symbol,discovered,retained):
    """Known table candidates and pinned originals precede other inventory.

    Preserve every URL and the existing checkpoint rotation; metadata only
    changes attempt order and never supplies a financial value.
    """
    pinned=ISSUERS[symbol]['originals']
    verified=[u for u in ISSUERS[symbol].get('verified_originals',[]) if u in pinned and u in discovered]
    candidates=sorted((u for u in retained if retained[u]['candidate_priority']==0))
    remaining=sorted((u for u in retained if u not in candidates))
    return list(dict.fromkeys(verified+candidates+[u for u in pinned if u in discovered]+remaining+list(discovered)))

def target_cohort(cohort,configured):
    if not configured.strip():return list(cohort)
    targets=set(configured.split(','))
    if not 1<=len(targets)<=4 or not targets.issubset(ISSUERS):raise ValueError('UNAPPROVED_TARGET_ISSUERS')
    return [row for row in cohort if row[0] in targets]

def persist(db,client,row,period,url,raw,parsed,identity_bridge=None,bse_identity_reference=None):
    symbol,isin,sid,_name,_periods=row;digest=sha(raw)
    original_key=batch.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf'
    batch.immutable_put(client,original_key,raw)
    payload={'contract':CONTRACT,'symbol':symbol,'isin':isin,'sourceUrl':url,'original_sha256':digest,
        'original_r2_key':original_key,'period_end':period,'parsed':parsed,
        'authority':'CURRENT_DISPLAY_ONLY; NO_POINT_IN_TIME_OR_SHARE_REBASING_AUTHORITY'}
    if identity_bridge is not None:payload['isin_bridge']=identity_bridge
    if bse_identity_reference is not None:
        payload.update(security_id=str(sid),bse_identity_reference=bse_identity_reference)
    encoded=canonical(payload);version=sha(encoded);external=':'.join((symbol,period,parsed['scope'],digest))
    batch.immutable_put(client,batch.PREFIX+'official-issuer-manifests/sha256='+version+'/manifest.json',encoded)
    with db.cursor() as cur:
        cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
            VALUES('COMPANY_EXCHANGE_FILING',%s,%s,%s,%s,%s::jsonb,'{"retention":"ORIGINAL_ISSUER_PDF_PRIVATE_R2; INDEPENDENT_SELECTION_REQUIRED"}'::jsonb)
            ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING RETURNING id""",(KIND,external,url,version,encoded.decode()))
        found=cur.fetchone()
        if not found:
            cur.execute("SELECT id FROM data_source_records WHERE source_code='COMPANY_EXCHANGE_FILING' AND record_kind=%s AND external_record_id=%s AND payload_hash=%s",(KIND,external,version));found=cur.fetchone()
        if not found:raise ValueError('OFFICIAL_SOURCE_READBACK_MISSING')
        source_id=found[0];inserted=0
        for metric,fact in parsed['facts'].items():
            cur.execute("""INSERT INTO fundamental_observations(security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
                period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
                VALUES(%s,%s,%s,'COMPANY_EXCHANGE_FILING',%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
                ON CONFLICT(security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id) DO NOTHING RETURNING id""",
                (sid,metric,source_id,fact['value'],fact['unit'],PERIODS[period],period,parsed['scope']))
            inserted+=int(cur.fetchone() is not None)
    db.commit();return inserted

def checkpoint(db,client,outcome,counts,shard):
    report={'contract':'RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1','workflow_run_id':os.environ['GITHUB_RUN_ID'],
        'source_commit':os.environ['GITHUB_SHA'],'shard':shard,'counts':dict(counts),'issuers':[outcome]}
    encoded=canonical(report);digest=sha(encoded)
    batch.immutable_put(client,batch.PREFIX+'official-issuer-audits/sha256='+digest+'/audit.json',encoded)
    external=':'.join((os.environ['GITHUB_RUN_ID'],str(shard),outcome['symbol'],str(outcome.get('original_urls_attempted',0))))
    with db.cursor() as cur:
        cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
            VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1',%s,%s,%s::jsonb,'{"retention":"STRUCTURED_OPERATIONAL_AUDIT; ORIGINALS_PRIVATE_R2"}'::jsonb)
            ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(external,digest,encoded.decode()))
    db.commit()

def main():
    global batch
    import requests,psycopg
    batch=load_runtime()
    parser=argparse.ArgumentParser();parser.add_argument('--shard',type=int,required=True);args=parser.parse_args()
    if args.shard not in range(4):raise RuntimeError('INVALID_SHARD')
    if os.getenv('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI' or os.getenv('GITHUB_REF')!='refs/heads/PortfolioAI-Development':
        raise RuntimeError('DEVELOPMENT_BRANCH_REQUIRED')
    if batch.REF not in os.environ['SUPABASE_DB_URL'] or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter();audit_rows=[]
    engine=replay_engine()
    with psycopg.connect(os.environ['SUPABASE_DB_URL']) as db,requests.Session() as session:
        session.headers['User-Agent']='Mozilla/5.0'
        cohort=[row for row in target_cohort(batch.candidates(db),os.getenv('RESULTS_R4_TARGET_SYMBOLS','')) if row[2].int%4==args.shard];db.rollback()
        with db.cursor() as cur:
            cur.execute("""SELECT raw_payload->'issuers'->-1->>'symbol' FROM data_source_records
                WHERE record_kind='RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1' AND raw_payload->>'shard'=%s
                ORDER BY retrieved_at DESC LIMIT 1""",(str(args.shard),));last=cur.fetchone()
        db.rollback();cohort=resume_issuer_order(cohort,last[0] if last else None)
        for row in cohort:
            symbol,isin,sid,_name,periods=row
            if int(sid.int)%4!=args.shard:continue
            outcome={'symbol':symbol,'security_id':str(sid),'periods':periods,'parser_engine':engine,'counts':{},'rejections':{}}
            rejects=Counter()
            if symbol not in ISSUERS:
                outcome['rejections']={'OFFICIAL_DISCOVERY_PAGE_NOT_CONFIGURED':1};audit_rows.append(outcome);continue
            identity_bridge=None
            if symbol in SPLIT_AUTHORITIES:
                try:identity_bridge=retain_split_authority(session,client,symbol)
                except Exception as error:rejects['SPLIT_AUTHORITY_'+type(error).__name__]+=1
            urls,discovery_errors=discover(session,symbol);rejects.update(discovery_errors)
            retained={}
            if active_basis_policy()==CURRENT_DISPLAY_POLICY:
                with db.cursor() as cur:
                    cur.execute("""SELECT raw_payload,payload_hash FROM data_source_records
                        WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s
                          AND jsonb_typeof(raw_payload->'bse_identity')='object'
                          AND CASE WHEN jsonb_typeof(raw_payload->'all_sources')='array'
                              THEN jsonb_array_length(raw_payload->'all_sources') ELSE 0 END>0
                        ORDER BY retrieved_at DESC LIMIT 16""",(str(sid),));reviews=cur.fetchall()
                db.rollback()
                for review,review_hash in reviews:
                    try:
                        for url,original in bse_inventory_sources(review,review_hash,symbol,isin,str(sid)).items():
                            if url not in retained or original['candidate_priority']<retained[url]['candidate_priority']:
                                retained[url]=original
                    except ValueError as error:rejects[str(error).split(':')[0]]+=1
                    except (TypeError,KeyError):rejects['BSE_IDENTITY_INVENTORY_REJECTED']+=1
                urls=prioritize_originals(symbol,urls,retained)
            with db.cursor() as cur:
                cur.execute("""SELECT x->>'next_offset' FROM data_source_records d CROSS JOIN LATERAL jsonb_array_elements(d.raw_payload->'issuers') x
                    WHERE d.record_kind='RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1' AND x->>'symbol'=%s AND x->>'parser_engine'=%s
                    ORDER BY d.retrieved_at DESC LIMIT 1""",(symbol,engine));previous=cur.fetchone()
            db.rollback();offset=int(previous[0] or 0)%len(urls) if previous and urls else 0
            ordered=urls[offset:]+urls[:offset];started=time.monotonic();attempted=0
            for url in ordered:
                if time.monotonic()-started>=480:
                    rejects['ISSUER_TIME_BUDGET_RESUME_NEXT_PASS']+=1
                    break
                try:
                    bse_reference=None
                    if url in retained:
                        original=retained[url]
                        raw=client.get_object(Bucket=batch.BUCKET,Key=original['original_r2_key'])['Body'].read()
                        if sha(raw)!=original['original_sha256']:raise ValueError('OFFICIAL_BSE_RETAINED_HASH_MISMATCH')
                        final_url=url;bse_reference=original['bse_identity_reference']
                    else:
                        raw,final_url=download_original(session,symbol,url)
                    digest=sha(raw);batch.immutable_put(client,batch.PREFIX+'evidence/original_version='+digest+'/issuer-original.pdf',raw)
                    counts['originals_retained']+=1
                    cachekey=batch.PREFIX+'official-issuer-replays/symbol='+symbol+'/engine='+engine+'/original='+digest+'/periods='+sha(canonical(periods))+'/proof.json'
                    try:proof=json.loads(client.get_object(Bucket=batch.BUCKET,Key=cachekey)['Body'].read())
                    except Exception as error:
                        if getattr(error,'response',{}).get('Error',{}).get('Code') not in ('404','NoSuchKey','NotFound'):raise
                        native_key=cachekey.removesuffix('proof.json')+'native-proof.json'
                        def load_native():
                            try:return json.loads(client.get_object(Bucket=batch.BUCKET,Key=native_key)['Body'].read())
                            except Exception as problem:
                                if getattr(problem,'response',{}).get('Error',{}).get('Code') not in ('404','NoSuchKey','NotFound'):raise
                                return None
                        def save_native(value):batch.immutable_put(client,native_key,canonical(value))
                        def checkpoint_native(value):
                            for period,options in value['periods'].items():
                                for parsed in options:counts['observations_inserted']+=persist(db,client,row,period,final_url,raw,parsed,identity_bridge,bse_reference)
                            outcome.update(phase='NATIVE_PROPOSALS_CHECKPOINTED',original_urls_attempted=attempted,
                                original_urls_discovered=len(urls),next_offset=(offset+attempted)%len(urls) if urls else 0)
                            checkpoint(db,client,outcome,counts,args.shard)
                            print('R4_NATIVE_ORIGINAL_CHECKPOINT',json.dumps({'native_slots':sum(bool(v) for v in value['periods'].values()),
                                'observations_inserted':counts.get('observations_inserted',0)}),flush=True)
                        proof=replay_with_native_checkpoint(raw,symbol,periods,load_native,save_native,checkpoint_native)
                        batch.immutable_put(client,cachekey,canonical(proof))
                    rejects.update(proof['rejections'])
                    for period,parsed_options in proof['periods'].items():
                        for parsed in parsed_options:counts['observations_inserted']+=persist(db,client,row,period,final_url,raw,parsed,identity_bridge,bse_reference)
                except Exception as error:
                    db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                    if isinstance(error,(NameError,AttributeError,TypeError)):counts['programming_failures']+=1
                finally:
                    counts['originals_attempted']+=1
                    attempted+=1
                    outcome.update(phase='ORIGINAL_ATTEMPT_CHECKPOINTED',rejections=dict(rejects),original_urls_attempted=attempted,
                        original_urls_discovered=len(urls),next_offset=(offset+attempted)%len(urls) if urls else 0)
                    checkpoint(db,client,outcome,counts,args.shard)
                    print('R4_OFFICIAL_ORIGINAL_PROGRESS',json.dumps(dict(counts)),flush=True)
            outcome['rejections']=dict(rejects);outcome['original_urls_attempted']=attempted
            outcome['original_urls_discovered']=len(urls);outcome['next_offset']=(offset+attempted)%len(urls) if urls else 0
            audit_rows.append(outcome);counts['issuers_attempted']+=1
        report={'contract':'RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1','workflow_run_id':os.environ['GITHUB_RUN_ID'],'source_commit':os.environ['GITHUB_SHA'],'shard':args.shard,'counts':dict(counts),'issuers':audit_rows}
        encoded=canonical(report);digest=sha(encoded);key=batch.PREFIX+'official-issuer-audits/sha256='+digest+'/audit.json';batch.immutable_put(client,key,encoded)
        with db.cursor() as cur:
            cur.execute("""INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot)
                VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_OFFICIAL_ISSUER_COLLECTION_AUDIT_V1',%s,%s,%s::jsonb,'{"retention":"STRUCTURED_OPERATIONAL_AUDIT; ORIGINALS_PRIVATE_R2"}'::jsonb)
                ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING""",(os.environ['GITHUB_RUN_ID']+':'+str(args.shard),digest,encoded.decode()))
        db.commit()
    print('R4_OFFICIAL_ORIGINAL_FINAL',json.dumps(dict(counts)),flush=True)
    if counts.get('programming_failures'):raise RuntimeError('OFFICIAL_COLLECTOR_PROGRAMMING_ERRORS_CHECKPOINTED')

if __name__=='__main__':main()
