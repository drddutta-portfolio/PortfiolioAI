"""Current reported PDF comparatives bound to a separately replayed board event."""
import json,re,base64
from decimal import Decimal
from r4_nse_catalog_revision import canonical,sha,PERIODS,CORE
from r4_current_nbfc_original import PREFIX,BUCKET
from r4_scope_board import extract_current_with_scope_board
from r4_official_issuer import bse_inventory_sources

CONTRACT='PORTFOLIOAI_RESULTS_CURRENT_SAME_BOARD_PDF_V1'
KIND='RESULTS_R4_CURRENT_SAME_BOARD_PDF_V1'

def qualify(source,observations,client):
    p=source['raw_payload'];period=p.get('period_end');mh=p.get('r2_manifest_sha256','')
    if (p.get('contract')!=CONTRACT or sha(canonical(p))!=source['payload_hash']
        or period not in PERIODS or p.get('period_start')!=PERIODS[period]
        or p.get('issuer_filing_url')!=source['source_url'] or p.get('reporting_currency')!='INR'
        or p.get('raw_bse_bytes_retained') is not True or p.get('original_pdf_retained') is not True
        or p.get('consolidation_scope')!='STANDALONE' or p.get('source_reporting_basis')!='LATER_FILING_REPORTED_COMPARATIVE'):
        raise ValueError('CURRENT_BOARD_PDF_CONTEXT_UNPROVEN')
    key=PREFIX+'security_id='+p['isin']+'/period_end='+period+'/source_version='+mh+'/manifest.json'
    if not re.fullmatch(r'[a-f0-9]{64}',mh) or p.get('r2_key')!=key:raise ValueError('CURRENT_BOARD_MANIFEST_REFERENCE_UNPROVEN')
    encoded=client.get_object(Bucket=BUCKET,Key=key)['Body'].read();manifest={k:v for k,v in p.items() if k not in ('r2_key','r2_manifest_sha256')}
    if sha(encoded)!=mh or json.loads(encoded)!=manifest:raise ValueError('CURRENT_BOARD_MANIFEST_HASH_MISMATCH')
    reference=p['bse_identity_reference'];rh=reference['sha256'];rk=PREFIX+'bse-dated-pdf-review/sha256='+rh+'/capture.json'
    if not re.fullmatch(r'[a-f0-9]{64}',rh) or reference.get('r2_key')!=rk:raise ValueError('CURRENT_BOARD_IDENTITY_REFERENCE_UNPROVEN')
    review_raw=client.get_object(Bucket=BUCKET,Key=rk)['Body'].read()
    if sha(review_raw)!=rh:raise ValueError('CURRENT_BOARD_IDENTITY_BYTES_MISMATCH')
    review=json.loads(review_raw);sources=bse_inventory_sources(review,rh,p['symbol'],p['isin'],p['security_id']);original=sources.get(source['source_url'])
    if not original or any(original[k]!=p[k] for k in ('original_sha256','original_r2_key')) or review['bse_identity']['issuer_name']!=p['issuer_name']:
        raise ValueError('CURRENT_BOARD_EXCHANGE_INVENTORY_LINK_UNPROVEN')
    raw=client.get_object(Bucket=BUCKET,Key=original['original_r2_key'])['Body'].read()
    if sha(raw)!=original['original_sha256']:raise ValueError('CURRENT_BOARD_ORIGINAL_HASH_MISMATCH')
    bridge=p['scope_bridge'];bh=bridge.get('nse_original_sha256','');bk=PREFIX+'scope-board-primary/sha256='+bh+'/original.html'
    if not re.fullmatch(r'[a-f0-9]{64}',bh) or bridge.get('nse_original_r2_key')!=bk or 'nse_original_base64' in bridge:raise ValueError('CURRENT_BOARD_PRIMARY_REFERENCE_UNPROVEN')
    primary=client.get_object(Bucket=BUCKET,Key=bk)['Body'].read()
    if len(primary)>5_000_000 or sha(primary)!=bh:raise ValueError('CURRENT_BOARD_PRIMARY_BYTES_MISMATCH')
    reconstructed={k:v for k,v in bridge.items() if k!='nse_original_r2_key'}
    reconstructed['nse_original_base64']=base64.b64encode(primary).decode('ascii')
    parsed,evidence=extract_current_with_scope_board(raw,p['financial_page'],period,p['symbol'],p['isin'],p['issuer_name'],reconstructed)
    if parsed['facts']!=p['facts'] or evidence!=p['scope_board_evidence'] or parsed['scope']!=p['consolidation_scope'] or set(parsed['facts'])!=CORE:
        raise ValueError('CURRENT_BOARD_FULL_ORIGINAL_REPLAY_MISMATCH')
    if len(observations)!=3 or {r['metric_code'] for r in observations}!=CORE:raise ValueError('CURRENT_BOARD_COMPLETE_CORE_TRIO_REQUIRED')
    for r in observations:
        f=p['facts'][r['metric_code']]
        if (str(r['security_id'])!=p['security_id'] or r['symbol']!=p['symbol'] or r['isin']!=p['isin']
            or str(r['period_start'])!=PERIODS[period] or str(r['period_end'])!=period or r['consolidation_scope']!='STANDALONE'
            or str(r['source_record_id'])!=str(source['source_record_id']) or r['source_code']!='COMPANY_EXCHANGE_FILING'
            or r['currency']!='INR' or r['evidence_status']!='AVAILABLE' or r['unit']!=f['unit'] or Decimal(str(r['numeric_value']))!=Decimal(f['value'])):
            raise ValueError('CURRENT_BOARD_CANONICAL_FACT_MISMATCH')
    return manifest
