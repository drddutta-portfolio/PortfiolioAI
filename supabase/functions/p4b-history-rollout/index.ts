import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const SOURCE_CODE="OWNER_REVIEWED_CLASSIFICATION"
const GRANT_KIND="P4_EXECUTION_GRANT"
const ACTION="P4B_HISTORY_BATCH"

const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const projectRef=(value:string)=>{try{return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const hash=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value))))).map(b=>b.toString(16).padStart(2,"0")).join("")

type Admin=ReturnType<typeof createClient>

async function createGrant(admin:Admin,securityId:string){
  const id=crypto.randomUUID()
  const payload={
    environment:"PortfolioAI Dev",project_ref:DEV_REF,action:"P4B_EXECUTE",
    portfolio_id:PORTFOLIO_ID,security_id:securityId,
    expires_at:new Date(Date.now()+20*60_000).toISOString(),
  }
  const ins=await admin.from("data_source_records").insert({
    id,source_code:SOURCE_CODE,record_kind:GRANT_KIND,external_record_id:id,
    payload_hash:await hash(payload),raw_payload:payload,
    retrieved_at:new Date().toISOString(),
    terms_snapshot:{mode:"POST_D_P4B_ONE_TIME_EXECUTION_GRANT",secret_transport:false},
  })
  if(ins.error) throw ins.error
  return id
}

async function invoke(url:string,body:Record<string,unknown>){
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
  let payload:Record<string,unknown>
  try{payload=await r.json()}catch{payload={error:"NON_JSON_RESPONSE"}}
  return {ok:r.ok,status:r.status,payload}
}

Deno.serve(async request=>{
  if(request.method!=="POST")return reply(405,{error:"Method not allowed."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??""
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
  const ref=projectRef(supabaseUrl)
  if(ref===PROD_REF)return reply(409,{error:"P4B history rollout refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
  if(ref!==DEV_REF||!serviceKey)return reply(500,{error:"PortfolioAI Dev runtime configuration is incomplete."})
  try{
    const body=await request.json() as {action?:unknown,grantId?:unknown,afterSymbol?:unknown,limit?:unknown}
    if(body.action!==ACTION)return reply(400,{error:"Unknown action."})
    const after=typeof body.afterSymbol==="string"?body.afterSymbol.trim().toUpperCase():""
    const limit=Number(body.limit??20)
    if(!Number.isInteger(limit)||limit<1||limit>20)return reply(400,{error:"Batch limit must be 1..20."})
    const sentinel=`${ACTION}:${after||"START"}:${limit}`
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const outer=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:sentinel})
    if(!outer.ok)return reply(401,{error:outer.message,code:outer.code})

    const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
    if(holdings.error)throw holdings.error
    const openIds=(holdings.data??[]).filter(r=>Number(r.current_quantity)>0).map(r=>r.security_id)
    const secs=await admin.from("securities").select("id,symbol,asset_class").in("id",openIds)
    if(secs.error)throw secs.error
    const equities=(secs.data??[]).filter(s=>s.asset_class==="EQUITY"&&String(s.symbol)>after).sort((a,b)=>String(a.symbol).localeCompare(String(b.symbol))).slice(0,limit)
    if(!equities.length)return reply(200,{status:"COMPLETE",processed:0,lastSymbol:after,results:[]})

    const ids=equities.map(s=>s.id)
    const [maps,hist]=await Promise.all([
      admin.from("market_data_instrument_mappings").select("security_id,mapping_status").in("security_id",ids).eq("provider_code","ANGEL_ONE"),
      admin.from("market_price_history").select("security_id").in("security_id",ids).eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").limit(10000),
    ])
    if(maps.error||hist.error)throw maps.error??hist.error
    const mapped=new Set((maps.data??[]).filter(r=>r.mapping_status==="VERIFIED").map(r=>r.security_id))
    const hasHistory=new Set((hist.data??[]).map(r=>r.security_id))
    const results:Record<string,unknown>[]=[]

    for(const security of equities){
      if(hasHistory.has(security.id)){
        results.push({symbol:security.symbol,status:"READY_EXISTING"})
        continue
      }
      if(!mapped.has(security.id)){
        results.push({symbol:security.symbol,status:"BLOCKED",code:"ANGEL_MAPPING_PREREQUISITE_MISSING"})
        continue
      }
      const grantId=await createGrant(admin,security.id)
      const r=await invoke(`${supabaseUrl}/functions/v1/refresh-market-history`,{
        action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,
        confirmation:"OWNER_CONFIRMED_POST_D_P4B_MARKET_HISTORY",grantId,
      })
      results.push({symbol:security.symbol,status:r.ok?"READY":"BLOCKED",httpStatus:r.status,...r.payload})
      await new Promise(resolve=>setTimeout(resolve,1300))
    }
    return reply(200,{status:"BATCH_COMPLETE",processed:equities.length,lastSymbol:equities.at(-1)?.symbol??after,results})
  }catch(error){
    return reply(500,{error:"P4B history batch failed safely.",code:error instanceof Error?error.message:"P4B_HISTORY_FAILED"})
  }
})
