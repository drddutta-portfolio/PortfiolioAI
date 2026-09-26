import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="P4B_NSE_IDENTITY_REPAIR"
const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const projectRef=(value:string)=>{try{return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
const browserHeaders=(extra:Record<string,string>={})=>({"user-agent":UA,"accept-language":"en-US,en;q=0.9","cache-control":"no-cache","pragma":"no-cache",...extra})

function cookies(headers:Headers){
  const raw=(headers as any).getSetCookie?.()??[headers.get("set-cookie")].filter(Boolean)
  return raw.flatMap((v:string)=>String(v).split(/,(?=[^;,]+=)/gu)).map((p:string)=>p.split(";")[0]?.trim()).filter(Boolean).join("; ")
}
function mergeCookies(...items:string[]){
  const m=new Map<string,string>()
  for(const item of items) for(const part of String(item??"").split(";")){
    const t=part.trim(),i=t.indexOf("="); if(i>0)m.set(t.slice(0,i),t.slice(i+1))
  }
  return [...m.entries()].map(([k,v])=>`${k}=${v}`).join("; ")
}
async function seedCookie(){
  const r=await fetch("https://www.nseindia.com/",{headers:browserHeaders({"accept":"text/html,application/xhtml+xml"}),redirect:"follow"})
  if(!r.ok) throw new Error(`NSE_SESSION_HTTP_${r.status}`)
  return cookies(r.headers)
}
async function quote(symbol:string,startCookie:string){
  let cookie=startCookie
  const page=`https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`
  const warm=await fetch(page,{headers:browserHeaders({"accept":"text/html,application/xhtml+xml","cookie":cookie,"referer":"https://www.nseindia.com/"}),redirect:"follow"})
  if(!warm.ok) throw new Error(`NSE_QUOTE_PAGE_HTTP_${warm.status}`)
  cookie=mergeCookies(cookie,cookies(warm.headers))
  await sleep(350)
  const api=await fetch(`https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`,{
    headers:browserHeaders({"accept":"application/json,text/plain,*/*","cookie":cookie,"referer":page,"x-requested-with":"XMLHttpRequest"})
  })
  if(!api.ok) throw new Error(`NSE_QUOTE_HTTP_${api.status}`)
  return {json:await api.json(),cookie}
}

Deno.serve(async request=>{
  if(request.method!=="POST")return reply(405,{error:"Method not allowed."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
  const ref=projectRef(supabaseUrl)
  if(ref===PROD_REF)return reply(409,{error:"P4B NSE identity repair refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
  if(ref!==DEV_REF||!serviceKey)return reply(500,{error:"PortfolioAI Dev runtime configuration is incomplete."})
  try{
    const body=await request.json() as {action?:unknown,grantId?:unknown,afterSymbol?:unknown,limit?:unknown}
    if(body.action!==ACTION)return reply(400,{error:"Unknown action."})
    const after=typeof body.afterSymbol==="string"?body.afterSymbol.trim().toUpperCase():""
    const limit=Number(body.limit??8)
    if(!Number.isInteger(limit)||limit<1||limit>12)return reply(400,{error:"limit must be 1..12"})
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const sentinel=`${ACTION}:${after||"START"}:${limit}`
    const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:sentinel})
    if(!grant.ok)return reply(401,{error:grant.message,code:grant.code})

    const h=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
    if(h.error)throw h.error
    const ids=(h.data??[]).filter(r=>Number(r.current_quantity)>0).map(r=>r.security_id)
    const s=await admin.from("securities").select("id,symbol,isin,asset_class").in("id",ids)
    if(s.error)throw s.error
    const targets=(s.data??[])
      .filter(r=>r.asset_class==="EQUITY"&&String(r.symbol)>after&&(!r.isin||r.symbol==="ANGELONE"))
      .sort((a,b)=>String(a.symbol).localeCompare(String(b.symbol))).slice(0,limit)
    if(!targets.length)return reply(200,{status:"COMPLETE",processed:0,lastSymbol:after,results:[]})

    let cookie=""
    try{cookie=await seedCookie()}catch{}
    const results:Record<string,unknown>[]=[]
    for(const sec of targets){
      try{
        if(!cookie)cookie=await seedCookie()
        const q=await quote(String(sec.symbol),cookie);cookie=q.cookie
        const info=q.json?.info??{}
        const official=typeof info.isin==="string"&&info.isin.trim()?info.isin.trim():null
        const observedSymbol=typeof info.symbol==="string"&&info.symbol.trim()?info.symbol.trim().toUpperCase():String(sec.symbol).toUpperCase()
        if(observedSymbol!==String(sec.symbol).toUpperCase())throw new Error("NSE_SYMBOL_IDENTITY_MISMATCH")
        if(!official)throw new Error("NSE_ISIN_MISSING")
        const current=typeof sec.isin==="string"&&sec.isin.trim()?sec.isin.trim():null
        let allowed=false,reason=""
        if(!current){allowed=true;reason="CANONICAL_ISIN_MISSING_OFFICIAL_NSE_REPAIR"}
        else if(sec.symbol==="ANGELONE"&&current==="INE732I01013"&&official==="INE732I01021"){
          allowed=true;reason="K1_REVIEWED_ANGELONE_CORPORATE_ACTION"
        }else if(current===official){
          results.push({symbol:sec.symbol,status:"UNCHANGED",isin:current});await sleep(300);continue
        }else{
          results.push({symbol:sec.symbol,status:"BLOCKED",code:"UNREVIEWED_ISIN_MISMATCH",canonicalIsin:current,officialIsin:official});await sleep(300);continue
        }
        const upd=await admin.from("securities").update({isin:official}).eq("id",sec.id).eq("symbol",sec.symbol)
        if(upd.error)throw upd.error
        results.push({symbol:sec.symbol,status:"UPDATED",oldIsin:current,newIsin:official,reason})
      }catch(error){
        results.push({symbol:sec.symbol,status:"FAILED",code:error instanceof Error?error.message:"NSE_IDENTITY_REPAIR_FAILED"})
        cookie=""
      }
      await sleep(300)
    }
    return reply(200,{status:"BATCH_COMPLETE",processed:targets.length,lastSymbol:String(targets.at(-1)?.symbol??after),results})
  }catch(error){return reply(500,{error:"P4B NSE identity repair failed safely.",code:error instanceof Error?error.message:"P4B_NSE_IDENTITY_REPAIR_FAILED"})}
})
