"""Exact retained Astra/Data annual cash cells; explicit optional fixed admission.

No acquisition, archive write, provider call or automatic canonical promotion.
"""
import hashlib
import json
import os
import re
import subprocess
import tempfile
from decimal import Decimal
from pathlib import Path
from g03_source_qualification import invoke

ROOT = Path('supabase/functions/_shared')


def normalize(text):
    return re.sub(r'\s+', ' ', text.replace('\u00ad', '')).strip()


def qualify_cells(pages, batch):
    for evidence in batch['scopeEvidence']:
        page = normalize(pages[(evidence['originalSha256'], evidence['pdfPage'])])
        if any(normalize(fragment) not in page for fragment in evidence['requiredFragments']):
            raise ValueError('REMAINING_CASH_STANDALONE_SCOPE_NOT_PROVEN')
    for cell in batch['cells']:
        page = normalize(pages[(cell['originalSha256'], cell['pdfPage'])])
        years = cell['rowFiscalYears']
        if not re.search(r'March\s+31,\s*' + str(years[0]) + r'\s+March\s+31,\s*' + str(years[1]), page):
            raise ValueError('REMAINING_CASH_ANNUAL_COLUMN_ORDER_NOT_PROVEN')
        if cell['originalUnit'] not in ('INR_LAKH', 'INR_CRORE'):
            raise ValueError('REMAINING_CASH_UNAPPROVED_ORIGINAL_UNIT')
        unit_marker = 'Rs. Lakhs' if cell['originalUnit'] == 'INR_LAKH' else 'INR Crores'
        if unit_marker not in page or cell['scope'] != 'STANDALONE':
            raise ValueError('REMAINING_CASH_ORIGINAL_UNIT_OR_SCOPE_INVALID')
        pattern = re.escape(normalize(cell['label'])) + r'\s+' + r'\s+'.join(re.escape(v) for v in cell['rowValues'])
        if len(re.findall(pattern, page)) != 1:
            raise ValueError('REMAINING_CASH_LABELLED_ANNUAL_ROW_NOT_UNIQUE')
        literal = cell['rowValues'][years.index(cell['fiscalYear'])]
        original = literal.replace(',', '').replace('(', '-').replace(')', '')
        value = Decimal(original) * (100 if cell['originalUnit'] == 'INR_CRORE' else 1)
        if literal != cell['literalValue'] or original != cell['originalValue'] or value != Decimal(cell['exactINRLakh']):
            raise ValueError('REMAINING_CASH_UNIT_OR_PERIOD_VALUE_MISMATCH')
    # Selected FY2025 facts overlap in the old and current reports. Total CFI /
    # cash-balance differences are retained separately, never used or overwritten.
    for symbol in ['ASTRAMICRO', 'DATAPATTNS']:
        for role in ['CFO', 'PAT', 'CASH_PPE', 'CASH_INTANGIBLES']:
            overlap = [c['exactINRLakh'] for c in batch['cells'] if c['symbol'] == symbol and c['fiscalYear'] == 2025 and c['role'] == role]
            if len(overlap) != 2 or Decimal(overlap[0]) != Decimal(overlap[1]):
                raise ValueError('REMAINING_CASH_OVERLAPPING_SELECTED_CELLS_CONFLICT')
        for b in [b for b in batch['periods'] if b['symbol'] == symbol]:
            selected = {c['role']: Decimal(c['exactINRLakh']) for c in batch['cells'] if c['originalSha256'] == b['originalSha256'] and c['fiscalYear'] == b['fiscalYear']}
            components = b['components']
            if (Decimal(components['cfoOriginal']) != selected['CFO'] or Decimal(components['pat']) != selected['PAT']
                    or Decimal(components['cashCapexOutflow']) != selected['CASH_PPE'] + selected['CASH_INTANGIBLES']
                    or selected['CASH_PPE'] > 0 or selected['CASH_INTANGIBLES'] > 0
                    or components['excludedRental'] != '0' or components['excludedMutualFundGain'] != '0'
                    or components['adjustmentKind'] != 'ISSUER_REPORTED'):
                raise ValueError('REMAINING_CASH_COMPONENT_JOIN_NOT_PROVEN')
    return batch['cells']


