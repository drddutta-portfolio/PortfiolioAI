"""Verify actual retained originals and the approved three-year debt AND join."""
import hashlib
import json
import os
import re
import subprocess
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path
from g03_source_qualification import invoke, PREFIX

ROOT = Path('supabase/functions/_shared')


def xml_cells(data, cells):
    root = ET.fromstring(data)
    values = {e.tag.split('}')[-1]: e.text for e in root
              if e.get('contextRef') == 'OneD' and not e.get('unitRef')}
    if (values.get('Symbol') != 'BEL' or values.get('ScripCode') != '500049'
            or values.get('NameOfTheCompany', '').upper() != 'BHARAT ELECTRONICS LIMITED'
            or values.get('NatureOfReportStandaloneConsolidated') != 'Standalone'):
        raise ValueError('BEL_XBRL_COMPANY_SCOPE_NOT_VERIFIED')
    # The old catalogue has an obsolete pre-2017 ISIN. This exact original is
    # identified independently by issuer name, NSE symbol, BSE code, standalone
    # context and face value; the obsolete catalogue ISIN is never relabelled.
    if values.get('ISIN') not in (None, 'INE263A01024'):
        raise ValueError('BEL_XBRL_CONTRADICTORY_ISIN')
    for c in cells:
        matches = [e for e in root if e.tag.split('}')[-1] == c['tag']
                   and e.get('contextRef') == c['context']]
        if len(matches) != 1:
            raise ValueError('BEL_XBRL_FACT_NOT_UNIQUE')
        e = matches[0]
        if (e.get('unitRef') != c['unit'] or e.get('scale') is not None
                or e.get('{http://www.w3.org/2001/XMLSchema-instance}nil') is not None
                or e.text != c['literalValue']):
            raise ValueError('BEL_XBRL_EXACT_NUMERIC_FACT_NOT_VERIFIED')
        context = next((n for n in root if n.tag.split('}')[-1] == 'context'
                        and n.get('id') == c['context']), None)
        if context is None:
            raise ValueError('BEL_XBRL_CONTEXT_MISSING')
        dates = {n.tag.split('}')[-1]: n.text for n in context.iter()}
        year = c['fiscalYear']
        if c['context'] == 'OneI':
            valid = dates.get('instant') == f'{year}-03-31'
        else:
            valid = dates.get('startDate') == f'{year-1}-04-01' and dates.get('endDate') == f'{year}-03-31'
        if not valid:
            raise ValueError('BEL_XBRL_ANNUAL_CONTEXT_MISMATCH')


def pdf_cells(text, cells):
    if 'L32309KA1954GOI000787' not in text:
        raise ValueError('BEL_ORIGINAL_CIN_NOT_VERIFIED')
    pages = text.split('\f')
    for c in cells:
        page = pages[c['pdfPage'] - 1]
        note = re.escape(c['note']) + r'\s+' if c.get('note') else ''
        matches = list(re.finditer(re.escape(c['label']) + r'\s+' + note + r'([\d,]+)\s+([\d,]+)', page))
        index = c['occurrence']
        if len(matches) <= index or list(matches[index].groups()) != c['rowValues']:
            raise ValueError('BEL_EXACT_PDF_DEBT_CELL_NOT_VERIFIED:' + c['id'])
        if any(str(y) not in page for y in c['rowFiscalYears']):
            raise ValueError('BEL_PDF_FISCAL_COLUMN_NOT_PROVEN')


