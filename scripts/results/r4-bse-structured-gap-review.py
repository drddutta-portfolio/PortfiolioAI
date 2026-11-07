#!/usr/bin/env python3
"""Fresh BSE result-link pulls for every unresolved issuer; no financial writes."""
import os,json,re,time,importlib.util
from pathlib import Path
from collections import Counter
import psycopg
from r4_current_gap_discovery import pending_current
from r4_bse_structured_review import review_shape
from r4_nse_catalog_revision import canonical,sha

spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'));batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)

def main():
    url=os.environ['SUPABASE_DB_URL']
    if batch.REF not in url or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET or os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI' or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development':raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();counts=Counter();index=[];groups={}
    with psycopg.connect(url) as db,batch.PortfolioBSE() as bse:
        for symbol,isin,sid,name,periods in batch.candidates(db):groups[str(sid)]={'symbol':symbol,'isin':isin}
        db.rollback()
        for sid,symbol,isin,period,_ in pending_current(db,batch):groups[sid]={'symbol':symbol,'isin':isin}
        for sid,item in groups.items():
            symbol=item['symbol'];isin=item['isin'];entry={'symbol':symbol,'canonical_facts':0}
            try:
                with db.cursor() as cur:
                    cur.execute("SELECT raw_payload,payload_hash FROM data_source_records WHERE record_kind='RESULTS_R4_BSE_DATED_PDF_REVIEW_V1' AND raw_payload->>'security_id'=%s ORDER BY retrieved_at DESC LIMIT 1",(sid,));saved=cur.fetchone()
                db.rollback()
                if saved:
                    review=batch.retained_review(client,saved[0],saved[1]);identity=review['bse_identity'];header=identity['header'];listing=identity['listing'];code=identity['bse_scrip_code']
                else:
                    code=bse.get_scrip_candidate(symbol)['bse_scrip_code'];header=bse._bse.equityMetaInfo(code);listing=bse._bse.listSecurities(scripcode=code,group='');matches=[x for x in listing if str(x.get('SCRIP_CD'))==code and x.get('ISIN_NUMBER')==isin]
                    if len(matches)!=1:raise ValueError('BSE_EXACT_CANONICAL_LISTING_UNPROVEN')
                    listing=matches[0]
                if not re.fullmatch(r'\d{6}',code) or str(header.get('SecurityCode'))!=code or header.get('ISIN')!=isin or str(listing.get('SCRIP_CD'))!=code or listing.get('ISIN_NUMBER')!=isin:raise ValueError('BSE_RESULT_REVIEW_CANONICAL_IDENTITY_UNPROVEN')
                endpoint='https://api.bseindia.com/BseIndiaAPI/api/TabResults_PAR/w';time.sleep(.5)
                response=bse._bse.session.get(endpoint,params={'scripcode':code,'tabtype':'RESULTS'},timeout=(15,35),allow_redirects=False)
                if response.status_code!=200:raise ValueError('BSE_RESULT_SOURCE_HTTP_'+str(response.status_code))
                raw=response.content
                if len(raw)>5_000_000:raise ValueError('BSE_RESULT_REVIEW_SIZE_BOUND')
                parsed=response.json();shape=review_shape(parsed);digest=sha(raw);key=batch.PREFIX+'bse-structured-result-review/sha256='+digest+'/response.json';batch.immutable_put(client,key,raw)
                entry.update(status='REVIEW_ONLY',source_endpoint=endpoint,bse_scrip_code=code,response_sha256=digest,**shape);counts['responses_retained']+=1
            except Exception as error:
                db.rollback();entry.update(status='SOURCE_UNAVAILABLE',reason=str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__);counts['source_failures']+=1
            counts['issuers_attempted']+=1;index.append(entry);print('R4_BSE_STRUCTURED_REVIEW',json.dumps(entry),flush=True)
    raw=canonical({'contract':'RESULTS_R4_BSE_STRUCTURED_GAP_REVIEW_V1','issuers':index,'counts':dict(counts),'canonical_facts':0});batch.immutable_put(client,batch.PREFIX+'bse-structured-result-review/sha256='+sha(raw)+'/index.json',raw);print('R4_BSE_STRUCTURED_REVIEW_FINAL',json.dumps(dict(counts)),flush=True)

if __name__=='__main__':main()
