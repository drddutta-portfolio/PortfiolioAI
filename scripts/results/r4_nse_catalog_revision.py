"""Explicit NSE financial-submission revisions, with complete primary replay.

The exchange's literal Revision classification and revision remark establish
supersession within one issuer/quarter/scope. Timestamps only order that declared
chain; a newer Original never establishes authority. Revised XML and iXBRL must
agree exactly. Immutable observations and protected decisions are preserved.
"""
import json,re
from collections import defaultdict,Counter
from datetime import datetime,date,timedelta
from decimal import Decimal
from hashlib import sha256
from urllib.parse import urlparse,parse_qs
import xml.etree.ElementTree as ET
from r4_dated_columns import extract_tables,parse_html,unique
from r4_issuer_name import exact_legal_identity

PREFIX='portfolioai-results/development/v1/quarterly/';BUCKET='portfolioai-history-dev'
CONTRACT='RESULTS_R4_EXPLICIT_NSE_CATALOG_REVISION_PROOF_V1'
KIND='RESULTS_R4_NSE_CATALOG_REVISION_PROOF_V1'
BASE='https://www.nseindia.com/api/integrated-filing-results'
PERIODS={'2025-09-30':'2025-07-01','2025-12-31':'2025-10-01','2026-03-31':'2026-01-01','2026-06-30':'2026-04-01'}
CORE={'OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER','EPS_DILUTED'}
SOURCE_CONTRACTS={'PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1','PORTFOLIOAI_RESULTS_VERIFIED_NSE_INTEGRATED_CURRENT_XBRL_V1'}

def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def sha(raw):return sha256(raw).hexdigest()
def local(tag):return tag.rsplit('}',1)[-1]
def stamp(text):return datetime.strptime(text,'%d-%b-%Y %H:%M:%S')
def scope(value):return {'Consolidated':'CONSOLIDATED','Standalone':'STANDALONE','Non-Consolidated':'STANDALONE'}.get(value)
def origin(url):
    u=urlparse(url)
    return (u.scheme=='https' and u.hostname=='nsearchives.nseindia.com' and not u.username and not u.password
        and not u.query and not u.fragment and u.port in (None,443)
        and bool(re.fullmatch(r'/corporate/(?:ixbrl/INTEGRATED_FILING_INDAS_[A-Za-z0-9_]+\.html|xbrl/INTEGRATED_FILING_INDAS_[A-Za-z0-9_]+\.xml)',u.path,re.I)))

def ref(raw,kind):
    suffix={'catalog':'response.json','proof':'proof.json','xml':'original.xml','html':'original.html'}[kind]
    digest=sha(raw);return {'sha256':digest,'r2_key':PREFIX+'nse-declared-revisions/'+kind+'/sha256='+digest+'/'+suffix}

def read_ref(client,reference,kind):
    digest=reference.get('sha256','')
    if not re.fullmatch(r'[a-f0-9]{64}',digest):raise ValueError('NSE_REVISION_REFERENCE_HASH_UNPROVEN')
    suffix={'catalog':'response.json','proof':'proof.json','xml':'original.xml','html':'original.html'}[kind]
    expected=PREFIX+'nse-declared-revisions/'+kind+'/sha256='+digest+'/'+suffix
    if reference.get('r2_key')!=expected:raise ValueError('NSE_REVISION_PRIVATE_REFERENCE_UNPROVEN')
    raw=client.get_object(Bucket=BUCKET,Key=expected)['Body'].read()
    if len(raw)>5_000_000 or sha(raw)!=digest:raise ValueError('NSE_REVISION_RETAINED_ORIGINAL_HASH_MISMATCH')
    return raw

