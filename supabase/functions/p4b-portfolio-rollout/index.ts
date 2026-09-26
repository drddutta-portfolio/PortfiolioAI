import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const SOURCE_CODE="OWNER_REVIEWED_CLASSIFICATION"
const GRANT_KIND="P4_EXECUTION_GRANT"
const BATCH_ACTION="P4B_PORTFOLIO_BATCH"

const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const projectRef=(value:string)=>{try{return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const hash=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value))))).map(b=>b.toString(16).padStart(2,"0")).join("")

type Admin=ReturnType<typeof createClient>
type Security={id:string;symbol:string;name:string;isin:string|null;asset_class:string}

async function createGrant(admin:Admin,action:string,securityId:string) {
  const id=crypto.randomUUID()
  const now=Date.now()
  const payload={
    environment:"PortfolioAI Dev",
    project_ref:DEV_REF,
    action,
    portfolio_id:PORTFOLIO_ID,
    security_id:securityId,
    expires_at:new Date(now+20*60_000).toISOString(),
  }
  const inserted=await admin.from("data_source_records").insert({
    id,
    source_code:SOURCE_CODE,
    record_kind:GRANT_KIND,
    external_record_id:id,
    payload_hash:await hash(payload),
    raw_payload:payload,
    retrieved_at:new Date(now).toISOString(),
    terms_snapshot:{mode:"POST_D_P4B_ONE_TIME_EXECUTION_GRANT",secret_transport:false},
  })
  if(inserted.error) throw inserted.error
  return id
}

async function invoke(url:string,body:Record<string,unknown>) {
  const response=await fetch(url,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
  })
  let payload:Record<string,unknown>
  try{payload=await response.json()}catch{payload={error:"NON_JSON_RESPONSE"}}
  return {ok:response.ok,status:response.status,payload}
}

