"""Register already archived BEL original and admit its fixed, owner-delegated findings."""
import json
import os
import re
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from g02_source_import import BUCKET, original_valid

ROOT = Path('supabase/functions/_shared')
BASE = 'https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/'
PREFIX = 'portfolioai-history/development/v1-4/g03/originals/'


def invoke(function, body, grant_response=False):
    audience = BASE + function
    request = urllib.request.Request(os.environ['ACTIONS_ID_TOKEN_REQUEST_URL'] + '&audience=' +
                                    urllib.parse.quote(audience, safe=''), headers={
                                        'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
    with urllib.request.urlopen(request, timeout=30) as response:
        token = json.load(response)['value']
    request = urllib.request.Request(audience, data=json.dumps(body).encode(), method='POST', headers={
        'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        detail = json.load(error)
        raise RuntimeError('G03_QUALIFICATION_HTTP_' + str(error.code) + ':' +
                           str(detail.get('code')) + ':' + str(detail.get('postgresCode'))) from None
    if not grant_response and (result.get('providerApiCalls') != 0 or result.get('canonicalMaterialization') is not False):
        raise ValueError('G03_QUALIFICATION_RESPONSE_SCOPE_INVALID')
    return result


def main():
    import boto3
    from botocore.config import Config
    if os.environ['CLOUDFLARE_R2_BUCKET'] != BUCKET:
        raise ValueError('DEVELOPMENT_BUCKET_REQUIRED')
    policy = json.loads((ROOT / 'v14-g03-pilot-authorization.json').read_text())
    pins = json.loads((ROOT / 'v14-g03-original-pins.json').read_text())
    batch = json.loads((ROOT / 'v14-g03-document-review-batch.json').read_text())
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
                      config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                                    retries={'total_max_attempts': 1}))
    out = Path('g03-source-qualification-result')
    out.mkdir(exist_ok=True)
    results = []
    for pin in pins:
        key = PREFIX + pin['original_sha256'] + '.pdf'
        # No PUT or source reacquisition: verify the already retained exact original.
        data = original_valid(pin, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read())
        with tempfile.TemporaryDirectory() as temp:
            pdf, txt = Path(temp) / 'source.pdf', Path(temp) / 'source.txt'
            pdf.write_bytes(data)
            subprocess.run(['pdftotext', '-layout', '-enc', 'UTF-8', str(pdf), str(txt)], check=True)
            text = re.sub(r'\s+', ' ', txt.read_text()).strip()
        findings = [b for b in batch if b['originalHash'] == pin['original_sha256']]
        if len(findings) != 2 or any(b['fragment'] not in text for b in findings):
            raise ValueError('G03_FIXED_ORIGINAL_PASSAGES_NOT_VERIFIED')
        body = {'action': 'REGISTER_PINNED_G03_ORIGINAL', 'authorizationHash': policy['directiveSha256'],
                'originalHash': pin['original_sha256'], 'readUrl': s3.generate_presigned_url(
                    'get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=240)}
        first = invoke('v14-g02-official-source-import', body)
        repeat = invoke('v14-g02-official-source-import', body)
        if (first.get('code') != 'G03_ORIGINAL_REGISTERED_NOT_FINANCIALLY_ADMITTED'
                or first.get('acceptedReviews') != 0 or repeat.get('sourceId') != first.get('sourceId')
                or repeat.get('documentId') != first.get('documentId') or repeat.get('reused') is not True):
            raise ValueError('G03_ORIGINAL_REGISTRATION_NOT_IDEMPOTENT')
        results.append({'stage': 'ORIGINAL_REGISTERED', 'sha256': pin['original_sha256'],
                        'duplicateRegistration': 'IDEMPOTENT', **first})
        (out / 'sanitized-results.json').write_text(json.dumps(results, indent=2) + '\n')
        for finding in findings:
            body = {'action': 'ADMIT_FIXED_G03_DOCUMENT', 'authorizationHash': policy['directiveSha256'],
                    'securityId': finding['securityId'], 'requirementCode': finding['requirementCode'],
                    'originalHash': finding['originalHash'], 'normalizedFragment': finding['fragment'],
                    'extractionMethod': 'POPPLER_LAYOUT_WHITESPACE_NORMALIZED_ORIGINAL_BYTES'}
            first = invoke('v14-g02-document-admission', body)
            repeat = invoke('v14-g02-document-admission', body)
            if (first.get('code') != 'G03_DOCUMENT_REVIEW_ADMITTED_NOT_CANONICAL_READY'
                    or repeat.get('reviewId') != first.get('reviewId') or repeat.get('reused') is not True):
                raise ValueError('G03_FIXED_DOCUMENT_REVIEW_NOT_IDEMPOTENT')
            results.append({'stage': 'FIXED_DOCUMENT_REVIEW', 'requirementCode': finding['requirementCode'],
                            'literalOriginalPassageVerified': True, 'duplicateReview': 'IDEMPOTENT', **first})
            (out / 'sanitized-results.json').write_text(json.dumps(results, indent=2) + '\n')
            print(json.dumps(results[-1]))


if __name__ == '__main__':
    main()
