import {createHash} from "node:crypto"
import {spoolArtifact} from "../server/b0-artifact-spool.ts"
import {
  V1_4_MASTER_MAX_RESPONSE_BYTES,
  V1_4_MASTER_FETCH_TIMEOUT_MS,
  advanceMasterCaptureAccounting,
  emptyMasterCaptureAccounting,
  scanMasterArtifact,
  captureByteStream,
  readableStreamChunks,
} from "../supabase/functions/_shared/v14-master-capture.ts"
import {V1_4_BATCH_B_CODES,exactOriginalBatchBOrder,type BenchmarkDefinition} from "../supabase/functions/_shared/v14-batch-b-contract.ts"
import {P7_IC_BENCHMARK_REGISTRY} from "../supabase/functions/_shared/p7-ic-benchmark-adapter.ts"

export const config={maxDuration:60}

const AUTH_SHA256="a975f44698cbc12c688ce48da0100afa49ea6ca8bcc7d49b391164dc3e39828d"
const DEV_BRANCH="PortfolioAI-Development"
const GATEWAY_URL="https://portfolioai-b0-r2-gateway-dev.dr-d-dutta.workers.dev"
const CONTROL_URL="https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/p7-ic-b0-node-control"
const MASTER_URL="https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json"
const ROOT="portfolioai-capture/development/v1/b0/"
const CAPTURE_PREFIX=ROOT+"angel-one/instrument-master/"
const TEST_PREFIX=ROOT+"tests/"
const TARGET_SYNTHETIC_BYTES=40*1024*1024
const MAX_TEST_OBJECT_BYTES=1024*1024

