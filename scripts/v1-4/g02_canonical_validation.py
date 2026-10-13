"""Signed, owner-delegated G02 validation. No provider or canonical writes."""
import json,os,uuid,urllib.request,urllib.parse,urllib.error
from datetime import datetime,timezone
from pathlib import Path
AUD='https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/p7-ic2-materialize-readiness'
def validate_result(result,ids):
    if result.get('status')!='IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY' or result.get('dryRun') is not True or result.get('providerCalls')!=0:raise ValueError('G02_VALIDATION_CONTRACT_INVALID')
    if result.get('snapshotIds')!=[] or result.get('selectionIds')!=[] or result.get('writeTotals')!={'snapshotsCreated':0,'snapshotsReused':0,'selectionsCreated':0,'selectionsReused':0}:raise ValueError('G02_VALIDATION_WRITE_PROOF_INVALID')
    rows=result.get('results',[])
    if len(rows)!=len(ids) or set(r.get('securityId') for r in rows)!=set(ids) or any(not r.get('items') for r in rows):raise ValueError('G02_VALIDATION_IDENTITIES_OR_REQUIREMENTS_MISSING')
    return result

def main():
    policy=json.loads(Path('supabase/functions/_shared/v14-g02-owner-authorization.json').read_text())
    oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(AUD,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
    with urllib.request.urlopen(oidc,timeout=30) as r:token=json.load(r)['value']
    now=datetime.now(timezone.utc).isoformat()
    body={'action':'P7_IC3_VALIDATE_CANONICAL_INPUTS','portfolioId':policy['portfolioId'],'securityIds':policy['securityIds'],'ownerExecutionAuthorization':policy['directiveSha256'],'selectionRunId':str(uuid.uuid4()),'evaluationAsOf':now,'sourceCutoffAt':now}
    request=urllib.request.Request(AUD,data=json.dumps(body).encode(),method='POST',headers={'Authorization':'Bearer '+json.loads(Path('supabase/functions/_shared/v14-g02-public-gateway.json').read_text())['anonKey'],'X-G02-Execution-Token':token,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(request,timeout=180) as r:result=json.load(r)
    except urllib.error.HTTPError as e:
        response=json.load(e);raise RuntimeError('G02_CANONICAL_VALIDATION_HTTP_'+str(e.code)+':'+str(response.get('code',response.get('error','UNKNOWN')))) from None
    validate_result(result,policy['securityIds'])
    out=Path('g02-canonical-validation-result');out.mkdir(exist_ok=True)
    (out/'sanitized-results.json').write_text(json.dumps(result,indent=2)+'\n')
    if os.environ.get('G02_MATERIALIZE')=='true':
        if any(not any(i.get('requirement_code')=='BUSINESS_DURABILITY' and i.get('evidence_state')=='FRESH' for i in r['items']) for r in result['results']):raise ValueError('G02_DOCUMENTARY_ADMISSION_NOT_CANONICALLY_FRESH')
        grant_url=AUD.replace('p7-ic2-materialize-readiness','v14-g02-execution-grant')
        grant_oidc=urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']+'&audience='+urllib.parse.quote(grant_url,safe=''),headers={'Authorization':'Bearer '+os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
        with urllib.request.urlopen(grant_oidc,timeout=30) as r:grant_token=json.load(r)['value']
        grant_req=urllib.request.Request(grant_url,data=json.dumps({'action':'ISSUE_G02_CANONICAL_ONLY_GRANT','authorizationHash':policy['directiveSha256']}).encode(),method='POST',headers={'Authorization':'Bearer '+grant_token,'Content-Type':'application/json'})
        with urllib.request.urlopen(grant_req,timeout=60) as r:grant=json.load(r)
        with urllib.request.urlopen(grant_req,timeout=60) as r:duplicate=json.load(r)
        if grant.get('code')!='G02_CANONICAL_ONLY_GRANT' or duplicate.get('grantId')!=grant.get('grantId') or duplicate.get('reused') is not True:raise ValueError('G02_GRANT_DUPLICATE_ISSUANCE_NOT_IDEMPOTENT')
        write_body={**body,'action':'P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS','targetingMode':'P4_GRANT_SCOPED_SECURITY_IDS_V1','grantId':grant['grantId']}
        write_req=urllib.request.Request(AUD,data=json.dumps(write_body).encode(),method='POST',headers={'Authorization':'Bearer '+json.loads(Path('supabase/functions/_shared/v14-g02-public-gateway.json').read_text())['anonKey'],'Content-Type':'application/json'})
        with urllib.request.urlopen(write_req,timeout=180) as r:materialized=json.load(r)
        if materialized.get('status')!='IC3_CANONICAL_SNAPSHOTS_MATERIALIZED' or materialized.get('processed')!=3 or materialized.get('providerCalls')!=0 or len(materialized.get('selectionIds',[]))!=3:raise ValueError('G02_CANONICAL_MATERIALIZATION_CONTRACT_INVALID')
        try:
            with urllib.request.urlopen(write_req,timeout=60):raise ValueError('G02_GRANT_REPLAY_NOT_REJECTED')
        except urllib.error.HTTPError as e:
            error=json.load(e)
            if e.code!=401 or error.get('code')!='P4_GRANT_ALREADY_USED':raise ValueError('G02_GRANT_REPLAY_CONTRACT_INVALID')
        (out/'sanitized-materialization.json').write_text(json.dumps({'result':materialized,'duplicateGrantIssuance':'IDEMPOTENT','grantReplay':'REJECTED_ALREADY_USED'},indent=2)+'\n')
        print(json.dumps({'materialized':3,'totals':materialized['totals'],'providerCalls':0,'duplicateGrantIssuance':'IDEMPOTENT','grantReplay':'REJECTED_ALREADY_USED'}))
    print(json.dumps({'processed':result['processed'],'totals':result['totals'],'providerCalls':0,'writeTotals':result['writeTotals']}))
if __name__=='__main__':main()