def main():
    import boto3
    from botocore.config import Config
    policy = json.loads((ROOT / 'v14-g03-remaining-cash-authorization.json').read_text())
    batch = json.loads((ROOT / 'v14-g03-remaining-cash-review-batch.json').read_text())
    pins = json.loads((ROOT / 'v14-g03-remaining-cash-original-pins.json').read_text())
    if hashlib.sha256(Path(policy['authorityDocument']).read_bytes()).hexdigest() != policy['directiveSha256']:
        raise ValueError('REMAINING_CASH_AUTHORIZATION_HASH_MISMATCH')
    if os.environ['CLOUDFLARE_R2_BUCKET'] != 'portfolioai-history-dev':
        raise ValueError('DEVELOPMENT_ONLY')
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com', region_name='auto',
                      aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
                      config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}, retries={'total_max_attempts': 1}))
    pages, originals = {}, []
    out = Path('g03-remaining-document-result'); out.mkdir(exist_ok=True)
    for pin in pins:
        sha = pin['original_sha256']; key = 'portfolioai-history/development/v1-4/g03/originals/' + sha + '.pdf'
        data = s3.get_object(Bucket='portfolioai-history-dev', Key=key)['Body'].read()
        if len(data) != pin['original_bytes'] or hashlib.sha256(data).hexdigest() != sha:
            raise ValueError('REMAINING_CASH_ORIGINAL_BYTES_NOT_VERIFIED')
        with tempfile.TemporaryDirectory() as temp:
            pdf = Path(temp) / 'original.pdf'; pdf.write_bytes(data)
            text = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], check=True, capture_output=True).stdout.decode()
        if pin['identity_fragment'] not in text:
            raise ValueError('REMAINING_CASH_ISSUER_IDENTITY_MISSING')
        for index, page in enumerate(text.split('\f')): pages[(sha, index + 1)] = page
        originals.append({'symbol': pin['symbol'], 'sha256': sha, 'byteLength': len(data), 'archiveWrite': False})
    cells = qualify_cells(pages, batch)
    result = {'originals': originals, 'verifiedCells': cells, 'scopeEvidence': batch['scopeEvidence'],
              'providerCalls': 0, 'canonicalMaterialization': False, 'acceptedReviews': 0, 'admissions': []}
    def save(): (out / 'sanitized-cash-results.json').write_text(json.dumps(result, indent=2) + '\n')
    save()
    if os.environ.get('G03_ADMIT_REMAINING_DOCUMENTS') != 'true':
        print(json.dumps({'qualifiedCashSourceCells': len(cells), 'acceptedReviews': 0, 'originalsReacquired': 0})); return
    for pin, archive in zip(pins, originals):
        key = 'portfolioai-history/development/v1-4/g03/originals/' + pin['original_sha256'] + '.pdf'
        body = {'action': 'REGISTER_PINNED_G03_REMAINING_CASH_ORIGINAL', 'authorizationHash': policy['directiveSha256'],
                'originalHash': pin['original_sha256'], 'readUrl': s3.generate_presigned_url('get_object', Params={'Bucket': 'portfolioai-history-dev', 'Key': key}, ExpiresIn=240)}
        first = invoke('v14-g02-official-source-import', body); repeat = invoke('v14-g02-official-source-import', body)
        if first.get('sourceId') != repeat.get('sourceId') or repeat.get('reused') is not True:
            raise ValueError('REMAINING_CASH_ORIGINAL_REGISTRATION_NOT_IDEMPOTENT')
        archive.update(sourceId=first['sourceId'], duplicateRegistration='IDEMPOTENT'); save()
    for symbol, security_id in policy['symbols'].items():
        body = {'action': 'ADMIT_FIXED_G03_REMAINING_CASH', 'authorizationHash': policy['directiveSha256'], 'securityId': security_id,
                'verifiedCells': [c for c in cells if c['securityId'] == security_id]}
        first = invoke('v14-g02-document-admission', body); repeat = invoke('v14-g02-document-admission', body)
        expected = {b['reviewId'] for b in batch['periods'] if b['securityId'] == security_id}
        if first.get('code') != 'G03_REMAINING_CASH_ADMITTED_NOT_CANONICAL_READY' or {r['reviewId'] for r in first['results']} != expected or {r['reviewId'] for r in repeat['results']} != expected or not all(r.get('reused') is True for r in repeat['results']):
            raise ValueError('REMAINING_CASH_ADMISSION_NOT_IDEMPOTENT')
        result['admissions'].append({'symbol': symbol, **first, 'duplicateAdmission': 'IDEMPOTENT'})
        result['acceptedReviews'] += len(first['results']); save()
        print(json.dumps({'symbol': symbol, 'acceptedCashYears': len(first['results']), 'providerCalls': 0, 'canonicalMaterialization': False}), flush=True)


if __name__ == '__main__': main()
