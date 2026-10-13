"""Owner-authorized original source registration; no evidence review or READY writes."""
import hashlib,json,os,gzip,urllib.request,urllib.parse,urllib.error
from pathlib import Path

BUCKET='portfolioai-history-dev'
PREFIX='portfolioai-history/development/v1-4/g02/originals/'
AUD='https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-g02-official-source-import'
ROOT=Path('supabase/functions/_shared')

def original_valid(pin,data):
    if len(data)!=pin['original_bytes'] or len(data)>64*1024*1024 or hashlib.sha256(data).hexdigest()!=pin['original_sha256']:raise ValueError('G02_ORIGINAL_BYTES_MISMATCH')
    if pin['extension']=='pdf' and not data.startswith(b'%PDF-'):raise ValueError('G02_PDF_REQUIRED')
    return data

def ensure_original(s3,pin,fetch):
    key=PREFIX+pin['original_sha256']+'.'+pin['extension']
    try:
        data=s3.get_object(Bucket=BUCKET,Key=key)['Body'].read()
        original_valid(pin,data)
        return key,False
    except Exception as e:
        if getattr(e,'response',{}).get('Error',{}).get('Code') not in ('NoSuchKey','404'):raise
    data=original_valid(pin,fetch(pin))
    try:
        s3.put_object(Bucket=BUCKET,Key=key,Body=data,ContentType='application/pdf' if pin['extension']=='pdf' else 'text/html',IfNoneMatch='*')
    except Exception:
        # A failed transport response may follow a completed conditional write.
        # Confirm actual bytes; never repeat PUT or overwrite to manufacture success.
        original_valid(pin,s3.get_object(Bucket=BUCKET,Key=key)['Body'].read())
        return key,True
    original_valid(pin,s3.get_object(Bucket=BUCKET,Key=key)['Body'].read())
    return key,True

def decode_transport(data,encoding):
    return gzip.decompress(data) if encoding.lower()=='gzip' else data

def main():
    import boto3
    from botocore.config import Config
    if os.environ['CLOUDFLARE_R2_BUCKET']!=BUCKET:raise ValueError('DEVELOPMENT_ONLY')
    s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',s3={'addressing_style':'path'},retries={'total_max_attempts':1}))
    pins=json.loads((ROOT/'v14-g02-original-pins.json').read_text());policy=json.loads((ROOT/'v14-g02-owner-authorization.json').read_text());results=[]
    def fetch(pin):
        request=urllib.request.Request(pin['original_url'],headers={'User-Agent':'Mozilla/5.0 PortfolioAI original-source verification'})
        with urllib.request.urlopen(request,timeout=90) as r:
            data=r.read(64*1024*1024+1)
            data=decode_transport(data,r.headers.get('Content-Encoding',''))
            if len(data)!=pin['original_bytes'] or hashlib.sha256(data).hexdigest()!=pin['original_sha256']:
                print(json.dumps({'sourceHash':pin['original_sha256'],'sourceSymbol':pin['symbol'],'httpStatus':r.status,'contentType':r.headers.get('Content-Type'),'contentEncoding':r.headers.get('Content-Encoding'),'observedBytes':len(data),'observedSha256':hashlib.sha256(data).hexdigest()}))
            if r.geturl()!=pin['resolved_url']:raise ValueError('G02_ORIGINAL_REDIRECT_CHANGED')
            return data
    def invoke(pin,url):
        oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(AUD,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
        with urllib.request.urlopen(oidc,timeout=30) as r:token=json.load(r)['value']
        body={'action':'REGISTER_PINNED_G02_ORIGINAL','originalHash':pin['original_sha256'],'authorizationHash':policy['directiveSha256'],'readUrl':url}
        request=urllib.request.Request(AUD,data=json.dumps(body).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(request,timeout=120) as r:result=json.load(r)
        except urllib.error.HTTPError as e:
            response=json.load(e)
            raise RuntimeError('G02_SOURCE_IMPORT:'+str(e.code)+':'+str(response.get('code'))) from None
        if result.get('code')!='G02_ORIGINAL_REGISTERED_NOT_FINANCIALLY_ADMITTED' or result.get('providerApiCalls')!=0 or result.get('acceptedReviews')!=0 or result.get('canonicalMaterialization') is not False:raise ValueError('G02_SOURCE_IMPORT_RESPONSE_CONTRACT_INVALID')
        return result
    for pin in pins:
        try:
            key,uploaded=ensure_original(s3,pin,fetch)
            result=invoke(pin,s3.generate_presigned_url('get_object',Params={'Bucket':BUCKET,'Key':key},ExpiresIn=240))
            results.append({'symbol':pin['symbol'],'hash':pin['original_sha256'],'r2ObjectKey':key,'uploaded':uploaded,**result})
            print(json.dumps({'symbol':pin['symbol'],'sourceId':result['sourceId'],'registered':True,'acceptedReviews':0}))
        except Exception as e:
            results.append({'symbol':pin['symbol'],'hash':pin['original_sha256'],'registered':False,'errorClass':type(e).__name__})
            print(json.dumps({'symbol':pin['symbol'],'sourceHash':pin['original_sha256'],'registered':False,'errorClass':type(e).__name__}))
        Path('g02-source-import-result').mkdir(exist_ok=True)
        Path('g02-source-import-result/sanitized-results.json').write_text(json.dumps({'results':results,'providerApiCalls':0,'acceptedReviews':0,'canonicalMaterialization':False},indent=2)+'\n')

    if any(x.get('registered') is False for x in results):raise RuntimeError('G02_PARTIAL_ORIGINAL_REGISTRATION_REVIEW_ARTIFACT')

if __name__=='__main__':main()
