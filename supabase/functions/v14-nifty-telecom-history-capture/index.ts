import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"

const DEV="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_CAPTURE_NIFTY_TELECOM_HISTORY"
const SENTINEL="NIFTY_TELECOM:PRICE_RETURN_RAW_CLOSE:2025-08-25:2026-10-07"
const ENDPOINT="https://www.nseindia.com/api/historicalOR/indicesHistory"
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const sha=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
const norm=(v:unknown)=>String(v??"").trim().toUpperCase().replace(/&/g," AND ").replace(/[^A-Z0-9]+/g," ").trim().replace(/\s+/g," ")
const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
function parse(body:string){
 const root=JSON.parse(body) as Record<string,unknown>
 const data=Array.isArray(root.data)?root.data:
  (root.data&&typeof root.data==="object"&&!Array.isArray(root.data)&&Array.isArray((root.data as Record<string,unknown>).indexCloseOnlineRecords))
   ?(root.data as Record<string,unknown>).indexCloseOnlineRecords as unknown[]:[]
 if(!data.length)throw new Error("NSE_NOT_ARRAY")
 const rows:{session:string;close:string;identity:string}[]=[];const seen=new Set<string>()
 for(const u of data){
  if(!u||typeof u!=="object"||Array.isArray(u))throw new Error("ROW_INVALID")
  const row=u as Record<string,unknown>,identity=String(row.EOD_INDEX_NAME??row.INDEX_NAME??row.indexName??"")
  if(norm(identity)!==norm("NIFTY TELECOM"))throw new Error("IDENTITY_MISMATCH:"+identity)
  const raw=String(row.EOD_TIMESTAMP??row.HistoricalDate??row.Date??"")
  const m=/^(\d{2})[- ]([A-Za-z]{3})[- ](\d{4})$/.exec(raw),m2=/^(\d{2})-(\d{2})-(\d{4})$/.exec(raw)
  let day=""
  if(m){const mi=months.findIndex(x=>x.toLowerCase()===m[2]!.toLowerCase());if(mi<0)throw new Error("MONTH_INVALID");day=`${m[3]}-${String(mi+1).padStart(2,"0")}-${m[1]}`}
  else if(m2)day=`${m2[3]}-${m2[2]}-${m2[1]}`
  else throw new Error("DATE_INVALID:"+raw)
  if(day<"2025-08-25"||day>"2026-10-07")throw new Error("DATE_WINDOW:"+day)
  if(seen.has(day))throw new Error("DUPLICATE:"+day);seen.add(day)
  const close=String(row.EOD_CLOSE_INDEX_VAL??row.CLOSE??"")
  if(!/^\d+(?:\.\d+)?$/.test(close)||!/[1-9]/.test(close))throw new Error("CLOSE_INVALID")
  rows.push({session:day,close,identity})
 }
 rows.sort((a,b)=>a.session.localeCompare(b.session))
 if(rows.length<252||rows.length>400)throw new Error("SESSION_COUNT:"+rows.length)
 if(rows.at(-1)?.session!=="2026-10-07")throw new Error("LATEST_SESSION:"+rows.at(-1)?.session)
 return rows
}
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";if(!key)return reply(409,{code:"UNAPPROVED_DEVELOPMENT_TARGET"})
 const body=await req.json().catch(()=>({})) as Record<string,unknown>
 const admin=createClient("https://"+DEV+".supabase.co",key,{auth:{persistSession:false}})
 const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:SENTINEL})
 if(!grant.ok)return reply(401,{code:grant.code})
 const warm=await fetch("https://www.nseindia.com/reports-indices-historical-index-data",{headers:{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36","accept":"text/html,application/xhtml+xml"},redirect:"follow",signal:AbortSignal.timeout(30000)})
 const cookies=(warm.headers as Headers&{getSetCookie?:()=>string[]}).getSetCookie?.()??[],cookie=cookies.map(v=>v.split(";")[0]).join("; ")
 const ranges=[["25-08-2025","24-08-2026"],["25-08-2026","07-10-2026"]] as const
 const captures:{from:string;to:string;requestUrl:string;body:string;byteLength:number;sha256:string}[]=[]
 const mergedRaw:unknown[]=[]
 for(const [from,to] of ranges){
  const q=new URLSearchParams({indexType:"NIFTY TELECOM",from,to})
  const requestUrl=ENDPOINT+"?"+q.toString()
  const res=await fetch(requestUrl,{headers:{"accept":"application/json,text/plain,*/*","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36","referer":"https://www.nseindia.com/reports-indices-historical-index-data",...(cookie?{"cookie":cookie}:{})},signal:AbortSignal.timeout(30000)})
  const text=await res.text(),bytes=new TextEncoder().encode(text)
  if(!res.ok)return reply(502,{code:"NSE_HTTP",status:res.status,from,to})
  const root=JSON.parse(text) as Record<string,unknown>
  const data=Array.isArray(root.data)?root.data:
   (root.data&&typeof root.data==="object"&&!Array.isArray(root.data)&&Array.isArray((root.data as Record<string,unknown>).indexCloseOnlineRecords))
    ?(root.data as Record<string,unknown>).indexCloseOnlineRecords as unknown[]:[]
  if(!data.length)return reply(409,{code:"NIFTY_TELECOM_RANGE_EMPTY",from,to,bodyHead:text.slice(0,1000)})
  mergedRaw.push(...data)
  captures.push({from,to,requestUrl,body:text,byteLength:bytes.length,sha256:await sha(bytes)})
 }
 const combinedBody=JSON.stringify({data:mergedRaw})
 const combinedBytes=new TextEncoder().encode(combinedBody)
 try{
  const rows=parse(combinedBody),digest=await sha(combinedBytes)
  return reply(200,{code:"NIFTY_TELECOM",identity:"NIFTY TELECOM",basis:"PRICE_RETURN_RAW_CLOSE",sourceUrl:ENDPOINT,retrievedAt:new Date().toISOString(),sha256:digest,byteLength:combinedBytes.length,sessions:rows.length,firstSession:rows[0]!.session,lastSession:rows.at(-1)!.session,rows,captures,body:combinedBody})
 }catch(e){return reply(409,{code:"NIFTY_TELECOM_VALIDATION_FAILED",error:e instanceof Error?e.message:"UNKNOWN",rangeCount:captures.length})}
})