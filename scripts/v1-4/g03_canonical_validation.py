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
    session_evidence = None
    if os.environ.get('G03_REQUIRE_BEL_CASH') == 'true':
        from g03_source_qualification import invoke
        financial = json.loads((root / 'v14-g03-financial-authorization.json').read_text())
        session_evidence = invoke('v14-g02-document-admission', {
            'action': 'QUALIFY_G03_BEL_CURRENT_SESSION', 'authorizationHash': financial['contractSha256'],
            'portfolioId': financial['portfolioId'], 'securityId': financial['securityId']})
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
    if session_evidence is not None:
        (out / 'sanitized-current-session-evidence.json').write_text(json.dumps(session_evidence, indent=2) + '\n')
    (out / 'sanitized-results.json').write_text(json.dumps(result, indent=2) + '\n')
    if os.environ.get('G03_MATERIALIZE_BEL') == 'true':
        pilot = json.loads((root / 'v14-g03-pilot-authorization.json').read_text())
        bel = next(r for r in result['results'] if r['securityId'] == pilot['securityIds'][0])
        if any(not any(i.get('requirement_code') == code and i.get('evidence_state') == 'FRESH'
                       for i in bel['items']) for code in pilot['allowedRequirementCodes']):
            raise ValueError('G03_BEL_DOCUMENTARY_REVIEWS_NOT_CANONICALLY_FRESH')
        if os.environ.get('G03_REQUIRE_BEL_ROCE') == 'true' and not any(
                i.get('requirement_code') == 'ROCE_OR_ROIC' and i.get('evidence_state') == 'FRESH'
                for i in bel['items']):
            raise ValueError('G03_BEL_ISSUER_ROCE_NOT_CANONICALLY_FRESH')
        if os.environ.get('G03_REQUIRE_BEL_ORDERS') == 'true' and not any(
                i.get('requirement_code') == 'ORDER_BOOK_AND_EXECUTION_GROWTH' and i.get('evidence_state') == 'FRESH'
                for i in bel['items']):
            raise ValueError('G03_BEL_ORDER_HISTORY_NOT_CANONICALLY_FRESH')
        if os.environ.get('G03_REQUIRE_BEL_CASH') == 'true' and not any(
                i.get('requirement_code') == 'CFO_FCF_CONVERSION' and i.get('evidence_state') == 'FRESH'
                for i in bel['items']):
            raise ValueError('G03_BEL_CASH_COMPONENTS_NOT_CANONICALLY_FRESH')
        if os.environ.get('G03_REQUIRE_BEL_CASH') == 'true' and any(not any(
                i.get('requirement_code') == code and i.get('evidence_state') == 'FRESH'
                for i in bel['items']) for code in ['MOMENTUM_12M_RELATIVE', 'DRAWDOWN_VOLATILITY_RISK']):
            raise ValueError('G03_BEL_CURRENT_MARKET_PROOF_NOT_FRESH_NO_SAVE')
        from g03_source_qualification import invoke
        grant_body = {'action': 'ISSUE_G03_CANONICAL_ONLY_GRANT', 'authorizationHash': pilot['directiveSha256']}
        grant = invoke('v14-g02-execution-grant', grant_body, grant_response=True)
        duplicate = invoke('v14-g02-execution-grant', grant_body, grant_response=True)
        if (grant.get('code') != 'G03_CANONICAL_ONLY_GRANT' or grant.get('providerCalls') != 0
                or grant.get('scope') != 'SECURITY_IDS:' + pilot['securityIds'][0]
                or duplicate.get('grantId') != grant.get('grantId') or duplicate.get('reused') is not True):
            raise ValueError('G03_BEL_GRANT_SCOPE_OR_IDEMPOTENCE_INVALID')
        write_body = {**body, 'action': 'P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS',
                      'securityIds': pilot['securityIds'], 'targetingMode': 'P4_GRANT_SCOPED_SECURITY_IDS_V1',
                      'grantId': grant['grantId']}
        write_request = urllib.request.Request(audience, data=json.dumps(write_body).encode(), method='POST',
                                               headers={'Authorization': 'Bearer ' + gateway,
                                                        'Content-Type': 'application/json'})
        with urllib.request.urlopen(write_request, timeout=180) as response:
            materialized = json.load(response)
        if (materialized.get('status') != 'IC3_CANONICAL_SNAPSHOTS_MATERIALIZED'
                or materialized.get('processed') != 1 or materialized.get('providerCalls') != 0
                or len(materialized.get('selectionIds', [])) != 1
                or len(materialized.get('snapshotIds', [])) != 1):
            raise ValueError('G03_BEL_MATERIALIZATION_CONTRACT_INVALID')
        (out / 'sanitized-materialization.json').write_text(json.dumps({
            'result': materialized, 'duplicateGrantIssuance': 'IDEMPOTENT'}, indent=2) + '\n')
        try:
            with urllib.request.urlopen(write_request, timeout=60):
                raise ValueError('G03_GRANT_REPLAY_NOT_REJECTED')
        except urllib.error.HTTPError as error:
            detail = json.load(error)
            if error.code != 401 or detail.get('code') != 'P4_GRANT_ALREADY_USED':
                raise ValueError('G03_GRANT_REPLAY_CONTRACT_INVALID') from None
        (out / 'sanitized-materialization.json').write_text(json.dumps({
            'result': materialized, 'duplicateGrantIssuance': 'IDEMPOTENT',
            'grantReplay': 'REJECTED_ALREADY_USED'}, indent=2) + '\n')
        print(json.dumps({'materializedBEL': 1, 'providerCalls': 0, 'grantReplay': 'REJECTED_ALREADY_USED'}))
    print(json.dumps({'processed': result['processed'], 'totals': result['totals'],
                      'providerCalls': 0, 'writeTotals': result['writeTotals']}))


if __name__ == '__main__':
    main()
