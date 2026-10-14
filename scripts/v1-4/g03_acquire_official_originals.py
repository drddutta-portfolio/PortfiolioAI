"""Read-only issuer/exchange acquisition. No database, R2 or provider credentials."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.parse
import urllib.request

TARGETS = Path('docs/private/v1-4-industry-batches/G03_Official_Source_Acquisition_Targets_2026-10-14.json')
ALLOWED_HOSTS = {
    'mtar.in', 'www.datapatternsindia.com', 'www.zentechnologies.com',
    'www.grse.in', 'grse.in', 'bel-india.in', 'astramwp.com',
    'www.hal-india.co.in', 'hal-india.co.in', 'www.bseindia.com',
}
MAX_BYTES = 128 * 1024 * 1024
OUT = Path('g03-original-acquisition-result')


def allowed_url(raw):
    u = urllib.parse.urlsplit(raw)
    return (u.scheme == 'https' and u.hostname in ALLOWED_HOSTS
            and not u.username and not u.password and not u.port
            and not u.fragment and u.path.lower().endswith('.pdf'))


def checked_pdf(data):
    if not data.startswith(b'%PDF-') or len(data) > MAX_BYTES:
        raise ValueError('PDF_OR_SIZE_INVALID')
    return hashlib.sha256(data).hexdigest()


def acquire(target):
    symbol, url = target['symbol'], target['url']
    row = {'symbol': symbol, 'source_url': url, 'published_at': None,
           'retrieved_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'canonical_admission': False}
    try:
        if not allowed_url(url):
            raise ValueError('OFFICIAL_URL_NOT_ALLOWED')
        request = urllib.request.Request(urllib.parse.quote(url, safe=':/%'),
                                        headers={'User-Agent': 'Mozilla/5.0 PortfolioAI source research'})
        # One request per target. No challenge bypass or automatic retries.
        with urllib.request.urlopen(request, timeout=90) as response:
            if not allowed_url(response.url):
                raise ValueError('REDIRECT_NOT_ALLOWED')
            data = response.read(MAX_BYTES + 1)
            row['resolved_url'] = response.url
        digest = checked_pdf(data)
        name = symbol + '-' + digest + '.pdf'
        path = OUT / name
        path.write_bytes(data)
        subprocess.run(['pdftotext', '-layout', str(path), str(path.with_suffix('.txt'))],
                       check=True, capture_output=True)
        row.update(status='ACQUIRED_NOT_ADMITTED', sha256=digest,
                   byte_length=len(data), artifact_pdf=name,
                   artifact_text=path.with_suffix('.txt').name)
    except Exception as error:
        row.update(status='ACQUISITION_FAILED', error_class=type(error).__name__)
        if isinstance(error, urllib.error.HTTPError):
            row['http_status'] = error.code
        elif isinstance(error, ValueError):
            row['error_code'] = str(error)
    print(json.dumps({k: row[k] for k in ('symbol', 'status', 'source_url')}), flush=True)
    return row


def main():
    targets = json.loads(TARGETS.read_text())['targets']
    if len(targets) > 24 or len({t['url'] for t in targets}) != len(targets):
        raise ValueError('TARGET_SCOPE_INVALID')
    OUT.mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(acquire, targets))
    (OUT / 'manifest.json').write_text(json.dumps({
        'group': 'G03', 'rows': rows, 'provider_api_calls': 0,
        'database_writes': 0, 'r2_writes': 0, 'accepted_reviews': 0,
        'canonical_materialization': False,
        'workflow_sha': __import__('os').environ.get('GITHUB_SHA'),
    }, indent=2) + '\n')
    # Acquisition failures are evidence outcomes, not a false all-sources PASS.
    if not any(r['status'] == 'ACQUIRED_NOT_ADMITTED' for r in rows):
        raise RuntimeError('NO_ORIGINALS_ACQUIRED')


if __name__ == '__main__':
    main()
