"""Replay every supported scope-omission proof; selection remains independent."""
import importlib.util
import json
import os
import re
from collections import Counter,defaultdict
from pathlib import Path
import fitz
import psycopg
from r4_bse_dated_proof import validate_original,REVISION
from r4_scope_bridge import CONTRACT,extract_with_scope_bridge

spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'))
batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    if os.environ.get('RESULTS_R4_DATED_PDF_ACK')!='EXPLICIT_QUARTER_ORIGINAL_REPLAY':raise RuntimeError('WRITES_NOT_AUTHORIZED')
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter()
    with psycopg.connect(url) as db:
        cohort=batch.candidates(db);db.rollback()
        for symbol,isin,sid,_name,periods in cohort:
            for period in periods:
                rejects=Counter();groups=defaultdict(list)
                outcome={'contract':'RESULTS_R4_SCOPE_BRIDGE_AUDIT_V1','symbol':symbol,'isin':isin,'security_id':str(sid),'period_end':period,'proofs_attempted':0,'observations_inserted':0,'workflow_run_id':os.getenv('GITHUB_RUN_ID'),'source_commit':os.getenv('GITHUB_SHA')}
                try:
                    with db.cursor() as cur:
                        cur.execute("SELECT raw_payload,payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_SCOPE_ANCHOR_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s AND raw_payload->>'period_end'=%s ORDER BY retrieved_at DESC LIMIT 1",(str(sid),period));review=cur.fetchone()
                        cur.execute("SELECT raw_payload,payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY retrieved_at DESC LIMIT 1",(str(sid),));inventory=cur.fetchone()
                    db.rollback()
                    if not review or not inventory:raise ValueError('PRIVATE_SCOPE_REVIEW_NOT_AVAILABLE')
                    if any(batch.sha(batch.canonical(row[0]))!=row[1] for row in (review,inventory)):raise ValueError('PRIVATE_SCOPE_REVIEW_HASH_MISMATCH')
                    identity=inventory[0].get('bse_identity')
                    if not identity or identity['header']['ISIN']!=isin:raise ValueError('BSE_IDENTITY_UNPROVEN')
                    candidates=[x for x in review[0].get('candidates',[]) if x.get('scope_bridge_proof')]
                    for candidate in candidates:
                        try:
                            outcome['proofs_attempted']+=1;reference=candidate['scope_bridge_proof'];digest=reference['sha256']
                            if not re.fullmatch(r'[a-f0-9]{64}',digest) or reference['r2_key']!=batch.PREFIX+'scope-bridge-proof/sha256='+digest+'/proof.json':raise ValueError('SCOPE_PROOF_REFERENCE_UNPROVEN')
                            encoded=client.get_object(Bucket=batch.BUCKET,Key=reference['r2_key'])['Body'].read()
                            if batch.sha(encoded)!=digest:raise ValueError('SCOPE_PROOF_HASH_MISMATCH')
                            witness=json.loads(encoded)
                            if (witness['contract']!=CONTRACT or witness['symbol']!=symbol or witness['isin']!=isin or witness['period_end']!=period or witness['bse_original_sha256']!=candidate['original_sha256'] or witness['bse_source_url']!=candidate['source_url'] or witness['financial_page']!=candidate['parsed']['page']):raise ValueError('SCOPE_PROOF_COMPANY_QUARTER_ORIGINAL_MISMATCH')
                            with db.cursor() as cur:
                                cur.execute('SELECT raw_payload,payload_hash FROM data_source_records WHERE id=%s',(witness['current_anchor_source_record_id'],));anchor=cur.fetchone()
                                cur.execute("SELECT count(DISTINCT d.metric_code) FROM fundamental_observation_decisions d JOIN fundamental_observations o ON o.id=d.selected_observation_id WHERE d.security_id=%s AND d.period_end=%s AND d.period_type='QUARTER' AND d.consolidation_scope=%s AND o.source_record_id=%s AND d.metric_code=ANY(%s::text[])",(sid,witness['bridge']['current_period'],witness['review_evidence']['scope'],witness['current_anchor_source_record_id'],sorted(candidate['current_anchor']['facts'])));selected=cur.fetchone()[0]
                            db.rollback()
                            if (not anchor or anchor[1]!=witness['current_anchor_payload_hash'] or batch.sha(batch.canonical(anchor[0]))!=anchor[1] or selected!=3 or anchor[0].get('isin')!=isin or anchor[0].get('issuer_filing_url')!=witness['bridge']['nse_original_url']):raise ValueError('SCOPE_CURRENT_ANCHOR_CHANGED_OR_UNPROVEN')
                            raw=client.get_object(Bucket=batch.BUCKET,Key=candidate['original_r2_key'])['Body'].read()
                            if batch.sha(raw)!=candidate['original_sha256']:raise ValueError('BSE_ORIGINAL_HASH_MISMATCH')
                            nse_raw=client.get_object(Bucket=batch.BUCKET,Key=witness['nse_original_r2_key'])['Body'].read()
                            if batch.sha(nse_raw)!=witness['bridge']['nse_original_sha256']:raise ValueError('NSE_ORIGINAL_HASH_MISMATCH')
                            with fitz.open(stream=raw,filetype='pdf') as pdf:
                                parsed,evidence=extract_with_scope_bridge(pdf,witness['financial_page'],period,symbol,isin,identity['issuer_name'],witness['bridge'],symbol in batch.BANKS,symbol in batch.INSURERS)
                            if evidence!=witness['review_evidence']:raise ValueError('SCOPE_PROOF_EVIDENCE_CHANGED')
                            proof={**identity,'original_sha256':candidate['original_sha256'],'source_url':candidate['source_url'],'scope_bridge':witness['bridge']}
                            basis='AS_FILED_OWN_QUARTER' if parsed['first_column_period']==period else 'LATER_FILING_REPORTED_COMPARATIVE'
                            manifest={'symbol':symbol,'isin':isin,'issuer_name':identity['issuer_name'],'bse_scrip_code':identity['bse_scrip_code'],'original_sha256_retained':candidate['original_sha256'],'issuer_filing_url':candidate['source_url'],'financial_page':parsed['page'],'period_end':period,'consolidation_scope':parsed['scope'],'original_unit':parsed['unit'],'first_column_period':parsed['first_column_period'],'selected_column_period':period,'selected_column_index':parsed['column_index'],'source_reporting_basis':basis,'facts':parsed['facts'],'scope_evidence_basis':CONTRACT,'parser_revision':REVISION}
                            validate_original(raw,manifest,proof)
                            vector=tuple(sorted((k,v['value'],v['unit']) for k,v in parsed['facts'].items()))
                            groups[parsed['scope']].append((vector,parsed,candidate,raw,proof,basis))
                        except Exception as error:
                            db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                    for scope,options in groups.items():
                        if len({x[0] for x in options})!=1:rejects['CONFLICTING_SCOPE_BRIDGED_TRIOS']+=1;continue
                        _,parsed,source,raw,proof,basis=sorted(options,key=lambda x:x[2]['original_sha256'])[0]
                        proof_raw=batch.canonical(proof);digest=batch.sha(proof_raw);key=batch.PREFIX+'bse-dated-identity/sha256='+digest+'/proof.json';batch.immutable_put(client,key,proof_raw)
                        parsed.update(scope_evidence_basis=CONTRACT,original_r2_key=source['original_r2_key'],selected_column_index=parsed['column_index'],issuer_identity_evidence_r2_key=key,issuer_identity_evidence_sha256=digest,source_reporting_basis=basis)
                        outcome['observations_inserted']+=batch.persist(db,client,(symbol,isin,sid,identity['issuer_name'],identity['bse_scrip_code']),period,source,raw,parsed,None)
                except Exception as error:
                    db.rollback();rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
                outcome['rejections']=dict(rejects);encoded=batch.canonical(outcome);digest=batch.sha(encoded)
                batch.immutable_put(client,batch.PREFIX+'scope-bridge-audit/sha256='+digest+'/audit.json',encoded)
                with db.cursor() as cur:
                    cur.execute("INSERT INTO data_source_records(source_code,record_kind,external_record_id,payload_hash,raw_payload,terms_snapshot) VALUES('COMPANY_EXCHANGE_FILING','RESULTS_R4_SCOPE_BRIDGE_AUDIT_V1',%s,%s,%s::jsonb,'{\"retention\":\"PRIVATE_ORIGINAL_REPLAY_AUDIT\"}'::jsonb) ON CONFLICT(source_code,record_kind,external_record_id,payload_hash) DO NOTHING",(str(sid)+':'+period,digest,encoded.decode()))
                db.commit();counts['slots_attempted']+=1;counts['scope_proofs_attempted']+=outcome['proofs_attempted'];counts['observations_inserted']+=outcome['observations_inserted']
                print('R4_SCOPE_BRIDGE_PROGRESS',json.dumps(dict(counts)),flush=True)
    print('R4_SCOPE_BRIDGE_FINAL',json.dumps(dict(counts)),flush=True)

if __name__=='__main__':main()