function sha256Text(v:string){return createHash("sha256").update(v).digest("hex")}
function bearer(req:Request){const h=req.headers.get("authorization")??"";return h.startsWith("Bearer ")?h.slice(7):null}
function auth(req:Request){const v=bearer(req);return Boolean(v&&sha256Text(v)===AUTH_SHA256)}
function devContext(env:NodeJS.ProcessEnv=process.env){return env.VERCEL_ENV==="preview"&&env.VERCEL_GIT_COMMIT_REF===DEV_BRANCH}
function allowedObjectKey(k:string){return k.startsWith(CAPTURE_PREFIX)||k.startsWith(TEST_PREFIX)}
function captureObjectKey(k:string){return k.startsWith(CAPTURE_PREFIX)}
function classifyPutStatus(s:number){if(s===412)return "B0_R2_OBJECT_EXISTS";if(s===413)return "B0_R2_OBJECT_TOO_LARGE";if(s===401)return "B0_R2_GATEWAY_UNAUTHORIZED";if(s===403)return "B0_R2_KEY_FORBIDDEN";return s>=200&&s<300?"OK":"B0_R2_UPLOAD_FAILED"}
const json=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const defs=()=>P7_IC_BENCHMARK_REGISTRY.filter(x=>V1_4_BATCH_B_CODES.includes(x.code as typeof V1_4_BATCH_B_CODES[number])) as readonly BenchmarkDefinition[]
function exactRows(){
  let token=900000
  return defs().map(d=>({token:String(token++),exch_seg:"NSE",symbol:d.acceptedAliases[0]!,name:d.acceptedAliases[0]!,instrumenttype:"AMXIDX"}))
}
async function* oneChunk(v:Uint8Array){yield v}
function snapshotMem(){const m=process.memoryUsage();return{rss:m.rss,heapUsed:m.heapUsed,heapTotal:m.heapTotal,external:m.external,arrayBuffers:m.arrayBuffers}}
async function* syntheticMaster(target=TARGET_SYNTHETIC_BYTES,peak:{rss:number;heapUsed:number}={rss:0,heapUsed:0}){
  const enc=new TextEncoder(),filler="X".repeat(32*1024)
  yield enc.encode("[")
  let n=1,i=0
  while(n<target){
    const s=(i?",":"")+JSON.stringify({token:"S"+i,exch_seg:"NSE",symbol:"OTHER",name:"OTHER",instrumenttype:"EQ",extra:filler})
    const b=enc.encode(s);n+=b.byteLength;i++
    if((i&31)===0){const m=process.memoryUsage();peak.rss=Math.max(peak.rss,m.rss);peak.heapUsed=Math.max(peak.heapUsed,m.heapUsed)}
    yield b
  }
  for(const row of exactRows())yield enc.encode(","+JSON.stringify(row))
  yield enc.encode("]")
}
async function localFailureTests(){
  const enc=new TextEncoder()
  let malformed="",oversized="",hashMismatch=""
  try{await scanMasterArtifact({chunks:oneChunk(enc.encode('[{"broken":1}')),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES})}catch(e){malformed=e instanceof Error?e.message:String(e)}
  try{await captureByteStream((async function*(){const b=new Uint8Array(1024*1024);for(let i=0;i<65;i++)yield b})(),{write(){},close(){}},V1_4_MASTER_MAX_RESPONSE_BYTES)}catch(e){oversized=e instanceof Error?e.message:String(e)}
  const valid=enc.encode(JSON.stringify(exactRows()))
  try{await scanMasterArtifact({chunks:oneChunk(valid),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES,expectedSha256:"0".repeat(64)})}catch(e){hashMismatch=e instanceof Error?e.message:String(e)}
  const d=defs()[0]!,alias=d.acceptedAliases[0]!
  const amb=enc.encode(JSON.stringify([{token:"1",exch_seg:"NSE",symbol:alias,name:alias,instrumenttype:"AMXIDX"},{token:"2",exch_seg:"NSE",symbol:alias,name:alias,instrumenttype:"AMXIDX"}]))
  const ambiguity=await scanMasterArtifact({chunks:oneChunk(amb),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES})
  let interrupted=advanceMasterCaptureAccounting(emptyMasterCaptureAccounting(),{stage:"ATTEMPT_STARTED"})
  interrupted=advanceMasterCaptureAccounting(interrupted,{stage:"RESPONSE_RECEIVED",responseOk:true})
  return{
    malformed,
    oversized,
    hashMismatch,
    interrupted,
    ambiguousStatus:ambiguity.preflight[0]?.status,
    unauthorizedTargetRejected:!allowedObjectKey("portfolioai-history/development/p8/forbidden.json"),
    overwriteClassification:classifyPutStatus(412),
  }
}
async function selfTest(){
  const start=performance.now(),before=snapshotMem(),peak={rss:before.rss,heapUsed:before.heapUsed}
  const scan=await scanMasterArtifact({chunks:syntheticMaster(TARGET_SYNTHETIC_BYTES,peak),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES})
  const artifact=await spoolArtifact(syntheticMaster(TARGET_SYNTHETIC_BYTES,peak),V1_4_MASTER_MAX_RESPONSE_BYTES)
  let spool
  try{
    const readback=await scanMasterArtifact({chunks:readableStreamChunks(artifact.stream() as unknown as ReadableStream<Uint8Array>),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES,expectedSha256:artifact.sha256})
    if(readback.sha256!==scan.sha256||readback.byteLength!==scan.byteLength)throw new Error("B0_SPOOL_READBACK_MISMATCH")
    spool={byteLength:artifact.byteLength,sha256:artifact.sha256,readbackVerified:true}
  }finally{await artifact.cleanup()}
  const after=snapshotMem(),failures=await localFailureTests()
  return{
    runtime:{node:process.version,vercelEnv:process.env.VERCEL_ENV??null,gitRef:process.env.VERCEL_GIT_COMMIT_REF??null,region:process.env.VERCEL_REGION??null},
    durationMs:Math.round(performance.now()-start),
    memory:{before,after,observedPeak:{rss:Math.max(peak.rss,after.rss),heapUsed:Math.max(peak.heapUsed,after.heapUsed)}},
    synthetic:{byteLength:scan.byteLength,sha256:scan.sha256,rowCount:scan.rowCount,allExact:scan.preflight.every(x=>x.status==="EXACT_MATCH"),statuses:scan.preflight.map(x=>({code:x.code,status:x.status}))},
    failures,spool,
  }
}
async function smallPayload(){
  const enc=new TextEncoder(),rows=[...exactRows(),{token:"X",exch_seg:"NSE",symbol:"OTHER",name:"OTHER",instrumenttype:"EQ",extra:"Y".repeat(128*1024)}]
  const b=enc.encode(JSON.stringify(rows));if(b.byteLength>MAX_TEST_OBJECT_BYTES)throw new Error("B0_TEST_OBJECT_TOO_LARGE");return b
}
async function gatewayFetch(token:string,key:string,method:string,body?:BodyInit,byteLength?:number){
  if(!allowedObjectKey(key))throw new Error("B0_R2_KEY_FORBIDDEN")
  const headers=new Headers({authorization:"Bearer "+token,"x-b0-object-key":key})
  if(body)headers.set("content-type","application/json")
  if(byteLength!==undefined)headers.set("content-length",String(byteLength))
  return fetch(GATEWAY_URL,{method,headers,body,redirect:"error",signal:AbortSignal.timeout(60_000),...(body?{duplex:"half" as const}:{})} as RequestInit)
}
async function r2Test(token:string){
  const id=crypto.randomUUID(),key=TEST_PREFIX+id+"/master.json",payload=await smallPayload(),expected=createHash("sha256").update(payload).digest("hex"),start=performance.now()
  let uploaded=false,deleted=false
  try{
    const put=await gatewayFetch(token,key,"PUT",payload);const pc=classifyPutStatus(put.status);if(pc!=="OK")throw new Error(pc);uploaded=true
    const get=await gatewayFetch(token,key,"GET");if(!get.ok||!get.body)throw new Error("B0_R2_READBACK_FAILED")
    const read=await scanMasterArtifact({chunks:readableStreamChunks(get.body),definitions:defs(),requestedCodes:V1_4_BATCH_B_CODES,expectedSha256:expected,maxBytes:MAX_TEST_OBJECT_BYTES})
    if(read.byteLength!==payload.byteLength)throw new Error("B0_R2_BYTE_LENGTH_MISMATCH")
    return{key,byteLength:read.byteLength,sha256:read.sha256,rowCount:read.rowCount,allExact:read.preflight.every(x=>x.status==="EXACT_MATCH"),durationMs:Math.round(performance.now()-start)}
  }finally{
    if(uploaded){const del=await gatewayFetch(token,key,"DELETE");deleted=del.status===204;if(!deleted)throw new Error("B0_R2_TEST_CLEANUP_FAILED")}
  }
}
async function control(token:string,body:Record<string,unknown>){
  const r=await fetch(CONTROL_URL,{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify(body),redirect:"error",signal:AbortSignal.timeout(15_000)})
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(String((data as Record<string,unknown>).code??"B0_CONTROL_FAILED"));return data
}
function validateCodes(v:unknown){if(!Array.isArray(v)||!v.every(x=>typeof x==="string")||!exactOriginalBatchBOrder(v as string[]))throw new Error("P7_IC_BATCH_B_EXACT_ORDER_REQUIRED");return v as string[]}
async function capture(token:string,body:Record<string,unknown>){
  const grantId=String(body.grantId??""),codes=validateCodes(body.benchmarkCodes)
  await control(token,{action:"BEGIN_CAPTURE",grantId})
  let response:Response
  try{response=await fetch(MASTER_URL,{headers:{accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(V1_4_MASTER_FETCH_TIMEOUT_MS)})}
  catch(e){throw new Error("B0_PROVIDER_TRANSPORT_UNKNOWN")}
  await control(token,{action:"MARK_STAGE",grantId,stage:"RESPONSE_RECEIVED",requestOutcome:response.ok?"SUCCEEDED":"FAILED",httpStatus:response.status})
  if(!response.ok||!response.body)throw new Error("B0_PROVIDER_HTTP_FAILED")
  const declared=Number(response.headers.get("content-length")??"0");if(declared>V1_4_MASTER_MAX_RESPONSE_BYTES)throw new Error("P7_IC_BENCHMARK_MASTER_RESPONSE_TOO_LARGE")
  const retrievedAt=new Date().toISOString(),objectKey=CAPTURE_PREFIX+grantId+"/"+retrievedAt.replace(/[:.]/gu,"-")+".json"
  const artifact=await spoolArtifact(readableStreamChunks(response.body),V1_4_MASTER_MAX_RESPONSE_BYTES)
  try{
    const bytes=artifact.byteLength,payloadHash=artifact.sha256
    await control(token,{action:"MARK_STAGE",grantId,stage:"BODY_COMPLETE",requestOutcome:"SUCCEEDED",httpStatus:response.status,byteLength:bytes,payloadHash,objectKey})
    const put=await gatewayFetch(token,objectKey,"PUT",artifact.stream() as unknown as BodyInit,bytes)
    const pc=classifyPutStatus(put.status);if(pc!=="OK")throw new Error(pc)
    await control(token,{action:"MARK_STAGE",grantId,stage:"CAPTURE_PERSISTED",requestOutcome:"SUCCEEDED",httpStatus:response.status,byteLength:bytes,payloadHash,objectKey})
    return{grantId,codes,objectKey,byteLength:bytes,payloadHash,retrievedAt}
  }finally{await artifact.cleanup()}
}
async function preflight(token:string,body:Record<string,unknown>){
  const grantId=String(body.grantId??""),objectKey=String(body.objectKey??""),expected=String(body.payloadHash??""),codes=validateCodes(body.benchmarkCodes)
  if(!captureObjectKey(objectKey)||!/^[0-9a-f]{64}$/u.test(expected))throw new Error("B0_PREFLIGHT_SCOPE_INVALID")
  const get=await gatewayFetch(token,objectKey,"GET");if(!get.ok||!get.body)throw new Error("B0_R2_READBACK_FAILED")
  const scan=await scanMasterArtifact({chunks:readableStreamChunks(get.body),definitions:defs(),requestedCodes:codes,expectedSha256:expected})
  await control(token,{action:"PREFLIGHT_COMPLETE",grantId,objectKey,byteLength:scan.byteLength,payloadHash:scan.sha256,rowCount:scan.rowCount,preflight:scan.preflight})
  return{grantId,objectKey,byteLength:scan.byteLength,payloadHash:scan.sha256,rowCount:scan.rowCount,preflight:scan.preflight,allExact:scan.preflight.every(x=>x.status==="EXACT_MATCH")}
}
async function handleRequest(request:Request){
  const url=new URL(request.url)
  if(request.method==="GET"&&url.searchParams.get("action")==="SELF_TEST"){
    if(!devContext())return json(409,{code:"UNAPPROVED_RUNTIME",vercelEnv:process.env.VERCEL_ENV??null,gitRef:process.env.VERCEL_GIT_COMMIT_REF??null})
    try{return json(200,{mode:"SELF_TEST",auth:"VERCEL_DEPLOYMENT_PROTECTION",result:await selfTest()})}
    catch(e){return json(409,{code:e instanceof Error?e.message:"B0_NODE_SELF_TEST_FAILED"})}
  }
  if(request.method!=="POST")return json(405,{code:"METHOD_NOT_ALLOWED"})
  if(!auth(request))return json(401,{code:"UNAUTHORIZED"})
  if(!devContext())return json(409,{code:"UNAPPROVED_RUNTIME",vercelEnv:process.env.VERCEL_ENV??null,gitRef:process.env.VERCEL_GIT_COMMIT_REF??null})
  const token=bearer(request)!
  try{
    const body=await request.json() as Record<string,unknown>,action=String(body.action??"")
    if(action==="SELF_TEST")return json(200,{mode:"SELF_TEST",result:await selfTest()})
    if(action==="R2_TEST")return json(200,{mode:"R2_TEST",result:await r2Test(token)})
    if(action==="CAPTURE")return json(200,{mode:"CAPTURE",result:await capture(token,body)})
    if(action==="PREFLIGHT")return json(200,{mode:"PREFLIGHT",result:await preflight(token,body)})
    return json(400,{code:"UNKNOWN_ACTION"})
  }catch(e){return json(409,{code:e instanceof Error?e.message:"B0_NODE_FAILED"})}
}

export default { fetch: handleRequest }
