"""Archive two pinned NSE originals; optionally execute reviewed signed admission.

Default is archive-only. No credentials or signed URLs appear in receipts. No
paid-provider calls, automatic retries, materialization, KVB or source overwrite.
"""
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError


def original_qualified(pin, raw):
    parsed = urlparse(pin['original_url'])
    return (pin['symbol'] in ('BANKBARODA', 'BANDHANBNK') and
            parsed.scheme == 'https' and parsed.netloc == 'nsearchives.nseindia.com' and
            parsed.path.startswith('/corporate/') and parsed.path.endswith('.pdf') and
            not parsed.query and not parsed.fragment and len(raw) == pin['original_bytes'] and
            raw.startswith(b'%PDF-') and hashlib.sha256(raw).hexdigest() == pin['original_sha256'])


def main():
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError
    manifest = json.loads(Path('supabase/functions/_shared/v14-bank-twelve-growth-manifest.json').read_text())
    policy = json.loads(Path('supabase/functions/_shared/v14-bank-twelve-delegation.json').read_text())
    assert os.environ['CLOUDFLARE_R2_BUCKET'] == policy['storageBucket'] == 'portfolioai-history-dev'
    assert {p['symbol'] for p in manifest['sources']} == {'BANKBARODA', 'BANDHANBNK'}
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', config=Config(retries={'total_max_attempts': 1}, signature_version='s3v4'))
    originals = []
    read_urls = {}
    for pin in manifest['sources']:
        assert pin['security_id'] in policy['securities'] and pin['symbol'] != 'KARURVYSYA'
        key = policy['storageKeyPrefix'] + pin['original_sha256'] + '.pdf'
        fetched = 0
        try:
            raw = s3.get_object(Bucket=policy['storageBucket'], Key=key)['Body'].read()
        except ClientError as error:
            if error.response['Error']['Code'] not in ('NoSuchKey', '404'):
                raise
            with urlopen(Request(pin['original_url'], headers={'User-Agent': 'PortfolioAI exact original archival verification/1.0'}), timeout=45) as response:
                raw = response.read(24 * 1024 * 1024)
            fetched = 1
            assert original_qualified(pin, raw)
            s3.put_object(Bucket=policy['storageBucket'], Key=key, Body=raw, ContentType='application/pdf', IfNoneMatch='*')
        assert original_qualified(pin, raw)
        retained = s3.get_object(Bucket=policy['storageBucket'], Key=key)['Body'].read()
        assert original_qualified(pin, retained)
        originals.append({'symbol': pin['symbol'], 'sha256': pin['original_sha256'], 'bytes': len(retained),
                          'r2HashVerified': True, 'originalPublicSourceDownloads': fetched, 'overwrites': 0})
        read_urls[pin['symbol']] = s3.generate_presigned_url('get_object', Params={'Bucket': policy['storageBucket'], 'Key': key}, ExpiresIn=300)
    result = {'code': 'PINNED_GROWTH_ORIGINALS_ARCHIVED_AND_HASH_VERIFIED', 'originals': originals,
              'providerCalls': 0, 'paidRetries': 0, 'canonicalAdmissions': 0, 'canonicalMaterializations': 0}
    if os.environ.get('BANK_TWELVE_GROWTH_ADMIT', 'false') == 'true':
        aud = 'https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-bank-twelve-growth-admission'
        oidc = os.environ['ACTIONS_ID_TOKEN_REQUEST_URL'] + '&audience=' + quote(aud, safe='')
        with urlopen(Request(oidc, headers={'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}), timeout=20) as response:
            token = json.load(response)['value']
        payload = {'action': 'ADMIT_PINNED_TWELVE_BANK_GROWTH_V1', 'approvalHash': policy['directiveSha256'], 'readUrls': read_urls}
        req = Request(aud, data=json.dumps(payload).encode(), headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}, method='POST')
        try:
            with urlopen(req, timeout=180) as response:
                admission = json.load(response)
        except HTTPError as error:
            admission = json.load(error)
        result.update({'admission': admission})
        expected = admission.get('code') == 'GROWTH_SOURCE_REVIEWS_ACCEPTED_READBACK_VERIFIED'
    else:
        expected = True
    out = Path('bank-twelve-growth-execution'); out.mkdir(exist_ok=True)
    (out / 'receipt.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    if not expected:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
