"""Qualify actual original financial availability and three dated defence valuations.

All original JSON captures retain their HTTP body bytes. Original source ledger
publication fields stay UNKNOWN; independently qualified NSE dissemination facts
are appended separately and never inferred from a current retrieval time.
"""
import hashlib
import json
import os
import subprocess
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from pathlib import Path
from g03_source_qualification import invoke, PREFIX
from g03_bel_cash_components import qualify_source_cells

ROOT = Path('supabase/functions/_shared')
CAPTURES = Path('scripts/v1-4/fixtures/g03-bel-valuations')
TZ = timezone(timedelta(hours=5, minutes=30))


def xml_cells(data, cells):
    root = ET.fromstring(data)
    meta = {e.tag.split('}')[-1]: e.text for e in root
            if e.get('contextRef') in ('OneD', 'MainD') and not e.get('unitRef')}
    share = any(c.get('scope') == 'ISSUED_EQUITY_SHARES' for c in cells)
    if (meta.get('Symbol') != 'BEL' or meta.get('NameOfTheCompany', '').upper() != 'BHARAT ELECTRONICS LIMITED'
            or meta.get('ISIN') not in (None, 'INE263A01024')
            or not share and (meta.get('ScripCode') != '500049' or meta.get('NatureOfReportStandaloneConsolidated') != 'Standalone')):
        raise ValueError('BEL_VALUATION_ORIGINAL_IDENTITY_SCOPE_NOT_VERIFIED')
    for c in cells:
        facts = [e for e in root if e.tag.split('}')[-1] == c['tag'] and e.get('contextRef') == c['context']]
        contexts = [e for e in root if e.tag.split('}')[-1] == 'context' and e.get('id') == c['context']]
        if len(facts) != 1 or len(contexts) != 1:
            raise ValueError('BEL_VALUATION_ORIGINAL_FACT_CONTEXT_NOT_UNIQUE')
        fact = facts[0]
        if (fact.text != c['literalValue'] or fact.get('unitRef') != c['unit'] or fact.get('scale') is not None
                or fact.get('{http://www.w3.org/2001/XMLSchema-instance}nil') is not None):
            raise ValueError('BEL_VALUATION_ORIGINAL_LITERAL_UNIT_NOT_VERIFIED')
        dates = {e.tag.split('}')[-1]: e.text for e in contexts[0].iter()}
        if 'instant' in c:
            valid = dates.get('instant') == c['instant']
        else:
            valid = dates.get('startDate') == c['periodStart'] and dates.get('endDate') == c['periodEnd']
        if not valid:
            raise ValueError('BEL_VALUATION_ORIGINAL_PERIOD_NOT_VERIFIED')


