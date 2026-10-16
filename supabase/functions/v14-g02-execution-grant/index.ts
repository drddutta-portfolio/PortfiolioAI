import {issueRemainingG03Grant} from '../_shared/v14-g03-remaining-grant-runtime.ts'
import {g03RemainingGrantExecutorQualified} from '../_shared/v14-g03-remaining-isolated-scope.ts'
import {renewBelMarketHistory} from '../_shared/v14-g03-market-renewal-runtime.ts'
import {appendBelCompletedSession} from '../_shared/v14-g03-market-append-runtime.ts'
import g03MarketPolicy from '../_shared/v14-g03-market-authorization.json' with {type:'json'}
import {g03HistoryExecutorQualified} from '../_shared/v14-g03-market-scope.ts'
import g03Policy from '../_shared/v14-g03-pilot-authorization.json' with {type:'json'}
import {g03MaterializationGrantQualified} from '../_shared/v14-g03-materialization-scope.ts'
import {g03ValidationExecutorQualified} from '../_shared/v14-g03-validation-scope.ts'
import {handleG02MarketHistory} from '../_shared/v14-g02-market-history-runtime.ts'
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import policy from '../_shared/v14-g02-owner-authorization.json' with {type:'json'}
import {g02ValidationExecutorQualified,g02HistoryExecutorQualified} from '../_shared/v14-g02-executor-identity.ts'
const canonicalAction='P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS',canonicalScope='SECURITY_IDS:'+policy.securityIds.join(','),audience=`https://${policy.developmentProject}.supabase.co/functions/v1/v14-g02-execution-grant`,jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))).map(x=>x.toString(16).padStart(2,'0')).join('')
Deno.serve(async req=>{
 const reply=(s:number,code:string,data:Record<string,unknown>={})=>new Response(JSON.stringify({code,...data}),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})
 if(req.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED')
 const url=Deno.env.get('SUPABASE_URL')??'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';if(url!==`https://${policy.developmentProject}.supabase.co`||!key)return reply(409,'DEVELOPMENT_ONLY')
 let claims:Record<string,unknown>
 try{const v=await jwtVerify((req.headers.get('authorization')??'').replace(/^Bearer\s+/i,''),jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'});claims=v.payload}catch{return reply(401,'SIGNED_G02_EXECUTOR_REQUIRED')}
 const body=await req.json().catch(()=>null)
 if(body?.action==='ISSUE_G03_REMAINING_CANONICAL_ONLY_GRANT'){
  if(!g03RemainingGrantExecutorQualified(claims))return reply(403,'G03_REMAINING_EXECUTOR_SCOPE_INVALID')
  const result=await issueRemainingG03Grant(createClient(url,key,{auth:{persistSession:false}}),key,body,claims);return reply(result.status,result.code,result.data)
 }

 if(body?.action==='APPEND_FIXED_G03_BEL_COMPLETED_SESSION'){if(!g03HistoryExecutorQualified(claims))return reply(403,'G03_HISTORY_EXECUTOR_REQUIRED');try{return new Response(JSON.stringify(await appendBelCompletedSession(createClient(url,key,{auth:{persistSession:false}}),body)),{headers:{'content-type':'application/json','cache-control':'no-store'}})}catch(e){return reply(409,e instanceof Error?e.message:'G03_HISTORY_APPEND_FAILED')}}
 if(body?.action==='V1_4_G02_HISTORY_TAIL'){if(!g02HistoryExecutorQualified(claims))return reply(403,'G02_HISTORY_EXECUTOR_REQUIRED');return handleG02MarketHistory(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify(body)}))}
 if(body?.action==='RENEW_FIXED_G03_BEL_HISTORY'){if(!g03HistoryExecutorQualified(claims))return reply(403,'G03_HISTORY_EXECUTOR_REQUIRED');try{return new Response(JSON.stringify(await renewBelMarketHistory(createClient(url,key,{auth:{persistSession:false}}),body)),{headers:{'content-type':'application/json','cache-control':'no-store'}})}catch(e){return reply(409,e instanceof Error?e.message:'G03_HISTORY_RENEWAL_FAILED')}}
 if(body?.action==='V1_4_G03_HISTORY_TAIL'){if(!g03HistoryExecutorQualified(claims))return reply(403,'G03_HISTORY_EXECUTOR_REQUIRED');return handleG02MarketHistory(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify(body)}),'G03')}
 const g03History=body?.action==='ISSUE_G03_HISTORY_TAIL_GRANT',g03=body?.action==='ISSUE_G03_CANONICAL_ONLY_GRANT',selectedPolicy=g03History?g03MarketPolicy:g03?g03Policy:policy,group=g03||g03History?'G03':'G02'
 if(g03&&!g03MaterializationGrantQualified(body))return reply(400,'EXACT_G03_CANONICAL_SCOPE_REQUIRED')
 if(!(g03History?g03HistoryExecutorQualified(claims):g03?g03ValidationExecutorQualified(claims):g02ValidationExecutorQualified(claims)||g02HistoryExecutorQualified(claims)))return reply(403,group+'_EXECUTOR_SCOPE_INVALID')
 const history=g03History||body?.action==='ISSUE_G02_HISTORY_TAIL_GRANT'
 if(body?.authorizationHash!==selectedPolicy.directiveSha256||history&&!(g03History?g03HistoryExecutorQualified(claims):g02HistoryExecutorQualified(claims))||!history&&(body?.action!==('ISSUE_'+group+'_CANONICAL_ONLY_GRANT')||!(g03?g03ValidationExecutorQualified(claims):g02ValidationExecutorQualified(claims))))return reply(400,'EXACT_G02_EXECUTION_AUTHORIZATION_REQUIRED')
 const sessionDate=String(body?.sessionDate??'')
 if(history&&(!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)||!Number.isFinite(Date.parse(sessionDate+'T19:00:00+05:30'))||Date.now()<Date.parse(sessionDate+'T19:00:00+05:30')||Date.now()-Date.parse(sessionDate+'T19:00:00+05:30')>3*86400000))return reply(409,'G02_HISTORY_SESSION_NOT_PUBLICATION_ELIGIBLE')
 const action=history?'V1_4_'+group+'_HISTORY_TAIL':canonicalAction,scope=history?group+'_STOCKS:'+selectedPolicy.securityIds.join(',')+':'+sessionDate:g03?'SECURITY_IDS:'+g03Policy.securityIds.join(','):canonicalScope
 const db=createClient(url,key,{auth:{persistSession:false}}),holder=crypto.randomUUID(),operation=group+'_CANONICAL_GRANT_'+String(claims.run_id)
 const acquired=await db.rpc('acquire_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_lease_seconds:60})
 if(acquired.error||!Array.isArray(acquired.data)||acquired.data[0]?.acquired!==true)return reply(409,'G02_GRANT_ISSUANCE_BUSY')
 try{
  const owner=await db.from('portfolios').select('user_id').eq('id',selectedPolicy.portfolioId).single();if(owner.error||owner.data.user_id!==selectedPolicy.ownerId)return reply(403,'G02_OWNER_NOT_VERIFIED')
  // Existing global unique consumption index was independently verified.
  // Consumption remains behind the unchanged canonical P4 contract.
  const external='V14_'+group+'_'+(history?'HISTORY':'CANONICAL')+':'+String(claims.run_id)+':'+String(claims.run_attempt),old=await db.from('data_source_records').select('id,raw_payload').eq('source_code','OWNER_REVIEWED_CLASSIFICATION').eq('record_kind','P4_EXECUTION_GRANT').eq('external_record_id',external).maybeSingle()
  if(old.error)return reply(503,'G02_GRANT_LOOKUP_FAILED')
  if(old.data){if(old.data.raw_payload.authorization_reference!==selectedPolicy.directiveSha256||old.data.raw_payload.action!==action||old.data.raw_payload.security_id!==scope||old.data.raw_payload.portfolio_id!==selectedPolicy.portfolioId)return reply(409,'G02_GRANT_IDENTITY_CONFLICT');if(Date.parse(old.data.raw_payload.expires_at)<=Date.now())return reply(409,'G02_GRANT_EXPIRED_NO_REISSUANCE');return reply(200,history?group+'_HISTORY_TAIL_GRANT':group+'_CANONICAL_ONLY_GRANT',{grantId:old.data.id,reused:true,scope,providerCalls:0})}
  const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']),digest=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode(group+'_CANONICAL_GRANT:'+external)))).map(x=>x.toString(16).padStart(2,'0')).join(''),id=digest.slice(0,8)+'-'+digest.slice(8,12)+'-4'+digest.slice(13,16)+'-a'+digest.slice(17,20)+'-'+digest.slice(20,32),now=new Date(),payload={action,security_id:scope,portfolio_id:selectedPolicy.portfolioId,environment:'PortfolioAI Dev',project_ref:policy.developmentProject,expires_at:new Date(now.getTime()+5*60000).toISOString(),authorization_reference:selectedPolicy.directiveSha256,authorizing_owner_id:selectedPolicy.ownerId,executor:history?'GITHUB_OIDC_'+group+'_HISTORY_EXECUTION':'GITHUB_OIDC_'+group+'_CANONICAL_EXECUTION',issuance_workflow:claims.workflow_ref,issuance_run_id:claims.run_id,issuance_sha:claims.sha,provider_calls_allowed:history?(g03History?1:3):0}
  const inserted=await db.from('data_source_records').insert({id,source_code:'OWNER_REVIEWED_CLASSIFICATION',record_kind:'P4_EXECUTION_GRANT',external_record_id:external,retrieved_at:now.toISOString(),payload_hash:await hash(payload),raw_payload:payload,terms_snapshot:{mode:history?'OWNER_AUTHORIZED_'+group+'_HISTORY_TAIL':'OWNER_AUTHORIZED_'+group+'_CANONICAL_ONLY',no_owner_session_attribution:true,provider_acquisition:history}})
  if(inserted.error)return reply(409,'G02_GRANT_INSERT_REJECTED')
  const read=await db.from('data_source_records').select('id,payload_hash').eq('id',id).single();if(read.error||read.data.payload_hash!==await hash(payload))return reply(409,'G02_GRANT_READBACK_FAILED')
  return reply(200,history?group+'_HISTORY_TAIL_GRANT':group+'_CANONICAL_ONLY_GRANT',{grantId:id,reused:false,scope,providerCalls:0})
 }catch{return reply(503,'G02_GRANT_ISSUANCE_FAILED')}
 finally{await db.rpc('release_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0})}
})
