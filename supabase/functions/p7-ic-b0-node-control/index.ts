import {createClient} from "https://esm.sh/@supabase/supabase-js@2"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="P7_IC2_CAPTURE_MASTER_V3"
const SENTINEL="P7_IC2_BATCH_B_MASTER_PREFLIGHT_V3"
const AUTH_SHA256="a975f44698cbc12c688ce48da0100afa49ea6ca8bcc7d49b391164dc3e39828d"
const STAGE_KIND="V1_4_B0_NODE_STAGE_V3"
const META_KIND="V1_4_ANGEL_INSTRUMENT_MASTER_V3"
const MAX_DB_BYTES=200_000_000
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, content-type"}

async function hexSha256(v:string){const b=new TextEncoder().encode(v);return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b))).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function authorized(req:Request){const h=req.headers.get("authorization")??"";if(!h.startsWith("Bearer "))return false;return await hexSha256(h.slice(7))===AUTH_SHA256}
const json=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}})
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
    if(action==="HEALTH")return json(200,{ok:true,project:DEV_REF,maxDbBytes:MAX_DB_BYTES,writeGate:"FAIL_CLOSED_WHEN_SIZE_UNKNOWN"})
    // Current verified Dev database size is above MAX_DB_BYTES. Mutating actions remain
    // fail-closed until a later provider-free deployment explicitly reopens this gate
    // after an external authoritative pg_database_size verification below the ceiling.
    return json(409,{code:"DB_SIZE_GATE_BLOCKED",maxDbBytes:MAX_DB_BYTES})
    const grantId=String(body.grantId??"")
    if(action==="BEGIN_CAPTURE"){
      const grant=await consumeP4ExecutionGrant(admin,{grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:SENTINEL})
      if(!grant.ok)return json(409,{code:grant.code})
      await stage(admin,grantId,"ATTEMPT_STARTED",{request_outcome:"UNKNOWN"})
      return json(200,{ok:true,grantId})
    }
    if(action==="MARK_STAGE"){
      const stageName=String(body.stage??"")
      if(!["RESPONSE_RECEIVED","BODY_COMPLETE","CAPTURE_PERSISTED"].includes(stageName))return json(400,{code:"INVALID_STAGE"})
      await stage(admin,grantId,stageName,{request_outcome:String(body.requestOutcome??"UNKNOWN"),http_status:body.httpStatus??null,byte_length:body.byteLength??null,payload_hash:body.payloadHash??null,object_key:body.objectKey??null})
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