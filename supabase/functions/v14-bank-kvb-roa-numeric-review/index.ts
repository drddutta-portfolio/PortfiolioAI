import {kvbRoaBinding,kvbRoaOriginalQualified,KVB_ORIGINAL_PROOF,pgReviewTimestamp} from "../_shared/v14-kvb-roa-original-proof.ts"
import {bankReportingDeadline} from "../_shared/v14-bank-dual-clock.ts"
import {sourceEligible} from "./source-guard.ts";
// BANK V1-4: owner-authenticated, append-only KVB ROA numeric review.
// Does not mint grants, alter canonical snapshots, or weaken M4.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0";
const PROJECT="lrgpjimipfkyoqbpsqzz",PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2",KVB="be55b3cc-0400-45af-84aa-2a95e2c361c5";
const HASH=/^[0-9a-f]{64}$/;
const reply=(status:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const str=(v:unknown)=>typeof v==="string"?v:"";
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null";
const sha=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(stable(v))))).map(x=>x.toString(16).padStart(2,"0")).join("");

async function handle(req:Request){
 if(req.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED");
 const url=Deno.env.get("SUPABASE_URL")??"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
 if(url!==`https://${PROJECT}.supabase.co`||!service)return reply(409,"DEV_ONLY");
 const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"").trim();
 if(!token)return reply(401,"OWNER_AUTH_REQUIRED");
 const db=createClient(url,service,{auth:{persistSession:false}});
 const user=await db.auth.getUser(token);
 if(user.error||!user.data.user||user.data.user.is_anonymous)return reply(401,"OWNER_AUTH_INVALID");
 const owner=await db.from("portfolios").select("user_id").eq("id",PORTFOLIO).single();
 if(owner.error||owner.data?.user_id!==user.data.user.id)return reply(403,"PORTFOLIO_OWNER_REQUIRED");
 const body=await req.json().catch(()=>null) as Record<string,unknown>|null;
 if(body?.action==="READ_KVB_FY26_ROA_PROPOSAL"&&body.portfolioId===PORTFOLIO&&body.securityId===KVB){
   const candidates=await db.from("data_source_records").select("id,payload_hash,raw_payload,source_code,record_kind,retrieved_at,published_at")
    .eq("record_kind","V1_4_KVB_ROA_ORIGINAL_SOURCE_V1").eq("source_code","COMPANY_EXCHANGE_FILING")
    .eq("external_record_id",KVB_ORIGINAL_PROOF.issuer.sha256);
   if(candidates.error)return reply(503,"PROPOSAL_READ_FAILED");
   const qualified=(candidates.data??[]).filter(x=>kvbRoaOriginalQualified(x));
   if(qualified.length!==1)return reply(409,"REGISTERED_ORIGINAL_PROPOSAL_NOT_UNIQUE");
   const s=qualified[0];
   const accepted=await db.from("research_evidence_requirement_reviews").select("id")
    .eq("portfolio_id",PORTFOLIO).eq("security_id",KVB).eq("requirement_code","ROA_ANNUAL")
    .eq("source_record_id",s.id).eq("source_payload_hash",s.payload_hash).eq("review_kind","OWNER_NUMERIC_REVIEW")
    .eq("decision","ACCEPTED").eq("reviewed_by",user.data.user.id);
   if(accepted.error)return reply(503,"ACCEPTED_REVIEW_READ_FAILED");
   if((accepted.data??[]).length>1)return reply(409,"ACCEPTED_REVIEW_NOT_UNIQUE");
   return reply(200,"SOURCE_BOUND_ROA_PROPOSAL_NOT_ACCEPTED",{sourceRecordId:s.id,sourcePayloadHash:s.payload_hash,
    supportingQuote:KVB_ORIGINAL_PROOF.issuer.table,period:"FY2025-26",scope:"STANDALONE",roaPercent:"1.93",
    issuerUrl:KVB_ORIGINAL_PROOF.issuer.originalUrl,regulatorUrl:KVB_ORIGINAL_PROOF.regulator.originalUrl,
    publicationPrecision:"UNKNOWN",canonicalPromotion:false,acceptedReviewId:accepted.data?.[0]?.id??null});
 }
 if(!body||body.action!=="V14_KVB_ROA_OWNER_NUMERIC_REVIEW"||body.portfolioId!==PORTFOLIO||body.securityId!==KVB||body.confirmation!=="APPROVE_KVB_FY26_ROA_SOURCE_BOUND_193"
   ||typeof body.sourceRecordId!=="string"||typeof body.sourcePayloadHash!=="string"||!HASH.test(body.sourcePayloadHash)
   ||typeof body.supportingQuote!=="string"||body.supportingQuote.length>3500)
   return reply(400,"EXACT_KVB_M4_REQUEST_REQUIRED");
 const sourceQ=await db.from("data_source_records").select("id,source_code,record_kind,payload_hash,raw_payload,published_at,retrieved_at").eq("id",body.sourceRecordId).single();
 const source=sourceQ.data as Record<string,unknown>|null;
 if(sourceQ.error||!source||source.payload_hash!==body.sourcePayloadHash||!sourceEligible(source,body.supportingQuote))return reply(409,"SOURCE_BYTES_AND_M4_BINDING_NOT_QUALIFIED");
 // The issuer PDF hash alone is insufficient: regulatory applicability proof must already be
 // retained as a separate, hash-verified original and linked by this immutable source record.
 const raw=source.raw_payload as Record<string,unknown>;
 const regulator=raw.roa_regulatory_proof as Record<string,unknown>|undefined;
 const structured=kvbRoaOriginalQualified(source);
 if(!structured)return reply(409,"REGISTERED_ORIGINAL_MULTI_ANCHOR_PROOF_REQUIRED");
 const regulatorRecordId=str(regulator?.source_record_id);
 const regulatorQ=await db.from("data_source_records").select("id,source_code,record_kind,payload_hash,raw_payload,retrieved_at").eq("id",regulatorRecordId).single();
 const regulatorSource=regulatorQ.data;
 if(regulatorQ.error||!regulatorSource||regulatorSource.source_code!=="CONTROLLED_PUBLIC_WEB"
   ||regulatorSource.record_kind!=="V1_4_KVB_ROA_ORIGINAL_SOURCE_V1"
   ||str(regulatorSource.raw_payload?.original_sha256)!==KVB_ORIGINAL_PROOF.regulator.sha256
   ||str(regulatorSource.raw_payload?.original_url)!==KVB_ORIGINAL_PROOF.regulator.originalUrl
   ||str(regulatorSource.raw_payload?.roa)!==KVB_ORIGINAL_PROOF.regulator.roa
   ||str(regulatorSource.raw_payload?.denominator)!==KVB_ORIGINAL_PROOF.regulator.denominator)
   return reply(409,"REGULATOR_INDEPENDENT_ORIGINAL_RECORD_REQUIRED");
 if(await sha(raw)!==source.payload_hash||await sha(regulatorSource.raw_payload)!==regulatorSource.payload_hash)
   return reply(409,"ORIGINAL_SOURCE_PAYLOAD_INTEGRITY_INVALID");
 const now=pgReviewTimestamp(new Date().toISOString()),retrieved=str(source.retrieved_at),published=str(source.published_at)||null;
 const quote=str(body.supportingQuote),binding=kvbRoaBinding();
 // Append to the already established correction chain; preserve both old reviews.
 const prior=await db.from("research_evidence_requirement_reviews").select("id,decision,metadata,period_start,period_end,unit,consolidation_scope")
  .eq("id","84db59ab-5621-4137-86a7-8ca9af987be2").eq("portfolio_id",PORTFOLIO).eq("security_id",KVB).eq("requirement_code","ROA_ANNUAL").single();
 if(prior.error||prior.data?.decision!=="ACCEPTED"||prior.data?.metadata?.numeric_value!=="1.9300"
   ||prior.data.period_start!=="2025-04-01"||prior.data.period_end!=="2026-03-31"||prior.data.unit!=="PERCENT"||prior.data.consolidation_scope!=="STANDALONE")
   return reply(409,"ROA_SUPERSESSION_PREDECESSOR_CHANGED");
 const row={portfolio_id:PORTFOLIO,security_id:KVB,requirement_code:"ROA_ANNUAL",review_kind:"OWNER_NUMERIC_REVIEW",decision:"ACCEPTED",source_record_id:source.id,research_document_id:null,provider_document_id:null,source_payload_hash:source.payload_hash,supporting_quote:quote,period_start:"2025-04-01",period_end:"2026-03-31",period_type:"YEAR",unit:"PERCENT",currency:null,consolidation_scope:"STANDALONE",published_at:published,retrieved_at:retrieved,fresh_through:pgReviewTimestamp(new Date(Math.min(bankReportingDeadline("2026-03-31",550),Date.parse(str(raw.original_bytes_verified_at))+550*86400000)).toISOString()),review_version:"V1_4_REQUIREMENT_REVIEW_V2",reviewed_by:user.data.user.id,reviewed_at:now,supersedes_review_id:prior.data.id,metadata:{metric_code:"ROA_ANNUAL",numeric_value:"1.93",source_binding:binding,publication_precision:str(raw.publication_precision)||"UNKNOWN_DATE",regulator_source_record_id:regulatorRecordId,regulator_source_payload_hash:regulatorSource.payload_hash}};
 const review_hash=await sha(row);
 // Idempotency on immutable source and requirement; the existing append-only uniqueness
 // is checked before insert but concurrent duplicates still need an atomic constraint.
 const previous=await db.from("research_evidence_requirement_reviews").select("id").eq("security_id",KVB).eq("requirement_code","ROA_ANNUAL").eq("source_record_id",source.id).eq("decision","ACCEPTED").limit(1);
 if(previous.error)return reply(503,"REVIEW_DEDUP_CHECK_FAILED");
 if(previous.data?.length)return reply(409,"REVIEW_SOURCE_ALREADY_ACCEPTED");
 const inserted=await db.from("research_evidence_requirement_reviews").insert({...row,review_hash}).select("id,review_hash").single();
 if(inserted.error)return reply(409,"REVIEW_APPEND_REJECTED",{postgresCode:inserted.error.code});
 return reply(201,"NUMERIC_REVIEW_APPENDED_NOT_MATERIALIZED",{reviewId:inserted.data.id,reviewHash:inserted.data.review_hash});
}
const REVIEW_ORIGINS=new Set([
 "https://portfiolio-ai-git-codex-banking-source-re-9b3df9-dibyendu-dutta.vercel.app",
 "http://localhost:5173","http://127.0.0.1:5173",
])
Deno.serve(async req=>{
 const origin=req.headers.get("origin")
 if(origin&&!REVIEW_ORIGINS.has(origin))return reply(403,"DEVELOPMENT_REVIEW_ORIGIN_REQUIRED")
 const response=req.method==="OPTIONS"?new Response(null,{status:204}):await handle(req)
 if(origin){
  response.headers.set("Access-Control-Allow-Origin",origin)
  response.headers.set("Access-Control-Allow-Headers","authorization, x-client-info, apikey, content-type")
  response.headers.set("Access-Control-Allow-Methods","POST, OPTIONS")
  response.headers.set("Vary","Origin")
 }
 return response
})
