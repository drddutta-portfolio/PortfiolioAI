// BANK V1-4: owner-authenticated, append-only KVB ROA numeric review.
// Does not mint grants, alter canonical snapshots, or weaken M4.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0";
const PROJECT="lrgpjimipfkyoqbpsqzz",PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2",KVB="be55b3cc-0400-45af-84aa-2a95e2c361c5";
const HASH=/^[0-9a-f]{64}$/;
const reply=(status:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const str=(v:unknown)=>typeof v==="string"?v:"";
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null";
const sha=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(stable(v))))).map(x=>x.toString(16).padStart(2,"0")).join("");
export function sourceEligible(source:Record<string,unknown>,fragment:string){
 const raw=source.raw_payload as Record<string,unknown>|null;
 if(!raw||!["COMPANY_EXCHANGE_FILING","NSE_OFFICIAL"].includes(str(source.source_code)))return false;
 const original=str(raw.original_sha256),url=str(raw.original_url);
 const inSource=Object.values(raw).some(x=>typeof x==="string"&&x.includes(fragment));
 if(!HASH.test(original)||!/^https:\/\/(www\.)?(kvb\.bank\.in|nsearchives\.nseindia\.com)\//.test(url)||!inSource)return false;
 return /return on assets/i.test(fragment)&&/1\.93(?:00)?\s*%?/.test(fragment)&&/average (?:total )?assets/i.test(fragment)&&/financial year|full.year|audited/i.test(fragment)
   &&/01-04-2025|2025-04-01/.test(fragment)&&/31-03-2026|2026-03-31/.test(fragment);
}
Deno.serve(async req=>{
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
 if(!regulator||!HASH.test(str(regulator.original_sha256))||!/^https:\/\/.*rbi\.org\.in\//.test(str(regulator.official_url))
   ||str(regulator.applicability_status)!=="VERIFIED_FOR_FY2025_26_STANDALONE"
   ||!str(regulator.exact_passage).toLowerCase().includes("average working funds"))
   return reply(409,"RBI_ORIGINAL_APPLICABILITY_NOT_PROVEN");
 const now=new Date().toISOString(),retrieved=str(source.retrieved_at),published=str(source.published_at)||null;
 const quote=str(body.supportingQuote);
 const binding={kind:"TEXT_CELL",fragment:quote,metric_label:"Return on Assets",period_label:"FY2025-26",exact_value:"1.93",entity_id:"KARURVYSYA",period_start:"2025-04-01",period_end:"2026-03-31",period_type:"YEAR",period_start_anchor:"01-04-2025",period_end_anchor:"31-03-2026",scale:"1",conversion:"IDENTITY"};
 // Validator requires literal anchors; do not auto-invent source text.
 if(![binding.metric_label,binding.period_label,binding.entity_id,binding.period_start_anchor,binding.period_end_anchor].every(x=>quote.includes(x)))return reply(409,"SOURCE_LITERAL_ANCHORS_MISSING");
 const authorization={policy_id:"V1_4_BANK_VERIFIED_ISSUER_ORIGINAL_DELEGATION_V1",authorizing_owner_id:user.data.user.id,executor:"CHATGPT",authorization:"OWNER_APPROVED_ISSUER_HOSTED_ORIGINALS_2026_10_10",recorded_at:"2026-10-09T19:21:00Z"};
 const row={portfolio_id:PORTFOLIO,security_id:KVB,requirement_code:"ROA_ANNUAL",review_kind:"DELEGATED_NUMERIC_REVIEW",decision:"ACCEPTED",source_record_id:source.id,research_document_id:null,provider_document_id:null,source_payload_hash:source.payload_hash,supporting_quote:quote,period_start:"2025-04-01",period_end:"2026-03-31",period_type:"YEAR",unit:"PERCENT",currency:null,consolidation_scope:"STANDALONE",published_at:published,retrieved_at:retrieved,fresh_through:new Date(Date.now()+150*86400000).toISOString(),review_version:"V1_4_REQUIREMENT_REVIEW_V2",reviewed_by:null,reviewed_at:now,supersedes_review_id:null,metadata:{metric_code:"ROA_ANNUAL",numeric_value:"1.93",source_binding:binding,review_authorization:authorization,publication_precision:str(raw.publication_precision)||"UNKNOWN_DATE"}};
 const review_hash=await sha(row);
 // Idempotency on immutable source and requirement; the existing append-only uniqueness
 // is checked before insert but concurrent duplicates still need an atomic constraint.
 const previous=await db.from("research_evidence_requirement_reviews").select("id").eq("security_id",KVB).eq("requirement_code","ROA_ANNUAL").eq("source_record_id",source.id).eq("decision","ACCEPTED").limit(1);
 if(previous.error)return reply(503,"REVIEW_DEDUP_CHECK_FAILED");
 if(previous.data?.length)return reply(409,"REVIEW_SOURCE_ALREADY_ACCEPTED");
 const inserted=await db.from("research_evidence_requirement_reviews").insert({...row,review_hash}).select("id,review_hash").single();
 if(inserted.error)return reply(409,"REVIEW_APPEND_REJECTED",{postgresCode:inserted.error.code});
 return reply(201,"NUMERIC_REVIEW_APPENDED_NOT_MATERIALIZED",{reviewId:inserted.data.id,reviewHash:inserted.data.review_hash});
});
