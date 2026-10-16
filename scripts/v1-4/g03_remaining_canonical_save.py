"""Per-stock, zero-provider save of actual validated G03 documentary progress."""
import json
import os
from pathlib import Path
import urllib.request
import urllib.error
from g03_source_qualification import invoke


def materialize_remaining(result, body, audience, gateway, out):
    policy = json.loads(Path('supabase/functions/_shared/v14-g03-remaining-authorization.json').read_text())
    if os.environ.get('G03_MATERIALIZE_BEL') == 'true':
        raise ValueError('BEL_AND_REMAINING_SAVES_MUST_BE_SEPARATE')
    rows = {r['securityId']: r for r in result['results']}
    results = []
    for symbol, security_id in policy['symbols'].items():
        row = rows[security_id]
        mandatory = [i for i in row['items'] if i.get('required')]
        fully_fresh = row['status'] == 'READY' and all(i['evidence_state'] == 'FRESH' for i in mandatory)
        if os.environ.get('G03_REMAINING_REQUIRE_READY') == 'true' and not fully_fresh:
            results.append({'symbol': symbol, 'skipped': 'ALL_REQUIRED_EVIDENCE_NOT_FRESH_NO_GRANT_OR_SAVE'})
            continue
        if any(not any(i['requirement_code'] == code and i['evidence_state'] == 'FRESH'
                       for i in mandatory) for code in policy['allowedRequirementCodes']):
            raise ValueError('G03_REMAINING_DOCUMENTS_NOT_FRESH_NO_GRANT_OR_SAVE:' + symbol)
        grant_body = {'action': 'ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT',
                      'authorizationHash': policy['directiveSha256'], 'securityId': security_id}
        grant = invoke('v14-g02-execution-grant', grant_body, grant_response=True)
        repeat = invoke('v14-g02-execution-grant', grant_body, grant_response=True)
        if (grant.get('scope') != 'SECURITY_IDS:' + security_id or grant.get('providerCalls') != 0
                or repeat.get('grantId') != grant.get('grantId') or repeat.get('reused') is not True):
            raise ValueError('G03_REMAINING_GRANT_SCOPE_OR_IDEMPOTENCE_INVALID')
        payload = {**body, 'action': 'P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS',
                   'securityIds': [security_id], 'targetingMode': 'P4_GRANT_SCOPED_SECURITY_IDS_V1',
                   'grantId': grant['grantId']}
        request = urllib.request.Request(audience, data=json.dumps(payload).encode(), method='POST',
                                         headers={'Authorization': 'Bearer ' + gateway,
                                                  'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=180) as response:
            saved = json.load(response)
        if (saved.get('status') != 'IC3_CANONICAL_SNAPSHOTS_MATERIALIZED'
                or saved.get('processed') != 1 or saved.get('providerCalls') != 0
                or saved.get('requestedSecurityIds') != [security_id]
                or len(saved.get('snapshotIds', [])) != 1 or len(saved.get('selectionIds', [])) != 1):
            raise ValueError('G03_REMAINING_MATERIALIZATION_CONTRACT_INVALID')
        try:
            with urllib.request.urlopen(request, timeout=60):
                raise ValueError('G03_REMAINING_GRANT_REPLAY_NOT_REJECTED')
        except urllib.error.HTTPError as error:
            detail = json.load(error)
            if error.code != 401 or detail.get('code') != 'P4_GRANT_ALREADY_USED':
                raise ValueError('G03_REMAINING_GRANT_REPLAY_CONTRACT_INVALID') from None
        results.append({'symbol': symbol, 'prospectiveStatus': row['status'],
                        'remainingMandatoryBlockers': sum(i['evidence_state'] != 'FRESH' for i in mandatory),
                        'result': saved, 'duplicateGrantIssuance': 'IDEMPOTENT',
                        'grantReplay': 'REJECTED_ALREADY_USED'})
        (out / 'sanitized-remaining-materializations.json').write_text(json.dumps(results, indent=2) + '\n')
        print(json.dumps({'materializedG03Remaining': symbol, 'status': row['status'], 'providerCalls': 0}), flush=True)
