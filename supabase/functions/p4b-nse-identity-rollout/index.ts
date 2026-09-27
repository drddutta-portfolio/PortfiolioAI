import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const SOURCE_CODE="OWNER_REVIEWED_CLASSIFICATION"
const RECORD_KIND="P4B_NSE_CANONICAL_IDENTITY"
const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
function projectRef(value:string){try{return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
function parseCookieHeaders(headers:Headers){
  const cookieHeaders=headers as Headers & {getSetCookie?:()=>string[]}
  const values=typeof cookieHeaders.getSetCookie==="function"
    ? cookieHeaders.getSetCookie()
    : [headers.get("set-cookie")].filter((value):value is string=>Boolean(value))
  return values.flatMap((value:string)=>String(value).split(/,(?=[^;,]+=)/gu)).map((part:string)=>part.split(";")[0]?.trim()).filter(Boolean).join("; ")
}
function mergeCookies(...cookieStrings:string[]){
  const byName=new Map<string,string>()
  for(const cookieString of cookieStrings){
    for(const part of String(cookieString??"").split(";")){
      const trimmed=part.trim(); if(!trimmed) continue
      const index=trimmed.indexOf("="); if(index<=0) continue
      byName.set(trimmed.slice(0,index),trimmed.slice(index+1))
    }
  }
  return [...byName.entries()].map(([name,value])=>`${name}=${value}`).join("; ")
}
function browserHeaders(extra:Record<string,string>={}){
  return {"user-agent":UA,"accept-language":"en-US,en;q=0.9","cache-control":"no-cache","pragma":"no-cache",...extra}
}
async function getSessionCookie(seedUrl="https://www.nseindia.com/"){
  const response=await fetch(seedUrl,{headers:browserHeaders({
    "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "sec-fetch-dest":"document","sec-fetch-mode":"navigate","sec-fetch-site":seedUrl==="https://www.nseindia.com/"?"none":"same-origin","upgrade-insecure-requests":"1",
  }),redirect:"follow"})
  if(!response.ok) throw new Error(`NSE_SESSION_HTTP_${response.status}`)
  return parseCookieHeaders(response.headers)
}
async function warmQuote(symbol:string,cookie:string){
  const url=`https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`
  const response=await fetch(url,{headers:browserHeaders({
    "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "cookie":cookie,"referer":"https://www.nseindia.com/","sec-fetch-dest":"document","sec-fetch-mode":"navigate","sec-fetch-site":"same-origin","upgrade-insecure-requests":"1",
  }),redirect:"follow"})
  if(!response.ok) throw new Error(`NSE_QUOTE_PAGE_HTTP_${response.status}`)
  return mergeCookies(cookie,parseCookieHeaders(response.headers))
}
async function fetchQuote(symbol:string,cookie:string){
  const url=`https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`
  const response=await fetch(url,{headers:browserHeaders({
    "accept":"application/json,text/plain,*/*","cookie":cookie,
    "referer":`https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
    "sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-requested-with":"XMLHttpRequest",
  })})
  if(!response.ok) throw new Error(`NSE_QUOTE_HTTP_${response.status}`)
  return response.json()
}
async function sha256(value:unknown){
  const data=new TextEncoder().encode(JSON.stringify(value))
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",data))).map(b=>b.toString(16).padStart(2,"0")).join("")
}

Deno.serve(async request=>{
  if(request.method!=="POST") return reply(405,{error:"Method not allowed."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??""
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
  const ref=projectRef(supabaseUrl)
  if(ref===PROD_REF) return reply(409,{error:"P4B NSE identity rollout refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
  if(ref!==DEV_REF||!serviceKey) return reply(500,{error:"Development runtime configuration is incomplete."})

  try{
    const body=await request.json() as {action?:unknown,grantId?:unknown,afterSymbol?:unknown,limit?:unknown}
    if(body.action!=="P4B_NSE_IDENTITY_BATCH") return reply(400,{error:"Unknown action."})
    const afterSymbol=typeof body.afterSymbol==="string"?body.afterSymbol.trim().toUpperCase():""
    const limit=Number(body.limit??5)
    if(!Number.isInteger(limit)||limit<1||limit>8) return reply(400,{error:"Batch limit must be 1..8."})
    const sentinel=`P4B_NSE_IDENTITY_BATCH:${afterSymbol||"START"}:${limit}`

    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:"P4B_NSE_IDENTITY_BATCH",portfolioId:PORTFOLIO_ID,securityId:sentinel})
    if(!grant.ok) return reply(401,{error:grant.message,code:grant.code})

    const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
    if(holdings.error) throw holdings.error
    const openIds=(holdings.data??[]).filter(row=>!/^[-+]?0(?:\.0+)?$/u.test(String(row.current_quantity))).map(row=>row.security_id)
    const securities=await admin.from("securities").select("id,symbol,name,isin,asset_class,exchange").in("id",openIds)
    if(securities.error) throw securities.error
    const targets=(securities.data??[])
      .filter(row=>row.asset_class==="EQUITY"&&!row.isin&&String(row.symbol)>afterSymbol)
      .sort((a,b)=>String(a.symbol).localeCompare(String(b.symbol)))
      .slice(0,limit)

    if(!targets.length) return reply(200,{status:"COMPLETE",processed:0,lastSymbol:afterSymbol,remaining:0,results:[]})

    let cookie=""
    try{cookie=await getSessionCookie()}catch{/* per-symbol retry */}
    const results:Record<string,unknown>[]=[]

    for(const security of targets){
      const symbol=String(security.symbol)
      try{
        if(!cookie) cookie=await getSessionCookie()
        cookie=await warmQuote(symbol,cookie)
        await sleep(450)
        const quote=await fetchQuote(symbol,cookie)
        const info=quote?.info??{}
        const industryInfo=quote?.industryInfo??{}
        const isin=typeof info.isin==="string"&&info.isin.trim()?info.isin.trim():null
        const observedSymbol=typeof info.symbol==="string"&&info.symbol.trim()?info.symbol.trim().toUpperCase():symbol
        if(observedSymbol!==symbol) throw new Error("NSE_SYMBOL_MISMATCH")
        if(!isin||!/^[A-Z]{2}[A-Z0-9]{10}$/u.test(isin)) throw new Error("NSE_ISIN_MISSING")

        const duplicate=await admin.from("securities").select("id,symbol").eq("isin",isin).neq("id",security.id).maybeSingle()
        if(duplicate.error) throw duplicate.error
        if(duplicate.data) throw new Error("NSE_ISIN_ALREADY_ASSIGNED")

        const now=new Date().toISOString()
        const payload={
          contract:"PORTFOLIOAI_P4B_NSE_CANONICAL_IDENTITY_V1",
          security_id:security.id,
          symbol,
          observed_symbol:observedSymbol,
          isin,
          company_name:typeof info.companyName==="string"?info.companyName:null,
          exchange:"NSE",
          macro_economic_sector:typeof industryInfo.macro==="string"?industryInfo.macro:null,
          sector:typeof industryInfo.sector==="string"?industryInfo.sector:null,
          industry:typeof industryInfo.industry==="string"?industryInfo.industry:null,
          basic_industry:typeof industryInfo.basicIndustry==="string"?industryInfo.basicIndustry:null,
          source_url:`https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
        }
        const hash=await sha256(payload)
        const rec=await admin.from("data_source_records").upsert({
          source_code:SOURCE_CODE,record_kind:RECORD_KIND,
          external_record_id:`${symbol}:${isin}`,payload_hash:hash,raw_payload:payload,
          source_url:payload.source_url,retrieved_at:now,
          terms_snapshot:{mode:"POST_D_P4B_NSE_IDENTITY",owner_checkpoint:"4B",canonical_identity_fill_only:true},
        },{onConflict:"source_code,record_kind,external_record_id,payload_hash",ignoreDuplicates:true})
        if(rec.error) throw rec.error
        const update=await admin.from("securities").update({isin,updated_at:now}).eq("id",security.id).is("isin",null)
        if(update.error) throw update.error
        results.push({symbol,status:"ACCEPTED",isin})
      }catch(error){
        results.push({symbol,status:"FAILED",code:error instanceof Error?error.message:"NSE_IDENTITY_FETCH_FAILED"})
        cookie=""
      }
      await sleep(300)
    }

    const lastSymbol=String(targets.at(-1)?.symbol??afterSymbol)
    const remaining=(securities.data??[]).filter(row=>row.asset_class==="EQUITY"&&!row.isin&&String(row.symbol)>lastSymbol).length
    return reply(200,{status:"BATCH_COMPLETE",processed:targets.length,lastSymbol,remaining,results})
  }catch(error){
    return reply(500,{error:"P4B NSE identity batch failed safely.",code:error instanceof Error?error.message:"P4B_NSE_IDENTITY_FAILED"})
  }
})
