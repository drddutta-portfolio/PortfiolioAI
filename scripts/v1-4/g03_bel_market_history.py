"""One governed G03 tail acquisition; never automatically retry provider execution."""
import json,os,hashlib,urllib.request,urllib.parse,urllib.error
from pathlib import Path
BASE='https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/'
def main():
 root=Path('supabase/functions/_shared');policy=json.loads((root/'v14-g03-market-authorization.json').read_text());grant_url=BASE+'v14-g02-execution-grant'
 oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(grant_url,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
 with urllib.request.urlopen(oidc,timeout=30) as r:token=json.load(r)['value']
 if os.environ.get('G03_RETAINED_CAPTURE_ID'):
  Path('g03-bel-market-history-result').mkdir(exist_ok=True)
  renew_history(token,os.environ['G03_RETAINED_CAPTURE_ID']);return
 grant_req=urllib.request.Request(grant_url,data=json.dumps({'action':'ISSUE_G03_HISTORY_TAIL_GRANT','authorizationHash':policy['directiveSha256'],'sessionDate':os.environ['G03_SESSION_DATE']}).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 with urllib.request.urlopen(grant_req,timeout=60) as r:grant=json.load(r)
 if grant.get('code')!='G03_HISTORY_TAIL_GRANT':raise ValueError('G03_HISTORY_GRANT_CONTRACT_INVALID')
 body={'action':'V1_4_G03_HISTORY_TAIL','portfolioId':policy['portfolioId'],'sessionDate':os.environ['G03_SESSION_DATE'],'calendarDecisionId':os.environ['G03_CALENDAR_DECISION_ID'],'grantId':grant['grantId']}
 req=urllib.request.Request(grant_url,data=json.dumps(body).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=240) as r:result=json.load(r)
 except urllib.error.HTTPError as e:
  result={'httpStatus':e.code,**json.load(e)}
 out=Path('g03-bel-market-history-result');out.mkdir(exist_ok=True);(out/'sanitized-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
 if result.get('httpStatus'):raise ValueError('G03_HISTORY_EXECUTION_BLOCKED_NO_AUTOMATIC_RETRY')
 transport=result.get('transport',{})
 if result.get('canonicalMaterialization') is not False or transport.get('historyRequests',99)>1 or transport.get('authenticationRequests',99)>1 or result.get('retryAttempts')!=0:raise ValueError('G03_HISTORY_ACCOUNTING_CONTRACT_INVALID')
 if any(r.get('status')=='FAILED' for r in result.get('results',[])):raise ValueError('G03_HISTORY_PARTIAL_FAILURE_REVIEW_RESULTS_NO_RETRY')
 capture=next((r.get('sourceRecordId') for r in result.get('results',[]) if r.get('status')=='INGESTED_NOT_QUALIFIED'),None)
 if not capture:raise ValueError('G03_ACTUAL_PRICE_CAPTURE_REQUIRED')
 if os.environ.get('G03_CAPTURE_ONLY')=='true':
  print(json.dumps({'capturedForSeparateQualification':capture,'canonicalMaterialization':False}));return
 renew_history(token,capture)
def renew_history(token,capture):
 import boto3
 from botocore.config import Config
 if os.environ['CLOUDFLARE_R2_BUCKET']!='portfolioai-history-dev':raise ValueError('DEVELOPMENT_R2_REQUIRED')
 root=Path('supabase/functions/_shared');pins=json.loads((root/'v14-g03-market-renewal-pins.json').read_text());policy=json.loads((root/'v14-g03-market-authorization.json').read_text())
 s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',s3={'addressing_style':'path'},retries={'total_max_attempts':1}));urls=[]
 for p in pins['sources']:
  try:data=s3.get_object(Bucket='portfolioai-history-dev',Key=p['r2_key'])['Body'].read()
  except s3.exceptions.NoSuchKey:
   name='corporate-actions-08-14.json' if p['extension']=='json' else 'ind_close_all_14102026.csv'
   data=(Path('scripts/v1-4/fixtures/g03-market-tail')/name).read_bytes()
   if len(data)!=p['bytes'] or hashlib.sha256(data).hexdigest()!=p['hash']:raise ValueError('G03_RETAINED_ORIGINAL_MISMATCH')
   s3.put_object(Bucket='portfolioai-history-dev',Key=p['r2_key'],Body=data,IfNoneMatch='*',ContentType='application/json' if p['extension']=='json' else 'text/csv')
  check=s3.get_object(Bucket='portfolioai-history-dev',Key=p['r2_key'])['Body'].read()
  if len(check)!=p['bytes'] or hashlib.sha256(check).hexdigest()!=p['hash']:raise ValueError('G03_R2_ORIGINAL_READBACK_MISMATCH')
  urls.append(s3.generate_presigned_url('get_object',Params={'Bucket':'portfolioai-history-dev','Key':p['r2_key']},ExpiresIn=300))
 req=urllib.request.Request(BASE+'v14-g02-execution-grant',data=json.dumps({'action':'RENEW_FIXED_G03_BEL_HISTORY','authorizationHash':policy['directiveSha256'],'captureId':capture,'readUrls':urls}).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as r:result=json.load(r)
 except urllib.error.HTTPError as e:
  result={'httpStatus':e.code,**json.load(e)}
 (Path('g03-bel-market-history-result')/'history-renewal.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
 if result.get('code')!='G03_BEL_HISTORY_RENEWED_NOT_READY':raise ValueError('G03_RENEWAL_FAILED_NO_PROVIDER_RETRY')
if __name__=='__main__':main()