def verify_components(batch):
    def xml(year, tag):
        c = next(x for x in batch['cells'] if x['format'] == 'XBRL'
                 and x['fiscalYear'] == year and x['tag'] == tag)
        return Decimal(c['literalValue']) / Decimal(100000)
    for p in batch['periods']:
        year, c = p['fiscalYear'], p['components']
        for field, tag in [('borrowingCurrent', 'BorrowingsCurrent'), ('borrowingNoncurrent', 'BorrowingsNoncurrent'),
                           ('cashEquivalents', 'CashAndCashEquivalents'), ('profitBeforeTax', 'ProfitBeforeTax'),
                           ('financeCosts', 'FinanceCosts'), ('depreciation', 'DepreciationDepletionAndAmortisationExpense'),
                           ('otherIncome', 'OtherIncome')]:
            if year == 2024 and field in ('profitBeforeTax', 'financeCosts', 'depreciation', 'otherIncome'):
                continue  # Legacy FourD duration is incorrectly quarter-dated; never use those facts as annual.
            if Decimal(c[field]) != xml(year, tag):
                raise ValueError('BEL_COMPONENT_XML_UNIT_BINDING_FAILED')
        wanted = [('issuerOperatingEbitda', 'Earnings before Interest, Tax,', 0),
                  ('pledgedCashEquivalents', '(iii) Cash & Cash Equivalents', 0),
                  ('leaseCurrent', '(ia) Lease liabilities', 0), ('leaseNoncurrent', '(ia) Lease liabilities', 1),
                  ('leaseInterest', '-Interest expense on lease liability' if year == 2026 else 'Interest expense on lease liability', 0)]
        if year == 2024:
            wanted += [('profitBeforeTax', 'Profit before tax (V - VI)', 0), ('financeCosts', 'Finance costs', 0),
                       ('depreciation', 'Depreciation and amortisation expense', 0), ('otherIncome', 'Other income', 0)]
        for field, label, occurrence in wanted:
            choices = [x for x in batch['cells'] if x['format'] == 'PDF' and x['label'] == label
                       and x['occurrence'] == occurrence and year in x['rowFiscalYears']]
            if not choices or any(Decimal(x['rowValues'][x['rowFiscalYears'].index(year)].replace(',', ''))
                                  != Decimal(c[field]) for x in choices):
                raise ValueError('BEL_COMPONENT_PDF_BINDING_FAILED:' + field)
        if year in (2024, 2025):
            hand = next(x for x in batch['cells'] if x['id'] == 'PDF-CASH-ON-HAND')
            if Decimal(c['cashEquivalents']) - Decimal(c['pledgedCashEquivalents']) != Decimal(
                    hand['rowValues'][hand['rowFiscalYears'].index(year)]):
                raise ValueError('BEL_UNPLEDGED_CASH_NOT_RECONCILED_TO_ORIGINAL_CASH_ON_HAND')


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
    batch = json.loads((ROOT / 'v14-g03-debt-review-batch.json').read_text())
    pins = json.loads((ROOT / 'v14-g03-roce-original-pins.json').read_text()) + json.loads((ROOT / 'v14-g03-debt-original-pins.json').read_text())
    policy = json.loads((ROOT / 'v14-g03-financial-authorization.json').read_text())
    out = Path('g03-bel-debt-components-result')
    out.mkdir(exist_ok=True)
    originals = []
    for pin in pins:
        key = PREFIX + pin['original_sha256'] + '.' + pin['extension']
        created = False
        try:
            data = s3.get_object(Bucket=bucket, Key=key)['Body'].read()
        except Exception as error:
            if (pin['extension'] != 'xml' or getattr(error, 'response', {}).get('Error', {}).get('Code')
                    not in ('NoSuchKey', '404')):
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
        if pin['extension'] == 'xml':
            xml_cells(data, cells)
            if os.environ.get('G03_ADMIT_DEBT_COMPONENTS') == 'true':
                request = {'action': 'REGISTER_PINNED_G03_DEBT_ORIGINAL', 'authorizationHash': policy['contractSha256'],
                           'originalHash': pin['original_sha256'], 'readUrl': s3.generate_presigned_url(
                               'get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=240)}
                first, repeat = invoke('v14-g02-official-source-import', request), invoke('v14-g02-official-source-import', request)
                if first.get('sourceId') != repeat.get('sourceId') or repeat.get('reused') is not True:
                    raise ValueError('BEL_ORIGINAL_REGISTRATION_NOT_IDEMPOTENT')
        else:
            with tempfile.TemporaryDirectory() as temp:
                pdf, txt = Path(temp) / 'original.pdf', Path(temp) / 'original.txt'
                pdf.write_bytes(data)
                subprocess.run(['pdftotext', '-layout', str(pdf), str(txt)], check=True, capture_output=True)
                pdf_cells(txt.read_text(), cells)
        originals.append({'sha256': pin['original_sha256'], 'originalBytesVerified': True,
                          'sourceCellsVerified': len(cells), 'r2Key': key, 'r2Writes': int(created)})
        (out / 'sanitized-originals.json').write_text(json.dumps(originals, indent=2) + '\n')
    verify_components(batch)
    result = {'originals': originals, 'verifiedCells': batch['cells'], 'sourceComponentsQualified': True,
              'providerCalls': 0, 'canonicalMaterialization': False}
    if os.environ.get('G03_ADMIT_DEBT_COMPONENTS') == 'true':
        request = {'action': 'ADMIT_FIXED_G03_BEL_DEBT_COMPONENTS', 'authorizationHash': policy['contractSha256'],
                   'verifiedCells': batch['cells']}
        first, repeat = invoke('v14-g02-document-admission', request), invoke('v14-g02-document-admission', request)
        expected = {b['reviewId'] for b in batch['periods']}
        if ({r['reviewId'] for r in first.get('results', [])} != expected
                or {r['reviewId'] for r in repeat.get('results', [])} != expected
                or not all(r.get('reused') is True for r in repeat['results'])):
            raise ValueError('BEL_DEBT_ADMISSION_NOT_IDEMPOTENT')
        result.update(admission=first, duplicateAdmission='IDEMPOTENT')
    (out / 'sanitized-results.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'qualifiedOriginals': len(originals), 'qualifiedCells': len(batch['cells']),
                      'admittedPeriods': len(result.get('admission', {}).get('results', [])),
                      'providerCalls': 0, 'canonicalMaterialization': False}))


if __name__ == '__main__':
    main()
