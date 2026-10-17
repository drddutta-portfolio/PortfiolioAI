"""One hash-pinned source, conditional archive, signed delegated admission.

Never logs credentials or signed URLs. No provider retries or KVB operations.
"""
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError


def main():
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError
    pin = json.loads(Path('supabase/functions/_shared/v14-bank-twelve-capital-manifest.json').read_text())
    policy = json.loads(Path('supabase/functions/_shared/v14-bank-twelve-delegation.json').read_text())
    assert pin['symbol'] != 'KARURVYSYA' and pin['security_id'] in policy['securities']
    assert os.environ['CLOUDFLARE_R2_BUCKET'] == policy['storageBucket'] == 'portfolioai-history-dev'
    key = policy['storageKeyPrefix'] + pin['original_sha256'] + '.pdf'
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', config=Config(retries={'total_max_attempts': 1}, signature_version='s3v4'))
    fetched = 0
    try:
        raw = s3.get_object(Bucket=policy['storageBucket'], Key=key)['Body'].read()
    except ClientError as error:
        if error.response['Error']['Code'] not in ('NoSuchKey', '404'):
            raise
        with urlopen(Request(pin['original_url'], headers={'User-Agent': 'PortfolioAI exact source verification/1.0'}), timeout=45) as response:
            raw = response.read()
        fetched = 1
        assert len(raw) == pin['original_bytes'] and hashlib.sha256(raw).hexdigest() == pin['original_sha256'] and raw.startswith(b'%PDF-')
        s3.put_object(Bucket=policy['storageBucket'], Key=key, Body=raw, ContentType='application/pdf', IfNoneMatch='*')
    assert len(raw) == pin['original_bytes'] and hashlib.sha256(raw).hexdigest() == pin['original_sha256']
    retained = s3.get_object(Bucket=policy['storageBucket'], Key=key)['Body'].read()
    assert hashlib.sha256(retained).hexdigest() == pin['original_sha256']
    aud = 'https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-bank-twelve-capital-admission'
    oidc = os.environ['ACTIONS_ID_TOKEN_REQUEST_URL'] + '&audience=' + quote(aud, safe='')
    with urlopen(Request(oidc, headers={'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}), timeout=20) as response:
        token = json.load(response)['value']
    materialize = os.environ.get('BANK_TWELVE_MATERIALIZE', 'false') == 'true'
    if os.environ.get('BANK_TWELVE_ONE_SHOT') == 'true':
        request_record = json.loads(Path('docs/private/v1-4-industry-batches/Banking_12_Federal_One_Shot_Execution_Request_2026-10-12.json').read_text())
        assert request_record['directive_sha256'] == policy['directiveSha256']
        assert request_record['security_id'] == pin['security_id'] and request_record['original_sha256'] == pin['original_sha256']
        assert request_record['action'] == 'ADMIT_PINNED_TWELVE_BANK_CAPITAL_V1' and request_record['materialize'] is True and request_record['once'] is True
    payload = {'action': 'ADMIT_PINNED_TWELVE_BANK_CAPITAL_V1', 'approvalHash': policy['directiveSha256'], 'materialize': materialize,
               'readUrl': s3.generate_presigned_url('get_object', Params={'Bucket': policy['storageBucket'], 'Key': key}, ExpiresIn=300)}
    if materialize:
        tail = json.loads(Path('docs/private/v1-4-industry-batches/Banking_12_Federal_CA_Tail_Source_2026-10-12.json').read_text())
        assert tail['http_status'] == 200 and tail['response'] == [] and tail['bytes'] == 2
        tail_bytes = b'[]'
        assert hashlib.sha256(tail_bytes).hexdigest() == tail['sha256']
        tail_key = policy['storageKeyPrefix'] + tail['sha256'] + '.json'
        try:
            retained_tail = s3.get_object(Bucket=policy['storageBucket'], Key=tail_key)['Body'].read()
        except ClientError as error:
            if error.response['Error']['Code'] not in ('NoSuchKey', '404'):
                raise
            s3.put_object(Bucket=policy['storageBucket'], Key=tail_key, Body=tail_bytes, ContentType='application/json', IfNoneMatch='*')
            retained_tail = s3.get_object(Bucket=policy['storageBucket'], Key=tail_key)['Body'].read()
        assert retained_tail == tail_bytes
        payload['corporateActionTailReadUrl'] = s3.generate_presigned_url('get_object', Params={'Bucket': policy['storageBucket'], 'Key': tail_key}, ExpiresIn=300)
    request = Request(aud, data=json.dumps(payload).encode(), headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}, method='POST')
    try:
        with urlopen(request, timeout=180) as response:
            result = json.load(response)
    except HTTPError as error:
        result = json.load(error)
    result.update({'originalPublicSourceDownloads': fetched, 'r2HashVerified': True, 'paidRetries': 0})
    out = Path('bank-twelve-capital-execution'); out.mkdir(exist_ok=True)
    (out / 'receipt.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    expected = 'PINNED_CAPITAL_MATERIALIZED_AND_SELECTED_READ_BACK' if materialize else 'PINNED_CAPITAL_REVIEWS_ACCEPTED_AND_READ_BACK'
    if result.get('code') != expected:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
