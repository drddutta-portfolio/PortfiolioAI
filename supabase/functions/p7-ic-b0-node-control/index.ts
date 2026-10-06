import {createClient} from "https://esm.sh/@supabase/supabase-js@2"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="P7_IC2_CAPTURE_MASTER_V3"
const SENTINEL="P7_IC2_BATCH_B_MASTER_PREFLIGHT_V3"
const AUTH_SHA256="a975f44698cbc12c688ce48da0100afa49ea6ca8bcc7d49b391164dc3e39828d"
const STAGE_KIND="V1_4_B0_NODE_STAGE_V3"
const META_KIND="V1_4_ANGEL_INSTRUMENT_MASTER_V3"
const OWNER_DB_QUOTA_BYTES=500_000_000
const DB_WARNING_BYTES=400_000_000
const DB_ACTION_BYTES=450_000_000
const DB_HARD_STOP_BYTES=475_000_000
const CAPACITY_SNAPSHOT_BYTES=202_812_563
const CAPACITY_SNAPSHOT_AT="2026-10-06T17:37:14.383727Z"
const CAPACITY_SNAPSHOT_MAX_AGE_MS=30*60*1000
const EXPECTED_B0_CONTROL_INCREMENT_BYTES=100_000
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, content-type"}

async function hexSha256(v:string){const b=new TextEncoder().encode(v);return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b))).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function authorized(req:Request){const h=req.headers.get("authorization")??"";if(!h.startsWith("Bearer "))return false;return await hexSha256(h.slice(7))===AUTH_SHA256}
const json=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}})
function capacity(){
  const ageMs=Date.now()-Date.parse(CAPACITY_SNAPSHOT_AT)
  const projected=CAPACITY_SNAPSHOT_BYTES+EXPECTED_B0_CONTROL_INCREMENT_BYTES
  const level=CAPACITY_SNAPSHOT_BYTES>=DB_HARD_STOP_BYTES?"HARD_STOP":CAPACITY_SNAPSHOT_BYTES>=DB_ACTION_BYTES?"ACTION":CAPACITY_SNAPSHOT_BYTES>=DB_WARNING_BYTES?"WARNING":"NORMAL"
  return{
    ownerQuotaBytes:OWNER_DB_QUOTA_BYTES,
    warningBytes:DB_WARNING_BYTES,
    actionBytes:DB_ACTION_BYTES,
    hardStopBytes:DB_HARD_STOP_BYTES,
    verifiedBytes:CAPACITY_SNAPSHOT_BYTES,
    verifiedAt:CAPACITY_SNAPSHOT_AT,
    snapshotAgeMs:ageMs,
    snapshotFresh:ageMs>=0&&ageMs<=CAPACITY_SNAPSHOT_MAX_AGE_MS,
    expectedControlIncrementBytes:EXPECTED_B0_CONTROL_INCREMENT_BYTES,
    projectedBytes:projected,
    quotaHeadroomBytes:OWNER_DB_QUOTA_BYTES-CAPACITY_SNAPSHOT_BYTES,
    hardStopHeadroomBytes:DB_HARD_STOP_BYTES-CAPACITY_SNAPSHOT_BYTES,
    level,
  }
}
function assertCapacity(){
  const s=capacity()
  if(!s.snapshotFresh)throw new Error("B0_CONTROL_CAPACITY_SNAPSHOT_STALE")
  if(s.projectedBytes>=DB_HARD_STOP_BYTES)throw new Error("B0_CONTROL_CAPACITY_HARD_STOP")
  return s
}
async function usageStart(admin:ReturnType<typeof createClient>,grantId:string){
  const at=new Date().toISOString()
  const ins=await admin.from("provider_usage_events").insert({
    source_code:"ANGEL_ONE",
    ingestion_run_id:null,run_item_id:null,security_id:null,
    data_domain:"BENCHMARK_HISTORY",operation_class:"INSTRUMENT_MASTER",
    accounting_class:"PROVIDER_TOOL_ATTEMPT",
    estimated_internal_units:1,actual_internal_units:1,provider_reported_units:null,
    attempted_at:at,completed_at:null,outcome:"UNKNOWN",safe_error_code:null,
    retry_attempt:0,idempotency_key:"V1_4_B0_NODE_MASTER_"+grantId
  })
  if(ins.error)throw new Error("B0_CONTROL_USAGE_WRITE_FAILED")
}
async function usageResponse(admin:ReturnType<typeof createClient>,grantId:string,outcome:"SUCCEEDED"|"FAILED",code:string|null){
  const up=await admin.from("provider_usage_events").update({
    completed_at:new Date().toISOString(),outcome,safe_error_code:code
  }).eq("source_code","ANGEL_ONE").eq("idempotency_key","V1_4_B0_NODE_MASTER_"+grantId)
  if(up.error)throw new Error("B0_CONTROL_USAGE_UPDATE_FAILED")
}
async function stage(admin:ReturnType<typeof createClient>,grantId:string,name:string,payload:Record<string,unknown>){
  const at=new Date().toISOString(),raw={grant_id:grantId,stage:name,at,...payload}
  const ins=await admin.from("data_source_records").insert({source_code:"ANGEL_ONE",record_kind:STAGE_KIND,external_record_id:grantId+":"+name+":"+at,retrieved_at:at,payload_hash:await hexSha256(JSON.stringify(raw)),raw_payload:raw,terms_snapshot:{mode:"V1_4_B0_NODE_APPEND_ONLY"}})
  if(ins.error)throw new Error("B0_CONTROL_STAGE_WRITE_FAILED")
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors})
  if(req.method!=="POST")return json(405,{code:"METHOD_NOT_ALLOWED"})
  if(!(await authorized(req)))return json(401,{code:"UNAUTHORIZED"})
  const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  if(!url.includes(DEV_REF))return json(409,{code:"UNAPPROVED_PROJECT"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  try{
    const body=await req.json() as Record<string,unknown>,action=String(body.action??"")
    if(action==="HEALTH")return json(200,{ok:true,project:DEV_REF,capacity:capacity()})
    // Every mutating action is gated by a recent authoritative capacity snapshot.
    // Refresh CAPACITY_SNAPSHOT_BYTES / CAPACITY_SNAPSHOT_AT provider-free before any acquisition grant.
    assertCapacity()
    const grantId=String(body.grantId??"")
    if(action==="BEGIN_CAPTURE"){
      const grant=await consumeP4ExecutionGrant(admin,{grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:SENTINEL})
      if(!grant.ok)return json(409,{code:grant.code})
      await usageStart(admin,grantId)
      await stage(admin,grantId,"ATTEMPT_STARTED",{request_outcome:"UNKNOWN"})
      return json(200,{ok:true,grantId})
    }
    if(action==="MARK_STAGE"){
      const stageName=String(body.stage??"")
      if(!["RESPONSE_RECEIVED","BODY_COMPLETE","CAPTURE_PERSISTED"].includes(stageName))return json(400,{code:"INVALID_STAGE"})
      const outcome=String(body.requestOutcome??"UNKNOWN")
      await stage(admin,grantId,stageName,{request_outcome:outcome,http_status:body.httpStatus??null,byte_length:body.byteLength??null,payload_hash:body.payloadHash??null,object_key:body.objectKey??null})
      if(stageName==="RESPONSE_RECEIVED"&&(outcome==="SUCCEEDED"||outcome==="FAILED")){
        await usageResponse(admin,grantId,outcome,outcome==="SUCCEEDED"?null:"B0_PROVIDER_HTTP_FAILED")
      }
      return json(200,{ok:true})
    }
    if(action==="PREFLIGHT_COMPLETE"){
      const preflight=Array.isArray(body.preflight)?body.preflight:[]
      const raw={object_key:String(body.objectKey??""),byte_length:Number(body.byteLength??0),payload_hash:String(body.payloadHash??""),row_count:Number(body.rowCount??0),preflight}
      const at=new Date().toISOString()
      const ins=await admin.from("data_source_records").insert({source_code:"ANGEL_ONE",record_kind:META_KIND,external_record_id:"V1_4_B0_NODE_MASTER_"+grantId,retrieved_at:at,payload_hash:raw.payload_hash,raw_payload:raw,terms_snapshot:{mode:"V1_4_B0_NODE_R2_REFERENCE_ONLY"}})
      if(ins.error)throw new Error("B0_CONTROL_META_WRITE_FAILED")
      await stage(admin,grantId,"PREFLIGHT_COMPLETED",{object_key:raw.object_key,byte_length:raw.byte_length,payload_hash:raw.payload_hash,row_count:raw.row_count})
      return json(200,{ok:true})
    }
    return json(400,{code:"UNKNOWN_ACTION"})
  }catch(e){return json(409,{code:e instanceof Error?e.message:"B0_CONTROL_FAILED"})}
})