import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"

const DEV="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_OFFICIAL_BENCHMARK_OCT7_REFRESH"
const SENTINEL="V1_4_OFFICIAL_BENCHMARKS_OCT7"
const ENDPOINT="https://www.niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString"
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
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url="https://"+DEV+".supabase.co",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(!key)return reply(409,{code:"UNAPPROVED_DEVELOPMENT_TARGET"})
 const body=await req.json().catch(()=>({})) as Record<string,unknown>
 const admin=createClient(url,key,{auth:{persistSession:false}})
 const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:SENTINEL})
 if(!grant.ok)return reply(401,{code:grant.code})
 const out=[]
 for(const [code,name] of ITEMS){
  const attemptedAt=new Date().toISOString()
  try{
   const cinfo=JSON.stringify({name,startDate:"25-Aug-2025",endDate:"07-Oct-2026",indexName:name})
   const r=await fetch(ENDPOINT,{method:"POST",headers:{"content-type":"application/json","accept":"application/json","user-agent":"Mozilla/5.0"},body:JSON.stringify({cinfo}),signal:AbortSignal.timeout(30000)})
   const text=await r.text(),bytes=new TextEncoder().encode(text)
   if(!r.ok)throw new Error("HTTP_"+r.status)
   const parsed=parse(text,name),sha256=await hex(bytes)
   out.push({code,name,state:"SUCCEEDED",attemptedAt,completedAt:new Date().toISOString(),httpStatus:r.status,byteLength:bytes.length,sha256,...parsed,returnBasis:"PRICE_RETURN_RAW_CLOSE",sourceUrl:ENDPOINT,body:text})
  }catch(e){out.push({code,name,state:"FAILED",attemptedAt,completedAt:new Date().toISOString(),error:e instanceof Error?e.message:"UNKNOWN"})}
 }
 const ok=out.every(x=>x.state==="SUCCEEDED")
 return reply(ok?200:207,{endpoint:ENDPOINT,retries:0,requestCount:ITEMS.length,allPass:ok,results:out})
})