def verify_availability(batch, originals):
    pins = {p['original_sha256']: p for p in json.loads((ROOT / 'v14-g03-valuation-original-pins.json').read_text())}
    for c in batch['catalogs']:
        if hashlib.sha256(originals[c['originalSha256']]).hexdigest() != c['originalSha256']:
            raise ValueError('BEL_DISSEMINATION_CATALOG_ORIGINAL_HASH_INVALID')
    catalogs = {c['kind']: json.loads(originals[c['originalSha256']]) for c in batch['catalogs']}
    for a in batch['availability']:
        kind, row = a['catalogKind'], a['catalogRow']
        catalog = catalogs[kind]
        rows = catalog if isinstance(catalog, list) else catalog['data']
        if row not in rows or row.get('symbol') != 'BEL':
            raise ValueError('BEL_ACTUAL_NSE_DISSEMINATION_ROW_NOT_FOUND')
        catalog_hash = next(c['originalSha256'] for c in batch['catalogs'] if c['kind'] == kind)
        pin = pins.get(a['originalSha256'])
        if not pin or a['catalogSha256'] != catalog_hash:
            raise ValueError('BEL_AVAILABILITY_ORIGINAL_BINDING_NOT_VERIFIED')
        if kind != 'NSE_ANNUAL_REPORT_DISSEMINATION' and row.get('xbrl') != pin['original_url']:
            raise ValueError('BEL_DISSEMINATED_XBRL_ORIGINAL_URL_MISMATCH')
        def dt(s):
            return datetime.strptime(s, '%d-%b-%Y %H:%M:%S').replace(tzinfo=TZ)
        if kind == 'NSE_INTEGRATED_FINANCIAL_ORIGINAL':
            if row['consolidated'] != 'Standalone' or row['type_Sub'] != 'Original' or row['revised_Date'] is not None:
                raise ValueError('BEL_REVISED_OR_WRONG_SCOPE_FINANCIAL_AVAILABILITY')
            at = max(dt(row['broadcast_Date']), dt(row['creation_Date']))
        elif kind == 'NSE_SHAREHOLDING_ORIGINAL':
            if row['name'] != 'Bharat Electronics Limited' or row['revisedData'] != 'N':
                raise ValueError('BEL_SHARE_AVAILABILITY_REVISION_NOT_RESOLVED')
            at = max(dt(row['broadcastDate']), dt(row['systemDate']))
        else:
            if row['seq_id'] != '106727442' or a['identicalOfficialAttachmentSha256'] != a['originalSha256']:
                raise ValueError('BEL_ANNUAL_PUBLICATION_ATTACHMENT_NOT_BOUND')
            at = max(dt(row['an_dt']), dt(row['exchdisstime']))
        if at.isoformat() != a['publishedAt'] or a['availabilityPrecision'] != 'EXACT':
            raise ValueError('BEL_CONSERVATIVE_ORIGINAL_AVAILABILITY_NOT_VERIFIED')
    # Share changes are not inferred from an increase of AUTHORIZED capital.
    # Exact June and September original share counts agree; all retained NSE
    # issuer announcements are examined for allotments/issuance/buybacks.
    announcements = catalogs['NSE_ANNUAL_REPORT_DISSEMINATION']
    if len(announcements) != 31 or any(r.get('symbol') != 'BEL' for r in announcements):
        raise ValueError('BEL_ISSUER_ANNOUNCEMENT_WINDOW_NOT_COMPLETE')
    changes = [r for r in announcements if any(w in (r.get('desc', '') + ' ' + r.get('attchmntText', '')).lower()
               for w in ('allotment', 'allotted', 'buyback', 'buy-back', 'esop', 'rights issue', 'bonus issue', 'split of'))]
    if changes:
        raise ValueError('BEL_SHARE_ISSUANCE_EVENT_REQUIRES_RECONCILIATION')
    financials = catalogs['NSE_INTEGRATED_FINANCIAL_ORIGINAL']['data']
    latest = [r for r in financials if r['consolidated'] == 'Standalone' and r['qe_Date'] == '30-JUN-2026']
    if len(latest) != 1 or latest[0]['type_Sub'] != 'Original':
        raise ValueError('BEL_LATEST_FINANCIAL_REVISION_NOT_RESOLVED')


