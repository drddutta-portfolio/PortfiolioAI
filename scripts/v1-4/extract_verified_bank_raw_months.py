"""Read verified NSE archives once for all banks; no database writes/admission.

Uses the established NSE archive catalog, exact dated ISIN scope, original
compressed/content hashes and exchange dates. Adjusted R2 closes are not raw closes.
"""
import argparse
import csv
import hashlib
import io
import json
import re
import time
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse

def digest(value): return hashlib.sha256(value).hexdigest()

def source_url(archive):
    url = archive['source_url']; parsed = urlparse(url)
    if (parsed.scheme != 'https' or parsed.hostname != 'nsearchives.nseindia.com'
            or parsed.username or parsed.password or parsed.port or parsed.query or parsed.fragment
            or not parsed.path.startswith('/content/') or not parsed.path.endswith('.csv.zip')):
        raise ValueError('OFFICIAL_ARCHIVE_AUTHORITY_INVALID')
    if archive['source_kind'] not in ('NSE_CM_BHAVCOPY_LEGACY', 'NSE_CM_BHAVCOPY_UDIFF'):
        raise ValueError('OFFICIAL_ARCHIVE_KIND_INVALID')
    if not all(re.fullmatch(r'[0-9a-f]{64}', archive.get(k, '')) for k in ('compressed_sha256', 'content_sha256')):
        raise ValueError('ORIGINAL_HASH_REQUIRED')
    return url

def parse_rows(content, trade_date, identities):
    reader = csv.DictReader(io.StringIO(content.decode('utf-8-sig')))
    def normalize(row): return {re.sub(r'[^A-Z0-9]', '', k.upper()): (v or '').strip() for k, v in row.items() if k}
    rows = [normalize(row) for row in reader]
    results = []
    for identity in identities:
        selected = [row for row in rows if row.get('ISIN') == identity['isin'] and row.get('SERIES', row.get('SCTYSRS')) == 'EQ']
        if len(selected) != 1: raise ValueError('EXACT_ISIN_ROW_MISSING_OR_DUPLICATE:' + identity['symbol'])
        row = selected[0]; symbol = row.get('SYMBOL', row.get('TCKRSYMB'))
        if symbol != identity['symbol']: raise ValueError('EXACT_ISIN_SYMBOL_CONFLICT')
        raw_date = row.get('TIMESTAMP', row.get('TRADDT', ''))
        try: parsed_date = datetime.strptime(raw_date, '%d-%b-%Y').date().isoformat()
        except ValueError: parsed_date = datetime.strptime(raw_date, '%Y-%m-%d').date().isoformat()
        if parsed_date != trade_date: raise ValueError('TRADE_DATE_CONFLICT')
        close = row.get('CLOSE', row.get('CLSPRIC', ''))
        try: numeric = Decimal(close)
        except InvalidOperation as exc: raise ValueError('RAW_PRICE_INVALID') from exc
        if not numeric.is_finite() or numeric <= 0: raise ValueError('RAW_PRICE_INVALID')
        results.append({'security_id': identity['securityId'], 'symbol': symbol, 'isin': identity['isin'],
            'series': 'EQ', 'trade_date': parsed_date, 'raw_close': close, 'price_basis': 'RAW_CONTEMPORANEOUS_CLOSE',
            'corporate_action_share_basis_qualified': False, 'canonical_admitted': False})
    return results

def read_archive(archive, identities, cache):
    url = source_url(archive); target = cache / (archive['compressed_sha256'] + '.zip')
    content_receipt = cache / (archive['content_sha256'] + '.json')
    if not target.exists() and content_receipt.exists():
        prior = json.loads(content_receipt.read_text())
        if not re.fullmatch(r'[0-9a-f]{64}', prior.get('actual_compressed_sha256', '')):
            raise ValueError('CACHED_TRANSPORT_RECEIPT_INVALID')
        target = cache / (prior['actual_compressed_sha256'] + '.zip')
    reused = target.exists()
    if reused: original = target.read_bytes()
    else:
        request = urllib.request.Request(url, headers={'User-Agent': 'PortfolioAI-V14-SourceQualification/1.0'})
        with urllib.request.urlopen(request, timeout=50) as response:
            if response.geturl() != url: raise ValueError('OFFICIAL_ARCHIVE_REDIRECT_REQUIRES_REVIEW')
            original = response.read(32 * 1024 * 1024 + 1)
        if len(original) > 32 * 1024 * 1024: raise ValueError('ARCHIVE_TOO_LARGE')
    actual_zip_hash = digest(original)
    with zipfile.ZipFile(io.BytesIO(original)) as zipped:
        files = [entry for entry in zipped.infolist() if entry.filename.lower().endswith('.csv')]
        if len(files) != 1 or files[0].file_size > 64 * 1024 * 1024: raise ValueError('CSV_ARCHIVE_AMBIGUOUS_OR_TOO_LARGE')
        content = zipped.read(files[0])
    if digest(content) != archive['content_sha256']: raise ValueError('CONTENT_HASH_MISMATCH')
    selected = parse_rows(content, archive['source_period_start'], identities)
    # NSE can repackage identical CSV bytes. Preserve the new original under its
    # actual hash; never overwrite the catalog's original compressed hash.
    if not reused:
        (cache / (actual_zip_hash + '.zip')).write_bytes(original)
        content_receipt.write_text(json.dumps({'actual_compressed_sha256': actual_zip_hash}) + '\n')
    return {'month': archive['month_key'], 'catalog_source_id': archive['id'], 'source_url': url,
        'source_contract_version': archive['source_contract_version'], 'compressed_sha256': actual_zip_hash,
        'catalog_compressed_sha256': archive['compressed_sha256'],
        'transport_representation': 'ORIGINAL_COMPRESSED_HASH_MATCH' if actual_zip_hash == archive['compressed_sha256'] else 'REPACKAGED_ZIP_EXACT_CSV_CONTENT_MATCH',
        'content_sha256': digest(content), 'source_downloads': 0 if reused else 1, 'cached_original_reused': reused,
        'rows': selected}

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('catalog'); parser.add_argument('scope'); parser.add_argument('cache'); parser.add_argument('output')
    args = parser.parse_args(); catalog = json.loads(Path(args.catalog).read_text()); scope = json.loads(Path(args.scope).read_text())
    if len({a['month_key'] for a in catalog}) != len(catalog): raise ValueError('DUPLICATE_MONTH_CATALOG')
    if any(not '2023-10' <= a['month_key'] <= '2025-07' for a in catalog): raise ValueError('DATED_SCOPE_REQUIRED')
    cache = Path(args.cache); cache.mkdir(parents=True, exist_ok=True); started = time.monotonic()
    with ThreadPoolExecutor(max_workers=3) as pool:
        captures = list(pool.map(lambda archive: read_archive(archive, scope, cache), catalog))
    report = {'version': 'VERIFIED_NSE_RAW_BANK_MONTHS_V1', 'captures': captures,
        'months': len(captures), 'banks_per_month': len(scope), 'raw_price_rows': sum(len(c['rows']) for c in captures),
        'source_downloads': sum(c['source_downloads'] for c in captures), 'paid_provider_calls': 0, 'retries': 0,
        'canonical_admissions': 0, 'elapsed_seconds': round(time.monotonic() - started, 6)}
    Path(args.output).write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'captures'}))

if __name__ == '__main__': main()
