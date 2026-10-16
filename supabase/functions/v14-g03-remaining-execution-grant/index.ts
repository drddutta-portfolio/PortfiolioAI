import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import {g03ValidationExecutorQualified} from '../_shared/v14-g03-validation-scope.ts'
import {g03RemainingMaterializationScope} from '../_shared/v14-g03-materialization-scope.ts'
import policy from '../_shared/v14-g03-remaining-authorization.json' with {type:'json'}
const audience=`https://${policy.developmentProject}.supabase.co/functions/v1/v14-g03-remaining-execution-grant`,jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))).map(x=>x.toString(16).padStart(2,'0')).join('')
Deno.serve(async req=>{
 const reply=(status:number,code:string,data:Record<string,unknown>={})=>new Response(JSON.stringify({code,...data}),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})
 if(req.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED')
 const url=Deno.env.get('SUPABASE_URL')??'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''
 if(url!==`https://${policy.developmentProject}.supabase.co`||!key)return reply(409,'DEVELOPMENT_ONLY')
 let claims:Record<string,unknown>
 try{claims=(await jwtVerify((req.headers.get('authorization')??'').replace(/^Bearer\s+/i,''),jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'})).payload}catch{return reply(401,'SIGNED_G03_REMAINING_EXECUTOR_REQUIRED')}
 if(claims.event_name!=='workflow_dispatch'||!g03ValidationExecutorQualified(claims))return reply(403,'G03_REMAINING_EXECUTOR_SCOPE_INVALID')
 const body=await req.json().catch(()=>null)
 const scope=body&&typeof body==='object'&&!Array.isArray(body)?g03RemainingMaterializationScope(body):null
 if(!scope)return reply(400,'EXACT_G03_REMAINING_CANONICAL_SCOPE_REQUIRED')
 const db=createClient(url,key,{auth:{persistSession:false}}),holder=crypto.randomUUID(),operation='G03_REMAINING_GRANT:'+String(claims.run_id)+':'+body.securityId
 const lease=await db.rpc('acquire_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_lease_seconds:60})
 if(lease.error||lease.data?.[0]?.acquired!==true)return reply(409,'G03_REMAINING_GRANT_BUSY')
 try{
  const owner=await db.from('portfolios').select('user_id').eq('id',policy.portfolioId).single()
  if(owner.error||owner.data.user_id!==policy.ownerId)return reply(403,'G03_REMAINING_OWNER_NOT_VERIFIED')
  const action='P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS',external='V14_G03_REMAINING_CANONICAL:'+String(claims.run_id)+':'+String(claims.run_attempt)+':'+body.securityId
  const old=await db.from('data_source_records').select('id,raw_payload').eq('source_code','OWNER_REVIEWED_CLASSIFICATION').eq('record_kind','P4_EXECUTION_GRANT').eq('external_record_id',external).maybeSingle()
  if(old.error)return reply(503,'G03_REMAINING_GRANT_LOOKUP_FAILED')
  if(old.data){const p=old.data.raw_payload;if(p.authorization_reference!==policy.directiveSha256||p.action!==action||p.security_id!==scope||p.portfolio_id!==policy.portfolioId||p.provider_calls_allowed!==0)return reply(409,'G03_REMAINING_GRANT_IDENTITY_CONFLICT');if(Date.parse(p.expires_at)<=Date.now())return reply(409,'G03_REMAINING_GRANT_EXPIRED_NO_REISSUANCE');return reply(200,'G03_CANONICAL_ONLY_GRANT',{grantId:old.data.id,reused:true,scope,providerCalls:0})}
  const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']),digest=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode(external)))).map(x=>x.toString(16).padStart(2,'0')).join(''),id=digest.slice(0,8)+'-'+digest.slice(8,12)+'-4'+digest.slice(13,16)+'-a'+digest.slice(17,20)+'-'+digest.slice(20,32),now=new Date()
  const payload={action,security_id:scope,portfolio_id:policy.portfolioId,environment:'PortfolioAI Dev',project_ref:policy.developmentProject,expires_at:new Date(now.getTime()+5*60000).toISOString(),authorization_reference:policy.directiveSha256,authorizing_owner_id:policy.ownerId,executor:'GITHUB_OIDC_G03_REMAINING_CANONICAL_EXECUTION',issuance_workflow:claims.workflow_ref,issuance_run_id:claims.run_id,issuance_sha:claims.sha,provider_calls_allowed:0}
  const inserted=await db.from('data_source_records').insert({id,source_code:'OWNER_REVIEWED_CLASSIFICATION',record_kind:'P4_EXECUTION_GRANT',external_record_id:external,retrieved_at:now.toISOString(),payload_hash:await hash(payload),raw_payload:payload,terms_snapshot:{mode:'OWNER_AUTHORIZED_G03_REMAINING_CANONICAL_ONLY',no_owner_session_attribution:true,provider_acquisition:false}})
  if(inserted.error)return reply(409,'G03_REMAINING_GRANT_INSERT_REJECTED')
  const read=await db.from('data_source_records').select('id,payload_hash').eq('id',id).single()
  if(read.error||read.data.payload_hash!==await hash(payload))return reply(409,'G03_REMAINING_GRANT_READBACK_FAILED')
  return reply(200,'G03_CANONICAL_ONLY_GRANT',{grantId:id,reused:false,scope,providerCalls:0})
 }catch{return reply(503,'G03_REMAINING_GRANT_ISSUANCE_FAILED')}
 finally{await db.rpc('release_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0})}
})
