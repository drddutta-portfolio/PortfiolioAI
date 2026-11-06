#!/usr/bin/env python3
"""Development-only, lossless operational payload compaction into private R2."""
import argparse,concurrent.futures,json,os,re,sys
from collections import Counter
from datetime import datetime,timezone
from pathlib import Path
import boto3,psycopg
from botocore.config import Config
from psycopg.rows import dict_row
from r4_source_archive import BUCKET,PREFIX,KINDS,canonical,sha,original_key,compact_payload,resolve_payload,r2_client_from_env

REF='lrgpjimipfkyoqbpsqzz'
REPO='drddutta-portfolio/PortfiolioAI'
JOURNAL=PREFIX+'storage-relief/v1/'

def retain(client,key,raw):
    try:
        existing=client.get_object(Bucket=BUCKET,Key=key)['Body'].read()
        if existing!=raw:raise ValueError('IMMUTABLE_ARCHIVE_CONFLICT')
    except Exception as error:
        if getattr(error,'response',{}).get('Error',{}).get('Code') not in ('404','NoSuchKey','NotFound'):raise
        client.put_object(Bucket=BUCKET,Key=key,Body=raw,IfNoneMatch='*',ContentType='application/json')
    result=client.get_object(Bucket=BUCKET,Key=key)['Body'].read()
    if result!=raw:raise ValueError('ARCHIVE_POST_WRITE_VERIFICATION_FAILED')

def snapshot(db,cutoff):
    result={}
    for table,time_column in (('transactions','created_at'),('fundamental_observations','created_at'),
                              ('fundamental_observation_decisions','decided_at')):
        # Fixed approved identifiers; protect existing rows while allowing legitimate new activity.
        with db.cursor() as cur:
            cur.execute("SELECT count(*) AS rows,encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'[]'),'UTF8')),'hex') AS digest FROM public."+table+" t WHERE coalesce("+time_column+",'-infinity'::timestamptz)<=%s::timestamptz",(cutoff,))
            result[table]=cur.fetchone()
    with db.cursor() as cur:
        cur.execute("SELECT count(*) AS rows,encode(sha256(convert_to(coalesce(string_agg(id::text||':'||payload_hash||':'||record_kind,',' ORDER BY id),''),'UTF8')),'hex') AS digest FROM public.data_source_records WHERE coalesce(created_at,'-infinity'::timestamptz)<=%s::timestamptz",(cutoff,))
        result['source_record_identities']=cur.fetchone()
    db.rollback()
    return result


def footprint(db):
    with db.cursor() as cur:
        cur.execute("SELECT pg_database_size(current_database()) database_bytes,pg_total_relation_size('public.data_source_records') source_relation_bytes")
        value=cur.fetchone()
    db.rollback();return value

