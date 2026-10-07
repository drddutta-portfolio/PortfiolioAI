import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
const DEV="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_CAPTURE_NSE_CORPORATE_ACTIONS_2026_10_07"
const SENTINEL="NSE_CORPORATE_ACTIONS:2026-10-07"
const URL="https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=07-10-2026&to_date=07-10-2026"
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const u=Deno.env.get("SUPABASE_URL")??"",k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 let ref:string|null=null;try{ref=new URL(u).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{}
 if(ref!==DEV||!k)return reply(409,{code:"UNAPPROVED_DEVELOPMENT_TARGET"})
 const body=await req.json().catch(()=>({})) as Record<string,unknown>
 const admin=createClient(u,k,{auth:{persistSession:false}})
 const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:SENTINEL})
 if(!grant.ok)return reply(401,{code:grant.code})
 const res=await fetch(URL,{headers:{"accept":"application/json,text/plain,*/*","user-agent":"Mozilla/5.0","referer":"https://www.nseindia.com/companies-listing/corporate-filings-actions"}})
 const text=await res.text()
 if(!res.ok)return reply(502,{code:"NSE_CORPORATE_ACTION_FETCH_FAILED",status:res.status})
 let parsed:unknown;try{parsed=JSON.parse(text)}catch{return reply(502,{code:"NSE_CORPORATE_ACTION_JSON_INVALID"})}
 if(!Array.isArray(parsed))return reply(502,{code:"NSE_CORPORATE_ACTION_SHAPE_INVALID"})
 const payload={version:"V1_4_NSE_CORPORATE_ACTIONS_CAPTURE_V1",date:"2026-10-07",body_text:text,row_count:parsed.length,http_status:res.status}
 const h=await digest(JSON.stringify(payload))
 const insert=await admin.from("data_source_records").insert({
  source_code:"CONTROLLED_PUBLIC_WEB",record_kind:"V1_4_CORPORATE_ACTIONS_2026_10_07",external_record_id:"NSE_CORPORATE_ACTIONS_2026_10_07",
  source_observed_at:"2026-10-07T23:59:59Z",retrieved_at:new Date().toISOString(),payload_hash:h,raw_payload:payload,source_url:URL,
  terms_snapshot:{environment:"PortfolioAI Dev",official_source:"NSE",fixed_date:true}
 }).select("id,payload_hash,retrieved_at").single()
 if(insert.error)return reply(409,{code:"CAPTURE_PERSIST_FAILED",detail:insert.error.code})
 return reply(200,{record:insert.data,rowCount:parsed.length})
})