"""Immutable Development R2 archive of an already verified G03 capture. No DB writes."""
import hashlib
import json
import os
from pathlib import Path
from g03_acquire_official_originals import checked_pdf

BUCKET = 'portfolioai-history-dev'
PREFIX = 'portfolioai-history/development/v1-4/g03/originals/'
SYMBOLS = {'BEL', 'MTARTECH', 'ASTRAMICRO', 'DATAPATTNS', 'HAL', 'GRSE', 'ZENTEC'}


def original_valid(row, data):
    if (row['symbol'] not in SYMBOLS or len(data) != row['byte_length']
            or checked_pdf(data) != row['sha256']):
        raise ValueError('G03_ORIGINAL_INTEGRITY_FAILED')
    return data


def archive(s3, row, data):
    original_valid(row, data)
    key = PREFIX + row['sha256'] + '.pdf'
    try:
        original_valid(row, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read())
        return key, False
    except Exception as error:
        if getattr(error, 'response', {}).get('Error', {}).get('Code') not in ('NoSuchKey', '404'):
            raise
    try:
        s3.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType='application/pdf',
                      IfNoneMatch='*', Metadata={'group': 'G03', 'sha256': row['sha256'],
                                              'financial-admission': 'false'})
    except Exception:
        # An uncertain transport completion is resolved by readback, never overwrite/retry.
        original_valid(row, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read())
        return key, True
    original_valid(row, s3.get_object(Bucket=BUCKET, Key=key)['Body'].read())
    return key, True


def main():
    import boto3
    from botocore.config import Config
    if os.environ['CLOUDFLARE_R2_BUCKET'] != BUCKET:
        raise ValueError('DEVELOPMENT_BUCKET_REQUIRED')
    root = Path('retained-originals')
    manifest = json.loads((root / 'manifest.json').read_text())
    if manifest['workflow_sha'] != '7aaf6870bec676b49e515f85c9f6465e9f614ad1':
        raise ValueError('EXACT_RETAINED_ACQUISITION_REQUIRED')
    expected = json.loads(Path('docs/private/v1-4-industry-batches/G03_Official_Original_Acquisition_Manifest_2026-10-14.json').read_text())
    if manifest != expected:
        raise ValueError('RETAINED_MANIFEST_CHANGED')
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',
                      region_name='auto', aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
                      aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
                      config=Config(signature_version='s3v4', s3={'addressing_style': 'path'},
                                    retries={'total_max_attempts': 1}))
    out = Path('g03-original-archive-result')
    out.mkdir(exist_ok=True)
    results = []
    for row in manifest['rows']:
        if row['status'] != 'ACQUIRED_NOT_ADMITTED':
            continue
        name = row['artifact_pdf']
        if Path(name).name != name:
            raise ValueError('ARTIFACT_PATH_INVALID')
        key, created = archive(s3, row, (root / name).read_bytes())
        result = {'symbol': row['symbol'], 'source_url': row['source_url'], 'sha256': row['sha256'],
                  'byte_length': row['byte_length'], 'r2_bucket': BUCKET, 'r2_key': key,
                  'created': created, 'readback_integrity': 'PASS', 'financial_admission': False}
        results.append(result)
        print(json.dumps(result), flush=True)
        (out / 'sanitized-results.json').write_text(json.dumps({
            'group': 'G03', 'results': results, 'provider_api_calls': 0, 'database_writes': 0,
            'accepted_reviews': 0, 'canonical_materialization': False,
        }, indent=2) + '\n')


if __name__ == '__main__':
    main()
