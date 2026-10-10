import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {unzipSync} from "https://esm.sh/fflate@0.8.2"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import scope from "./scope.json" with {type:"json"}

const PROJECT="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_VALUATION_PRICE_BACKFILL_2021_2023"
const SOURCE="NSE_OFFICIAL"
const MONTH=/^20(21|22|23)-(0[1-9]|1[0-2])$/
const FIRST="2021-10",LAST="2023-09",MAX_MONTHS=6
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const hex=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
const payloadHash=async(v:unknown)=>hex(new TextEncoder().encode(JSON.stringify(v)))
const ord=(m:string)=>{const [y,mo]=m.split("-").map(Number);return y*12+mo}
const months=(a:string,b:string)=>{const out:string[]=[];for(let x=ord(a);x<=ord(b);x++){const y=Math.floor((x-1)/12),m=(x-1)%12+1;out.push(`${y}-${String(m).padStart(2,"0")}`)}return out}
const mon=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
function candidates(month:string){
 const [y,m]=month.split("-").map(Number),last=new Date(Date.UTC(y,m,0)),out:Date[]=[]
 for(let i=0;i<10&&out.length<6;i++){const d=new Date(last.getTime()-i*86400000),wd=d.getUTCDay();if(wd!==0&&wd!==6)out.push(d)}
 return out
}
function archiveUrl(d:Date){
 const y=d.getUTCFullYear(),M=mon[d.getUTCMonth()]!,dd=String(d.getUTCDate()).padStart(2,"0")
 return `https://nsearchives.nseindia.com/content/historical/EQUITIES/${y}/${M}/cm${dd}${M}${y}bhav.csv.zip`
}
function csvRows(text:string){
 const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);if(!lines.length)return[]
 const header=lines[0]!.split(",").map(x=>x.trim().toUpperCase())
 const idx=(...names:string[])=>names.map(n=>header.indexOf(n)).find(i=>i>=0)??-1
 const symbol=idx("SYMBOL"),series=idx("SERIES"),close=idx("CLOSE"),isin=idx("ISIN"),timestamp=idx("TIMESTAMP")
 if([symbol,series,close,isin].some(i=>i<0))throw new Error("NSE_BHAVCOPY_SCHEMA_UNEXPECTED")
 return lines.slice(1).map(line=>{const c=line.split(",");return{symbol:c[symbol]?.trim()??"",series:c[series]?.trim()??"",close:c[close]?.trim()??"",isin:c[isin]?.trim()??"",timestamp:timestamp>=0?c[timestamp]?.trim()??"":""}})
}
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED"})
 try{
  const body=await req.json() as Record<string,unknown>,fromMonth=String(body.fromMonth??""),toMonth=String(body.toMonth??"")
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO||!MONTH.test(fromMonth)||!MONTH.test(toMonth)||
    fromMonth<FIRST||toMonth>LAST||fromMonth>toMonth)return reply(400,{code:"BANK_PRICE_BACKFILL_SCOPE_INVALID"})
  const requested=months(fromMonth,toMonth);if(requested.length>MAX_MONTHS)return reply(400,{code:"BANK_PRICE_BACKFILL_TOO_MANY_MONTHS"})
  const sentinel=`BANKING_13_VALUATION_PRICES:${fromMonth}:${toMonth}`,admin=createClient(url,key,{auth:{persistSession:false}})
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:sentinel})
  if(!grant.ok)return reply(401,{code:grant.code})
  const run=await admin.from("data_ingestion_runs").insert({
   source_code:SOURCE,portfolio_id:PORTFOLIO,operation:ACTION,orchestration_type:"V1_4_BANK_VALUATION_PRICE_BACKFILL",
   trigger_source:"OWNER",status:"RUNNING",requested_count:requested.length,estimated_call_count:requested.length*3,
   reserved_call_count:0,attempted_call_count:0,metadata:{grant_id:body.grantId,from_month:fromMonth,to_month:toMonth,
    source_authority:"NSE_CM_BHAVCOPY_LEGACY",join_basis:"EXACT_ISIN",canonical_promotion:false}
  }).select("id").single()
  if(run.error)throw new Error("BANK_PRICE_BACKFILL_RUN_CREATE_FAILED")
  const runId=String(run.data.id),captures:Record<string,unknown>[]=[];let attempts=0,failed=0
  for(const month of requested){
   let found:{date:Date;url:string;bytes:Uint8Array;rows:ReturnType<typeof csvRows>}|null=null
   for(const date of candidates(month)){
    const sourceUrl=archiveUrl(date);attempts++
    try{
     const response=await fetch(sourceUrl,{headers:{"user-agent":"PortfolioAI-V14-BANK-VALUATION/1.0","accept":"application/zip,*/*"}})
     if(response.status===404)continue
     if(!response.ok)throw new Error("NSE_BHAVCOPY_HTTP_"+response.status)
     const bytes=new Uint8Array(await response.arrayBuffer()),files=unzipSync(bytes),name=Object.keys(files).find(x=>x.toLowerCase().endsWith(".csv"))
     if(!name)throw new Error("NSE_BHAVCOPY_CSV_MISSING")
     const rows=csvRows(new TextDecoder().decode(files[name]!));found={date,url:sourceUrl,bytes,rows};break
    }catch(e){if(e instanceof Error&&e.message.startsWith("NSE_BHAVCOPY_HTTP_"))throw e}
   }
   if(!found){failed++;captures.push({month,status:"MISSING_OFFICIAL_SESSION_ARCHIVE"});continue}
   const byIsin=new Map(found.rows.filter(r=>r.series==="EQ").map(r=>[r.isin,r]))
   const selected=scope.map(target=>{const r=byIsin.get(target.isin);return r?{
    security_id:target.securityId,symbol:target.symbol,isin:target.isin,raw_symbol:r.symbol,series:r.series,close:r.close,timestamp:r.timestamp
   }:null}).filter(Boolean)
   if(selected.length!==scope.length){failed++;captures.push({month,status:"IDENTITY_ROWS_INCOMPLETE",found:selected.length,tradeDate:found.date.toISOString().slice(0,10)});continue}
   const zipSha=await hex(found.bytes),tradeDate=found.date.toISOString().slice(0,10)
   const payload={version:"V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE_V1",month,trade_date:tradeDate,
    source_url:found.url,archive_sha256:zipSha,archive_bytes:found.bytes.length,join_basis:"EXACT_ISIN",rows:selected,
    valuation_use:"RAW_CONTEMPORANEOUS_CLOSE_PENDING_SPLIT_BONUS_SHARE_BASIS_RECONCILIATION",canonical_promotion:false}
   const ins=await admin.from("data_source_records").insert({
    source_code:SOURCE,record_kind:"V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE",
    external_record_id:`${month}:${zipSha}`,retrieved_at:new Date().toISOString(),payload_hash:await payloadHash(payload),
    raw_payload:payload,source_url:found.url,terms_snapshot:{operation:ACTION,ingestion_run_id:runId,source_contract:"NSE_CM_BHAVCOPY_LEGACY",canonical_promotion:false}
   }).select("id,payload_hash").single()
   if(ins.error)throw new Error("BANK_PRICE_BACKFILL_CAPTURE_WRITE_FAILED")
   captures.push({month,status:"CAPTURED",tradeDate,sourceRecordId:ins.data.id,payloadHash:ins.data.payload_hash,archiveSha256:zipSha,rows:selected.length})
  }
  await admin.from("data_ingestion_runs").update({
   status:failed?"PARTIAL":"SUCCEEDED",completed_at:new Date().toISOString(),attempted_call_count:attempts,
   fetched_count:captures.filter(x=>x.status==="CAPTURED").length,accepted_count:captures.filter(x=>x.status==="CAPTURED").length,
   failed_count:failed,error_summary:failed?"ONE_OR_MORE_MONTHS_NOT_CAPTURED":null,
   metadata:{grant_id:body.grantId,from_month:fromMonth,to_month:toMonth,attempts,captures,source_authority:"NSE_CM_BHAVCOPY_LEGACY",
    join_basis:"EXACT_ISIN",canonical_promotion:false}
  }).eq("id",runId)
  return reply(200,{state:failed?"PARTIAL":"PASS",runId,attempts,failed,captures,canonicalPromotion:false})
 }catch(e){return reply(500,{code:e instanceof Error?e.message:"BANK_PRICE_BACKFILL_FAILED"})}
})