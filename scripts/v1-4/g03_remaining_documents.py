"""Qualify pinned remaining-G03 disclosures through existing signed admission.

Original PDF bytes are immutable in Development R2. Findings retain adverse
disclosures and do not admit financial observations, scores or READY status.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.request
from urllib.parse import urlsplit
from g03_source_qualification import invoke, PREFIX

ROOT = Path('supabase/functions/_shared')
BUCKET = 'portfolioai-history-dev'
HOSTS = {'www.bseindia.com', 'mtar.in', 'www.datapatternsindia.com',
         'www.grse.in', 'nsearchives.nseindia.com', 'www.zentechnologies.com'}


def verify_original(pin, data):
    if (len(data) != pin['original_bytes'] or len(data) > 64 * 1024 * 1024
            or not data.startswith(b'%PDF-')
            or hashlib.sha256(data).hexdigest() != pin['original_sha256']):
        raise ValueError('G03_REMAINING_ORIGINAL_BYTES_INVALID')
    return data


def qualify_pages(pin, findings, data):
    verify_original(pin, data)
    with tempfile.TemporaryDirectory() as temp:
        pdf = Path(temp) / 'original.pdf'
        pdf.write_bytes(data)
        texts = {}
        for page in sorted({1, 2, *(b['pdfPage'] for b in findings)}):
            result = subprocess.run(['pdftotext', '-layout', '-f', str(page),
                                     '-l', str(page), str(pdf), '-'],
                                    check=True, capture_output=True, timeout=90)
            texts[page] = re.sub(r'\s+', ' ', result.stdout.decode()).strip()
        if pin['identity_fragment'].casefold() not in ' '.join(texts.values()).casefold():
            raise ValueError('G03_REMAINING_ORIGINAL_IDENTITY_NOT_PROVEN')
        if any(b['fragment'] not in texts[b['pdfPage']] for b in findings):
            raise ValueError('G03_REMAINING_EXACT_SOURCE_PASSAGE_NOT_PROVEN')


def retained_original(s3, pin):
    key = PREFIX + pin['original_sha256'] + '.pdf'
    try:
        return verify_original(pin, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read()), False
    except Exception as error:
        if getattr(error, 'response', {}).get('Error', {}).get('Code') not in ('NoSuchKey', '404'):
            raise
    url = urlsplit(pin['original_url'])
    if (url.scheme != 'https' or url.hostname not in HOSTS or url.username or url.password
            or url.port or url.fragment or not url.path.lower().endswith('.pdf')):
        raise ValueError('G03_REMAINING_OFFICIAL_URL_NOT_ALLOWED')
    with urllib.request.urlopen(urllib.request.Request(pin['original_url'], headers={
            'User-Agent': 'Mozilla/5.0 PortfolioAI original qualification'}), timeout=60) as response:
        if response.url != pin['resolved_url']:
            raise ValueError('G03_REMAINING_ORIGINAL_REDIRECT_CHANGED')
        data = verify_original(pin, response.read(pin['original_bytes'] + 1))
    try:
        s3.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType='application/pdf', IfNoneMatch='*')
    except Exception:
        # An uncertain or competing PUT is resolved by integrity readback; never overwrite.
        verify_original(pin, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read())
    return verify_original(pin, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read()), True


def main():
    import boto3
    from botocore.config import Config
    if os.environ['CLOUDFLARE_R2_BUCKET'] != BUCKET:
        raise ValueError('DEVELOPMENT_BUCKET_REQUIRED')
    policy = json.loads((ROOT / 'v14-g03-remaining-authorization.json').read_text())
    pins = json.loads((ROOT / 'v14-g03-remaining-original-pins.json').read_text())
    batch = json.loads((ROOT / 'v14-g03-remaining-document-batch.json').read_text())
    if (len(pins) != 7 or len(batch) != 12 or len(policy['securityIds']) != 6
            or any(p['security_id'] not in policy['securityIds'] for p in pins)):
        raise ValueError('G03_REMAINING_FIXED_BATCH_REQUIRED')
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
                      config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                                    retries={'total_max_attempts': 1}))
    out = Path('g03-remaining-document-result')
    out.mkdir(exist_ok=True)
    results, originals = [], []
    def save():
        (out / 'sanitized-results.json').write_text(json.dumps({
            'originals': originals, 'reviews': results, 'providerCalls': 0,
            'canonicalMaterialization': False, 'workflowSha': os.environ.get('GITHUB_SHA'),
        }, indent=2) + '\n')
    for pin in pins:
        findings = [b for b in batch if b['originalHash'] == pin['original_sha256']]
        data, created = retained_original(s3, pin)
        qualify_pages(pin, findings, data)
        key = PREFIX + pin['original_sha256'] + '.pdf'
        if os.environ.get('G03_ADMIT_REMAINING_DOCUMENTS') != 'true':
            originals.append({'symbol': pin['symbol'], 'sha256': pin['original_sha256'],
                              'byteLength': len(data), 'r2ObjectCreated': created,
                              'pagesQualified': sorted(b['pdfPage'] for b in findings),
                              'canonicalRegistration': False})
            save()
            print(json.dumps({'symbol': pin['symbol'], 'qualifiedOriginal': pin['original_sha256'],
                              'canonicalMaterialization': False}), flush=True)
            continue
        request = {'action': 'REGISTER_PINNED_G03_REMAINING_ORIGINAL',
                   'authorizationHash': policy['directiveSha256'],
                   'originalHash': pin['original_sha256'], 'readUrl': s3.generate_presigned_url(
                       'get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=240)}
        first, repeat = invoke('v14-g02-official-source-import', request), invoke('v14-g02-official-source-import', request)
        if first.get('sourceId') != repeat.get('sourceId') or repeat.get('reused') is not True:
            raise ValueError('G03_REMAINING_ORIGINAL_REGISTRATION_NOT_IDEMPOTENT')
        originals.append({'symbol': pin['symbol'], 'sha256': pin['original_sha256'],
                          'byteLength': len(data), 'r2ObjectCreated': created,
                          'pagesQualified': sorted(b['pdfPage'] for b in findings),
                          'sourceId': first['sourceId'], 'duplicateRegistration': 'IDEMPOTENT'})
        save()
    if os.environ.get('G03_ADMIT_REMAINING_DOCUMENTS') != 'true':
        return
    for b in batch:
        request = {'action': 'ADMIT_FIXED_G03_REMAINING_DOCUMENT',
                   'authorizationHash': policy['directiveSha256'],
                   'securityId': b['securityId'], 'requirementCode': b['requirementCode'],
                   'originalHash': b['originalHash'], 'normalizedFragment': b['fragment'],
                   'extractionMethod': 'POPPLER_LAYOUT_WHITESPACE_NORMALIZED_ORIGINAL_BYTES'}
        first, repeat = invoke('v14-g02-document-admission', request), invoke('v14-g02-document-admission', request)
        if first.get('reviewId') != repeat.get('reviewId') or repeat.get('reused') is not True:
            raise ValueError('G03_REMAINING_DOCUMENT_ADMISSION_NOT_IDEMPOTENT')
        results.append({'symbol': b['symbol'], 'requirementCode': b['requirementCode'],
                        'reviewId': first['reviewId'], 'sourceId': first['sourceId'],
                        'duplicateAdmission': 'IDEMPOTENT', 'doesNotProve': b['doesNotProve']})
        save()
        print(json.dumps({'symbol': b['symbol'], 'requirement': b['requirementCode'],
                          'reviewId': first['reviewId'], 'canonicalMaterialization': False}), flush=True)


if __name__ == '__main__':
    main()