Deno.serve(async request=>{
  if(request.method!=="POST") return reply(405,{error:"Method not allowed."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??""
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
  const ref=projectRef(supabaseUrl)
  if(ref===PROD_REF) return reply(409,{error:"P4B portfolio rollout refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
  if(ref!==DEV_REF||!serviceKey) return reply(500,{error:"PortfolioAI Dev runtime configuration is incomplete."})

  try{
    const body=await request.json() as {action?:unknown;grantId?:unknown;afterSymbol?:unknown;limit?:unknown}
    if(body.action!==BATCH_ACTION) return reply(400,{error:"Unknown action."})
    const afterSymbol=typeof body.afterSymbol==="string"?body.afterSymbol.trim().toUpperCase():""
    const limit=Number(body.limit??3)
    if(!Number.isInteger(limit)||limit<1||limit>5) return reply(400,{error:"Batch limit must be 1..5."})
    const sentinel=`${BATCH_ACTION}:${afterSymbol||"START"}:${limit}`

    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const outerGrant=await consumeP4ExecutionGrant(admin,{
      grantId:body.grantId,
      action:BATCH_ACTION,
      portfolioId:PORTFOLIO_ID,
      securityId:sentinel,
    })
    if(!outerGrant.ok) return reply(401,{error:outerGrant.message,code:outerGrant.code})

    const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
    if(holdings.error) throw holdings.error
    const openIds=(holdings.data??[]).filter(r=>Number(r.current_quantity)>0).map(r=>r.security_id)
    const securities=await admin.from("securities").select("id,symbol,name,isin,asset_class").in("id",openIds)
    if(securities.error) throw securities.error
    const equities=(securities.data??[] as Security[])
      .filter(s=>s.asset_class==="EQUITY"&&s.symbol>afterSymbol)
      .sort((a,b)=>a.symbol.localeCompare(b.symbol))
      .slice(0,limit)

    if(!equities.length) return reply(200,{status:"COMPLETE",processed:0,lastSymbol:afterSymbol,results:[]})

    const ids=equities.map(s=>s.id)
    const [classifications,identities,mappings,prices,fundamentals,documents,histories]=await Promise.all([
      admin.from("current_security_classification_v1").select("security_id,sector,industry,has_conflict").in("security_id",ids),
      admin.from("security_identity_observations").select("security_id,provider_instrument_id,evidence_status").in("security_id",ids).eq("source_code","TRENDLYNE_MCP"),
      admin.from("market_data_instrument_mappings").select("security_id,mapping_status").in("security_id",ids).eq("provider_code","ANGEL_ONE"),
      admin.from("market_price_latest").select("security_id,price").in("security_id",ids).eq("provider_code","ANGEL_ONE"),
      admin.from("fundamental_observations").select("security_id").in("security_id",ids).limit(10000),
      admin.from("research_documents").select("security_id").in("security_id",ids).limit(10000),
      admin.from("market_price_history").select("security_id").in("security_id",ids).eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").limit(10000),
    ])
    for(const r of [classifications,identities,mappings,prices,fundamentals,documents,histories]) if(r.error) throw r.error

    const classBy=new Map((classifications.data??[]).map(r=>[r.security_id,r]))
    const identityReady=new Set((identities.data??[]).filter(r=>r.evidence_status==="MATCHED"&&r.provider_instrument_id).map(r=>r.security_id))
    const mappingReady=new Set((mappings.data??[]).filter(r=>r.mapping_status==="VERIFIED").map(r=>r.security_id))
    const priceReady=new Set((prices.data??[]).filter(r=>r.price!==null).map(r=>r.security_id))
    const fundamentalReady=new Set((fundamentals.data??[]).map(r=>r.security_id))
    const documentReady=new Set((documents.data??[]).map(r=>r.security_id))
    const historyReady=new Set((histories.data??[]).map(r=>r.security_id))

    const results:Record<string,unknown>[]=[]
    for(const security of equities){
      const row:Record<string,unknown>={symbol:security.symbol,securityId:security.id,steps:[]}
      const steps=row.steps as Record<string,unknown>[]
      const cls=classBy.get(security.id)
      if(!cls?.sector||!cls?.industry||cls?.has_conflict){
        steps.push({domain:"CLASSIFICATION",status:"BLOCKED",code:"CLASSIFICATION_NOT_READY"})
        row.status="BLOCKED"
        results.push(row)
        continue
      }

      let identityOk=identityReady.has(security.id)
      if(!identityOk){
        if(!security.isin){
          steps.push({domain:"TRENDLYNE_IDENTITY",status:"BLOCKED",code:"CANONICAL_ISIN_MISSING"})
        }else{
          const grantId=await createGrant(admin,"P4B_EXECUTE",security.id)
          const r=await invoke(`${supabaseUrl}/functions/v1/resolve-trendlyne-identity`,{
            action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,
            confirmation:"OWNER_CONFIRMED_POST_D_P4B_IDENTITY_DISCOVERY",grantId,
          })
          steps.push({domain:"TRENDLYNE_IDENTITY",status:r.ok?"READY":"BLOCKED",httpStatus:r.status,...r.payload})
          identityOk=r.ok
        }
      }else steps.push({domain:"TRENDLYNE_IDENTITY",status:"READY_EXISTING"})

      if(identityOk&&(!fundamentalReady.has(security.id)||!documentReady.has(security.id))){
        const grantId=await createGrant(admin,"P4B_EXECUTE",security.id)
        const r=await invoke(`${supabaseUrl}/functions/v1/complete-research-refresh`,{
          action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,
          confirmation:"OWNER_CONFIRMED_POST_D_P4B_COMPLETE_RESEARCH",grantId,
        })
        steps.push({domain:"TRENDLYNE_RESEARCH",httpStatus:r.status,...r.payload,status:r.ok?(r.status===207?"PARTIAL":"READY"):"BLOCKED"})
      }else if(identityOk) steps.push({domain:"TRENDLYNE_RESEARCH",status:"READY_EXISTING"})
      else steps.push({domain:"TRENDLYNE_RESEARCH",status:"BLOCKED",code:"TRENDLYNE_IDENTITY_PREREQUISITE_MISSING"})

      let mappingOk=mappingReady.has(security.id)
      if(!mappingOk){
        const grantId=await createGrant(admin,"P4B_SYNC_MAPPING",security.id)
        const r=await invoke(`${supabaseUrl}/functions/v1/refresh-market-data`,{
          action:"P4B_SYNC_MAPPING",portfolioId:PORTFOLIO_ID,securityIds:[security.id],grantId,
        })
        steps.push({domain:"ANGEL_MAPPING",status:r.ok?"READY":"BLOCKED",httpStatus:r.status,...r.payload})
        mappingOk=r.ok
      }else steps.push({domain:"ANGEL_MAPPING",status:"READY_EXISTING"})

      if(mappingOk&&!priceReady.has(security.id)){
        const grantId=await createGrant(admin,"P4B_REFRESH_PRICE",security.id)
        const r=await invoke(`${supabaseUrl}/functions/v1/refresh-market-data`,{
          action:"P4B_REFRESH_PRICE",portfolioId:PORTFOLIO_ID,securityIds:[security.id],grantId,
        })
        steps.push({domain:"CURRENT_PRICE",status:r.ok?"READY":"BLOCKED",httpStatus:r.status,...r.payload})
      }else if(mappingOk) steps.push({domain:"CURRENT_PRICE",status:"READY_EXISTING"})
      else steps.push({domain:"CURRENT_PRICE",status:"BLOCKED",code:"ANGEL_MAPPING_PREREQUISITE_MISSING"})

      if(mappingOk&&!historyReady.has(security.id)){
        const grantId=await createGrant(admin,"P4B_EXECUTE",security.id)
        const r=await invoke(`${supabaseUrl}/functions/v1/refresh-market-history`,{
          action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,
          confirmation:"OWNER_CONFIRMED_POST_D_P4B_MARKET_HISTORY",grantId,
        })
        steps.push({domain:"MARKET_HISTORY",status:r.ok?"READY":"BLOCKED",httpStatus:r.status,...r.payload})
      }else if(mappingOk) steps.push({domain:"MARKET_HISTORY",status:"READY_EXISTING"})
      else steps.push({domain:"MARKET_HISTORY",status:"BLOCKED",code:"ANGEL_MAPPING_PREREQUISITE_MISSING"})

      row.status=steps.some(s=>s.status==="BLOCKED"||s.status==="PARTIAL")?"PARTIAL_OR_BLOCKED":"READY"
      results.push(row)
      await new Promise(resolve=>setTimeout(resolve,1300))
    }

    return reply(200,{
      status:"BATCH_COMPLETE",
      processed:equities.length,
      lastSymbol:equities.at(-1)?.symbol??afterSymbol,
      results,
    })
  }catch(error){
    return reply(500,{error:"P4B portfolio batch failed safely.",code:error instanceof Error?error.message:"P4B_PORTFOLIO_BATCH_FAILED"})
  }
})
