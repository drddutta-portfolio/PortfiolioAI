import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {unzipSync} from "https://esm.sh/fflate@0.8.2"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import scope from "./scope.json" with {type:"json"}

const PROJECT="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_VALUATION_PRICE_BACKFILL_2021_2025"
const SOURCE="NSE_OFFICIAL"
const MONTH=/^20(21|22|23|24|25)-(0[1-9]|1[0-2])$/
const FIRST="2021-10",LAST="2025-07",MAX_MONTHS=6
const ALLOWED_KINDS=new Set(["NSE_CM_BHAVCOPY_LEGACY","NSE_CM_BHAVCOPY_UDIFF"])
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const hex=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
const payloadHash=async(v:unknown)=>hex(new TextEncoder().encode(JSON.stringify(v)))
const ord=(m:string)=>{const [y,mo]=m.split("-").map(Number);return y*12+mo}
const months=(a:string,b:string)=>{const out:string[]=[];for(let x=ord(a);x<=ord(b);x++){const y=Math.floor((x-1)/12),m=(x-1)%12+1;out.push(`${y}-${String(m).padStart(2,"0")}`)}return out}
const monthEnd=(month:string)=>{const [y,m]=month.split("-").map(Number);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)}
const monthStart=(month:string)=>month+"-01"
const cleanHeader=(v:string)=>v.replace(/^\uFEFF/,"").trim().replace(/[^A-Za-z0-9]/g,"").toUpperCase()
const pick=(header:string[],...names:string[])=>names.map(cleanHeader).map(n=>header.indexOf(n)).find(i=>i>=0)??-1
export function parseBhavcopyCsv(text:string){
 const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);if(!lines.length)return[]
 const rawHeader=lines[0]!.split(","),header=rawHeader.map(cleanHeader)
 const symbol=pick(header,"SYMBOL","TckrSymb"),series=pick(header,"SERIES","SctySrs"),
  close=pick(header,"CLOSE","ClsPric"),isin=pick(header,"ISIN"),timestamp=pick(header,"TIMESTAMP","TradDt")
 if([symbol,series,close,isin].some(i=>i<0))throw new Error("NSE_BHAVCOPY_SCHEMA_UNEXPECTED")
 return lines.slice(1).map(line=>{const c=line.split(",");return{
  symbol:c[symbol]?.trim()??"",series:c[series]?.trim()??"",close:c[close]?.trim()??"",
  isin:c[isin]?.trim()??"",timestamp:timestamp>=0?c[timestamp]?.trim()??"":""
 }})
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
   trigger_source:"OWNER",status:"RUNNING",requested_count:requested.length,estimated_call_count:requested.length,
   reserved_call_count:0,attempted_call_count:0,metadata:{grant_id:body.grantId,from_month:fromMonth,to_month:toMonth,
    source_authority:"P8_B3_VERIFIED_NSE_ARCHIVE_CATALOG",join_basis:"EXACT_ISIN",canonical_promotion:false}
  }).select("id").single()
  if(run.error)throw new Error("BANK_PRICE_BACKFILL_RUN_CREATE_FAILED")
  const runId=String(run.data.id),captures:Record<string,unknown>[]=[];let attempts=0,failed=0
  for(const month of requested){
   const archives=await admin.from("p8_b3_source_archives")
    .select("id,source_kind,source_period_start,source_period_end,source_url,content_sha256,compressed_sha256,archive_hash,source_contract_version")
    .in("source_kind",[...ALLOWED_KINDS]).gte("source_period_start",monthStart(month)).lte("source_period_start",monthEnd(month))
    .order("source_period_start",{ascending:false}).order("id",{ascending:false}).limit(10)
   if(archives.error)throw new Error("BANK_PRICE_ARCHIVE_CATALOG_READ_FAILED")
   const rows=(archives.data??[]) as Array<Record<string,unknown>>
   if(!rows.length){failed++;captures.push({month,status:"MISSING_VERIFIED_ARCHIVE_CATALOG"});continue}
   const latestDate=String(rows[0]!.source_period_start),latest=rows.filter(x=>String(x.source_period_start)===latestDate)
   const identities=new Set(latest.map(x=>String(x.archive_hash)))
   if(identities.size!==1){failed++;captures.push({month,status:"ARCHIVE_CATALOG_CONFLICT",tradeDate:latestDate,archiveIds:latest.map(x=>x.id)});continue}
   const archive=latest[0]!,kind=String(archive.source_kind),sourceUrl=String(archive.source_url)
   if(!ALLOWED_KINDS.has(kind)||!sourceUrl.startsWith("https://nsearchives.nseindia.com/")){
    failed++;captures.push({month,status:"ARCHIVE_CATALOG_AUTHORITY_INVALID"});continue
   }
   attempts++
   const response=await fetch(sourceUrl,{headers:{"user-agent":"PortfolioAI-V14-BANK-VALUATION/2.0","accept":"application/zip,*/*"}})
   if(!response.ok){failed++;captures.push({month,status:"OFFICIAL_ARCHIVE_HTTP_"+response.status,tradeDate:latestDate});continue}
   const bytes=new Uint8Array(await response.arrayBuffer()),zipSha=await hex(bytes)
   if(String(archive.compressed_sha256||"")&&zipSha!==String(archive.compressed_sha256)){
    failed++;captures.push({month,status:"COMPRESSED_HASH_MISMATCH",tradeDate:latestDate,archiveId:archive.id});continue
   }
   const files=unzipSync(bytes),name=Object.keys(files).find(x=>x.toLowerCase().endsWith(".csv"))
   if(!name){failed++;captures.push({month,status:"NSE_BHAVCOPY_CSV_MISSING",tradeDate:latestDate});continue}
   const csv=files[name]!,contentSha=await hex(csv)
   if(contentSha!==String(archive.content_sha256)){
    failed++;captures.push({month,status:"CONTENT_HASH_MISMATCH",tradeDate:latestDate,archiveId:archive.id});continue
   }
   const parsed=parseBhavcopyCsv(new TextDecoder().decode(csv)),byIsin=new Map(parsed.filter(r=>r.series==="EQ").map(r=>[r.isin,r]))
   const selected=scope.map(target=>{const r=byIsin.get(target.isin);return r?{
    security_id:target.securityId,symbol:target.symbol,isin:target.isin,raw_symbol:r.symbol,series:r.series,close:r.close,timestamp:r.timestamp
   }:null}).filter(Boolean)
   if(selected.length!==scope.length){
    const missing=scope.filter(target=>!byIsin.has(target.isin)).map(target=>({
     symbol:target.symbol,expectedIsin:target.isin,
     observed:parsed.filter(r=>r.series==="EQ"&&r.symbol===target.symbol).map(r=>({symbol:r.symbol,isin:r.isin,close:r.close,timestamp:r.timestamp})),
    }))
    failed++;captures.push({month,status:"IDENTITY_ROWS_INCOMPLETE",found:selected.length,tradeDate:latestDate,archiveId:archive.id,missing});continue
   }
   const payload={version:"V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE_V2",month,trade_date:latestDate,
    source_archive_id:String(archive.id),source_kind:kind,source_contract_version:String(archive.source_contract_version),
    source_url:sourceUrl,archive_sha256:zipSha,content_sha256:contentSha,archive_catalog_hash:String(archive.archive_hash),
    archive_bytes:bytes.length,join_basis:"EXACT_ISIN",rows:selected,
    valuation_use:"RAW_CONTEMPORANEOUS_CLOSE_PENDING_SPLIT_BONUS_SHARE_BASIS_RECONCILIATION",canonical_promotion:false}
   const pHash=await payloadHash(payload),external=`${month}:${String(archive.archive_hash)}:V2`
   const existing=await admin.from("data_source_records").select("id,payload_hash").eq("source_code",SOURCE)
    .eq("record_kind","V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE").eq("external_record_id",external).maybeSingle()
   if(existing.error)throw new Error("BANK_PRICE_BACKFILL_IDEMPOTENCY_READ_FAILED")
   if(existing.data){
    if(existing.data.payload_hash!==pHash)throw new Error("BANK_PRICE_BACKFILL_IDEMPOTENCY_CONFLICT")
    captures.push({month,status:"ALREADY_CAPTURED",tradeDate:latestDate,sourceRecordId:existing.data.id,payloadHash:pHash,rows:selected.length});continue
   }
   const ins=await admin.from("data_source_records").insert({
    source_code:SOURCE,record_kind:"V1_4_BANK_VALUATION_MONTH_END_PRICE_CAPTURE",external_record_id:external,
    retrieved_at:new Date().toISOString(),payload_hash:pHash,raw_payload:payload,source_url:sourceUrl,
    terms_snapshot:{operation:ACTION,ingestion_run_id:runId,source_contract:String(archive.source_contract_version),
     source_archive_id:String(archive.id),canonical_promotion:false}
   }).select("id,payload_hash").single()
   if(ins.error)throw new Error("BANK_PRICE_BACKFILL_CAPTURE_WRITE_FAILED")
   captures.push({month,status:"CAPTURED",tradeDate:latestDate,sourceRecordId:ins.data.id,payloadHash:ins.data.payload_hash,
    archiveId:archive.id,sourceKind:kind,archiveSha256:zipSha,rows:selected.length})
  }
  const accepted=captures.filter(x=>x.status==="CAPTURED"||x.status==="ALREADY_CAPTURED").length
  await admin.from("data_ingestion_runs").update({
   status:failed?"PARTIAL":"SUCCEEDED",completed_at:new Date().toISOString(),attempted_call_count:attempts,
   fetched_count:accepted,accepted_count:accepted,failed_count:failed,error_summary:failed?"ONE_OR_MORE_MONTHS_NOT_CAPTURED":null,
   metadata:{grant_id:body.grantId,from_month:fromMonth,to_month:toMonth,attempts,captures,
    source_authority:"P8_B3_VERIFIED_NSE_ARCHIVE_CATALOG",join_basis:"EXACT_ISIN",canonical_promotion:false}
  }).eq("id",runId)
  return reply(200,{state:failed?"PARTIAL":"PASS",runId,attempts,failed,captures,canonicalPromotion:false})
 }catch(e){return reply(500,{code:e instanceof Error?e.message:"BANK_PRICE_BACKFILL_FAILED"})}
})