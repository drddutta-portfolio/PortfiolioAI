"""Invoke the established validator with the distinct owner-authorized G03 read scope."""
import json
import os
from pathlib import Path
from datetime import datetime, timezone
import urllib.request
import urllib.parse
import urllib.error
import uuid
from g02_canonical_validation import validate_result


def main():
    root = Path('supabase/functions/_shared')
    policy = json.loads((root / 'v14-g03-owner-authorization.json').read_text())
    audience = 'https://' + policy['developmentProject'] + '.supabase.co/functions/v1/p7-ic2-materialize-readiness'
    oidc = urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL'] + '&audience=' +
                                 urllib.parse.quote(audience, safe=''), headers={
                                     'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
    with urllib.request.urlopen(oidc, timeout=30) as response:
        token = json.load(response)['value']
    now = datetime.now(timezone.utc).isoformat()
    body = {'action': 'P7_IC3_VALIDATE_CANONICAL_INPUTS', 'portfolioId': policy['portfolioId'],
            'securityIds': policy['securityIds'], 'ownerExecutionAuthorization': policy['directiveSha256'],
            'selectionRunId': str(uuid.uuid4()), 'evaluationAsOf': now, 'sourceCutoffAt': now}
    gateway = json.loads((root / 'v14-g02-public-gateway.json').read_text())['anonKey']
    request = urllib.request.Request(audience, data=json.dumps(body).encode(), method='POST', headers={
        'Authorization': 'Bearer ' + gateway, 'X-G03-Execution-Token': token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        detail = json.load(error)
        raise RuntimeError('G03_VALIDATION_HTTP_' + str(error.code) + ':' +
                           str(detail.get('code', detail.get('error', 'UNKNOWN')))) from None
    validate_result(result, policy['securityIds'])
    out = Path('g03-canonical-validation-result')
    out.mkdir(exist_ok=True)
    (out / 'sanitized-results.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'processed': result['processed'], 'totals': result['totals'],
                      'providerCalls': 0, 'writeTotals': result['writeTotals']}))


if __name__ == '__main__':
    main()
