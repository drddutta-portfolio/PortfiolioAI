import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"

const DEV="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_OFFICIAL_BENCHMARK_OCT7_REFRESH"
const SENTINEL="V1_4_OFFICIAL_BENCHMARKS_OCT7"
const ENDPOINT="https://www.niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString"
const NSE_ENDPOINT="https://www.nseindia.com/api/historicalOR/indicesHistory"
const ITEMS=[
 ["NIFTY_CAPITAL_GOODS","NIFTY CAPITAL GOODS"],
 ["NIFTY_CHEMICALS","NIFTY CHEMICALS"],
 ["NIFTY_CONSUMER_DURABLES","NIFTY CONSUMER DURABLES"],
 ["NIFTY_CONSUMER_SERVICES","NIFTY CONSUMER SERVICES"],
 ["NIFTY_FINANCIAL_SERVICES_EX_BANK","NIFTY FINANCIAL SERVICES EX-BANK"],
 ["NIFTY_OIL_GAS","NIFTY OIL & GAS"],
 ["NIFTY_SERVICES_SECTOR","NIFTY SERVICES SECTOR"],
 ["NIFTY_TRANSPORTATION_LOGISTICS","NIFTY TRANSPORTATION & LOGISTICS"],
] as const
const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const norm=(v:unknown)=>String(v??"").trim().toUpperCase().replace(/&/g," AND ").replace(/[^A-Z0-9]+/g," ").trim().replace(/\s+/g," ")
const hex=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
function parse(body:string,identity:string){
 let raw:unknown=JSON.parse(body)
 if(raw&&typeof raw==="object"&&!Array.isArray(raw)&&"d" in raw){const d=(raw as Record<string,unknown>).d;raw=typeof d==="string"?JSON.parse(d):d}
 if(!Array.isArray(raw))throw new Error("NOT_ARRAY")
 const seen=new Set<string>();let min:string|null=null,max:string|null=null
 for(const u of raw){
  if(!u||typeof u!=="object"||Array.isArray(u))throw new Error("ROW_INVALID")
  const row=u as Record<string,unknown>
  if(norm(row["Index Name"]??row.INDEX_NAME)!==norm(identity))throw new Error("IDENTITY_MISMATCH")
  const date=String(row.Date??row.HistoricalDate??""),m=/^(\d{2})[- ]([A-Za-z]{3})[- ](\d{4})$/.exec(date)
  if(!m)throw new Error("DATE_INVALID")
  const mi=months.findIndex(x=>x.toLowerCase()===m[2]!.toLowerCase());if(mi<0)throw new Error("MONTH_INVALID")
  const day=`${m[3]}-${String(mi+1).padStart(2,"0")}-${m[1]}`,ms=Date.parse(day+"T00:00:00Z")
  if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==day||day<"2025-08-25"||day>"2026-10-07")throw new Error("DATE_WINDOW")
  if(seen.has(day))throw new Error("DUPLICATE")
  seen.add(day);min=min===null||day<min?day:min;max=max===null||day>max?day:max
  const close=row.CLOSE
  if(typeof close!=="string"||!/^\d+(?:\.\d+)?$/.test(close)||!/[1-9]/.test(close))throw new Error("CLOSE_INVALID")
 }
 if(seen.size<252||seen.size>400)throw new Error("SESSION_COUNT_"+seen.size)
 if(max!=="2026-10-07")throw new Error("LATEST_SESSION_"+max)
 return{sessions:seen.size,firstSession:min,lastSession:max}
}
function parseNse(body:string,identity:string){
 const root=JSON.parse(body) as Record<string,unknown>
 const data=Array.isArray(root.data)?root.data:
   (root.data&&typeof root.data==="object"&&!Array.isArray(root.data)&&Array.isArray((root.data as Record<string,unknown>).indexCloseOnlineRecords))
     ?(root.data as Record<string,unknown>).indexCloseOnlineRecords as unknown[]:[]
 if(!Array.isArray(data)||!data.length)throw new Error("NSE_NOT_ARRAY")
 const seen=new Set<string>();let min:string|null=null,max:string|null=null
 for(const u of data){
  if(!u||typeof u!=="object"||Array.isArray(u))throw new Error("NSE_ROW_INVALID")
  const row=u as Record<string,unknown>
  const got=String(row.EOD_INDEX_NAME??row.INDEX_NAME??row.indexName??"")
  if(norm(got)!==norm(identity))throw new Error("NSE_IDENTITY_MISMATCH:"+got)
  const rawDate=String(row.EOD_TIMESTAMP??row.HistoricalDate??row.Date??"")
  const m=/^(\d{2})[- ]([A-Za-z]{3})[- ](\d{4})$/.exec(rawDate)
  const m2=/^(\d{2})-(\d{2})-(\d{4})$/.exec(rawDate)
  let day=""
  if(m){const mi=months.findIndex(x=>x.toLowerCase()===m[2]!.toLowerCase());if(mi<0)throw new Error("NSE_MONTH_INVALID");day=`${m[3]}-${String(mi+1).padStart(2,"0")}-${m[1]}`}
  else if(m2)day=`${m2[3]}-${m2[2]}-${m2[1]}`
  else throw new Error("NSE_DATE_INVALID:"+rawDate)
  const ms=Date.parse(day+"T00:00:00Z")
  if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==day||day<"2025-08-25"||day>"2026-10-07")throw new Error("NSE_DATE_WINDOW")
  if(seen.has(day))throw new Error("NSE_DUPLICATE")
  seen.add(day);min=min===null||day<min?day:min;max=max===null||day>max?day:max
  const close=String(row.EOD_CLOSE_INDEX_VAL??row.CLOSE??"")
  if(!/^\d+(?:\.\d+)?$/.test(close)||!/[1-9]/.test(close))throw new Error("NSE_CLOSE_INVALID")
 }
 if(seen.size<252||seen.size>400)throw new Error("NSE_SESSION_COUNT_"+seen.size)
 if(max!=="2026-10-07")throw new Error("NSE_LATEST_SESSION_"+max)
 return{sessions:seen.size,firstSession:min,lastSession:max}
}

Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url="https://"+DEV+".supabase.co",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(!key)return reply(409,{code:"UNAPPROVED_DEVELOPMENT_TARGET"})
 const body=await req.json().catch(()=>({})) as Record<string,unknown>
 const requested=Array.isArray(body.codes)?body.codes.filter((x):x is string=>typeof x==="string"):null
 const items=requested&&requested.length?ITEMS.filter(([code])=>requested.includes(code)):ITEMS
 if(requested&&requested.length&&items.length!==new Set(requested).size)return reply(400,{code:"BENCHMARK_SUBSET_INVALID"})
 const admin=createClient(url,key,{auth:{persistSession:false}})
 const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:SENTINEL})
 if(!grant.ok)return reply(401,{code:grant.code})
 const warm=await fetch("https://www.niftyindices.com/reports/historical-data",{headers:{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36","accept":"text/html,application/xhtml+xml","accept-language":"en-US,en;q=0.9"},redirect:"follow",signal:AbortSignal.timeout(30000)})
 const setCookies=(warm.headers as Headers & {getSetCookie?:()=>string[]}).getSetCookie?.()??[]
 const cookie=setCookies.map(v=>v.split(";")[0]).filter(Boolean).join("; ")
 const nseWarm=await fetch("https://www.nseindia.com/reports-indices-historical-index-data",{headers:{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36","accept":"text/html,application/xhtml+xml","accept-language":"en-US,en;q=0.9"},redirect:"follow",signal:AbortSignal.timeout(30000)})
 const nseSetCookies=(nseWarm.headers as Headers & {getSetCookie?:()=>string[]}).getSetCookie?.()??[]
 const nseCookie=nseSetCookies.map(v=>v.split(";")[0]).filter(Boolean).join("; ")
 const out=[]
 for(const [code,name] of items){
  const attemptedAt=new Date().toISOString()
  try{
   const cinfo=JSON.stringify({name,startDate:"25-Aug-2025",endDate:"07-Oct-2026",indexName:name})
   const r=await fetch(ENDPOINT,{method:"POST",headers:{
    "content-type":"application/json; charset=UTF-8",
    "accept":"application/json, text/javascript, */*; q=0.01",
    "accept-language":"en-US,en;q=0.9",
    "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
    "origin":"https://www.niftyindices.com",
    "referer":"https://www.niftyindices.com/reports/historical-data",
    "x-requested-with":"XMLHttpRequest",
    ...(cookie?{"cookie":cookie}:{})
   },body:JSON.stringify({cinfo}),signal:AbortSignal.timeout(30000)})
   const text=await r.text(),bytes=new TextEncoder().encode(text)
   if(!r.ok)throw new Error("HTTP_"+r.status)
   const parsed=parse(text,name),sha256=await hex(bytes)
   out.push({code,name,state:"SUCCEEDED",attemptedAt,completedAt:new Date().toISOString(),httpStatus:r.status,byteLength:bytes.length,sha256,...parsed,returnBasis:"PRICE_RETURN_RAW_CLOSE",sourceUrl:ENDPOINT,body:text})
  }catch(niftyError){
   let nseText=""
   try{
    const q=new URLSearchParams({indexType:name,from:"25-08-2025",to:"07-10-2026"})
    const r=await fetch(NSE_ENDPOINT+"?"+q.toString(),{method:"GET",headers:{
      "accept":"application/json,text/plain,*/*",
      "accept-language":"en-US,en;q=0.9",
      "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
      "referer":"https://www.nseindia.com/reports-indices-historical-index-data",
      ...(nseCookie?{"cookie":nseCookie}:{})
    },signal:AbortSignal.timeout(30000)})
    nseText=await r.text();const bytes=new TextEncoder().encode(nseText)
    if(!r.ok)throw new Error("NSE_HTTP_"+r.status)
    const parsed=parseNse(nseText,name),sha256=await hex(bytes)
    out.push({code,name,state:"SUCCEEDED",attemptedAt,completedAt:new Date().toISOString(),httpStatus:r.status,byteLength:bytes.length,sha256,...parsed,returnBasis:"PRICE_RETURN_RAW_CLOSE",sourceUrl:NSE_ENDPOINT,transport:"NSE_HISTORICAL_OR",body:nseText,niftyFallbackError:niftyError instanceof Error?niftyError.message:"UNKNOWN"})
     }catch(nseError){out.push({code,name,state:"FAILED",attemptedAt,completedAt:new Date().toISOString(),error:nseError instanceof Error?nseError.message:"UNKNOWN",niftyError:niftyError instanceof Error?niftyError.message:"UNKNOWN",nseBodyHead:nseText.slice(0,1400)})}
  }
 }
 const ok=out.every(x=>x.state==="SUCCEEDED")
 return reply(ok?200:207,{endpoint:ENDPOINT,nseEndpoint:NSE_ENDPOINT,warmStatus:warm.status,cookieCount:setCookies.length,nseWarmStatus:nseWarm.status,nseCookieCount:nseSetCookies.length,retries:0,requestCount:items.length,allPass:ok,results:out})
})