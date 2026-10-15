"""Archive four previously qualified public BEL originals; never admit research evidence."""
import hashlib,json,os,urllib.request,urllib.parse
from pathlib import Path

def verify(pin,data):
 if len(data)!=pin['bytes'] or hashlib.sha256(data).hexdigest()!=pin['sha256'] or not data.startswith(b'%PDF'):raise ValueError('EXACT_BEL_ORIGINAL_BYTES_REQUIRED')
 return data

def main():
 import boto3
 from botocore.config import Config
 p=json.loads(Path('scripts/v1-4/g03-bel-supplemental-original-pins.json').read_text());bucket=p['developmentBucket']
 if bucket!='portfolioai-history-dev' or os.environ['CLOUDFLARE_R2_BUCKET']!=bucket or len(p['sources'])!=4:raise ValueError('FIXED_DEVELOPMENT_BEL_ARCHIVE_REQUIRED')
 s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',s3={'addressing_style':'path'},retries={'total_max_attempts':1}));results=[]
 for pin in p['sources']:
  url=urllib.parse.urlparse(pin['url'])
  if url.scheme!='https' or url.hostname not in ['www.msei.in','nsearchives.nseindia.com'] or not url.path.endswith('.pdf') or pin['bytes']>32*1024*1024:raise ValueError('PUBLIC_ISSUER_EXCHANGE_SCOPE_REQUIRED')
  key='portfolioai-history/development/v1-4/g03/originals/'+pin['sha256']+'.pdf';written=False
  try:data=s3.get_object(Bucket=bucket,Key=key)['Body'].read()
  except s3.exceptions.NoSuchKey:
   with urllib.request.urlopen(urllib.request.Request(pin['url'],headers={'User-Agent':'Mozilla/5.0'}),timeout=45) as response:data=response.read(pin['bytes']+1)
   verify(pin,data);s3.put_object(Bucket=bucket,Key=key,Body=data,ContentType='application/pdf',IfNoneMatch='*');written=True
  verify(pin,s3.get_object(Bucket=bucket,Key=key)['Body'].read());results.append({**pin,'r2Bucket':bucket,'r2Key':key,'readbackSha256Verified':True,'r2Writes':int(written),'canonicalAdmission':False})
  out=Path('g03-bel-supplemental-originals-result');out.mkdir(exist_ok=True);(out/'sanitized-results.json').write_text(json.dumps(results,indent=2)+'\n')
 print(json.dumps({'originalsVerified':len(results),'r2Writes':sum(x['r2Writes'] for x in results),'providerCalls':0,'canonicalAdmissions':0,'canonicalMaterialization':False}))
if __name__=='__main__':main()
