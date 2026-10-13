"""Signed source qualification only; no owner approval or canonical materialization."""
import json,os,hashlib,base64,urllib.request,urllib.parse
from pathlib import Path
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from kvb_pb_raw_archive_receipts import extract
AUD='https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-kvb-pb-admission'
BUCKET='portfolioai-history-dev';ROOT=Path('supabase/functions/_shared');OUTPUT=Path('kvb-valuation-bundle-result');OUTPUT.mkdir(exist_ok=True)
if os.environ['CLOUDFLARE_R2_BUCKET']!=BUCKET:raise ValueError('DEVELOPMENT_ONLY')
s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',s3={'addressing_style':'path'},retries={'total_max_attempts':1}))
def invoke(action,extra=None):
    oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(AUD,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
    with urllib.request.urlopen(oidc,timeout=30) as r:token=json.load(r)['value']
    request=urllib.request.Request(AUD,data=json.dumps({'action':action,**(extra or {})}).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(request,timeout=240) as r:return json.load(r)
    except urllib.error.HTTPError as e:
        details=json.load(e);print(json.dumps({'failedAction':action,'code':details.get('code'),'status':e.code}));raise RuntimeError(details.get('code','EXECUTION_FAILED')) from None
request=invoke('READ_KVB_VALUATION_SOURCE_REQUEST');receipts=extract(s3,BUCKET,request['archives'])
def original_read_url(data,pin,extension="json"):
    sha=hashlib.sha256(data).hexdigest()
    if sha!=pin['original_sha256']:raise ValueError('PINNED_ORIGINAL_BYTES_CONFLICT')
    key='portfolioai-history/development/v1-4/banking/pit-originals/'+sha+'.'+extension
    try:
        found=s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()
        if found!=data:raise ValueError('DURABLE_ORIGINAL_CONFLICT')
    except ClientError as e:
        if e.response['Error']['Code'] not in ['NoSuchKey','404']:raise
        s3.put_object(Bucket=BUCKET,Key=key,Body=data,ContentType='text/html' if extension=='html' else 'application/json',IfNoneMatch='*')
    return s3.generate_presigned_url('get_object',Params={'Bucket':BUCKET,'Key':key},ExpiresIn=240)
tail=json.loads((ROOT/'v14-kvb-history-renewal-tail-pin.json').read_text());late=json.loads((ROOT/'v14-kvb-valuation-ca-late-pin.json').read_text())
timing={'original_sha256':'9b138c51ef3e05cef9fdc05746614f7919d8c8018e0fede788b228672b044067'}
result=invoke('PREPARE_KVB_PB_PE_SOURCE_BATCH',{'timingReadUrl':original_read_url(base64.b64decode(json.loads((ROOT/'v14-kvb-nse-timing-original.json').read_text())['body_base64'],validate=True),timing,'html'),'receipts':receipts,'tailReadUrl':original_read_url(b'[]',tail),'lateCaReadUrl':original_read_url((ROOT/'v14-kvb-valuation-ca-late-original.json').read_bytes(),late)})
(OUTPUT/'sanitized-result.json').write_text(json.dumps(result,indent=2)+'\n')
(OUTPUT/'raw-archive-receipts.json').write_text(json.dumps({'receipts':receipts,'providerCalls':0,'canonicalAdmissions':0,'retries':0},indent=2)+'\n')
print(json.dumps({'code':result.get('code'),'verifiedRawMonths':len(receipts),'canonicalAdmissions':0,'providerCalls':0}))