def prepare(client,row):
    digest=row['payload_hash'];key=original_key(row['record_kind'],digest)
    raw=client.get_object(Bucket=BUCKET,Key=key)['Body'].read()
    if sha(raw)!=digest:raise ValueError('PRIVATE_ORIGINAL_HASH_MISMATCH')
    original=json.loads(raw)
    if original.get('contract')!=row['record_kind']:raise ValueError('PRIVATE_ORIGINAL_KIND_MISMATCH')
    for field in ('symbol','isin','security_id','period_end'):
        if original.get(field)!=row.get(field):raise ValueError('PRIVATE_ORIGINAL_CONTEXT_MISMATCH')
    index=compact_payload(original,digest)
    if index is original:return None
    if resolve_payload(client,index,digest)!=original:raise ValueError('PRIVATE_ORIGINAL_RESTORE_CHECK_FAILED')
    return row,original,index,len(raw),len(canonical(index))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--reclaim',action='store_true');options=parser.parse_args()
    db_url=os.environ.get('SUPABASE_DB_URL','')
    if (REF not in db_url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=BUCKET
        or os.environ.get('GITHUB_REPOSITORY')!=REPO
        or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development'):
        raise ValueError('DEVELOPMENT_STORAGE_BOUNDARY_REQUIRED')
    if options.apply and os.environ.get('RESULTS_STORAGE_RELIEF_ACK')!='VERIFY_R2_BEFORE_COMPACTING_DIAGNOSTICS':
        raise ValueError('STORAGE_COMPACTION_ACK_REQUIRED')
    client=r2_client_from_env();counts=Counter();run=os.environ['GITHUB_RUN_ID']
    with psycopg.connect(db_url,row_factory=dict_row) as db:
        with db.cursor() as cur:
            cur.execute('SELECT clock_timestamp()::text cutoff');cutoff=cur.fetchone()['cutoff']
        db.rollback()
        if options.apply:
            with db.cursor() as cur:
                cur.execute("SELECT EXISTS(SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid WHERE t.tgrelid='public.data_source_records'::regclass AND t.tgname='data_source_records_immutable' AND t.tgenabled='O' AND p.proname='portfolioai_guard_source_record_archive_v1') approved")
                if not cur.fetchone()['approved']:raise ValueError('VERSIONED_ARCHIVAL_MIGRATION_APPROVAL_REQUIRED')
            db.rollback()
        before=snapshot(db,cutoff);size_before=footprint(db)
        with db.cursor() as cur:
            cur.execute("""SELECT d.id,d.record_kind,d.payload_hash,d.raw_payload->>'symbol' symbol,
                d.raw_payload->>'isin' isin,d.raw_payload->>'security_id' security_id,
                d.raw_payload->>'period_end' period_end
                FROM public.data_source_records d
                WHERE d.source_code='COMPANY_EXCHANGE_FILING' AND d.record_kind=ANY(%s::text[]) AND NOT d.raw_payload ? 'archive_reference'
                  AND d.raw_payload->>'diagnostic_only'='true'
                  AND coalesce(d.created_at,'-infinity'::timestamptz)<=%s::timestamptz
                  AND NOT EXISTS(SELECT 1 FROM public.fundamental_observations o WHERE o.source_record_id=d.id)
                ORDER BY d.id""",(list(KINDS),cutoff))
            rows=cur.fetchall()
        db.rollback()
        if len(rows)>10000:raise ValueError('BOUNDED_OPERATIONAL_ARCHIVE_EXCEEDED')
        plan={'contract':'RESULTS_R4_OPERATIONAL_STORAGE_RELIEF_PLAN_V1','environment':'Development',
              'source_commit':os.environ['GITHUB_SHA'],'created_at':datetime.now(timezone.utc).isoformat(),
              'protected_cutoff':cutoff,'before':before,'footprint_before':size_before,'records':[{**r,'id':str(r['id'])} for r in rows]}
        data=canonical(plan);retain(client,JOURNAL+'run='+run+'/plan-sha256='+sha(data)+'.json',data)
        counts['candidate_indexes']=len(rows);mutated=[]
        # R2 supplies full original bytes; the DB sends only compact identity metadata.
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            pending={pool.submit(prepare,client,row):row for row in rows}
            for future in concurrent.futures.as_completed(pending):
                try:prepared=future.result()
                except Exception as error:
                    reason=str(error) if re.fullmatch(r'[A-Z_]{1,90}',str(error)) else type(error).__name__
                    counts['preserved_unarchived_'+reason]+=1
                    continue
                counts['archives_checked']+=1
                if prepared is None:continue
                row,original,index,old_bytes,new_bytes=prepared
                counts['eligible_indexes']+=1
                if options.apply:
                    with db.cursor() as cur:
                        cur.execute("SELECT set_config('portfolioai.storage_archive_mode','R4_PRIVATE_R2_20261105_V1',true)")
                        cur.execute("""UPDATE public.data_source_records d SET raw_payload=%s::jsonb
                            WHERE d.source_code='COMPANY_EXCHANGE_FILING' AND d.id=%s AND d.payload_hash=%s AND d.raw_payload=%s::jsonb
                              AND NOT EXISTS(SELECT 1 FROM public.fundamental_observations o WHERE o.source_record_id=d.id)""",
                            (canonical(index).decode(),row['id'],row['payload_hash'],canonical(original).decode()))
                        if cur.rowcount!=1:raise ValueError('ARCHIVE_COMPARE_AND_SWAP_FAILED')
                    db.commit();mutated.append(str(row['id']));counts['indexes_compacted']+=1
                counts['projected_json_bytes_reduction']+=old_bytes-new_bytes
                if options.apply:counts['json_bytes_removed']+=old_bytes-new_bytes
                if counts['archives_checked']%100==0:
                    print('STORAGE_RELIEF_PROGRESS',json.dumps(dict(counts),sort_keys=True),flush=True)
        after=snapshot(db,cutoff)
        if before!=after:raise ValueError('CANONICAL_RECORDS_CHANGED_DURING_STORAGE_RELIEF')
        report={'contract':'RESULTS_R4_OPERATIONAL_STORAGE_RELIEF_RESULT_V1','environment':'Development',
                'protected_cutoff':cutoff,'mode':'APPLY' if options.apply else 'DRY_RUN','counts':dict(counts),'protected_before':before,
                'protected_after':after,'compacted_record_ids':sorted(mutated),'footprint_before':size_before,
                'footprint_before_reclaim':footprint(db),'reclaim':'NOT_REQUESTED'}
    if options.reclaim:
        # Space maintenance only: no rows, financial values, indexes or schema definitions removed.
        # Fail quickly if another transaction holds a conflicting table lock.
        try:
            with psycopg.connect(db_url,autocommit=True) as maintenance:
                maintenance.execute("SET lock_timeout='5s'")
                maintenance.execute("SET statement_timeout='120s'")
                maintenance.execute('VACUUM (FULL, ANALYZE) public.data_source_records')
            report['reclaim']='FULL_VACUUM_COMPLETED'
        except psycopg.errors.LockNotAvailable:report['reclaim']='DEFERRED_ACTIVE_READER_LOCK'
        except psycopg.errors.QueryCanceled:report['reclaim']='DEFERRED_MAINTENANCE_TIMEOUT'
    with psycopg.connect(db_url,row_factory=dict_row) as db:
        report['footprint_after']=footprint(db)
        if snapshot(db,cutoff)!=before:raise ValueError('POST_MAINTENANCE_CANONICAL_CHECK_FAILED')
    encoded=canonical(report);retain(client,JOURNAL+'run='+run+'/result-sha256='+sha(encoded)+'.json',encoded)
    Path('tmp/results-storage-relief').mkdir(parents=True,exist_ok=True)
    Path('tmp/results-storage-relief/aggregate.json').write_text(json.dumps({k:v for k,v in report.items() if k not in ('compacted_record_ids','protected_before','protected_after')},sort_keys=True))
    print('STORAGE_RELIEF_RESULT',json.dumps({k:v for k,v in report.items() if k not in ('compacted_record_ids','protected_before','protected_after')},sort_keys=True),flush=True)

if __name__=='__main__':
    try:main()
    except Exception as error:raise SystemExit('STORAGE_RELIEF_FAILED_'+type(error).__name__) from None