def catalog_group(raw,proof):
    if len(raw)>5_000_000:raise ValueError('NSE_REVISION_CATALOG_SIZE_BOUND')
    u=urlparse(proof['catalog_url']);args=parse_qs(u.query,keep_blank_values=True)
    captured=datetime.fromisoformat(proof['captured_at_utc'].replace('Z','+00:00'))
    if captured.utcoffset()!=timedelta(0):raise ValueError('NSE_REVISION_CAPTURE_TIME_UNPROVEN')
    expected={'index':['equities'],'symbol':[proof['symbol']],'type':['Integrated Filing- Financials'],
        'page':['1'],'size':['100'],'from_date':['01-01-2025'],'to_date':[captured.strftime('%d-%m-%Y')]}
    if (u.scheme!='https' or u.hostname!='www.nseindia.com' or u.path!='/api/integrated-filing-results'
        or u.username or u.password or u.fragment or u.port not in (None,443) or args!=expected):
        raise ValueError('NSE_REVISION_OFFICIAL_COMPLETE_CATALOG_REQUEST_UNPROVEN')
    data=json.loads(raw);rows=data if isinstance(data,list) else data.get('data',data.get('records',[]))
    if isinstance(rows,dict):rows=rows.get('data',[])
    if not isinstance(rows,list) or len(rows)>=100:raise ValueError('NSE_REVISION_CATALOG_COMPLETENESS_UNPROVEN')
    period=proof['period_end'];target=date.fromisoformat(period).strftime('%d-%b-%Y').upper();group=[]
    for row in rows:
        if row.get('symbol')!=proof['symbol'] or row.get('qe_Date','').upper()!=target or scope(row.get('consolidated'))!=proof['scope']:continue
        if (row.get('type')!='Integrated Filing- Financials' or row.get('type_Sub') not in ('Original','Revision')
            or not exact_legal_identity(proof['issuer_name'],row.get('cmName',''))
            or not exact_legal_identity(proof['issuer_name'],row.get('smName',''))
            or not all(origin(row.get(k,'')) for k in ('xbrl','ixbrl'))
            or not re.fullmatch(r'\d+',str(row.get('seq_Id','')))
            or not re.search(r'_'+re.escape(str(row['seq_Id']))+r'_',urlparse(row['ixbrl']).path)):
            raise ValueError('NSE_REVISION_CATALOG_ISSUER_OR_ORIGINAL_LINK_UNPROVEN')
        created=stamp(row['creation_Date'])
        if created.date()>captured.date()+timedelta(days=1):raise ValueError('NSE_REVISION_FUTURE_CATALOG_EVENT_UNPROVEN')
        group.append((created,row))
    if not group or len({str(r['seq_Id']) for _,r in group})!=len(group):raise ValueError('NSE_REVISION_CHAIN_AMBIGUOUS')
    originals=[(t,r) for t,r in group if r['type_Sub']=='Original']
    if len(originals)!=1:raise ValueError('NSE_REVISION_SINGLE_ORIGINAL_CHAIN_REQUIRED')
    group.sort(key=lambda x:(x[0],int(x[1]['seq_Id'])))
    if group[0][1]['type_Sub']!='Original' or len({t for t,_ in group})!=len(group):raise ValueError('NSE_REVISION_CHAIN_ORDER_UNPROVEN')
    latest=group[-1][1]
    if (latest['type_Sub']!='Revision' or not str(latest.get('revision_Remark') or '').strip()
        or len(str(latest.get('revision_Remark','')))>4096 or not latest.get('revised_Date')
        or stamp(latest['revised_Date'])>group[-1][0]):
        raise ValueError('NSE_REVISION_EXPLICIT_REVISED_SUBMISSION_REQUIRED')
    return [r for _,r in group],latest

def unit_kinds(root):
    units={}
    for node in root:
        if local(node.tag)!='unit':continue
        children=list(node);kind=None
        if len(children)==1 and local(children[0].tag)=='measure' and (children[0].text or '').strip() in ('iso4217:INR','INR'):
            kind='money'
        elif len(children)==1 and local(children[0].tag)=='divide':
            parts=list(children[0])
            if len(parts)==2 and [local(x.tag) for x in parts]==['unitNumerator','unitDenominator']:
                num,den=[list(x) for x in parts]
                if (len(num)==len(den)==1 and local(num[0].tag)==local(den[0].tag)=='measure'
                    and (num[0].text or '').strip() in ('iso4217:INR','INR')
                    and (den[0].text or '').strip() in ('xbrli:shares','shares')):kind='eps'
        if node.attrib.get('id') in units:raise ValueError('NSE_REVISION_DUPLICATE_UNIT_DECLARATION')
        units[node.attrib.get('id')]=kind
    return units

