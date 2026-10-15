"""Qualify eight raw Trendlyne pairs against original NSE quarter/scope facts.

The issuer P&L identity corroborates the provider's existing raw-profit definition;
it is NOT used to manufacture a substitute operating-profit observation.
"""
import hashlib
import json
import os
import urllib.request
import xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path
from g03_source_qualification import invoke, PREFIX

ROOT = Path('supabase/functions/_shared')


def xml_cells(data, cells):
    root = ET.fromstring(data)
    metadata = {e.tag.split('}')[-1]: e.text for e in root
                if e.get('contextRef') == 'OneD' and not e.get('unitRef')}
    if (metadata.get('Symbol') != 'BEL' or metadata.get('ScripCode') != '500049'
            or metadata.get('NameOfTheCompany', '').upper() != 'BHARAT ELECTRONICS LIMITED'
            or metadata.get('NatureOfReportStandaloneConsolidated') != 'Consolidated'
            or metadata.get('ISIN') not in (None, 'INE263A01024')):
        raise ValueError('BEL_CONSOLIDATED_ORIGINAL_IDENTITY_NOT_VERIFIED')
    for c in cells:
        matches = [e for e in root if e.tag.split('}')[-1] == c['tag']
                   and e.get('contextRef') == c['context']]
        if len(matches) != 1:
            raise ValueError('BEL_MARGIN_FACT_NOT_UNIQUE')
        e = matches[0]
        if (e.get('unitRef') != c['unit'] or e.get('scale') is not None
                or e.get('{http://www.w3.org/2001/XMLSchema-instance}nil') is not None
                or e.text != c['literalValue']):
            raise ValueError('BEL_MARGIN_EXACT_NUMERIC_FACT_NOT_VERIFIED')
        contexts = [n for n in root if n.tag.split('}')[-1] == 'context'
                    and n.get('id') == c['context']]
        if len(contexts) != 1:
            raise ValueError('BEL_MARGIN_CONTEXT_NOT_UNIQUE')
        dates = {n.tag.split('}')[-1]: n.text for n in contexts[0].iter()}
        if dates.get('startDate') != c['periodStart'] or dates.get('endDate') != c['periodEnd']:
            raise ValueError('BEL_MARGIN_QUARTER_CONTEXT_MISMATCH')


