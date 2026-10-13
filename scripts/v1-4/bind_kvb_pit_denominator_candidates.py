"""Bind original publication-bounded BVPS to raw month prices without admission.

This is source qualification, not a second valuation calculator. The existing
canonical ledger/comparator remain the only owners of P/B and P/E calculations.
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

def instant(value): return datetime.fromisoformat(value.replace('Z', '+00:00'))

def available_bvps(documents, trade_date):
    # NSE normal closing time; cannot use an after-close filing on the same day.
    at_close = instant(trade_date + 'T15:30:00+05:30')
    rows = []
    for document in documents:
        published = document.get('source_available_at')
        if not published or instant(published) > at_close: continue
        for observation in document['observations']:
            if observation['code'] != 'BVPS_REPORTED' or observation['period_end'] > trade_date: continue
            rows.append({**observation, 'original_url': document['exchange_original_url'],
                'original_sha256': document['exchange_original_sha256'], 'source_available_at': published})
    if not rows: return {'state': 'NO_THEN_AVAILABLE_BVPS', 'candidates': []}
    latest_period = max(row['period_end'] for row in rows)
    latest = sorted([row for row in rows if row['period_end'] == latest_period], key=lambda row: (instant(row['source_available_at']), row['original_sha256']))
    values = sorted({row['numeric_value'] for row in latest})
    # Newer retrieval or even later publication alone does not resolve a changed
    # denominator. Retain both versions for source-bound correction admission.
    return {'state': 'THEN_AVAILABLE_BVPS_VALUE_CONFLICT' if len(values) > 1 else 'THEN_AVAILABLE_LITERAL_BVPS_CANDIDATE',
        'period_end': latest_period, 'literal_values': values, 'candidates': latest,
        'canonical_admitted': False}

def price_rows(earlier, middle, recent):
    rows = []
    for capture in earlier:
        if len(capture['kvb_rows']) != 1: raise ValueError('EARLIER_KVB_EXACT_IDENTITY_REQUIRED')
        row = capture['kvb_rows'][0]
        rows.append({'month': capture['month'], 'trade_date': capture['trade_date'], 'raw_close': row['close'],
            'source_record_id': capture['id'], 'source_url': capture['source_url'], 'content_sha256': capture['content_sha256'],
            'security_id': row['security_id'], 'isin': row['isin'], 'price_basis': 'RAW_CONTEMPORANEOUS_CLOSE'})
    for capture in middle['captures']:
        selected = [row for row in capture['rows'] if row['symbol'] == 'KARURVYSYA']
        if len(selected) != 1: raise ValueError('MIDDLE_KVB_EXACT_IDENTITY_REQUIRED')
        rows.append({**selected[0], 'month': capture['month'], 'source_catalog_id': capture['catalog_source_id'],
            'source_url': capture['source_url'], 'content_sha256': capture['content_sha256'],
            'original_compressed_sha256': capture['compressed_sha256'], 'transport_representation': capture['transport_representation']})
    for row in recent:
        date = row['trade_date_ist']
        rows.append({'month': date[:7], 'trade_date': date, 'raw_close': row['close'], 'security_id': row['security_id'],
            'provider_code': row['provider_code'], 'mapping_id': row['mapping_id'], 'provenance': row['provenance'],
            'price_basis': 'RAW_CONTEMPORANEOUS_CLOSE', 'exchange_time_zone': 'Asia/Kolkata'})
    if len(rows) != 60 or len({row['month'] for row in rows}) != 60: raise ValueError('EXACT_60_MONTH_RAW_PRICE_SCOPE_REQUIRED')
    return sorted(rows, key=lambda row: row['month'])

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('source_dir'); parser.add_argument('denominators'); parser.add_argument('output')
    args = parser.parse_args(); root = Path(args.source_dir)
    read = lambda name: json.loads((root / name).read_text())
    prices = price_rows(read('earlier-raw-month-prices.json'), read('raw-price-extraction.json'), read('recent-raw-month-prices.json'))
    documents = json.loads(Path(args.denominators).read_text())['documents']
    bound = []
    for price in prices:
        bvps = available_bvps(documents, price['trade_date'])
        bound.append({'price': price, 'bvps': bvps,
            'required_before_pb_admission': ['ORIGINAL_ACCOUNTING_SCOPE_BINDING', 'THEN_APPLICABLE_SHARE_BASIS_PROOF', 'SOURCE_BOUND_FACTUAL_ADMISSION'] +
                (['DOCUMENTED_DENOMINATOR_REVISION_RESOLUTION'] if bvps['state'] == 'THEN_AVAILABLE_BVPS_VALUE_CONFLICT' else []),
            'pe_state': 'DILUTED_TTM_EPS_NOT_PROVEN_ANNUAL_EPS_NOT_SUBSTITUTED', 'pe_admitted': False, 'pb_admitted': False})
    report = {'version': 'KVB_PUBLICATION_BOUNDED_RAW_PRICE_DENOMINATOR_JOIN_V1', 'period': '2021-10..2026-09',
        'price_months': len(bound), 'then_available_bvps_months': sum(row['bvps']['state'] != 'NO_THEN_AVAILABLE_BVPS' for row in bound),
        'same_period_conflict_months': sum(row['bvps']['state'] == 'THEN_AVAILABLE_BVPS_VALUE_CONFLICT' for row in bound),
        'pe_admitted_months': 0, 'pb_admitted_months': 0, 'provider_calls': 0, 'source_downloads': 0, 'months': bound}
    Path(args.output).write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'months'}))

if __name__ == '__main__': main()
