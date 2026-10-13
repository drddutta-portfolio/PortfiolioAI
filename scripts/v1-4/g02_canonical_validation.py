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
    print(json.dumps({'processed':result['processed'],'totals':result['totals'],'providerCalls':0,'writeTotals':result['writeTotals']}))
if __name__=='__main__':main()