def xml_facts(raw,proof,tags):
    if len(raw)>5_000_000 or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():raise ValueError('NSE_REVISION_XML_BYTES_UNPROVEN')
    root=ET.fromstring(raw)
    if local(root.tag)!='xbrl':raise ValueError('NSE_REVISION_NOT_XML_INSTANCE')
    def one(name):
        values={(x.text or '').strip() for x in root if local(x.tag)==name and x.text}
        return next(iter(values)) if len(values)==1 else None
    code=one('ScripCode')
    if (one('Symbol')!=proof['symbol'] or one('ISIN')!=proof['isin'] or not re.fullmatch(r'\d{6}',code or '')
        or not exact_legal_identity(proof['issuer_name'],one('NameOfTheCompany') or '')
        or scope(one('NatureOfReportStandaloneConsolidated'))!=proof['scope']):
        raise ValueError('NSE_REVISION_XML_EXACT_IDENTITY_OR_SCOPE_UNPROVEN')
    contexts=[e for e in root if local(e.tag)=='context' and e.attrib.get('id')=='OneD']
    if len(contexts)!=1:raise ValueError('NSE_REVISION_XML_QUARTER_CONTEXT_UNPROVEN')
    context=contexts[0]
    if (any(local(e.tag) in ('scenario','segment') for e in context.iter())
        or [(e.text or '').strip() for e in context.iter() if local(e.tag)=='startDate']!=[PERIODS[proof['period_end']]]
        or [(e.text or '').strip() for e in context.iter() if local(e.tag)=='endDate']!=[proof['period_end']]
        or [(e.text or '').strip() for e in context.iter() if local(e.tag)=='identifier'] not in ([code],[proof['symbol']])):
        raise ValueError('NSE_REVISION_XML_EXACT_QUARTER_ENTITY_UNPROVEN')
    units=unit_kinds(root)
    facts={}
    for metric,tag in tags.items():
        values=set();eps=metric=='EPS_DILUTED'
        for e in root:
            if local(e.tag)!=tag or e.attrib.get('contextRef')!='OneD':continue
            if units.get(e.attrib.get('unitRef'))!=('eps' if eps else 'money'):continue
            text=(e.text or '').strip()
            if not re.fullmatch(r'-?\d+(?:\.\d+)?',text):raise ValueError('NSE_REVISION_ORIGINAL_DECIMAL_UNPROVEN')
            value=Decimal(text)/(1 if eps else Decimal(10000000))
            if not value.is_finite():raise ValueError('NSE_REVISION_ORIGINAL_NONFINITE')
            values.add(value)
        if len(values)!=1:raise ValueError('NSE_REVISION_XML_COMPLETE_TRIO_UNPROVEN')
        facts[metric]=values.pop()
    return facts

def xml_trio(raw,proof):
    return xml_facts(raw,proof,{'OPERATING_REVENUE_QUARTER':'RevenueFromOperations','NET_PROFIT_QUARTER':'ProfitLossForPeriod','EPS_DILUTED':'DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations'})

def parse_original(raw,url,proof):
    if not origin(url):raise ValueError('NSE_REVISION_ORIGINAL_ORIGIN_UNPROVEN')
    if url.lower().endswith('.xml'):return xml_trio(raw,proof)
    text,tables=parse_html(raw.decode('utf-8-sig'))
    if unique(tables,'description of presentation currency')!='INR' or not exact_legal_identity(proof['issuer_name'],unique(tables,'name of company') or ''):
        raise ValueError('NSE_REVISION_HTML_LEGAL_IDENTITY_OR_CURRENCY_UNPROVEN')
    parsed=extract_tables(tables,proof['symbol'],proof['isin'],proof['period_end'])
    if (parsed['scope']!=proof['scope'] or parsed['filing_period_end']!=proof['period_end'] or parsed['filing_period_start']!=PERIODS[proof['period_end']]):
        raise ValueError('NSE_REVISION_HTML_OWN_QUARTER_AND_SCOPE_UNPROVEN')
    return {k:Decimal(f['value']) for k,f in parsed['facts'].items()}

