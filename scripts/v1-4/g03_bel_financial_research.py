"""One governed provider request, discovery only; no admission or canonical write."""
import json
import os
from pathlib import Path
from g03_source_qualification import invoke


def main():
    policy = json.loads(Path('supabase/functions/_shared/v14-g03-financial-authorization.json').read_text())
    body = {'action': 'ACQUIRE_G03_BEL_FINANCIAL_RESEARCH', 'authorizationHash': policy['contractSha256'],
            'portfolioId': policy['portfolioId'], 'securityId': policy['securityId'],
            'batchDate': '2026-10-15', 'researchKind': os.environ['G03_RESEARCH_KIND']}
    result = invoke('v14-g02-document-admission', body, grant_response=True)
    out = Path('g03-bel-financial-research-result')
    out.mkdir(exist_ok=True)
    (out / 'sanitized-results.json').write_text(json.dumps(result, indent=2) + '\n')
    if result.get('canonicalMaterialization') is not False or result.get('providerApiCalls') not in (0, 1):
        raise ValueError('G03_RESEARCH_RESPONSE_SCOPE_INVALID')
    repeat = invoke('v14-g02-document-admission', body, grant_response=True)
    if (repeat.get('code') != 'G03_RESEARCH_ALREADY_ATTEMPTED_NO_RETRY'
            or repeat.get('providerApiCalls') != 0 or repeat.get('reused') is not True
            or repeat.get('priorRunId') != result.get('runId', result.get('priorRunId'))):
        raise ValueError('G03_RESEARCH_DUPLICATE_REQUEST_NOT_IDEMPOTENT')
    (out / 'duplicate-request.json').write_text(json.dumps(repeat, indent=2) + '\n')
    print(json.dumps({'result': result, 'duplicate': repeat}))


if __name__ == '__main__':
    main()
