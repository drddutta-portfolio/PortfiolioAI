"""Fixed original-cell extraction and explicit delegated admission; no formulas or providers."""
import hashlib
import json
import os
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path
from decimal import Decimal
from g02_source_import import BUCKET, original_valid
from g03_source_qualification import invoke, PREFIX

ROOT = Path('supabase/functions/_shared')


def fixed_cell(row, text):
    pages = text.split('\f')
    page = pages[row['pdfPage'] - 1]
    if ('L32309KA1954GOI000787' not in text or 'Standalone Notes to Accounts' not in page
            or row['fiscalLabel'] not in page):
        raise ValueError('G03_ROCE_ORIGINAL_IDENTITY_SCOPE_OR_HEADER_MISSING')
    ratio = re.search(r'Return on Capital Employed \(in %age\)\s+(\d+\.\d+)\s+(\d+\.\d+)', page)
    ebit = re.search(r'Earnings Before Interest and Tax \(EBIT\)\s+([\d,]+)\s+([\d,]+)', page)
    capital = re.search(r'Denominator\s+Capital Employed\s+([\d,]+)\s+([\d,]+)', page)
    header = re.search(r'Particulars\s+(\d{4}-\d{2})\s+(\d{4}-\d{2})', page)
    if not all([ratio, ebit, capital, header]):
        raise ValueError('G03_ROCE_TABLE_CELLS_NOT_FOUND')
    matches = [i for i in (1, 2) if header.group(i) == row['fiscalLabel']]
    if len(matches) != 1:
        raise ValueError('G03_ROCE_COLUMN_NOT_UNIQUE')
    column = matches[0]
    value, numerator, denominator = ratio.group(column), ebit.group(column).replace(',', ''), capital.group(column).replace(',', '')
    if (value != row['numericValue'] or numerator != row['supportingNumeratorINRLakh']
            or denominator != row['supportingDenominatorINRLakh']):
        raise ValueError('G03_ROCE_FIXED_ISSUER_CELLS_MISMATCH')
    # This verifies the issuer's two-decimal disclosure; it does not replace it.
    if abs(Decimal(numerator) / Decimal(denominator) * 100 - Decimal(value)) > Decimal('0.005'):
        raise ValueError('G03_ROCE_ISSUER_ROUNDING_INCONSISTENT')
    return {'reviewId': row['reviewId'], 'originalSha256': row['originalSha256'],
            'pdfPage': row['pdfPage'], 'fiscalLabel': row['fiscalLabel'], 'value': value,
            'ebit': numerator, 'capitalEmployed': denominator,
            'identityVerified': True, 'standaloneTableVerified': True}


def retained_original(s3, pin):
    key = PREFIX + pin['original_sha256'] + '.pdf'
    try:
        return key, original_valid(pin, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read()), False
    except Exception as error:
        if getattr(error, 'response', {}).get('Error', {}).get('Code') not in ('NoSuchKey', '404'):
            raise
    # The original is already hash-qualified. Only its exact exchange URL may
    # fill the missing durable archive object; no discovery, retries or replacement.
    request = urllib.request.Request(pin['original_url'], headers={'User-Agent': 'Mozilla/5.0 PortfolioAI original qualification'})
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.url != pin['original_url']:
            raise ValueError('G03_ROCE_ORIGINAL_REDIRECT_CHANGED')
        data = original_valid(pin, response.read(64 * 1024 * 1024 + 1))
    try:
        s3.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType='application/pdf', IfNoneMatch='*')
    except Exception:
        # An uncertain write completion must be resolved by byte readback, not PUT retry.
        data = original_valid(pin, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read())
        return key, data, True
    data = original_valid(pin, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read())
    return key, data, True


def main():
    import boto3
    from botocore.config import Config
    if os.environ['CLOUDFLARE_R2_BUCKET'] != BUCKET:
        raise ValueError('DEVELOPMENT_BUCKET_REQUIRED')
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
                      config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                                    retries={'total_max_attempts': 1}))
    policy = json.loads((ROOT / 'v14-g03-roce-authorization.json').read_text())
    pins = json.loads((ROOT / 'v14-g03-roce-original-pins.json').read_text())
    batch = json.loads((ROOT / 'v14-g03-roce-review-batch.json').read_text())
    out = Path('g03-roce-qualification-result')
    out.mkdir(exist_ok=True)
    archive_results, cells = [], []
    for pin in pins:
        key, data, created = retained_original(s3, pin)
        with tempfile.TemporaryDirectory() as temp:
            pdf, txt = Path(temp) / 'source.pdf', Path(temp) / 'source.txt'
            pdf.write_bytes(data)
            subprocess.run(['pdftotext', '-layout', '-enc', 'UTF-8', str(pdf), str(txt)],
                           check=True, capture_output=True)
            text = txt.read_text()
        cells.extend(fixed_cell(row, text) for row in batch if row['originalSha256'] == pin['original_sha256'])
        body = {'action': 'REGISTER_PINNED_G03_ROCE_ORIGINAL', 'authorizationHash': policy['directiveSha256'],
                'originalHash': pin['original_sha256'], 'readUrl': s3.generate_presigned_url(
                    'get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=240)}
        first = invoke('v14-g02-official-source-import', body)
        repeat = invoke('v14-g02-official-source-import', body)
        if (first.get('code') != 'G03_ORIGINAL_REGISTERED_NOT_FINANCIALLY_ADMITTED'
                or first.get('sourceId') != repeat.get('sourceId') or repeat.get('reused') is not True):
            raise ValueError('G03_ROCE_ORIGINAL_REGISTRATION_NOT_IDEMPOTENT')
        archive_results.append({'sha256': hashlib.sha256(data).hexdigest(), 'created': created,
                                'originalBytesVerified': True, **first})
        (out / 'sanitized-originals.json').write_text(json.dumps(archive_results, indent=2) + '\n')
    if len(cells) != 3:
        raise ValueError('G03_EXACT_THREE_ROCE_CELLS_REQUIRED')
    body = {'action': 'ADMIT_FIXED_G03_BEL_ROCE_BATCH', 'authorizationHash': policy['directiveSha256'],
            'verifiedCells': cells}
    first = invoke('v14-g02-document-admission', body)
    repeat = invoke('v14-g02-document-admission', body)
    expected = {row['reviewId'] for row in batch}
    if (first.get('code') != 'G03_FIXED_ROCE_REVIEWS_ADMITTED_NOT_CANONICAL_READY'
            or {row.get('reviewId') for row in first.get('results', [])} != expected
            or {row.get('reviewId') for row in repeat.get('results', [])} != expected
            or not all(row.get('reused') is True for row in repeat['results'])):
        raise ValueError('G03_ROCE_ADMISSION_OR_IDEMPOTENCE_NOT_PROVEN')
    (out / 'sanitized-results.json').write_text(json.dumps({
        'originals': archive_results, 'verifiedCells': cells, 'admission': first,
        'duplicateAdmission': 'IDEMPOTENT', 'providerCalls': 0, 'canonicalMaterialization': False,
    }, indent=2) + '\n')
    print(json.dumps({'acceptedFacts': len(first['results']), 'duplicateAdmission': 'IDEMPOTENT',
                      'providerCalls': 0, 'canonicalMaterialization': False}))


if __name__ == '__main__':
    main()
