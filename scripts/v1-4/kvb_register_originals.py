"""Register two pinned originals through signed CI identity; never approve facts."""
import hashlib,json,os,urllib.request,urllib.parse
from pathlib import Path
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

PROJECT='lrgpjimipfkyoqbpsqzz'
AUD=f'https://{PROJECT}.supabase.co/functions/v1/v14-bank-kvb-original-import'
ACCOUNT='ced17d24f4b380721e58a08c9e9273e4'
BUCKET='portfolioai-history-dev'
proof=json.loads(Path('supabase/functions/_shared/v14-kvb-roa-original-proof.json').read_text())
assert os.environ['CLOUDFLARE_R2_BUCKET']==BUCKET
s3=boto3.client('s3',endpoint_url=f'https://{ACCOUNT}.r2.cloudflarestorage.com',region_name='auto',
 config=Config(signature_version='s3v4',s3={'addressing_style':'path'}),
 aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'])
body={'action':'REGISTER_KVB_ROA_PINNED_ORIGINALS_V1'}
for kind in ['regulator','issuer']:
 p=proof[kind];data=(Path('original-artifacts')/kind/p['fileName']).read_bytes()
 assert len(data)==p['bytes'] and hashlib.sha256(data).hexdigest()==p['sha256']
 key=f"portfolioai-research/development/v1-4/kvb-roa-original/sha256/{p['sha256']}."+('pdf' if kind=='issuer' else 'html')
 try:
  existing=s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()
  assert hashlib.sha256(existing).hexdigest()==p['sha256'],'CONFLICTING_DURABLE_ORIGINAL'
 except ClientError as e:
  if e.response['Error']['Code'] not in ['NoSuchKey','404']:raise
  s3.put_object(Bucket=BUCKET,Key=key,Body=data,ContentType=p['contentType'],IfNoneMatch='*')
 assert hashlib.sha256(s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()).hexdigest()==p['sha256']
 body[kind+'ReadUrl']=s3.generate_presigned_url('get_object',Params={'Bucket':BUCKET,'Key':key},ExpiresIn=120)
req=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(AUD,safe=''),
 headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
with urllib.request.urlopen(req,timeout=30) as response:token=json.load(response)['value']
request=urllib.request.Request(AUD,data=json.dumps(body).encode(),method='POST',
 headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
with urllib.request.urlopen(request,timeout=90) as response:result=json.load(response)
assert result['code']=='PINNED_ORIGINALS_REGISTERED_NOT_REVIEWED' and result['canonicalPromotion'] is False
Path('source-import-result').mkdir(exist_ok=True)
Path('source-import-result/registration.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
