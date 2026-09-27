import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"
const DEV_REF="lrgpjimipfkyoqbpsqzz",PROD_REF="uxiyufbsbgzzdujzcdxe",PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const SOURCE_CODE="OWNER_REVIEWED_CLASSIFICATION",GRANT_KIND="P4_EXECUTION_GRANT",ACTION="P4B_IDENTITY_RESIDUAL_BATCH"
const reply=(s:number,b:Record<string,unknown>)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json"}})
const projectRef=(v:string)=>{try{return new URL(v).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(b=>b.toString(16).padStart(2,"0")).join("")
type Admin=ReturnType<typeof createClient>; type Security={id:string;symbol:string;isin:string|null;asset_class:string}
async function grant(admin:Admin,action:string,securityId:string){const id=crypto.randomUUID(),now=Date.now();const payload={environment:"PortfolioAI Dev",project_ref:DEV_REF,action,portfolio_id:PORTFOLIO_ID,security_id:securityId,expires_at:new Date(now+20*60_000).toISOString()};const r=await admin.from("data_source_records").insert({id,source_code:SOURCE_CODE,record_kind:GRANT_KIND,external_record_id:id,payload_hash:await hash(payload),raw_payload:payload,retrieved_at:new Date(now).toISOString(),terms_snapshot:{mode:"POST_D_P4B_ONE_TIME_EXECUTION_GRANT",secret_transport:false}});if(r.error)throw r.error;return id}
async function invoke(url:string,body:Record<string,unknown>){const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});let p:Record<string,unknown>;try{p=await r.json()}catch{p={error:"NON_JSON_RESPONSE"}};return{ok:r.ok,status:r.status,payload:p}}
Deno.serve(async request=>{
 if(request.method!=="POST")return reply(405,{error:"Method not allowed."})
 const supabaseUrl=Deno.env.get("SUPABASE_URL")??"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",ref=projectRef(supabaseUrl)
 if(ref===PROD_REF)return reply(409,{error:"P4B identity residual refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
 if(ref!==DEV_REF||!serviceKey)return reply(500,{error:"PortfolioAI Dev runtime configuration is incomplete."})
 try{
  const body=await request.json() as {action?:unknown,grantId?:unknown,afterSymbol?:unknown,limit?:unknown}
  if(body.action!==ACTION)return reply(400,{error:"Unknown action."})
  const after=typeof body.afterSymbol==="string"?body.afterSymbol.trim().toUpperCase():"",limit=Number(body.limit??30)
  if(!Number.isInteger(limit)||limit<1||limit>30)return reply(400,{error:"Batch limit must be 1..30."})
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
  const outer=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:`${ACTION}:${after||"START"}:${limit}`})
  if(!outer.ok)return reply(401,{error:outer.message,code:outer.code})
  const h=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID);if(h.error)throw h.error
  const ids=(h.data??[]).filter(r=>Number(r.current_quantity)>0).map(r=>r.security_id)
  const s=await admin.from("securities").select("id,symbol,isin,asset_class").in("id",ids);if(s.error)throw s.error
  const equities=(s.data??[] as Security[]).filter(x=>x.asset_class==="EQUITY"&&x.symbol>after).sort((a,b)=>a.symbol.localeCompare(b.symbol))
  const obs=await admin.from("security_identity_observations").select("security_id,provider_instrument_id,evidence_status").in("security_id",equities.map(x=>x.id)).eq("source_code","TRENDLYNE_MCP");if(obs.error)throw obs.error
  const ready=new Set((obs.data??[]).filter(x=>x.evidence_status==="MATCHED"&&x.provider_instrument_id).map(x=>x.security_id))
  const targets=equities.filter(x=>!ready.has(x.id)&&x.isin).slice(0,limit)
  if(!targets.length)return reply(200,{status:"COMPLETE",processed:0,lastSymbol:after,remaining:0,results:[]})
  const one=async(x:Security)=>{const g=await grant(admin,"P4B_EXECUTE",x.id);const r=await invoke(`${supabaseUrl}/functions/v1/resolve-trendlyne-identity`,{action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:x.id,confirmation:"OWNER_CONFIRMED_POST_D_P4B_IDENTITY_DISCOVERY",grantId:g});return{symbol:x.symbol,securityId:x.id,status:r.ok?"READY":"BLOCKED",httpStatus:r.status,...r.payload}}
  const results:Record<string,unknown>[]=[]
  for(let i=0;i<targets.length;i+=6){results.push(...await Promise.all(targets.slice(i,i+6).map(one)));if(i+6<targets.length)await new Promise(r=>setTimeout(r,250))}
  const last=targets.at(-1)?.symbol??after
  const remaining=equities.filter(x=>x.symbol>last&&!ready.has(x.id)&&x.isin).length
  return reply(200,{status:"BATCH_COMPLETE",processed:targets.length,lastSymbol:last,remaining,results})
 }catch(error){return reply(500,{error:"P4B identity residual failed safely.",code:error instanceof Error?error.message:"P4B_IDENTITY_RESIDUAL_FAILED"})}
})