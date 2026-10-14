"""Register exact official tail originals and renew existing scoped history proofs."""
import json,os,hashlib,urllib.request,urllib.parse,urllib.error,http.cookiejar
from pathlib import Path
import boto3
from botocore.config import Config
AUD='https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-g02-document-admission'
BUCKET='portfolioai-history-dev';PREFIX='portfolioai-history/development/v1-4/g02/history-tail/'
def main():
 if os.environ['CLOUDFLARE_R2_BUCKET']!=BUCKET:raise ValueError('DEVELOPMENT_ONLY')
 root=Path('supabase/functions/_shared');pins=json.loads((root/'v14-g02-history-renewal-pins.json').read_text());policy=json.loads((root/'v14-g02-owner-authorization.json').read_text())
 s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',retries={'total_max_attempts':1}))
 opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));urls=[]
 for p in pins['sources']:
  key=PREFIX+p['hash']+'.'+p['extension']
  try:data=s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()
  except s3.exceptions.NoSuchKey:
   if p['extension']=='json':
    with opener.open(urllib.request.Request('https://www.nseindia.com',headers={'User-Agent':'Mozilla/5.0'}),timeout=30) as r:r.read(1048576)
   with opener.open(urllib.request.Request(p['url'],headers={'User-Agent':'Mozilla/5.0','Referer':'https://www.nseindia.com/'}),timeout=40) as r:data=r.read(p['bytes']+1)
   if len(data)!=p['bytes'] or hashlib.sha256(data).hexdigest()!=p['hash']:raise ValueError('OFFICIAL_ORIGINAL_CHANGED_REQUALIFICATION_REQUIRED')
   s3.put_object(Bucket=BUCKET,Key=key,Body=data,IfNoneMatch='*',ContentType='application/json' if p['extension']=='json' else 'text/csv')
  read=s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()
  if len(read)!=p['bytes'] or hashlib.sha256(read).hexdigest()!=p['hash']:raise ValueError('IMMUTABLE_ORIGINAL_READBACK_FAILED')
  urls.append(s3.generate_presigned_url('get_object',Params={'Bucket':BUCKET,'Key':key},ExpiresIn=300))
 oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(AUD,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
 with urllib.request.urlopen(oidc,timeout=30) as r:token=json.load(r)['value']
 body={'action':'RENEW_FIXED_G02_STOCK_HISTORY','authorizationHash':policy['directiveSha256'],'readUrls':urls}
 request=urllib.request.Request(AUD,data=json.dumps(body).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(request,timeout=180) as r:result=json.load(r)
 except urllib.error.HTTPError as e:
  error=json.load(e);raise RuntimeError('G02_HISTORY_RENEWAL:'+str(error.get('code'))) from None
 if result.get('code')!='G02_STOCK_HISTORY_PROOFS_RENEWED_NOT_READY' or len(result.get('results',[]))!=3 or result.get('providerApiCalls')!=0:raise ValueError('G02_HISTORY_RENEWAL_CONTRACT_INVALID')
 out=Path('g02-document-admission-result');out.mkdir(exist_ok=True);(out/'history-renewal.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if __name__=='__main__':main()