def validate_proof(proof,client):
    if (proof.get('contract')!=CONTRACT or proof.get('period_end') not in PERIODS
        or proof.get('scope') not in ('STANDALONE','CONSOLIDATED')
        or not re.fullmatch(r'[0-9a-f-]{36}',str(proof.get('security_id','')))
        or not re.fullmatch(r'IN[A-Z0-9]{10}',str(proof.get('isin','')))):
        raise ValueError('NSE_REVISION_PROOF_CONTEXT_UNPROVEN')
    rows,latest=catalog_group(read_ref(client,proof['catalog'],'catalog'),proof)
    references=proof['revised_originals']
    if set(references)!=set(('xbrl','ixbrl')):raise ValueError('NSE_REVISION_BOTH_PRIMARY_FORMATS_REQUIRED')
    revised=[]
    for kind,name in [('xml','xbrl'),('html','ixbrl')]:
        witness=references[name]
        if witness['source_url']!=latest[name]:raise ValueError('NSE_REVISION_LATEST_DECLARED_ORIGINAL_MISMATCH')
        revised.append(parse_original(read_ref(client,witness,kind),latest[name],proof))
    if revised[0]!=revised[1] or set(revised[0])!=CORE:raise ValueError('NSE_REVISION_INDEPENDENT_XML_HTML_TRIOS_DISAGREE')
    allowed={url:r for r in rows for url in (r['xbrl'],r['ixbrl'])};source_vectors={};retired=set();accepted=set()
    for source in proof['source_records']:
        sid=source['source_record_id'];url=source['source_url']
        if sid in source_vectors or url not in allowed or source['source_contract'] not in SOURCE_CONTRACTS:
            raise ValueError('NSE_REVISION_SOURCE_VERSION_NOT_IN_EXPLICIT_CHAIN')
        recorded=source.get('recorded_original_sha256','');basis=source.get('snapshot_basis')
        if not re.fullmatch(r'[a-f0-9]{64}',recorded):raise ValueError('NSE_REVISION_RECORDED_SOURCE_HASH_UNPROVEN')
        if basis=='EXACT_ORIGINAL_BYTES':
            if recorded!=source['sha256']:raise ValueError('NSE_REVISION_EXACT_ORIGINAL_VERSION_CHANGED')
        elif basis=='FRESH_EXCHANGE_RENDITION_FINANCIAL_TRIO_REPLAY':
            if source.get('original_bytes_previously_retained') is not False or recorded==source['sha256']:
                raise ValueError('NSE_REVISION_UNRETAINED_RENDITION_BASIS_UNPROVEN')
        else:raise ValueError('NSE_REVISION_EXPLICIT_CAPTURE_BASIS_REQUIRED')
        vector=parse_original(read_ref(client,source,'xml' if url.lower().endswith('.xml') else 'html'),url,proof)
        source_vectors[sid]=(source,vector)
        if allowed[url]['seq_Id']==latest['seq_Id']:
            if vector!=revised[0]:raise ValueError('NSE_REVISION_CANONICAL_REVISED_SOURCE_DISAGREES')
            accepted.add(sid)
        else:retired.add(sid)
    if not retired or not accepted:raise ValueError('NSE_REVISION_COMPLETE_OLD_AND_REVISED_VERSIONS_REQUIRED')
    return source_vectors,retired,accepted,latest['revision_Remark']

def qualify(facts,indexes,client):
    omitted=set();accepted=set();errors=Counter()
    for indexed in indexes:
        try:
            index=indexed['raw_payload']
            if sha(canonical(index))!=indexed['payload_hash'] or index.get('contract')!=CONTRACT:raise ValueError('NSE_REVISION_INDEX_HASH_UNPROVEN')
            proof=json.loads(read_ref(client,index['proof'],'proof'))
            if any(index.get(k)!=proof.get(k) for k in ('security_id','symbol','isin','period_end','scope')):raise ValueError('NSE_REVISION_INDEX_CONTEXT_MISMATCH')
            vectors,old,new,_=validate_proof(proof,client);groups=defaultdict(dict);matches=[]
            for row in facts:
                if (str(row['security_id'])!=proof['security_id'] or str(row['period_end'])!=proof['period_end']
                    or row['consolidation_scope']!=proof['scope'] or str(row['source_record_id']) not in vectors):continue
                sid=str(row['source_record_id']);source,vector=vectors[sid];metric=row['metric_code'];payload=row['raw_payload']
                if (row['symbol']!=proof['symbol'] or row['isin']!=proof['isin'] or str(row['period_start'])!=PERIODS[proof['period_end']]
                    or row['source_url']!=source['source_url'] or payload.get('contract')!=source['source_contract']
                    or payload.get('original_sha256_unretained')!=source['recorded_original_sha256']
                    or (source['snapshot_basis']=='FRESH_EXCHANGE_RENDITION_FINANCIAL_TRIO_REPLAY' and payload.get('raw_nse_bytes_retained') is not False) or row['currency']!='INR'
                    or row['unit']!=('INR_PER_SHARE' if metric=='EPS_DILUTED' else 'INR_CRORE') or metric not in CORE
                    or metric in groups[sid]):raise ValueError('NSE_REVISION_CANONICAL_FACT_CONTEXT_MISMATCH')
                groups[sid][metric]=Decimal(str(row['numeric_value']));matches.append(row)
            if set(groups)!=set(vectors) or any(groups[sid]!=vector for sid,(_,vector) in vectors.items()):
                raise ValueError('NSE_REVISION_CANONICAL_TRIOS_NOT_REPRODUCED')
            omitted.update(id(r) for r in matches if str(r['source_record_id']) in old);accepted.update(new)
        except Exception as error:errors[str(error).split(':')[0] if isinstance(error,ValueError) else type(error).__name__]+=1
    return [r for r in facts if id(r) not in omitted],accepted,dict(errors)
