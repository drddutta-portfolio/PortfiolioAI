"""Credentialed exact R2 original verification; no provider acquisition or admission.
Reads fixed KVB P8 catalog CSV and compressed originals, verifies both hashes,
then extracts one identity-matched raw NSE row. Never uses adjusted Parquet.
"""
import argparse
import hashlib
import io
import json
import os
import zipfile
from pathlib import Path
from decimal import Decimal
import boto3
from botocore.config import Config
from extract_verified_bank_raw_months import parse_rows
PREFIX = 'portfolioai-history/development/p8/b3/source-authority/v1'
IDENTITY = {'securityId':'be55b3cc-0400-45af-84aa-2a95e2c361c5','symbol':'KARURVYSYA','isin':'INE036D01028'}
def extract(client,bucket,archives):
    if len(archives)!=36 or len({x['id'] for x in archives})!=36:
        raise ValueError('EXACT_36_ARCHIVES_REQUIRED')
    receipts=[]
    for a in archives:
        date=a['source_period_start']; member=a['raw_metadata']['csv_member']
        if '/' in member or '\\' in member or not member.lower().endswith('.csv'):
            raise ValueError('CSV_MEMBER_SCOPE_INVALID')
        content_key=f'{PREFIX}/content/trade_date={date}/{member}'
        compressed_key=f"{PREFIX}/trade_date={date}/{a['source_file_name']}"
        content=client.get_object(Bucket=bucket,Key=content_key)['Body'].read(64*1024*1024+1)
        original=client.get_object(Bucket=bucket,Key=compressed_key)['Body'].read(32*1024*1024+1)
        if len(content)>64*1024*1024 or len(original)>32*1024*1024:
            raise ValueError('ORIGINAL_TOO_LARGE')
        content_hash=hashlib.sha256(content).hexdigest(); zip_hash=hashlib.sha256(original).hexdigest()
        if content_hash!=a['content_sha256'] or zip_hash!=a['compressed_sha256']:
            raise ValueError('R2_ORIGINAL_HASH_CONFLICT:'+a['id'])
        with zipfile.ZipFile(io.BytesIO(original)) as z:
            files=[x for x in z.infolist() if x.filename.lower().endswith('.csv')]
            if len(files)!=1 or files[0].file_size>64*1024*1024 or z.read(files[0])!=content:
                raise ValueError('R2_CSV_ZIP_BYTES_CONFLICT')
        row=parse_rows(content,date,[IDENTITY])[0]
        if not Decimal(row['raw_close']).is_finite():raise ValueError('INVALID_RAW_PRICE')
        receipts.append({'archiveId':a['id'],'contentSha256':content_hash,'compressedSha256':zip_hash,
            'rawClose':row['raw_close'],'tradeDate':date,'isin':row['isin'],'symbol':row['symbol'],
            'series':'EQ','r2ContentKey':content_key})
    return receipts
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('catalog');p.add_argument('output');a=p.parse_args()
    account=os.environ.get('CLOUDFLARE_R2_ACCOUNT_ID','ced17d24f4b380721e58a08c9e9273e4')
    bucket=os.environ.get('CLOUDFLARE_R2_BUCKET','portfolioai-history-dev')
    if bucket!='portfolioai-history-dev':raise ValueError('DEVELOPMENT_ONLY')
    client=boto3.client('s3',endpoint_url=f'https://{account}.r2.cloudflarestorage.com',
        aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],region_name='auto',
        config=Config(retries={'total_max_attempts':1}))
    request=json.loads(Path(a.catalog).read_text());rows=extract(client,bucket,request['archives'])
    Path(a.output).write_text(json.dumps({'receipts':rows,'providerCalls':0,'canonicalAdmissions':0,'retries':0},indent=2)+'\n')
    print(json.dumps({'verifiedMonths':len(rows),'providerCalls':0,'canonicalAdmissions':0,'retries':0}))
