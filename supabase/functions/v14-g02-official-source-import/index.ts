import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import {G02_OWNER_POLICY as policy,G02_ORIGINAL_KIND,g02SourceExecutorQualified,g02ReadUrlAllowed,verifyG02Original,prepareG02Source,hashG02,g02StableId,g02SourcePin,G02_R2_BUCKET,g02R2Key,readG02Original} from '../_shared/v14-g02-source-import.ts'
const audience=`https://${policy.developmentProject}.supabase.co/functions/v1/v14-g02-official-source-import`,jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
Deno.serve(async req=>{
 const reply=(s:number,code:string,data:Record<string,unknown>={})=>new Response(JSON.stringify({code,...data}),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})
 if(req.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED')
 const url=Deno.env.get('SUPABASE_URL')??'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''
 if(url!==`https://${policy.developmentProject}.supabase.co`||!key)return reply(409,'DEVELOPMENT_ONLY')
 let claims:Record<string,unknown>
 try{const verified=await jwtVerify((req.headers.get('authorization')??'').replace(/^Bearer\s+/i,''),jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'});claims=verified.payload;if(!g02SourceExecutorQualified(claims))return reply(403,'G02_EXECUTOR_SCOPE_INVALID')}catch{return reply(401,'SIGNED_G02_EXECUTOR_REQUIRED')}
 const body=await req.json().catch(()=>null)
 if(body?.action!=='REGISTER_PINNED_G02_ORIGINAL'||body.authorizationHash!==policy.directiveSha256||typeof body.originalHash!=='string'||typeof body.readUrl!=='string'||!g02ReadUrlAllowed(body.originalHash,body.readUrl))return reply(400,'EXACT_G02_SOURCE_AND_AUTHORIZATION_REQUIRED')
 const db=createClient(url,key,{auth:{persistSession:false}})
 try{
  const pin=g02SourcePin(body.originalHash),owner=await db.from('portfolios').select('user_id').eq('id',policy.portfolioId).single(),security=await db.from('securities').select('id,symbol').eq('id',pin.security_id).single(),authority=await db.from('data_sources').select('is_active').eq('code',pin.source_code).single()
  if(owner.error||owner.data.user_id!==policy.ownerId||security.error||security.data.symbol!==pin.symbol||authority.error||authority.data.is_active!==true)return reply(409,'G02_OWNER_SECURITY_OR_SOURCE_NOT_VERIFIED')
  const response=await fetch(body.readUrl,{redirect:'error',signal:AbortSignal.timeout(60000)});if(!response.ok)return reply(503,'G02_PINNED_R2_READ_FAILED')
  // Fetch may decode a compressed transfer: Content-Length describes the wire,
  // while the pinned hash/length describe the original decoded document bytes.
  await verifyG02Original(body.originalHash,await readG02Original(response,pin.original_bytes))
  const id=await g02StableId({kind:G02_ORIGINAL_KIND,security:pin.security_id,hash:body.originalHash}),existing=await db.from('data_source_records').select('id,payload_hash,raw_payload,retrieved_at').eq('id',id).maybeSingle()
  if(existing.error)return reply(503,'G02_SOURCE_LOOKUP_FAILED')
  const at=existing.data?.raw_payload.original_bytes_verified_at??new Date().toISOString(),candidate=await prepareG02Source(body.originalHash,at)
  if(existing.data&&(existing.data.payload_hash!==candidate.payload_hash||await hashG02(existing.data.raw_payload)!==candidate.payload_hash))return reply(409,'G02_IMMUTABLE_SOURCE_CONFLICT')
  if(!existing.data){const insert=await db.from('data_source_records').insert({...candidate,terms_snapshot:{...candidate.terms_snapshot,execution_sha:claims.sha,execution_run_id:claims.run_id}});if(insert.error&&insert.error.code!=='23505')return reply(409,'G02_SOURCE_INSERT_REJECTED',{postgresCode:insert.error.code})}
  const read=await db.from('data_source_records').select('id,payload_hash,raw_payload').eq('id',id).single();if(read.error||read.data.payload_hash!==candidate.payload_hash||await hashG02(read.data.raw_payload)!==candidate.payload_hash)return reply(409,'G02_SOURCE_READBACK_MISMATCH')
  // Original content identity is distinct from financial review and reporting-period admission.
  const documentId=await g02StableId({kind:'G02_DOCUMENT',security:pin.security_id,hash:body.originalHash}),document={id:documentId,security_id:pin.security_id,document_type:pin.document_type,reporting_period_start:null,reporting_period_end:null,reporting_period_type:null,published_at:null,canonical_content_hash:body.originalHash,identity_basis:'CONTENT_SHA256',identity_status:'VERIFIED',external_storage_reference:`r2://${G02_R2_BUCKET}/${g02R2Key(body.originalHash)}`,identity_evidence:{source_record_id:id,original_sha256:body.originalHash,original_url:pin.original_url,publication_precision:'UNKNOWN',source_registration_only:true}}
  const oldDoc=await db.from('research_documents').select('id,security_id,canonical_content_hash,identity_status,document_type,external_storage_reference').eq('id',documentId).maybeSingle();if(oldDoc.error)return reply(503,'G02_DOCUMENT_LOOKUP_FAILED');if(oldDoc.data&&(oldDoc.data.security_id!==pin.security_id||oldDoc.data.canonical_content_hash!==body.originalHash||oldDoc.data.identity_status!=='VERIFIED'||oldDoc.data.document_type!==pin.document_type||oldDoc.data.external_storage_reference!==document.external_storage_reference))return reply(409,'G02_DOCUMENT_IDENTITY_CONFLICT')
  if(!oldDoc.data){const ins=await db.from('research_documents').insert(document);if(ins.error&&ins.error.code!=='23505')return reply(409,'G02_DOCUMENT_INSERT_REJECTED',{postgresCode:ins.error.code})}
  const linkId=await g02StableId({kind:'G02_DOCUMENT_SOURCE',documentId,sourceId:id}),link={id:linkId,research_document_id:documentId,source_code:pin.source_code,source_record_id:id,provider_document_id:body.originalHash,source_url:pin.original_url,source_title:pin.title,source_published_at:null,retrieved_at:at,content_hash:body.originalHash,extraction_method:'PINNED_ORIGINAL_BYTE_VERIFICATION',extraction_version:'G02_ORIGINAL_IMPORT_V1',extraction_provenance:{authorization_reference:policy.directiveSha256,source_registration_only:true},source_status:'VERIFIED'}
  const oldLink=await db.from('research_document_sources').select('*').eq('id',linkId).maybeSingle();if(oldLink.error)return reply(503,'G02_DOCUMENT_SOURCE_LOOKUP_FAILED');if(oldLink.data&&(oldLink.data.source_record_id!==id||oldLink.data.research_document_id!==documentId||oldLink.data.content_hash!==body.originalHash||oldLink.data.source_url!==pin.original_url||oldLink.data.source_status!=='VERIFIED'))return reply(409,'G02_DOCUMENT_SOURCE_CONFLICT')
  if(!oldLink.data){const ins=await db.from('research_document_sources').insert(link);if(ins.error&&ins.error.code!=='23505')return reply(409,'G02_DOCUMENT_SOURCE_INSERT_REJECTED',{postgresCode:ins.error.code})}
  const docRead=await db.from('research_documents').select('canonical_content_hash,identity_status').eq('id',documentId).single(),linkRead=await db.from('research_document_sources').select('source_record_id,content_hash,source_status').eq('id',linkId).single()
  if(docRead.error||linkRead.error||docRead.data.canonical_content_hash!==body.originalHash||docRead.data.identity_status!=='VERIFIED'||linkRead.data.source_record_id!==id||linkRead.data.content_hash!==body.originalHash||linkRead.data.source_status!=='VERIFIED')return reply(409,'G02_DOCUMENT_BINDING_READBACK_FAILED')
  return reply(200,'G02_ORIGINAL_REGISTERED_NOT_FINANCIALLY_ADMITTED',{sourceId:id,documentId,documentSourceId:linkId,reused:Boolean(existing.data),providerApiCalls:0,acceptedReviews:0,canonicalMaterialization:false})
 }catch(e){const m=e instanceof Error?e.message:'';return reply(409,/^[A-Z0-9_:]+$/.test(m)?m:'G02_SOURCE_IMPORT_FAILED')}
})
