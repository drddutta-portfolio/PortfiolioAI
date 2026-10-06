import {createClient} from "https://esm.sh/@supabase/supabase-js@2"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {P7_IC_BENCHMARK_REGISTRY} from "../_shared/p7-ic-benchmark-adapter.ts"
import {V1_4_BATCH_B_CODES,exactOriginalBatchBOrder,type BenchmarkDefinition} from "../_shared/v14-batch-b-contract.ts"
import {
  V1_4_MASTER_MAX_RESPONSE_BYTES,V1_4_MASTER_FETCH_TIMEOUT_MS,V1_4_MASTER_STORAGE_TIMEOUT_MS,
  advanceMasterCaptureAccounting,captureByteStream,emptyMasterCaptureAccounting,readableStreamChunks,scanMasterArtifact,
  type ByteSink,type MasterCaptureAccounting,type MasterCaptureStage,
} from "../_shared/v14-master-capture.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const BUCKET="provider-capture-artifacts"
const MASTER_URL="https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json"
const MASTER_KIND="V1_4_ANGEL_INSTRUMENT_MASTER_V2"
const STAGE_KIND="V1_4_B0_CAPTURE_STAGE_V2"
const CAPTURE_ACTION="P7_IC2_CAPTURE_MASTER_V2"
const CAPTURE_SENTINEL="P7_IC2_BATCH_B_MASTER_PREFLIGHT_V2"
const OWNER_CONFIRMATION="OWNER_AUTHORIZED_B0_V2_PREP_2026_10_06"
const CAPTURE_CONFIRMATION="OWNER_CONFIRMED_V1_4_BATCH_B_MASTER_PREFLIGHT_V2"
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}
const json=(s:number,b:Record<string,unknown>)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}})
const projectRef=(v:string)=>{try{return new URL(v).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const safe=(e:unknown)=>e instanceof Error&&/^P7_IC_[A-Z0-9_]+$/u.test(e.message)?e.message:"P7_IC_B0_V2_FAILED"
const defs=()=>P7_IC_BENCHMARK_REGISTRY.filter(x=>V1_4_BATCH_B_CODES.includes(x.code as typeof V1_4_BATCH_B_CODES[number])) as readonly BenchmarkDefinition[]
async function sha(v:string){const b=new TextEncoder().encode(v);return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",b))).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function stage(admin:ReturnType<typeof createClient>,grantId:string,stageName:MasterCaptureStage,state:MasterCaptureAccounting,extra:Record<string,unknown>={}){
  const at=new Date().toISOString(),payload={grant_id:grantId,stage:stageName,state,at,...extra}
  const r=await admin.from("data_source_records").insert({source_code:"ANGEL_ONE",record_kind:STAGE_KIND,external_record_id:grantId+":"+stageName+":"+at,retrieved_at:at,payload_hash:await sha(JSON.stringify(payload)),raw_payload:payload,terms_snapshot:{mode:"V1_4_B0_V2_APPEND_ONLY_STAGE"}})
  if(r.error)throw new Error("P7_IC_BENCHMARK_MASTER_STAGE_PERSIST_FAILED")
}
async function usageStart(admin:ReturnType<typeof createClient>,grantId:string,at:string){
  const r=await admin.from("provider_usage_events").insert({source_code:"ANGEL_ONE",ingestion_run_id:null,run_item_id:null,security_id:null,data_domain:"BENCHMARK_HISTORY",operation_class:"INSTRUMENT_MASTER",accounting_class:"PROVIDER_TOOL_ATTEMPT",estimated_internal_units:1,actual_internal_units:1,provider_reported_units:null,attempted_at:at,completed_at:null,outcome:"UNKNOWN",safe_error_code:null,retry_attempt:0,idempotency_key:"V1_4_B0_V2_MASTER_"+grantId})
  if(r.error)throw new Error("P7_IC_PROVIDER_USAGE_PERSIST_FAILED")
}
async function usageFinish(admin:ReturnType<typeof createClient>,grantId:string,outcome:"SUCCEEDED"|"FAILED",code:string|null){
  const r=await admin.from("provider_usage_events").update({completed_at:new Date().toISOString(),outcome,safe_error_code:code}).eq("source_code","ANGEL_ONE").eq("idempotency_key","V1_4_B0_V2_MASTER_"+grantId)
  if(r.error)throw new Error("P7_IC_PROVIDER_USAGE_PERSIST_FAILED")
}
async function ensureBucket(admin:ReturnType<typeof createClient>){
  const listed=await admin.storage.listBuckets()
  if(listed.error)throw new Error("P7_IC_B0_V2_STORAGE_LIST_FAILED")
  const existing=listed.data.find(x=>x.name===BUCKET)
  if(!existing){
    const c=await admin.storage.createBucket(BUCKET,{public:false,fileSizeLimit:V1_4_MASTER_MAX_RESPONSE_BYTES,allowedMimeTypes:["application/json","application/octet-stream"]})
    if(c.error){console.error("B0_V2_STORAGE_CREATE_ERROR",JSON.stringify({message:c.error.message,statusCode:(c.error as {statusCode?:unknown}).statusCode,error:(c.error as {error?:unknown}).error}));throw new Error("P7_IC_B0_V2_STORAGE_CREATE_FAILED")}
  }
  return true
}
function validateCodes(v:unknown){if(!Array.isArray(v)||!v.every(x=>typeof x==="string")||!exactOriginalBatchBOrder(v as string[]))throw new Error("P7_IC_BATCH_B_EXACT_ORDER_REQUIRED");return v as string[]}
function encodedPath(p:string){return p.split("/").map(encodeURIComponent).join("/")}
async function uploadFile(url:string,key:string,path:string,filePath:string,contentType:string){
  const file=await Deno.open(filePath,{read:true}),stat=await Deno.stat(filePath)
  const r=await fetch(url+"/storage/v1/object/"+BUCKET+"/"+encodedPath(path),{
    method:"POST",
    headers:{Authorization:"Bearer "+key,apikey:key,"Content-Type":contentType,"Content-Length":String(stat.size),"x-upsert":"false"},
    body:file.readable,
    signal:AbortSignal.timeout(V1_4_MASTER_STORAGE_TIMEOUT_MS),
  })
  if(!r.ok)throw new Error("P7_IC_B0_V2_STORAGE_UPLOAD_FAILED")
  return path
}
async function signedRead(admin:ReturnType<typeof createClient>,path:string){
  const signed=await admin.storage.from(BUCKET).createSignedUrl(path,60)
  if(signed.error||!signed.data?.signedUrl)throw new Error("P7_IC_B0_V2_STORAGE_SIGN_FAILED")
  const r=await fetch(signed.data.signedUrl,{signal:AbortSignal.timeout(V1_4_MASTER_STORAGE_TIMEOUT_MS)})
  if(!r.ok||!r.body)throw new Error("P7_IC_B0_V2_STORAGE_READ_FAILED")
  return r
}
async function fileSink(path:string):Promise<ByteSink>{
  const f=await Deno.open(path,{create:true,write:true,truncate:true}),w=f.writable.getWriter()
  return{write:c=>w.write(c),close:()=>w.close(),abort:async()=>{try{await w.abort()}catch{}}}
}
async function* syntheticMaster(){
  const enc=new TextEncoder(),filler="X".repeat(48*1024),row=JSON.stringify({token:"S",exch_seg:"NSE",symbol:"OTHER",name:"OTHER",instrumenttype:"EQ",extra:filler})
  yield enc.encode("[");let n=1,i=0
  while(n<32*1024*1024){const s=(i?",":"")+row.replace('"S"',`"S${i}"`);const b=enc.encode(s);n+=b.byteLength;i++;yield b}
  let token=900000
  for(const d of defs()){const alias=d.acceptedAliases[0]!,s=","+JSON.stringify({token:String(token++),exch_seg:"NSE",symbol:alias,name:alias,instrumenttype:"AMXIDX"});yield enc.encode(s)}
  yield enc.encode("]")
}
async function createSyntheticFile(path:string){
  const sink=await fileSink(path)
  return captureByteStream(syntheticMaster(),sink)
}
async function uploadBytes(admin:ReturnType<typeof createClient>,path:string,bytes:Uint8Array,contentType:string){
  const r=await admin.storage.from(BUCKET).upload(path,bytes,{contentType,upsert:false})
  if(r.error)throw new Error("P7_IC_B0_V2_STORAGE_UPLOAD_FAILED")
}
async function syntheticLocalVerify(){
  const tmp="/tmp/"+crypto.randomUUID()+".json",results:Record<string,unknown>={}
  try{
    const created=await createSyntheticFile(tmp);results.tmpCapture=created
    const file=await Deno.open(tmp,{read:true})
    const scan=await scanMasterArtifact({chunks:readableStreamChunks(file.readable),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES,expectedSha256:created.sha256})
    results.localReadback={byteLength:scan.byteLength,sha256:scan.sha256,rowCount:scan.rowCount,allExact:scan.preflight.every(x=>x.status==="EXACT_MATCH"),statuses:scan.preflight.map(x=>({code:x.code,status:x.status}))}
    let malformed=""
    try{await scanMasterArtifact({chunks:(async function*(){yield new TextEncoder().encode('[{"broken":1}')})(),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES})}catch(e){malformed=safe(e)}
    results.malformed=malformed
    const oneMiB=new Uint8Array(1024*1024);let oversize=""
    try{await captureByteStream((async function*(){for(let i=0;i<65;i++)yield oneMiB})(),{write(){},close(){}},V1_4_MASTER_MAX_RESPONSE_BYTES)}catch(e){oversize=safe(e)}
    results.oversize=oversize
    let acc=advanceMasterCaptureAccounting(emptyMasterCaptureAccounting(),{stage:"ATTEMPT_STARTED"});results.interrupted=acc
    acc=advanceMasterCaptureAccounting(acc,{stage:"RESPONSE_RECEIVED",responseOk:true})
    acc=advanceMasterCaptureAccounting(acc,{stage:"BODY_COMPLETE"})
    acc=advanceMasterCaptureAccounting(acc,{stage:"CAPTURE_PERSISTED"})
    acc=advanceMasterCaptureAccounting(acc,{stage:"PREFLIGHT_COMPLETED"})
    results.completedAccounting=acc
    return results
  }finally{await Deno.remove(tmp).catch(()=>undefined)}
}
async function syntheticVerify(admin:ReturnType<typeof createClient>){
  await ensureBucket(admin)
  const prefix="synthetic-b0-v2/"+crypto.randomUUID(),good=prefix+"/master.json",bad=prefix+"/malformed.json",tmp="/tmp/"+crypto.randomUUID()+".json"
  const cleanup=[good,bad],results:Record<string,unknown>={}
  try{
    const created=await createSyntheticFile(tmp);results.tmpCapture=created
    await uploadFile(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,good,tmp,"application/json")
    const rr=await signedRead(admin,good)
    const scan=await scanMasterArtifact({chunks:readableStreamChunks(rr.body!),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES,expectedSha256:created.sha256})
    results.readback={byteLength:scan.byteLength,sha256:scan.sha256,rowCount:scan.rowCount,allExact:scan.preflight.every(x=>x.status==="EXACT_MATCH"),statuses:scan.preflight.map(x=>({code:x.code,status:x.status}))}
    await uploadBytes(admin,bad,new TextEncoder().encode('[{"broken":1}'),"application/json")
    const br=await signedRead(admin,bad);let malformed=""
    try{await scanMasterArtifact({chunks:readableStreamChunks(br.body!),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES})}catch(e){malformed=safe(e)}
    results.malformed=malformed
    const oneMiB=new Uint8Array(1024*1024);let oversize=""
    try{await captureByteStream((async function*(){for(let i=0;i<65;i++)yield oneMiB})(),{write(){},close(){}},V1_4_MASTER_MAX_RESPONSE_BYTES)}catch(e){oversize=safe(e)}
    results.oversize=oversize
    let acc=advanceMasterCaptureAccounting(emptyMasterCaptureAccounting(),{stage:"ATTEMPT_STARTED"})
    results.interrupted=acc
    acc=advanceMasterCaptureAccounting(acc,{stage:"RESPONSE_RECEIVED",responseOk:true})
    acc=advanceMasterCaptureAccounting(acc,{stage:"BODY_COMPLETE"})
    acc=advanceMasterCaptureAccounting(acc,{stage:"CAPTURE_PERSISTED"})
    acc=advanceMasterCaptureAccounting(acc,{stage:"PREFLIGHT_COMPLETED"})
    results.completedAccounting=acc
    return results
  }finally{
    await admin.storage.from(BUCKET).remove(cleanup).catch(()=>undefined)
    await Deno.remove(tmp).catch(()=>undefined)
  }
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors})
  if(req.method!=="POST")return json(405,{error:"Method not allowed"})
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if(!url||!key)return json(500,{error:"Server configuration incomplete"})
  const ref=projectRef(url);if(ref===PROD_REF)return json(409,{code:"UNEXPECTED_PRODUCTION_DB_TARGET"});if(ref!==DEV_REF)return json(409,{code:"UNAPPROVED_DEVELOPMENT_DB_TARGET"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  try{
    const body=await req.json() as Record<string,unknown>,action=String(body.action??"")
    if(action==="PREPARE_STORAGE"){
      if(body.confirmation!==OWNER_CONFIRMATION)throw new Error("P7_IC_B0_V2_OWNER_CONFIRMATION_REQUIRED")
      await ensureBucket(admin);return json(200,{mode:"B0_V2_STORAGE_READY",bucket:BUCKET,maxObjectBytes:V1_4_MASTER_MAX_RESPONSE_BYTES})
    }
    if(action==="SYNTHETIC_LOCAL_VERIFY"){
      if(body.confirmation!==OWNER_CONFIRMATION)throw new Error("P7_IC_B0_V2_OWNER_CONFIRMATION_REQUIRED")
      return json(200,{mode:"B0_V2_SYNTHETIC_LOCAL_VERIFY",results:await syntheticLocalVerify()})
    }
    if(action==="SYNTHETIC_VERIFY"){
      if(body.confirmation!==OWNER_CONFIRMATION)throw new Error("P7_IC_B0_V2_OWNER_CONFIRMATION_REQUIRED")
      return json(200,{mode:"B0_V2_SYNTHETIC_VERIFY",results:await syntheticVerify(admin)})
    }
    if(action==="B0_V2_CAPTURE"){
      if(body.confirmation!==CAPTURE_CONFIRMATION||body.portfolioId!==PORTFOLIO_ID)throw new Error("P7_IC_B0_V2_CAPTURE_SCOPE_INVALID")
      const codes=validateCodes(body.benchmarkCodes),grantId=String(body.grantId??"")
      await ensureBucket(admin)
      const grant=await consumeP4ExecutionGrant(admin,{grantId,action:CAPTURE_ACTION,portfolioId:PORTFOLIO_ID,securityId:CAPTURE_SENTINEL})
      if(!grant.ok)throw new Error(grant.code)
      let state=advanceMasterCaptureAccounting(emptyMasterCaptureAccounting(),{stage:"ATTEMPT_STARTED"}),at=new Date().toISOString()
      await stage(admin,grantId,"ATTEMPT_STARTED",state);await usageStart(admin,grantId,at)
      let response:Response
      try{response=await fetch(MASTER_URL,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(V1_4_MASTER_FETCH_TIMEOUT_MS)})}
      catch(e){throw e}
      state=advanceMasterCaptureAccounting(state,{stage:"RESPONSE_RECEIVED",responseOk:response.ok});await stage(admin,grantId,"RESPONSE_RECEIVED",state,{http_status:response.status,content_type:response.headers.get("content-type"),content_length:response.headers.get("content-length")})
      await usageFinish(admin,grantId,response.ok?"SUCCEEDED":"FAILED",response.ok?null:"P7_IC_BENCHMARK_MASTER_HTTP_FAILED")
      if(!response.ok||!response.body)throw new Error("P7_IC_BENCHMARK_MASTER_HTTP_FAILED")
      const declared=Number(response.headers.get("content-length")??"0");if(declared>V1_4_MASTER_MAX_RESPONSE_BYTES)throw new Error("P7_IC_BENCHMARK_MASTER_RESPONSE_TOO_LARGE")
      const tmp="/tmp/"+crypto.randomUUID()+".json"
      try{
        const cap=await captureByteStream(readableStreamChunks(response.body),await fileSink(tmp))
        state=advanceMasterCaptureAccounting(state,{stage:"BODY_COMPLETE"});await stage(admin,grantId,"BODY_COMPLETE",state,{byte_length:cap.byteLength,payload_hash:cap.sha256})
        const objectPath="angel-one/instrument-master/"+grantId+".json";await uploadFile(url,key,objectPath,tmp,response.headers.get("content-type")??"application/json")
        state=advanceMasterCaptureAccounting(state,{stage:"CAPTURE_PERSISTED"});await stage(admin,grantId,"CAPTURE_PERSISTED",state,{storage_bucket:BUCKET,object_path:objectPath,byte_length:cap.byteLength,payload_hash:cap.sha256})
        const completedAt=new Date().toISOString(),meta={storage_bucket:BUCKET,object_path:objectPath,byte_length:cap.byteLength,http_status:response.status,content_type:response.headers.get("content-type"),codes,stage:"CAPTURE_PERSISTED"}
        const rec=await admin.from("data_source_records").insert({source_code:"ANGEL_ONE",record_kind:MASTER_KIND,external_record_id:"V1_4_B0_V2_MASTER_"+grantId,source_observed_at:completedAt,retrieved_at:completedAt,payload_hash:cap.sha256,source_url:MASTER_URL,raw_payload:meta,terms_snapshot:{mode:"V1_4_B0_V2",retry_attempt:0,history_calls:0,max_response_bytes:V1_4_MASTER_MAX_RESPONSE_BYTES}}).select("id").single()
        if(rec.error)throw new Error("P7_IC_BENCHMARK_MASTER_PERSIST_FAILED")
        return json(200,{mode:"B0_V2_CAPTURE_PERSISTED",masterSourceRecordId:rec.data.id,master:{...meta,payload_hash:cap.sha256}})
      }finally{await Deno.remove(tmp).catch(()=>undefined)}
    }
    if(action==="B0_V2_PREFLIGHT"){
      if(body.confirmation!==CAPTURE_CONFIRMATION||body.portfolioId!==PORTFOLIO_ID)throw new Error("P7_IC_B0_V2_CAPTURE_SCOPE_INVALID")
      const codes=validateCodes(body.benchmarkCodes),id=String(body.masterSourceRecordId??"")
      const rec=await admin.from("data_source_records").select("id,payload_hash,raw_payload").eq("id",id).eq("source_code","ANGEL_ONE").eq("record_kind",MASTER_KIND).maybeSingle()
      if(rec.error||!rec.data)throw new Error("P7_IC_BENCHMARK_MASTER_ARTIFACT_NOT_FOUND")
      const p=rec.data.raw_payload as Record<string,unknown>,path=String(p.object_path??"")
      if(p.storage_bucket!==BUCKET||!path)throw new Error("P7_IC_B0_V2_STORAGE_METADATA_INVALID")
      const rr=await signedRead(admin,path),scan=await scanMasterArtifact({chunks:readableStreamChunks(rr.body!),definitions:defs(),requestedCodes:codes,expectedSha256:String(rec.data.payload_hash)})
      const grantId=String(p.object_path).split("/").at(-1)?.replace(/\.json$/u,"")??"UNKNOWN"
      let state=advanceMasterCaptureAccounting(emptyMasterCaptureAccounting(),{stage:"ATTEMPT_STARTED"});state=advanceMasterCaptureAccounting(state,{stage:"RESPONSE_RECEIVED",responseOk:true});state=advanceMasterCaptureAccounting(state,{stage:"BODY_COMPLETE"});state=advanceMasterCaptureAccounting(state,{stage:"CAPTURE_PERSISTED"});state=advanceMasterCaptureAccounting(state,{stage:"PREFLIGHT_COMPLETED"})
      await stage(admin,grantId,"PREFLIGHT_COMPLETED",state,{master_source_record_id:id,byte_length:scan.byteLength,payload_hash:scan.sha256,row_count:scan.rowCount,preflight:scan.preflight})
      return json(200,{mode:"B0_V2_PREFLIGHT_COMPLETED",masterSourceRecordId:id,rowCount:scan.rowCount,payloadHash:scan.sha256,preflight:scan.preflight,allExact:scan.preflight.every(x=>x.status==="EXACT_MATCH")})
    }
    return json(400,{code:"P7_IC_B0_V2_UNKNOWN_ACTION"})
  }catch(e){return json(409,{code:safe(e),error:"B0 V2 failed safely."})}
})
