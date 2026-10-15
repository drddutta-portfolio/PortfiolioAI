#!/usr/bin/env python3
"""Reuse original BSE index responses; fetch only eight target primary filings.

No repeated announcement/snapshot acquisition, no financial calculation/admission.
Larger identified originals use the adapter's explicit 32 MB opt-in.
"""
from __future__ import annotations
import hashlib
import json
import re
import subprocess
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from portfolio_bse import PortfolioBSE

SRC = Path('tmp/retained-bel-bse')
OUT = Path('tmp/bel-bse-recovered')


def primary_candidates(result):
    rows = []
    for row in result['results']:
        text = row['title'] + ' ' + row.get('headline', '')
        if not row['attachment_name'] or re.search(r'intimation|newspaper|transcript|audio|video|analyst|investor meet|presentation|press release', text, re.I):
            continue
        if not re.search(r'financial result|financial statement|board meeting outcome|outcome of board meeting', text, re.I):
            continue
        rank = 0 if re.search(r'financial result', row['title'], re.I) else 1
        rows.append((rank, row))
    return [r for _, r in sorted(rows, key=lambda x: (x[0], x[1].get('published_at') or ''))]


def main():
    original = json.loads((SRC / 'report.json').read_text())
    pages = {}
    for call in original['calls']:
        url = urlsplit(call['url'])
        if url.hostname != 'api.bseindia.com' or 'AnnSubCategoryGetData' not in url.path or call['httpStatus'] != 200:
            continue
        data = (SRC / 'http' / (call['sha256'] + '.body')).read_bytes()
        assert hashlib.sha256(data).hexdigest() == call['sha256']
        q = parse_qs(url.query)
        assert q['strScrip'] == ['500049']
        pages[(q['strPrevDate'][0], q['strToDate'][0], int(q['pageno'][0]))] = json.loads(data)
    class Replay:
        def announcements(self, **kw):
            return pages[(kw['from_date'].strftime('%Y%m%d'), kw['to_date'].strftime('%Y%m%d'), kw['page_no'])]
    replay = PortfolioBSE.__new__(PortfolioBSE)
    replay._bse = Replay()
    OUT.mkdir(parents=True, exist_ok=True)
    originals = OUT / 'originals'
    report_dir = OUT / 'report'
    originals.mkdir(exist_ok=True)
    report_dir.mkdir(exist_ok=True)
    result = {'contract': 'BEL_BSE_ORIGINAL_RECOVERY_V1', 'sourceRunId': 38796801988,
              'startedAt': datetime.now(timezone.utc).isoformat(), 'symbol': 'BEL', 'scripCode': '500049',
              'readOnly': True, 'databaseWrites': 0, 'r2Writes': 0, 'canonicalSelections': 0,
              'newAnnouncementRequests': 0, 'newSnapshotRequests': 0,
              'primaryFilings': [], 'newOriginalDownloads': 0, 'reusedOriginals': 0,
              'priorProbe': original['summary'], 'snapshots': original['snapshots']}
    def save():
        (report_dir / 'report.json').write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    old = {p['filing']['attachment_name']: p for p in original['pdfs'] if p.get('sha256')}
    with PortfolioBSE(OUT) as client:
        for w in original['windows']:
            found = replay.financial_announcements('500049', date.fromisoformat(w['start']), date.fromisoformat(w['end']), max_pages=3)
            candidates = primary_candidates(found)
            entry = {'periodEnd': w['periodEnd'], 'status': 'NO_PRIMARY_CANDIDATE',
                     'metadataReplayedFromHashVerifiedOriginal': True, 'candidates': candidates,
                     'attempts': [], 'scopeAndFinancialQualification': 'PENDING'}
            for row in candidates[:2]:
                name = row['attachment_name']
                try:
                    if name in old:
                        prior = old[name]
                        raw = (SRC / 'originals' / (prior['sha256'] + '.pdf')).read_bytes()
                        meta = {k: prior[k] for k in ['source_url', 'attachment_name', 'sha256', 'bytes', 'qualification_status']}
                        result['reusedOriginals'] += 1
                        reused = True
                    else:
                        raw, meta = client.retrieve_original_pdf(name, max_bytes=32_000_000)
                        result['newOriginalDownloads'] += 1
                        reused = False
                    assert raw.startswith(b'%PDF-') and hashlib.sha256(raw).hexdigest() == meta['sha256'] and len(raw) == meta['bytes']
                    pdf = originals / (w['periodEnd'] + '.pdf')
                    pdf.write_bytes(raw)
                    txt = report_dir / (w['periodEnd'] + '.txt')
                    subprocess.run(['pdftotext', '-layout', str(pdf), str(txt)], check=True, capture_output=True)
                    text = txt.read_text()
                    name_ok = bool(re.search(r'Bharat\s+Electronics', text, re.I))
                    cin_ok = 'L32309KA1954GOI000787' in text.replace(' ', '')
                    table_seen = bool(re.search(r'revenue\s+from\s+operations|income\s+from\s+operations', text, re.I))
                    entry['attempts'].append({'attachment': name, 'sha256': meta['sha256'], 'issuerNameSeen': name_ok, 'cinSeen': cin_ok, 'financialTableTextSeen': table_seen})
                    entry.update(status='ORIGINAL_ACQUIRED_PENDING_FINANCIAL_QUALIFICATION', original=meta, filing=row,
                                 reused=reused, issuerNameSeen=name_ok, cinSeen=cin_ok, financialTableTextSeen=table_seen,
                                 pdfPages=len(text.split('\f')) - int(text.endswith('\f')))
                    break
                except Exception as error:
                    entry['attempts'].append({'attachment': name, 'errorType': type(error).__name__, 'error': str(error)[:300]})
                    entry['status'] = 'ORIGINAL_FETCH_FAILED'
            result['primaryFilings'].append(entry)
            save()
            print(json.dumps({'period': w['periodEnd'], 'status': entry['status'], 'reused': entry.get('reused'),
                              'bytes': entry.get('original', {}).get('bytes'), 'tableTextSeen': entry.get('financialTableTextSeen')}), flush=True)
    result['completedAt'] = datetime.now(timezone.utc).isoformat()
    result['summary'] = {'targetQuarters': 8, 'primaryOriginalsAcquired': sum('original' in p for p in result['primaryFilings']),
                         'issuerNameVerified': sum(p.get('issuerNameSeen', False) for p in result['primaryFilings']),
                         'originalTablesTextReadable': sum(p.get('financialTableTextSeen', False) for p in result['primaryFilings']),
                         'newOriginalDownloads': result['newOriginalDownloads'], 'reusedOriginals': result['reusedOriginals'],
                         'databaseWrites': 0, 'factsAdmitted': 0}
    save()
    print(json.dumps(result['summary'], sort_keys=True))
    return 0 if result['summary']['primaryOriginalsAcquired'] == 8 else 2


if __name__ == '__main__':
    raise SystemExit(main())