def verify_components(batch):
    def raw(end, tag):
        xs = [c for c in batch['cells'] if c.get('periodEnd') == end and c['tag'] == tag]
        if len(xs) != 1:
            raise ValueError('BEL_VALUATION_COMPONENT_NOT_UNIQUE')
        return Decimal(xs[0]['literalValue']) / Decimal(100000)
    def ebitda(end):
        return raw(end, 'ProfitBeforeTax') + raw(end, 'FinanceCosts') + raw(end, 'DepreciationDepletionAndAmortisationExpense') - raw(end, 'OtherIncome')
    cash = next(x for x in json.loads((ROOT / 'v14-g03-cash-review-batch.json').read_text())['periods'] if x['fiscalYear'] == 2026)
    debt = next(x for x in json.loads((ROOT / 'v14-g03-debt-review-batch.json').read_text())['periods'] if x['fiscalYear'] == 2026)
    if len(batch['periods']) != 3 or len({p['valuationDate'] for p in batch['periods']}) != 3:
        raise ValueError('THREE_DISTINCT_DATED_VALUATIONS_REQUIRED')
    for p in batch['periods']:
        c = p['components']
        if c['scope'] != 'STANDALONE' or c['shares'] != '7309778829' or c['amountUnit'] != 'INR_LAKH':
            raise ValueError('BEL_VALUATION_SHARE_SCOPE_UNIT_NOT_PROVEN')
        for field, end in [('annualPat', '2026-03-31'), ('priorJunePat', '2025-06-30'), ('currentJunePat', '2026-06-30')]:
            if Decimal(c[field]) != raw(end, 'ProfitLossForPeriod'):
                raise ValueError('BEL_VALUATION_TTM_PAT_NOT_BOUND')
        for field, end in [('annualOperatingEbitda', '2026-03-31'), ('priorJuneOperatingEbitda', '2025-06-30'), ('currentJuneOperatingEbitda', '2026-06-30')]:
            if Decimal(c[field]) != ebitda(end):
                raise ValueError('BEL_VALUATION_TTM_EBITDA_NOT_BOUND')
        if (c['annualCfo'] != cash['components']['cfoOriginal'] or Decimal(c['annualCashCapex']) != -Decimal(cash['components']['cashCapexOutflow'])
                or Decimal(c['grossDebt']) != sum(Decimal(debt['components'][k]) for k in ['borrowingCurrent', 'borrowingNoncurrent', 'leaseCurrent', 'leaseNoncurrent'])
                or Decimal(c['verifiedUnpledgedCash']) != Decimal(debt['components']['cashEquivalents']) - Decimal(debt['components']['pledgedCashEquivalents'])):
            raise ValueError('BEL_VALUATION_ACCEPTED_CASH_OR_DEBT_NOT_MATCHED')
        close = datetime.fromisoformat(p['valuationDate'] + 'T15:30:00+05:30')
        if any(datetime.fromisoformat(c[k]) > close for k in ['financialAvailabilityAt', 'shareAvailabilityAt']):
            raise ValueError('BEL_VALUATION_LOOKAHEAD_NOT_ALLOWED')
        share = next(x for x in batch['shareFacts'] if x['originalSha256'] == p['shareSourceSha256'])
        if share['shares'] != c['shares'] or share['publishedAt'] != c['shareAvailabilityAt']:
            raise ValueError('BEL_VALUATION_EXACT_DATED_SHARES_NOT_BOUND')


