"""Content-addressed private R2 cache of the canonical readback, not a new classifier."""
import json
from pathlib import Path
from r4_source_archive import BUCKET,PREFIX,canonical,sha

CONTRACT='RESULTS_R4_CANONICAL_MONITOR_READBACK_CACHE_V1'

def engine_revision(reader):
    return sha(Path(reader.__file__).read_bytes()+b'\0'+Path(__file__).read_bytes())

def input_fingerprint(reader,db_url,connection):
    if reader.EXPECTED_REF not in db_url:raise ValueError('DEVELOPMENT_READBACK_REQUIRED')
    signatures=[]
    with connection.cursor() as cur:
        for sql,parameters in ((reader.COHORT_SQL,(reader.PORTFOLIO_ID,)),
            (reader.SELECTED_SQL,(list(reader.PERIODS),list(reader.METRICS))),
            (reader.CANDIDATE_SQL,(list(reader.PERIODS),list(reader.METRICS)))):
            cur.execute("SELECT count(*),encode(sha256(convert_to(coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.id)::text,'[]'),'UTF8')),'hex') FROM ("+sql+") q",parameters)
            signatures.append(cur.fetchone())
    return sha(canonical(signatures))


def cached_readback(reader,db_url,client):
    import psycopg
    if reader.EXPECTED_REF not in db_url:raise ValueError('DEVELOPMENT_READBACK_REQUIRED')
    with psycopg.connect(db_url,options='-c default_transaction_read_only=on') as connection:
        connection.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY')
        return snapshot_readback(reader,db_url,client,connection)


def snapshot_readback(reader,db_url,client,connection):
    # Fingerprint and full canonical classification use the same read-only snapshot.
    revision=engine_revision(reader);fingerprint=input_fingerprint(reader,db_url,connection)
    key=PREFIX+'monitor-readbacks/v1/engine='+revision+'/inputs='+fingerprint+'/report.json'
    try:
        raw=client.get_object(Bucket=BUCKET,Key=key)['Body'].read()
    except Exception as error:
        if getattr(error,'response',{}).get('Error',{}).get('Code') not in ('404','NoSuchKey','NotFound'):raise
        raw=None
    if raw is not None:
        value=json.loads(raw)
        if (value.get('contract')!=CONTRACT or value.get('engine_revision')!=revision
            or value.get('input_fingerprint')!=fingerprint
            or value.get('report_sha256')!=sha(canonical(value.get('report')))):
            raise ValueError('CANONICAL_MONITOR_CACHE_UNPROVEN')
        return value['report']
    report=json.loads(canonical(reader.readback(db_url,connection=connection)))
    value={'contract':CONTRACT,'engine_revision':revision,'input_fingerprint':fingerprint,
           'report_sha256':sha(canonical(report)),'report':report}
    body=canonical(value)
    client.put_object(Bucket=BUCKET,Key=key,Body=body,IfNoneMatch='*',ContentType='application/json')
    if client.get_object(Bucket=BUCKET,Key=key)['Body'].read()!=body:
        raise ValueError('CANONICAL_MONITOR_CACHE_WRITE_UNVERIFIED')
    return report
