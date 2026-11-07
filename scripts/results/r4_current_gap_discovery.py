"""Exact-quarter discovery for every unselected current slot, never source promotion."""
import json
from datetime import date
from r4_recovery_queue import task_id,attempt_all
PERIODS={'2025-09-30','2025-12-31','2026-03-31','2026-06-30'}
# Search hints only; provider identity still requires an exact observed ISIN.
NAMES={'360ONE':'360 ONE WAM Limited','AVANTIFEED':'Avanti Feeds Limited','BDL':'Bharat Dynamics Limited',
 'COROMANDEL':'Coromandel International Limited','DATAPATTNS':'Data Patterns (India) Limited',
 'ICICIAMC':'ICICI Prudential Asset Management Company Limited','JIOFIN':'Jio Financial Services Limited',
 'MGL':'Mahanagar Gas Limited','STARHEALTH':'Star Health and Allied Insurance Company Limited',
 'VAML':'Vedanta Aluminium Metal Limited','WELSPUNLIV':'Welspun Living Limited',
 'YATRA':'Yatra Online Limited','ZAGGLE':'Zaggle Prepaid Ocean Services Limited'}


def pending_current(db,batch):
    """Acquisition target projection only; the independent R4 selector owns coverage."""
    with db.cursor() as cur:
        cur.execute("""WITH cohort AS (
          SELECT DISTINCT s.id,s.symbol,s.isin FROM transactions t JOIN securities s ON s.id=t.security_id
          WHERE t.portfolio_id=%s AND t.superseded_at IS NULL AND s.asset_class='EQUITY' AND s.isin IS NOT NULL),
        periods AS (SELECT unnest(%s::date[]) p),
        complete AS (
          SELECT d.security_id,d.period_end,d.consolidation_scope,o.source_record_id
          FROM fundamental_observation_decisions d JOIN fundamental_observations o ON o.id=d.selected_observation_id
          JOIN cohort c ON c.id=d.security_id
          WHERE d.security_id=o.security_id AND d.metric_code=o.metric_code AND d.period_end=o.period_end
            AND d.consolidation_scope=o.consolidation_scope AND d.period_type='QUARTER' AND o.period_type='QUARTER'
            AND d.period_end=ANY(%s::date[]) AND o.source_code='COMPANY_EXCHANGE_FILING'
            AND o.evidence_status='AVAILABLE' AND o.currency='INR' AND o.numeric_value IS NOT NULL AND o.source_record_id IS NOT NULL
            AND o.consolidation_scope IN ('CONSOLIDATED','STANDALONE')
            AND o.period_end-o.period_start BETWEEN 75 AND 100
            AND o.unit=CASE WHEN o.metric_code='EPS_DILUTED' THEN 'INR_PER_SHARE' ELSE 'INR_CRORE' END
            AND o.metric_code IN ('NET_PROFIT_QUARTER','EPS_DILUTED',
              CASE WHEN c.symbol='STARHEALTH' THEN 'NET_PREMIUM_EARNED_QUARTER'
                   WHEN c.symbol=ANY(%s::text[]) THEN 'NET_INTEREST_INCOME_QUARTER' ELSE 'OPERATING_REVENUE_QUARTER' END)
          GROUP BY 1,2,3,4 HAVING count(DISTINCT o.metric_code)=3)
        SELECT c.id::text,c.symbol,c.isin,p.p::text,i.provider_instrument_id
        FROM cohort c CROSS JOIN periods p LEFT JOIN LATERAL (
          SELECT provider_instrument_id FROM security_identity_observations
          WHERE security_id=c.id AND source_code='TRENDLYNE_MCP' AND evidence_status='MATCHED'
            AND observed_isin=c.isin AND provider_instrument_id IS NOT NULL
          ORDER BY created_at DESC LIMIT 1) i ON true
        WHERE NOT EXISTS(SELECT 1 FROM complete z WHERE z.security_id=c.id AND z.period_end=p.p)
        ORDER BY c.symbol,p.p""",(batch.PORTFOLIO,sorted(PERIODS),sorted(PERIODS),sorted(batch.BANKS)))
        rows=cur.fetchall()
    db.rollback();return rows


def plan_requests(rows):
    plan=[];blocked=[];seen={}
    for sid,symbol,isin,period,pid in rows:
        if period not in PERIODS:raise ValueError('CURRENT_DISCOVERY_EXACT_PERIOD_REQUIRED')
        if not sid or not symbol or not isin:raise ValueError('CURRENT_DISCOVERY_CANONICAL_IDENTITY_REQUIRED')
        identity=(str(sid),period)
        if identity in seen:
            if seen[identity]!=(symbol,isin,pid):raise ValueError('CURRENT_DISCOVERY_CONFLICTING_IDENTITY')
            continue
        seen[identity]=(symbol,isin,pid)
        if not pid:
            blocked.append({'security_id':str(sid),'symbol':symbol,'period_end':period,'reason':'EXACT_PROVIDER_IDENTITY_UNRESOLVED'});continue
        quarter=date.fromisoformat(period).strftime('%d %B %Y');name=NAMES.get(symbol,symbol)
        for topic in ('quarterly financial results for the three months ended','correction revised quarterly financial results diluted EPS for'):
            args={'query':f'{name} ({symbol}) {topic} {quarter}.'}
            key=task_id(sid,'get_document_search_results',period,args)
            plan.append((key,str(sid),symbol,period,args))
    return plan,blocked


def run(db,call,names,client,batch,dest):
    if 'get_document_search_results' not in names:raise RuntimeError('CURRENT_ORIGINAL_DISCOVERY_UNSUPPORTED')
    tasks,blocked=plan_requests(pending_current(db,batch));outcomes=[]
    print('R4_CURRENT_DISCOVERY_PLAN',json.dumps({'planned':len(tasks),'identity_blocked':len(blocked),'canonical_facts':0}),flush=True)
    def process(task):
        key,sid,_,_,args=task
        call('current-'+key[:48],'get_document_search_results',args,sid)
        return {'status':'CAPTURED_REVIEW_ONLY'}
    def failed(task,error):
        db.rollback();return {'status':'RETRY_REQUIRED','reason':type(error).__name__,'http_status':getattr(error,'code',None)}
    def checkpoint(task,result):
        key,_,symbol,period,_=task;outcomes.append({'task_id':key,'symbol':symbol,'period_end':period,**result})
        report={'contract':'RESULTS_R4_CURRENT_GAP_ORIGINAL_DISCOVERY_V1','canonical_promotion_performed':False,
            'planned':len(tasks),'identity_blocked':blocked,'outcomes':outcomes}
        encoded=batch.canonical(report)
        batch.immutable_put(client,batch.PREFIX+'private-recovery-traces/sha256='+batch.sha(encoded)+'/current-corrections.json',encoded)
        (dest/'current-corrections-report.json').write_bytes(encoded)
        print('R4_CURRENT_DISCOVERY_PROGRESS',json.dumps({'attempted':len(outcomes),'status':result['status']}),flush=True)
    attempt_all(tasks,process,failed,checkpoint)
    failures=sum(x['status']=='RETRY_REQUIRED' for x in outcomes)
    print('R4_CURRENT_DISCOVERY_COMPLETE',json.dumps({'planned':len(tasks),'attempted':len(outcomes),'failed':failures,'identity_blocked':len(blocked),'canonical_facts':0}),flush=True)
    if failures:raise RuntimeError('CURRENT_DISCOVERY_PARTIAL_BATCH_SEE_PRIVATE_REPORT')
