"""One governed G02 tail acquisition; never automatically retry provider execution."""
import json,os,urllib.request,urllib.parse,urllib.error
from pathlib import Path
BASE='https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/'
def main():
 root=Path('supabase/functions/_shared');policy=json.loads((root/'v14-g02-owner-authorization.json').read_text());grant_url=BASE+'v14-g02-execution-grant'
 oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(grant_url,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
 with urllib.request.urlopen(oidc,timeout=30) as r:token=json.load(r)['value']
 grant_req=urllib.request.Request(grant_url,data=json.dumps({'action':'ISSUE_G02_HISTORY_TAIL_GRANT','authorizationHash':policy['directiveSha256'],'sessionDate':os.environ['G02_SESSION_DATE']}).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 with urllib.request.urlopen(grant_req,timeout=60) as r:grant=json.load(r)
 if grant.get('code')!='G02_HISTORY_TAIL_GRANT':raise ValueError('G02_HISTORY_GRANT_CONTRACT_INVALID')
 body={'action':'V1_4_G02_HISTORY_TAIL','portfolioId':policy['portfolioId'],'sessionDate':os.environ['G02_SESSION_DATE'],'calendarDecisionId':os.environ['G02_CALENDAR_DECISION_ID'],'grantId':grant['grantId']}
 req=urllib.request.Request(grant_url,data=json.dumps(body).encode(),method='POST',headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=240) as r:result=json.load(r)
 except urllib.error.HTTPError as e:
  result={'httpStatus':e.code,**json.load(e)}
 out=Path('g02-market-history-result');out.mkdir(exist_ok=True);(out/'sanitized-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
 if result.get('httpStatus'):raise ValueError('G02_HISTORY_EXECUTION_BLOCKED_NO_AUTOMATIC_RETRY')
 transport=result.get('transport',{})
 if result.get('canonicalMaterialization') is not False or transport.get('historyRequests',99)>3 or transport.get('authenticationRequests',99)>1 or result.get('retryAttempts')!=0:raise ValueError('G02_HISTORY_ACCOUNTING_CONTRACT_INVALID')
 if any(r.get('status')=='FAILED' for r in result.get('results',[])):raise ValueError('G02_HISTORY_PARTIAL_FAILURE_REVIEW_RESULTS_NO_RETRY')
if __name__=='__main__':main()
