import {validKvbGrantRequest,ownerMatches} from "./request-guard.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0";
const PROJECT="lrgpjimipfkyoqbpsqzz",PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2",KVB="be55b3cc-0400-45af-84aa-2a95e2c361c5";
const ACTION="P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS",SCOPE="SECURITY_IDS:"+KVB;
const respond=(s:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});

async function handle(req:Request){
 if(req.method!=="POST")return respond(405,"METHOD_NOT_ALLOWED");
 const url=Deno.env.get("SUPABASE_URL")??"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
 if(url!==`https://${PROJECT}.supabase.co`||!secret)return respond(409,"DEV_TARGET_REQUIRED");
 const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"").trim();
 if(!token)return respond(401,"OWNER_AUTH_REQUIRED");
 const db=createClient(url,secret,{auth:{persistSession:false}});
 const user=await db.auth.getUser(token);
 if(user.error||!user.data.user||user.data.user.is_anonymous)return respond(401,"OWNER_AUTH_INVALID");
 const own=await db.from("portfolios").select("user_id").eq("id",PORTFOLIO).single();
 if(own.error||!ownerMatches(user.data.user.id,own.data?.user_id,user.data.user.is_anonymous))return respond(403,"OWNER_ONLY");
 const b=await req.json().catch(()=>null);
 if(!b||typeof b!=="object"||Array.isArray(b)||!validKvbGrantRequest(b))return respond(400,"EXACT_SCOPE_REQUIRED");
 const open=await db.from("current_holdings").select("security_id").eq("portfolio_id",PORTFOLIO).eq("security_id",KVB).gt("current_quantity",0).maybeSingle();
 if(open.error||!open.data)return respond(409,"FROZEN_OPEN_HOLDING_NOT_VERIFIED");
 const external="V14_KVB_OWNER_MATERIALIZER:"+b.requestId;
 const existing=await db.from("data_source_records").select("id").eq("source_code","OWNER_REVIEWED_CLASSIFICATION").eq("record_kind","P4_EXECUTION_GRANT").eq("external_record_id",external).maybeSingle();
 if(existing.error)return respond(503,"GRANT_IDEMPOTENCY_CHECK_FAILED");
 if(existing.data)return respond(409,"GRANT_ISSUANCE_REPLAY_REJECTED");
 const now=new Date(),payload={action:ACTION,expires_at:new Date(now.getTime()+15*60000).toISOString(),environment:"PortfolioAI Dev",project_ref:PROJECT,security_id:SCOPE,portfolio_id:PORTFOLIO,authorization:"OWNER_APPROVED_BANK_V14_INCREMENTAL_PASSING_BANK_MATERIALIZATION",issuer_user_id:user.data.user.id,request_id:b.requestId};
 const encoded=new TextEncoder().encode(JSON.stringify(payload));
 const h=await crypto.subtle.digest("SHA-256",encoded);const hash=Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,"0")).join("");
 const inserted=await db.from("data_source_records").insert({source_code:"OWNER_REVIEWED_CLASSIFICATION",record_kind:"P4_EXECUTION_GRANT",external_record_id:external,retrieved_at:now.toISOString(),payload_hash:hash,raw_payload:payload,terms_snapshot:{issuer:"OWNER_AUTHENTICATED_BANK_KVB_V14",authenticated_owner:user.data.user.id,materialization_only:true,expires_in_seconds:900}}).select("id").single();
 if(inserted.error)return respond(409,"GRANT_INSERT_REJECTED",{postgresCode:inserted.error.code});
 return respond(200,"GRANT_ISSUED_SINGLE_USE",{grantId:inserted.data.id,action:ACTION,scope:SCOPE,expiresAt:payload.expires_at});
}
const REVIEW_ORIGINS=new Set(["https://portfiolio-ai-git-codex-banking-source-re-9b3df9-dibyendu-dutta.vercel.app","http://localhost:5173","http://127.0.0.1:5173"])
Deno.serve(async req=>{
 const origin=req.headers.get("origin")
 if(origin&&!REVIEW_ORIGINS.has(origin))return respond(403,"DEVELOPMENT_REVIEW_ORIGIN_REQUIRED")
 const response=req.method==="OPTIONS"?new Response(null,{status:204}):await handle(req)
 if(origin){
  response.headers.set("Access-Control-Allow-Origin",origin)
  response.headers.set("Access-Control-Allow-Headers","authorization, x-client-info, apikey, content-type")
  response.headers.set("Access-Control-Allow-Methods","POST, OPTIONS")
  response.headers.set("Vary","Origin")
 }
 return response
})
