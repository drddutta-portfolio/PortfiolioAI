"""Private R2 authority for bulky operational evidence; compact DB indexes only."""
import copy,hashlib,json,re

BUCKET='portfolioai-history-dev'
PREFIX='portfolioai-results/development/v1/quarterly/'
CONTRACT='RESULTS_R4_PRIVATE_R2_PAYLOAD_ARCHIVE_V1'
KINDS={
    'RESULTS_R4_BSE_DATED_PDF_REVIEW_V1':('bse-dated-pdf-review','capture.json'),
    'RESULTS_R4_DATED_OCR_HEADER_DIAGNOSTIC_V1':('ocr-header-diagnostics','diagnostic.json'),
}

def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def sha(raw):return hashlib.sha256(raw).hexdigest()

def original_key(kind,digest):
    if kind not in KINDS or not re.fullmatch(r'[a-f0-9]{64}',str(digest)):
        raise ValueError('OPERATIONAL_ARCHIVE_SCOPE_UNPROVEN')
    folder,name=KINDS[kind]
    return PREFIX+folder+'/sha256='+digest+'/'+name

def compact_payload(payload,digest):
    if payload.get('archive_reference'):
        raise ValueError('ALREADY_ARCHIVED_PAYLOAD')
    if payload.get('diagnostic_only') is not True:raise ValueError('DIAGNOSTIC_ARCHIVE_ONLY')
    raw=canonical(payload);kind=payload.get('contract');key=original_key(kind,digest)
    if sha(raw)!=digest:raise ValueError('ORIGINAL_OPERATIONAL_PAYLOAD_HASH_MISMATCH')
    if len(raw)<4096:return payload
    index=copy.deepcopy(payload)
    if kind=='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1':
        for source in index.get('all_sources',[]):
            source.pop('header_layouts',None);source.pop('basis_excerpts',None)
    else:
        for field in ('rows','date_header_candidates','labels_without_amounts',
                      'metric_row_geometry','native_fonts','native_unit_spans'):
            index.pop(field,None)
    reference={'contract':CONTRACT,'bucket':BUCKET,'r2_key':key,
               'original_payload_sha256':digest,'original_bytes':len(raw),
               'index_sha256':sha(canonical(index))}
    index['archive_reference']=reference
    return index if len(canonical(index))<len(raw)*0.8 else payload

def resolve_payload(client,payload,digest):
    reference=payload.get('archive_reference')
    if not reference:
        if sha(canonical(payload))!=digest:raise ValueError('OPERATIONAL_PAYLOAD_HASH_MISMATCH')
        return payload
    expected=original_key(payload.get('contract'),digest)
    index={k:v for k,v in payload.items() if k!='archive_reference'}
    if (reference.get('contract')!=CONTRACT or reference.get('bucket')!=BUCKET
        or reference.get('r2_key')!=expected or reference.get('original_payload_sha256')!=digest
        or reference.get('index_sha256')!=sha(canonical(index))):
        raise ValueError('OPERATIONAL_ARCHIVE_REFERENCE_UNPROVEN')
    raw=client.get_object(Bucket=BUCKET,Key=expected)['Body'].read()
    if sha(raw)!=digest or len(raw)!=reference.get('original_bytes'):
        raise ValueError('OPERATIONAL_ARCHIVE_ORIGINAL_HASH_MISMATCH')
    original=json.loads(raw)
    if sha(canonical(original))!=digest or compact_payload(original,digest)!=payload:
        raise ValueError('OPERATIONAL_ARCHIVE_INDEX_OR_CONTEXT_MISMATCH')
    return original


def r2_client_from_env():
    import os
    import boto3
    from botocore.config import Config
    if os.environ.get('CLOUDFLARE_R2_BUCKET')!=BUCKET:raise ValueError('PRIVATE_DEVELOPMENT_BUCKET_REQUIRED')
    account=os.environ['CLOUDFLARE_R2_ACCOUNT_ID'].strip()
    if not re.fullmatch(r'[a-f0-9]{32}',account):
        match=re.fullmatch(r'https://([a-f0-9]{32})\.r2\.cloudflarestorage\.com/?',account)
        if not match:raise ValueError('INVALID_DEVELOPMENT_R2_ACCOUNT')
        account=match[1]
    return boto3.client('s3',endpoint_url='https://'+account+'.r2.cloudflarestorage.com',
        aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],region_name='auto',
        config=Config(retries={'max_attempts':2,'mode':'standard'},max_pool_connections=12))