def verify_pairs(batch):
    periods = batch['periods']
    if len(periods) != 8 or len({p['periodEnd'] for p in periods}) != 8:
        raise ValueError('EIGHT_DISTINCT_QUARTERS_REQUIRED')
    for i, p in enumerate(periods):
        if i and ((int(p['periodEnd'][:4]) * 4 + (int(p['periodEnd'][5:7]) - 1) // 3)
                  - (int(periods[i-1]['periodEnd'][:4]) * 4
                     + (int(periods[i-1]['periodEnd'][5:7]) - 1) // 3) != 1):
            raise ValueError('CONSECUTIVE_QUARTERS_REQUIRED')
        cells = {c['tag']: Decimal(c['literalValue']) for c in batch['cells']
                 if c['originalSha256'] == p['originalSha256']}
        c = p['components']
        if (c['scope'] != 'CONSOLIDATED' or c['unit'] != 'INR_CRORE' or c['currency'] != 'INR'
                or c['periodEnd'] != p['periodEnd'] or c['periodStart'] != p['periodStart']
                or Decimal(c['revenue']) != cells['RevenueFromOperations'] / Decimal(10000000)
                or Decimal(c['profit']) != (cells['ProfitBeforeTax'] + cells['FinanceCosts']
                                           + cells['DepreciationDepletionAndAmortisationExpense']
                                           - cells['OtherIncome']) / Decimal(10000000)
                or c['profit'] != p['profitField']['value'] or c['revenue'] != p['revenueField']['value']):
            raise ValueError('BEL_DIRECT_PROVIDER_PAIR_NOT_CORROBORATED_TO_ISSUER_SCOPE')
        if p['profitField']['parameterToken'] in ('opqmq5', 'opqmq6') and not p['profitField']['singleFieldRequired']:
            raise ValueError('BEL_AMBIGUOUS_CAPTION_REQUIRES_SINGLE_FIELD_SOURCE')


def main():
    import boto3
    from botocore.config import Config
    bucket = 'portfolioai-history-dev'
    if os.environ['CLOUDFLARE_R2_BUCKET'] != bucket:
        raise ValueError('DEVELOPMENT_BUCKET_REQUIRED')
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
                      config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                                    retries={'total_max_attempts': 1}))
    batch = json.loads((ROOT / 'v14-g03-margin-review-batch.json').read_text())
    pins = json.loads((ROOT / 'v14-g03-margin-original-pins.json').read_text())
    policy = json.loads((ROOT / 'v14-g03-financial-authorization.json').read_text())
    verify_pairs(batch)
    out = Path('g03-bel-margin-components-result')
    out.mkdir(exist_ok=True)
    originals = []
    for pin in pins:
        key = PREFIX + pin['original_sha256'] + '.xml'
        created = False
        try:
            data = s3.get_object(Bucket=bucket, Key=key)['Body'].read()
        except Exception as error:
            if getattr(error, 'response', {}).get('Error', {}).get('Code') not in ('NoSuchKey', '404'):
                raise
            if not pin['original_url'].startswith('https://nsearchives.nseindia.com/corporate/xbrl/'):
                raise ValueError('FIXED_NSE_XBRL_URL_REQUIRED')
            with urllib.request.urlopen(urllib.request.Request(pin['original_url'], headers={'User-Agent': 'Mozilla/5.0'}), timeout=45) as response:
                if response.url != pin['original_url']:
                    raise ValueError('BEL_ORIGINAL_REDIRECT_CHANGED')
                data = response.read(pin['original_bytes'] + 1)
            if len(data) != pin['original_bytes'] or hashlib.sha256(data).hexdigest() != pin['original_sha256']:
                raise ValueError('BEL_ORIGINAL_BYTES_MISMATCH')
            s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType='application/xml', IfNoneMatch='*')
            created = True
            data = s3.get_object(Bucket=bucket, Key=key)['Body'].read()
        if len(data) != pin['original_bytes'] or hashlib.sha256(data).hexdigest() != pin['original_sha256']:
            raise ValueError('BEL_RETAINED_ORIGINAL_BYTES_MISMATCH')
        cells = [c for c in batch['cells'] if c['originalSha256'] == pin['original_sha256']]
        xml_cells(data, cells)
        if os.environ.get('G03_ADMIT_MARGIN_COMPONENTS') == 'true':
            request = {'action': 'REGISTER_PINNED_G03_MARGIN_ORIGINAL', 'authorizationHash': policy['contractSha256'],
                       'originalHash': pin['original_sha256'], 'readUrl': s3.generate_presigned_url(
                           'get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=240)}
            first, repeat = invoke('v14-g02-official-source-import', request), invoke('v14-g02-official-source-import', request)
            if first.get('sourceId') != repeat.get('sourceId') or repeat.get('reused') is not True:
                raise ValueError('BEL_ORIGINAL_REGISTRATION_NOT_IDEMPOTENT')
        originals.append({'sha256': pin['original_sha256'], 'originalBytesVerified': True,
                          'sourceCellsVerified': len(cells), 'r2Key': key, 'r2Writes': int(created)})
        (out / 'sanitized-originals.json').write_text(json.dumps(originals, indent=2) + '\n')
    result = {'originals': originals, 'verifiedCells': batch['cells'], 'rawProviderPairsCorroborated': True,
              'providerCalls': 0, 'canonicalMaterialization': False}
    if os.environ.get('G03_ADMIT_MARGIN_COMPONENTS') == 'true':
        request = {'action': 'ADMIT_FIXED_G03_BEL_MARGIN_PAIRS', 'authorizationHash': policy['contractSha256'],
                   'verifiedCells': batch['cells']}
        first, repeat = invoke('v14-g02-document-admission', request), invoke('v14-g02-document-admission', request)
        expected = {b['reviewId'] for b in batch['periods']}
        if ({r['reviewId'] for r in first.get('results', [])} != expected
                or {r['reviewId'] for r in repeat.get('results', [])} != expected
                or not all(r.get('reused') is True for r in repeat['results'])):
            raise ValueError('BEL_MARGIN_ADMISSION_NOT_IDEMPOTENT')
        result.update(admission=first, duplicateAdmission='IDEMPOTENT')
    (out / 'sanitized-results.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'qualifiedOriginals': len(originals), 'qualifiedCells': len(batch['cells']),
                      'admittedPeriods': len(result.get('admission', {}).get('results', [])),
                      'providerCalls': 0, 'canonicalMaterialization': False}))


if __name__ == '__main__':
    main()
