"""Verify actual pinned PDF bytes and original passages before delegated document review."""
import json,os,hashlib,re,tempfile,subprocess,urllib.request,urllib.parse,urllib.error
from pathlib import Path
from g02_source_import import BUCKET,PREFIX,original_valid
AUD='https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-g02-document-admission'
def main():
 import boto3
 from botocore.config import Config
 if os.environ['CLOUDFLARE_R2_BUCKET']!=BUCKET:raise ValueError('DEVELOPMENT_ONLY')
 s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',retries={'total_max_attempts':1}))
 root=Path('supabase/functions/_shared');pins=json.loads((root/'v14-g02-original-pins.json').read_text());batch=json.loads((root/'v14-g02-document-review-batch.json').read_text());policy=json.loads((root/'v14-g02-owner-authorization.json').read_text());results=[]
 for b in batch:
  pin=next(p for p in pins if p['original_sha256']==b['originalHash']);data=original_valid(pin,s3.get_object(Bucket=BUCKET,Key=PREFIX+b['originalHash']+'.pdf')['Body'].read())
  with tempfile.TemporaryDirectory() as temp:
   pdf=Path(temp)/'source.pdf';txt=Path(temp)/'source.txt';pdf.write_bytes(data);subprocess.run(['pdftotext','-layout','-enc','UTF-8',str(pdf),str(txt)],check=True);text=re.sub(r'\s+',' ',txt.read_text()).strip()
   if b['fragment'] not in text:raise ValueError('G02_LITERAL_ORIGINAL_PASSAGE_NOT_FOUND:'+b['symbol'])
  oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(AUD,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
  with urllib.request.urlopen(oidc,timeout=30) as r:token=json.load(r)['value']
  body={'action':'ADMIT_FIXED_G02_DURABILITY_DOCUMENT','authorizationHash':policy['directiveSha256'],'securityId':b['securityId'],'requirementCode':b['requirementCode'],'originalHash':b['originalHash'],'normalizedFragment':b['fragment'],'extractionMethod':'POPPLER_LAYOUT_WHITESPACE_NORMALIZED_ORIGINAL_BYTES'}
  req=urllib.request.Request(AUD,data=json.dumps(body).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=90) as r:result=json.load(r)
  except urllib.error.HTTPError as e:
   err=json.load(e);raise RuntimeError('G02_DOCUMENT_ADMISSION:'+str(e.code)+':'+str(err.get('code'))+':'+str(err.get('postgresCode'))) from None
  if result.get('code')!='G02_DOCUMENT_REVIEW_ADMITTED_NOT_CANONICAL_READY' or result.get('providerApiCalls')!=0 or result.get('canonicalMaterialization') is not False:raise ValueError('G02_DOCUMENT_ADMISSION_CONTRACT_INVALID')
  results.append({'symbol':b['symbol'],'verifiedOriginalSha256':hashlib.sha256(data).hexdigest(),'literalPassageVerified':True,**result});print(json.dumps(results[-1]))
  out=Path('g02-document-admission-result');out.mkdir(exist_ok=True);(out/'sanitized-results.json').write_text(json.dumps(results,indent=2)+'\n')
if __name__=='__main__':main()
