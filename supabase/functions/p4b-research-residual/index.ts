import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const SOURCE_CODE="OWNER_REVIEWED_CLASSIFICATION"
const GRANT_KIND="P4_EXECUTION_GRANT"
const ACTION="P4B_RESEARCH_RESIDUAL_BATCH"

const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const projectRef=(v:string)=>{try{return new URL(v).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(b=>b.toString(16).padStart(2,"0")).join("")
type Admin=ReturnType<typeof createClient>
type Security={id:string;symbol:string;name:string;isin:string|null;asset_class:string}

async function createGrant(admin:Admin,action:string,securityId:string){
  const id=crypto.randomUUID(),now=Date.now()
  const payload={environment:"PortfolioAI Dev",project_ref:DEV_REF,action,portfolio_id:PORTFOLIO_ID,security_id:securityId,expires_at:new Date(now+20*60_000).toISOString()}
  const r=await admin.from("data_source_records").insert({id,source_code:SOURCE_CODE,record_kind:GRANT_KIND,external_record_id:id,payload_hash:await hash(payload),raw_payload:payload,retrieved_at:new Date(now).toISOString(),terms_snapshot:{mode:"POST_D_P4B_ONE_TIME_EXECUTION_GRANT",secret_transport:false}})
  if(r.error) throw r.error
  return id
}
async function invoke(url:string,body:Record<string,unknown>){
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
  let p:Record<string,unknown>;try{p=await r.json()}catch{p={error:"NON_JSON_RESPONSE"}}
  return {ok:r.ok,status:r.status,payload:p}
}

Deno.serve(async request=>{
  if(request.method!=="POST") return reply(405,{error:"Method not allowed."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??"", serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
  const ref=projectRef(supabaseUrl)
  if(ref===PROD_REF) return reply(409,{error:"P4B residual research refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
  if(ref!==DEV_REF||!serviceKey) return reply(500,{error:"PortfolioAI Dev runtime configuration is incomplete."})
  try{
    const body=await request.json() as {action?:unknown,grantId?:unknown,afterSymbol?:unknown,limit?:unknown}
    if(body.action!==ACTION) return reply(400,{error:"Unknown action."})
    const afterSymbol=typeof body.afterSymbol==="string"?body.afterSymbol.trim().toUpperCase():""
    const limit=Number(body.limit??24)
    if(!Number.isInteger(limit)||limit<1||limit>24) return reply(400,{error:"Batch limit must be 1..24."})
    const sentinel=`${ACTION}:${afterSymbol||"START"}:${limit}`
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const g=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:sentinel})
    if(!g.ok) return reply(401,{error:g.message,code:g.code})

    const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
    if(holdings.error) throw holdings.error
    const openIds=(holdings.data??[]).filter(r=>Number(r.current_quantity)>0).map(r=>r.security_id)
    const securities=await admin.from("securities").select("id,symbol,name,isin,asset_class").in("id",openIds)
    if(securities.error) throw securities.error
    const equities=(securities.data??[] as Security[]).filter(s=>s.asset_class==="EQUITY"&&s.symbol>afterSymbol).sort((a,b)=>a.symbol.localeCompare(b.symbol))
    const ids=equities.map(s=>s.id)
    const [idsObs,fund,docs]=await Promise.all([
      admin.from("security_identity_observations").select("security_id,provider_instrument_id,evidence_status").in("security_id",ids).eq("source_code","TRENDLYNE_MCP"),
      admin.from("fundamental_observations").select("security_id").in("security_id",ids).limit(20000),
      admin.from("research_documents").select("security_id").in("security_id",ids).limit(20000),
    ])
    for(const r of [idsObs,fund,docs]) if(r.error) throw r.error
    const identityReady=new Set((idsObs.data??[]).filter(r=>r.evidence_status==="MATCHED"&&r.provider_instrument_id).map(r=>r.security_id))
    const fundReady=new Set((fund.data??[]).map(r=>r.security_id))
    const docReady=new Set((docs.data??[]).map(r=>r.security_id))
    const targets=equities.filter(s=>!identityReady.has(s.id)||!fundReady.has(s.id)||!docReady.has(s.id)).slice(0,limit)
    if(!targets.length) return reply(200,{status:"COMPLETE",processed:0,lastSymbol:afterSymbol,remaining:0,results:[]})

    const processOne=async(security:Security)=>{
      const steps:Record<string,unknown>[]=[]
      let identityOk=identityReady.has(security.id)
      if(!identityOk){
        if(!security.isin){
          steps.push({domain:"TRENDLYNE_IDENTITY",status:"BLOCKED",code:"CANONICAL_ISIN_MISSING"})
        }else{
          const grantId=await createGrant(admin,"P4B_EXECUTE",security.id)
          const r=await invoke(`${supabaseUrl}/functions/v1/resolve-trendlyne-identity`,{action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,confirmation:"OWNER_CONFIRMED_POST_D_P4B_IDENTITY_DISCOVERY",grantId})
          steps.push({domain:"TRENDLYNE_IDENTITY",status:r.ok?"READY":"BLOCKED",httpStatus:r.status,...r.payload})
          identityOk=r.ok
        }
      }else steps.push({domain:"TRENDLYNE_IDENTITY",status:"READY_EXISTING"})

      if(identityOk&&(!fundReady.has(security.id)||!docReady.has(security.id))){
        const grantId=await createGrant(admin,"P4B_EXECUTE",security.id)
        const r=await invoke(`${supabaseUrl}/functions/v1/complete-research-refresh`,{action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,confirmation:"OWNER_CONFIRMED_POST_D_P4B_COMPLETE_RESEARCH",grantId})
        steps.push({domain:"TRENDLYNE_RESEARCH",httpStatus:r.status,...r.payload,status:r.ok?(r.status===207?"PARTIAL":"READY"):"BLOCKED"})
      }else if(identityOk) steps.push({domain:"TRENDLYNE_RESEARCH",status:"READY_EXISTING"})
      else steps.push({domain:"TRENDLYNE_RESEARCH",status:"BLOCKED",code:"TRENDLYNE_IDENTITY_PREREQUISITE_MISSING"})
      return {symbol:security.symbol,securityId:security.id,status:steps.some(s=>s.status==="BLOCKED"||s.status==="PARTIAL")?"PARTIAL_OR_BLOCKED":"READY",steps}
    }

    const results:Record<string,unknown>[]=[]
    for(let i=0;i<targets.length;i+=3){
      const chunk=targets.slice(i,i+3)
      const rr=await Promise.all(chunk.map(processOne))
      results.push(...rr)
      if(i+3<targets.length) await new Promise(r=>setTimeout(r,350))
    }
    const lastSymbol=targets.at(-1)?.symbol??afterSymbol
    const remaining=equities.filter(s=>s.symbol>lastSymbol).filter(s=>!identityReady.has(s.id)||!fundReady.has(s.id)||!docReady.has(s.id)).length
    return reply(200,{status:"BATCH_COMPLETE",processed:targets.length,lastSymbol,remaining,results})
  }catch(error){
    return reply(500,{error:"P4B residual research batch failed safely.",code:error instanceof Error?error.message:"P4B_RESIDUAL_RESEARCH_FAILED"})
  }
})