def main():
    import boto3
    from botocore.config import Config
    bucket = 'portfolioai-history-dev'
    if os.environ['CLOUDFLARE_R2_BUCKET'] != bucket:
        raise ValueError('DEVELOPMENT_BUCKET_REQUIRED')
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
                      config=Config(signature_version='s3v4', s3={'addressing_style': 'path'}, retries={'total_max_attempts': 1}))
    batch = json.loads((ROOT / 'v14-g03-valuation-review-batch.json').read_text())
    pins = json.loads((ROOT / 'v14-g03-valuation-original-pins.json').read_text())
    policy = json.loads((ROOT / 'v14-g03-financial-authorization.json').read_text())
    out = Path('g03-bel-valuation-components-result')
    out.mkdir(exist_ok=True)
    originals, evidence = {}, []
    for pin in pins:
        h = pin['original_sha256']
        key = PREFIX + h + '.' + pin['extension']
        created = False
        try:
            data = s3.get_object(Bucket=bucket, Key=key)['Body'].read()
        except Exception as error:
            if getattr(error, 'response', {}).get('Error', {}).get('Code') not in ('NoSuchKey', '404'):
                raise
            if pin['extension'] == 'json':
                # Exact captured original bytes, never json.dumps() of a model's
                # reconstructed catalogue. Every relevant row is verified below.
                data = (CAPTURES / (h + '.json')).read_bytes()
            elif pin['extension'] == 'xml' and pin['original_url'].startswith('https://nsearchives.nseindia.com/corporate/xbrl/'):
                with urllib.request.urlopen(urllib.request.Request(pin['original_url'], headers={'User-Agent': 'Mozilla/5.0'}), timeout=45) as response:
                    if response.url != pin['original_url']:
                        raise ValueError('BEL_ORIGINAL_REDIRECT_CHANGED')
                    data = response.read(pin['original_bytes'] + 1)
            else:
                raise ValueError('BEL_EXISTING_ORIGINAL_REQUIRED')
            if len(data) != pin['original_bytes'] or hashlib.sha256(data).hexdigest() != h:
                raise ValueError('BEL_ORIGINAL_BYTES_MISMATCH')
            s3.put_object(Bucket=bucket, Key=key, Body=data, IfNoneMatch='*', ContentType='application/json' if pin['extension'] == 'json' else 'application/xml')
            created = True
            data = s3.get_object(Bucket=bucket, Key=key)['Body'].read()
        if len(data) != pin['original_bytes'] or hashlib.sha256(data).hexdigest() != h:
            raise ValueError('BEL_RETAINED_ORIGINAL_BYTES_MISMATCH')
        originals[h] = data
        cells = [c for c in batch['cells'] if c['originalSha256'] == h]
        if pin['extension'] == 'xml':
            xml_cells(data, cells)
        elif pin['extension'] == 'pdf':
            with tempfile.TemporaryDirectory() as temp:
                pdf, txt = Path(temp) / 'original.pdf', Path(temp) / 'original.txt'
                pdf.write_bytes(data)
                subprocess.run(['pdftotext', '-layout', str(pdf), str(txt)], check=True, capture_output=True)
                pages = txt.read_text().split('\f')
                note = batch['annualSharesNote']
                if note['label'] not in pages[note['pdfPage']-1] or '7,30,97,78,829   7,30,97,78,829' not in pages[note['pdfPage']-1]:
                    raise ValueError('BEL_ANNUAL_WEIGHTED_SHARE_COUNT_NOT_PROVEN')
                cash_cells = [c for c in json.loads((ROOT / 'v14-g03-cash-review-batch.json').read_text())['cells'] if c['originalSha256'] == h]
                qualify_source_cells({(h, number + 1): text for number, text in enumerate(pages)}, cash_cells)
        evidence.append({'sha256': h, 'r2Key': key, 'r2Writes': int(created), 'originalBytesVerified': True, 'sourceCellsVerified': len(cells)})
        (out / 'sanitized-originals.json').write_text(json.dumps(evidence, indent=2) + '\n')
    verify_availability(batch, originals)
    verify_components(batch)
    # Independently establish that the NSE-disseminated annual-report attachment
    # is byte-identical to the already archived original, not merely same-title.
    a = next(a for a in batch['availability'] if a['catalogKind'] == 'NSE_ANNUAL_REPORT_DISSEMINATION')
    with urllib.request.urlopen(urllib.request.Request(a['catalogRow']['attchmntFile'], headers={'User-Agent': 'Mozilla/5.0'}), timeout=60) as response:
        data = response.read(32 * 1024 * 1024 + 1)
    if hashlib.sha256(data).hexdigest() != a['originalSha256']:
        raise ValueError('BEL_OFFICIAL_ANNUAL_ATTACHMENT_CONTENT_NOT_IDENTICAL')
    result = {'originals': evidence, 'verifiedCells': batch['cells'], 'verifiedAvailability': batch['availability'],
              'qualifiedDates': [p['valuationDate'] for p in batch['periods']], 'officialAnnualAttachmentBytesIdentical': True,
              'financialAvailabilityNotRetrieval': True, 'providerCalls': 0, 'canonicalMaterialization': False}
    if os.environ.get('G03_ADMIT_VALUATION_COMPONENTS') == 'true':
        for pin in pins:
            key = PREFIX + pin['original_sha256'] + '.' + pin['extension']
            request = {'action': 'REGISTER_PINNED_G03_VALUATION_ORIGINAL', 'authorizationHash': policy['contractSha256'],
                       'originalHash': pin['original_sha256'], 'readUrl': s3.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=240)}
            first, repeat = invoke('v14-g02-official-source-import', request), invoke('v14-g02-official-source-import', request)
            if first.get('sourceId') != repeat.get('sourceId') or repeat.get('reused') is not True:
                raise ValueError('BEL_ORIGINAL_REGISTRATION_NOT_IDEMPOTENT')
        request = {'action': 'ADMIT_FIXED_G03_BEL_DATED_VALUATIONS', 'authorizationHash': policy['contractSha256'],
                   'verifiedCells': batch['cells'], 'verifiedAvailability': batch['availability']}
        first, repeat = invoke('v14-g02-document-admission', request), invoke('v14-g02-document-admission', request)
        expected = {p['reviewId'] for p in batch['periods']}
        if {r['reviewId'] for r in first.get('results', [])} != expected or not all(r.get('reused') is True for r in repeat['results']):
            raise ValueError('BEL_VALUATION_ADMISSION_NOT_IDEMPOTENT')
        result.update(admission=first, duplicateAdmission='IDEMPOTENT')
    (out / 'sanitized-results.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'qualifiedOriginals': len(evidence), 'qualifiedDates': 3, 'admittedDates': len(result.get('admission', {}).get('results', [])), 'providerCalls': 0, 'canonicalMaterialization': False}))


if __name__ == '__main__':
    main()
