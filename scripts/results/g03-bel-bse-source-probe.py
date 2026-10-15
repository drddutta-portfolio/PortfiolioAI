#!/usr/bin/env python3
"""BEL-only, bounded read-only test of the pinned BSE adapter.

Discovery and original PDF acquisition only. No database, R2, grants, provider
secrets, financial calculation, source acceptance or canonical selection writes.
"""
from __future__ import annotations
import hashlib
import json
import re
import subprocess
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE
from bse import BSE

WINDOWS = [
    ('2024-09-30', '2024-10-01', '2024-11-30'),
    ('2024-12-31', '2025-01-01', '2025-02-28'),
    ('2025-03-31', '2025-04-01', '2025-06-30'),
    ('2025-06-30', '2025-07-01', '2025-08-31'),
    ('2025-09-30', '2025-10-01', '2025-11-30'),
    ('2025-12-31', '2026-01-01', '2026-02-28'),
    ('2026-03-31', '2026-04-01', '2026-06-30'),
    ('2026-06-30', '2026-07-01', '2026-08-31'),
]
HINTS = re.compile(r'revenue|income from operations|profit before|finance cost|depreciation|earnings per|equity share capital|operating profit|EBITDA|cash flow|net cash|CIN|consolidated|standalone', re.I)


def candidates(result):
    rows = []
    for row in result.get('results', []):
        title = row.get('title', '')
        if not row.get('attachment_name') or re.search(r'intimation|newspaper|transcript|audio|video|press release|presentation', title, re.I):
            continue
        if not re.search(r'financial result|financial statement|audited|unaudited|outcome', title, re.I):
            continue
        rows.append(row)
    return rows[:2]


def main():
    root = Path('tmp/bel-bse-source-probe')
    root.mkdir(parents=True, exist_ok=True)
    (root / 'originals').mkdir(exist_ok=True)
    (root / 'http').mkdir(exist_ok=True)
    report = {'contract': 'BEL_BSE_SOURCE_FEASIBILITY_V1', 'libraryVersion': BSE.version,
              'symbol': 'BEL', 'bseScripCode': '500049', 'canonicalIsin': 'INE263A01024',
              'startedAt': datetime.now(timezone.utc).isoformat(), 'readOnly': True,
              'databaseWrites': 0, 'r2Writes': 0, 'canonicalSelections': 0,
              'financialReviews': 0, 'calls': [], 'windows': [], 'snapshots': {},
              'pdfs': [], 'financialQualification': 'NOT_ADMITTED'}
    def save():
        (root / 'report.json').write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')
    def capture(response, *args, **kwargs):
        if urlsplit(response.url).hostname == 'api.bseindia.com':
            raw = response.content
            sha = hashlib.sha256(raw).hexdigest()
            (root / 'http' / (sha + '.body')).write_bytes(raw)
            report['calls'].append({'url': response.url, 'httpStatus': response.status_code,
                                    'retrievedAt': datetime.now(timezone.utc).isoformat(),
                                    'sha256': sha, 'bytes': len(raw),
                                    'contentType': response.headers.get('Content-Type')})
            save()
        return response
    downloaded = set()
    with PortfolioBSE(root) as client:
        client._bse.session.hooks['response'].append(capture)
        for period, start, end in WINDOWS:
            try:
                result = client.financial_announcements('500049', date.fromisoformat(start), date.fromisoformat(end), max_pages=3)
            except Exception as error:
                report['windows'].append({'periodEnd': period, 'start': start, 'end': end,
                                          'status': 'SOURCE_FAILURE', 'errorType': type(error).__name__,
                                          'error': str(error)[:300]})
                # A denied source is not polled over all eight windows.
                report['stoppedAfterSourceFailure'] = True
                save()
                print(json.dumps({'status': 'SOURCE_FAILURE', 'period': period, 'error': str(error)[:200]}), flush=True)
                return 2
            report['windows'].append({'periodEnd': period, 'status': 'DISCOVERY_SUCCESS', **result})
            for row in candidates(result):
                attachment = row['attachment_name']
                if attachment in downloaded:
                    continue
                downloaded.add(attachment)
                try:
                    raw, meta = client.retrieve_original_pdf(attachment)
                    original = root / 'originals' / (meta['sha256'] + '.pdf')
                    original.write_bytes(raw)
                    text_file = original.with_suffix('.txt')
                    subprocess.run(['pdftotext', '-layout', str(original), str(text_file)], check=True, capture_output=True)
                    text = text_file.read_text()
                    pages = text.split('\f')
                    fragments = [{'pdfPage': n+1, 'text': line.strip()} for n, page in enumerate(pages)
                                 for line in page.splitlines() if HINTS.search(line)]
                    proof = {**meta, 'filing': row, 'requestedPeriodEnd': period,
                             'issuerNameSeen': bool(re.search(r'Bharat\s+Electronics', text, re.I)),
                             'cinSeen': 'L32309KA1954GOI000787' in text.replace(' ', ''),
                             'sourceTextExtracted': True, 'candidateRows': fragments,
                             'periodScopeAndColumnQualification': 'PENDING',
                             'financialFactsAdmitted': 0}
                    report['pdfs'].append(proof)
                except Exception as error:
                    report['pdfs'].append({'requestedPeriodEnd': period, 'attachment': attachment,
                                           'status': 'PDF_FAILURE', 'errorType': type(error).__name__,
                                           'error': str(error)[:300]})
                save()
            print(json.dumps({'period': period, 'financialFilings': len(result['results']),
                              'recordsSeen': result['records_seen'],
                              'truncated': result['may_have_more_pages']}), flush=True)
            save()
        for key, fn in [('results', lambda: client.results_snapshot('500049')),
                        ('market', lambda: client.market_context('500049')),
                        ('actions', lambda: client.action_discovery('500049', date(2026,7,9), date(2026,10,16)))]:
            try:
                report['snapshots'][key] = {'status': 'SUCCESS', 'result': fn()}
            except Exception as error:
                report['snapshots'][key] = {'status': 'SOURCE_FAILURE', 'errorType': type(error).__name__, 'error': str(error)[:300]}
            save()
    report['completedAt'] = datetime.now(timezone.utc).isoformat()
    report['summary'] = {'windowsQueried': len(report['windows']),
                         'windowsWithFilings': sum(bool(x.get('results')) for x in report['windows']),
                         'originalPdfsVerified': sum(bool(x.get('sha256')) for x in report['pdfs']),
                         'pdfFailures': sum(x.get('status') == 'PDF_FAILURE' for x in report['pdfs']),
                         'httpCalls': len(report['calls']),
                         'stillDiscoveryOnly': True}
    save()
    print(json.dumps(report['summary'], sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
