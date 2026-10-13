"""Source-only registration under signed GitHub identity; no owner impersonation.
Reads retained original R2 objects via short-lived server-only URLs. Never logs
tokens, URLs or credentials; no original-provider download or factual admission.
"""
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote

AUD = 'https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/v14-bank-pit-original-import'
ACTION = 'REGISTER_BANK_PIT_PINNED_ORIGINALS_V1'

def main():
    import boto3
    from botocore.config import Config
    if os.environ['CLOUDFLARE_R2_BUCKET'] != 'portfolioai-history-dev': raise ValueError('DEVELOPMENT_BUCKET_REQUIRED')
    source = json.loads(Path('supabase/functions/_shared/v14-bank-pit-original-manifest.json').read_text())
    s3 = boto3.client('s3', endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com', region_name='auto', config=Config(retries={'total_max_attempts': 1},signature_version='s3v4'))
    oidc_url = os.environ['ACTIONS_ID_TOKEN_REQUEST_URL'] + '&audience=' + quote(AUD, safe='')
    request = urllib.request.Request(oidc_url, headers={'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']})
    with urllib.request.urlopen(request, timeout=20) as response: token = json.load(response)['value']
    originals = [{'sha256': p['original_sha256'], 'readUrl': s3.generate_presigned_url('get_object', Params={'Bucket': 'portfolioai-history-dev','Key':p['r2_object_key']},ExpiresIn=300)} for p in source]
    request = urllib.request.Request(AUD, data=json.dumps({'action': ACTION,'originals': originals}).encode(), headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=180) as response: result = json.load(response)
    except urllib.error.HTTPError as error:
        result = json.load(error)
    out = Path('bank-pit-source-registration'); out.mkdir(exist_ok=True)
    (out/'registration-receipt.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k != 'results'}))
    if result.get('registered') != len(source) or result.get('canonicalAdmissions') != 0: raise SystemExit(1)

if __name__ == '__main__': main()
