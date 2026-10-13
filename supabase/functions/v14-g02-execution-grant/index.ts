import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import policy from '../_shared/v14-g02-owner-authorization.json' with {type:'json'}
import {g02ValidationExecutorQualified} from '../_shared/v14-g02-executor-identity.ts'
const action='P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS',scope='SECURITY_IDS:'+policy.securityIds.join(','),audience=`https://${policy.developmentProject}.supabase.co/functions/v1/v14-g02-execution-grant`,jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))).map(x=>x.toString(16).padStart(2,'0')).join('')
Deno.serve(async req=>{
 const reply=(s:number,code:string,data:Record<string,unknown>={})=>new Response(JSON.stringify({code,...data}),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})
 if(req.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED')
 const url=Deno.env.get('SUPABASE_URL')??'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';if(url!==`https://${policy.developmentProject}.supabase.co`||!key)return reply(409,'DEVELOPMENT_ONLY')
 let claims:Record<string,unknown>
 try{const v=await jwtVerify((req.headers.get('authorization')??'').replace(/^Bearer\s+/i,''),jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'});claims=v.payload;if(!g02ValidationExecutorQualified(claims))return reply(403,'G02_EXECUTOR_SCOPE_INVALID')}catch{return reply(401,'SIGNED_G02_EXECUTOR_REQUIRED')}
 const body=await req.json().catch(()=>null);if(body?.action!=='ISSUE_G02_CANONICAL_ONLY_GRANT'||body.authorizationHash!==policy.directiveSha256)return reply(400,'EXACT_G02_CANONICAL_AUTHORIZATION_REQUIRED')
 const db=createClient(url,key,{auth:{persistSession:false}}),holder=crypto.randomUUID(),operation='G02_CANONICAL_GRANT_'+String(claims.run_id)
 const acquired=await db.rpc('acquire_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_lease_seconds:60})
 if(acquired.error||!Array.isArray(acquired.data)||acquired.data[0]?.acquired!==true)return reply(409,'G02_GRANT_ISSUANCE_BUSY')
 try{
  const owner=await db.from('portfolios').select('user_id').eq('id',policy.portfolioId).single();if(owner.error||owner.data.user_id!==policy.ownerId)return reply(403,'G02_OWNER_NOT_VERIFIED')
  // Existing global unique consumption index was independently verified.
  // Consumption remains behind the unchanged canonical P4 contract.
  const external='V14_G02_CANONICAL:'+String(claims.run_id)+':'+String(claims.run_attempt),old=await db.from('data_source_records').select('id,raw_payload').eq('source_code','OWNER_REVIEWED_CLASSIFICATION').eq('record_kind','P4_EXECUTION_GRANT').eq('external_record_id',external).maybeSingle()
  if(old.error)return reply(503,'G02_GRANT_LOOKUP_FAILED')
  if(old.data){if(old.data.raw_payload.authorization_reference!==policy.directiveSha256||old.data.raw_payload.action!==action||old.data.raw_payload.security_id!==scope||old.data.raw_payload.portfolio_id!==policy.portfolioId)return reply(409,'G02_GRANT_IDENTITY_CONFLICT');if(Date.parse(old.data.raw_payload.expires_at)<=Date.now())return reply(409,'G02_GRANT_EXPIRED_NO_REISSUANCE');return reply(200,'G02_CANONICAL_ONLY_GRANT',{grantId:old.data.id,reused:true,scope,providerCalls:0})}
  const secret=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']),digest=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',secret,new TextEncoder().encode('G02_CANONICAL_GRANT:'+external)))).map(x=>x.toString(16).padStart(2,'0')).join(''),id=digest.slice(0,8)+'-'+digest.slice(8,12)+'-4'+digest.slice(13,16)+'-a'+digest.slice(17,20)+'-'+digest.slice(20,32),now=new Date(),payload={action,security_id:scope,portfolio_id:policy.portfolioId,environment:'PortfolioAI Dev',project_ref:policy.developmentProject,expires_at:new Date(now.getTime()+5*60000).toISOString(),authorization_reference:policy.directiveSha256,authorizing_owner_id:policy.ownerId,executor:'GITHUB_OIDC_G02_CANONICAL_EXECUTION',issuance_workflow:claims.workflow_ref,issuance_run_id:claims.run_id,issuance_sha:claims.sha,provider_calls_allowed:0}
  const inserted=await db.from('data_source_records').insert({id,source_code:'OWNER_REVIEWED_CLASSIFICATION',record_kind:'P4_EXECUTION_GRANT',external_record_id:external,retrieved_at:now.toISOString(),payload_hash:await hash(payload),raw_payload:payload,terms_snapshot:{mode:'OWNER_AUTHORIZED_G02_CANONICAL_ONLY',no_owner_session_attribution:true,provider_acquisition:false}})
  if(inserted.error)return reply(409,'G02_GRANT_INSERT_REJECTED')
  const read=await db.from('data_source_records').select('id,payload_hash').eq('id',id).single();if(read.error||read.data.payload_hash!==await hash(payload))return reply(409,'G02_GRANT_READBACK_FAILED')
  return reply(200,'G02_CANONICAL_ONLY_GRANT',{grantId:id,reused:false,scope,providerCalls:0})
 }catch{return reply(503,'G02_GRANT_ISSUANCE_FAILED')}
 finally{await db.rpc('release_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0})}
})
