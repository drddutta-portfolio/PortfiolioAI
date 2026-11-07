#!/usr/bin/env python3
"""Read private source captures and publish only public primary-PDF URLs for review."""
import os,json,re,importlib.util
from pathlib import Path
from collections import Counter
import psycopg
from r4_current_gap_discovery import pending_current
from r4_retained_provider_links import original_links
from r4_nse_catalog_revision import canonical,sha

spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'));batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET or os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI' or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development':raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter();rejects=Counter();groups={};index=[]
    with psycopg.connect(url) as db:
        for symbol,isin,sid,name,periods in batch.candidates(db):groups[str(sid)]={'symbol':symbol,'isin':isin,'periods':set(periods)}
        db.rollback()
        for sid,symbol,isin,period,_ in pending_current(db,batch):groups.setdefault(sid,{'symbol':symbol,'isin':isin,'periods':set()})['periods'].add(period)
        for sid,identity in groups.items():
            links=set();symbol=identity['symbol']
            with db.cursor() as cur:
                cur.execute("""SELECT DISTINCT ON(raw_payload->'request'->'args') raw_payload,payload_hash
                  FROM data_source_records WHERE record_kind='RESULTS_R4_HISTORY_CAPTURE_V2'
                    AND raw_payload->'request'->>'tool'='get_document_search_results'
                    AND raw_payload->'request'->>'securityId'=%s
                  ORDER BY raw_payload->'request'->'args',retrieved_at DESC""",(sid,));rows=cur.fetchall()
            db.rollback()
            for metadata,payload_hash in rows:
                try:
                    digest=metadata['sha256'];key=batch.PREFIX+'trendlyne-history/sha256='+digest+'/capture.json'
                    if sha(canonical(metadata))!=payload_hash or not re.fullmatch(r'[a-f0-9]{64}',digest) or metadata.get('r2_key')!=key:raise ValueError('PROVIDER_CAPTURE_PRIVATE_REFERENCE_UNPROVEN')
                    raw=client.get_object(Bucket=batch.BUCKET,Key=key)['Body'].read()
                    if len(raw)>5_000_000 or sha(raw)!=digest:raise ValueError('PROVIDER_CAPTURE_BYTES_UNPROVEN')
                    links.update(original_links(json.loads(raw),symbol));counts['private_captures_checked']+=1
                except Exception as error:rejects[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
            entry={'symbol':symbol,'isin':identity['isin'],'periods':sorted(identity['periods']),'public_primary_pdf_urls':sorted(links),'canonical_facts':0,'original_source_validation_required':True};index.append(entry)
            # No snippets, provider financial values, credentials or raw capture
            # bodies leave private R2. These are public primary-source URLs only.
            print('R4_PUBLIC_PRIMARY_LINK_REVIEW',json.dumps(entry),flush=True)
    body=canonical({'contract':'RESULTS_R4_RETAINED_PROVIDER_ORIGINAL_LINK_REVIEW_V1','issuers':index,'counts':dict(counts),'rejections':dict(rejects),'canonical_facts':0});batch.immutable_put(client,batch.PREFIX+'trendlyne-primary-link-review/sha256='+sha(body)+'/index.json',body)
    print('R4_RETAINED_LINK_REVIEW_FINAL',json.dumps({**dict(counts),'rejections':dict(rejects),'canonical_facts':0}),flush=True)

if __name__=='__main__':main()
