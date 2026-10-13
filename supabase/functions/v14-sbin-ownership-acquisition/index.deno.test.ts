let handler:(r:Request)=>Promise<Response>
Deno.test("SBIN acquisition rejects Production, other securities and missing grants without provider spending",async()=>{
 const serve=Deno.serve,get=Deno.env.get,fetch=globalThis.fetch
 let project="lrgpjimipfkyoqbpsqzz",requests=0
 try{
  Deno.serve=((fn:typeof handler)=>{handler=fn;return {}}) as typeof Deno.serve
  Deno.env.get=(name:string)=>name==="SUPABASE_URL"?`https://${project}.supabase.co`:"test-only-non-secret"
  globalThis.fetch=(async()=>{requests++;throw new Error("Unexpected external request")}) as typeof fetch
  const {ownershipTransportContainsEvidence}=await import("./index.ts")
  for(const raw of ["","status: error\nmessage: View returned non-success error status: 1 (No shareholding data available). [code:1011]","status: error\nmessage: unavailable"]){if(ownershipTransportContainsEvidence(raw))throw new Error("Business error classified as ownership evidence")}
  const invoke=(patch:Record<string,unknown>={})=>handler(new Request("https://example.invalid",{method:"POST",body:JSON.stringify({action:"V1_4_SBIN_OWNERSHIP_CAPTURE_2026_10_09",portfolioId:"6193a4aa-3235-4057-bddc-209fcf443fc2",securityId:"d77abadc-d171-49d9-bfee-0b34dd0281f4",...patch})}))
  let r=await invoke();if(r.status!==401||requests!==0)throw new Error("Missing grant admitted")
  r=await invoke({securityId:"00000000-0000-4000-8000-000000000001"});if(r.status!==400||requests!==0)throw new Error("Other security admitted")
  project="uxiyufbsbgzzdujzcdxe";r=await invoke();if(r.status!==409||requests!==0)throw new Error("Production admitted")
 }finally{Deno.serve=serve;Deno.env.get=get;globalThis.fetch=fetch}
})
