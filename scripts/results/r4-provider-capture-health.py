"""Read-only health audit; never emit provider text or financial values."""
import hashlib,json,os,re

def r2_endpoint(value):
    value=value.strip().rstrip('/')
    endpoint=value if value.startswith('https://') else 'https://'+value+'.r2.cloudflarestorage.com'
    if endpoint!='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com':
        raise RuntimeError('DEVELOPMENT_R2_ENDPOINT_REQUIRED')
    return endpoint

def classify(value):
    if isinstance(value,str):
        try:return classify(json.loads(value))
        except (ValueError,TypeError):
            text=value.lower().strip()
            if re.search(r'unauthori[sz]ed|authentication failed|invalid.{0,30}(?:token|api.?key)|(?:token|api.?key).{0,30}expired',text):return 'PROVIDER_AUTH_ERROR_TEXT'
            if re.match(r'^(?:error|exception|failed)\b',text):return 'PROVIDER_ERROR_TEXT'
            return 'TEXT_RESPONSE_REQUIRES_SOURCE_REVIEW'
    if isinstance(value,dict):
        if value.get('error') or value.get('isError') or value.get('success') is False or str(value.get('status','')).lower() in ('error','failed','failure'):
            return 'PROVIDER_ERROR_ENVELOPE'
        if 'data' in value and not value['data']:return 'EMPTY_DATA_ENVELOPE'
        return 'STRUCTURED_RESPONSE_REQUIRES_SOURCE_REVIEW'
    if isinstance(value,list):return 'EMPTY_RESULT_LIST' if not value else 'RESULT_LIST_REQUIRES_SOURCE_REVIEW'
    return 'MISSING_OR_UNRECOGNIZED_RESULT'

def require_usable_result(value):
    status=classify(value)
    if status in ('PROVIDER_AUTH_ERROR_TEXT','PROVIDER_ERROR_TEXT','PROVIDER_ERROR_ENVELOPE','MISSING_OR_UNRECOGNIZED_RESULT'):
        raise RuntimeError(status)
    return value

def error_hints(value):
    if isinstance(value,str):
        try:value=json.loads(value)
        except ValueError:pass
    text=str(value.get('message','') if isinstance(value,dict) else value).lower()
    patterns={'AUTHENTICATION':r'auth|token|credential|login|password|api.?key|username',
        'QUOTA':r'quota|daily|monthly|rate.?limit|credit|limit exceeded',
        'ARGUMENT_CONTRACT':r'argument|required|schema|parameter|input|validation',
        'INSTRUMENT_IDENTITY':r'stock|symbol|isin|instrument',
        'ENTITLEMENT':r'subscription|upgrade|premium|permission|access denied|plan',
        'PROVIDER_AVAILABILITY':r'internal|server|unavailable|temporar|try again|maintenance',
        'UNSUPPORTED_CONTRACT':r'unsupported|not supported|not found|unknown|invalid'}
    return [key for key,pattern in patterns.items() if re.search(pattern,text)]

def main():
    import boto3,psycopg
    if (os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI'
        or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development'
        or 'lrgpjimipfkyoqbpsqzz' not in os.environ['SUPABASE_DB_URL']
        or os.environ['CLOUDFLARE_R2_BUCKET']!='portfolioai-history-dev'):
        raise RuntimeError('DEVELOPMENT_ONLY')
    client=boto3.client('s3',endpoint_url=r2_endpoint(os.environ['CLOUDFLARE_R2_ACCOUNT_ID']),
        aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],region_name='auto')
    with psycopg.connect(os.environ['SUPABASE_DB_URL'],options='-c default_transaction_read_only=on') as db:
        with db.cursor() as cur:
            cur.execute("SELECT raw_payload FROM data_source_records WHERE record_kind='RESULTS_R4_HISTORY_CAPTURE_V2' AND retrieved_at>=current_date ORDER BY retrieved_at DESC LIMIT 100")
            rows=cur.fetchall()
    counts={}
    for (metadata,) in rows:
        key=metadata.get('r2_key','')
        if not key.startswith('portfolioai-results/development/v1/quarterly/trendlyne-history/'):raise RuntimeError('CAPTURE_REFERENCE_UNPROVEN')
        raw=client.get_object(Bucket=os.environ['CLOUDFLARE_R2_BUCKET'],Key=key)['Body'].read()
        if hashlib.sha256(raw).hexdigest()!=metadata['sha256']:raise RuntimeError('CAPTURE_HASH_MISMATCH')
        capture=json.loads(raw);value=capture.get('result');status=classify(value)
        counts[status]=counts.get(status,0)+1
        decoded=value
        if isinstance(value,str):
            try:decoded=json.loads(value)
            except ValueError:pass
        # Only structural key names and a closed status code are public.
        known=('data','error','isError','success','status','message','content','result','tools')
        keys=[k for k in known if isinstance(decoded,dict) and k in decoded]
        print('R4_PROVIDER_CAPTURE_HEALTH',json.dumps({'tool':metadata['request']['tool'],'status':status,'known_envelope_keys':keys,'error_hints':error_hints(value) if status.startswith('PROVIDER_') else []}),flush=True)
    print('R4_PROVIDER_CAPTURE_HEALTH_TOTALS',json.dumps(counts,sort_keys=True),flush=True)

if __name__=='__main__':main()
