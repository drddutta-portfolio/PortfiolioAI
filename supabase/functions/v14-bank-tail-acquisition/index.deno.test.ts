let handler:(r:Request)=>Promise<Response>
Deno.test("bank tail executor rejects Production and missing or wrong grants before provider requests/writes",async()=>{
 const serve=Deno.serve,get=Deno.env.get,fetch=globalThis.fetch
 let project="lrgpjimipfkyoqbpsqzz",requests=0
 try{
  Deno.serve=((fn:typeof handler)=>{handler=fn;return {}}) as typeof Deno.serve
  Deno.env.get=(name:string)=>name==="SUPABASE_URL"?`https://${project}.supabase.co`:"test-only-non-secret"
  globalThis.fetch=(async(input:string|URL|Request)=>{requests++;const url=new URL(input instanceof Request?input.url:String(input));if(!url.pathname.startsWith("/rest/v1/data_source_records"))throw new Error("Unexpected provider/storage call");return new Response("null",{headers:{"content-type":"application/json"}})}) as typeof fetch
  await import("./index.ts")
  const req=(body:unknown)=>new Request("https://example.invalid",{method:"POST",body:JSON.stringify(body)})
  let r=await handler(req({action:"V1_4_BANK_TAIL_2026_10_08",portfolioId:"6193a4aa-3235-4057-bddc-209fcf443fc2"}))
  if(r.status!==401||requests!==0)throw new Error("Missing grant admitted")
  r=await handler(req({action:"V1_4_BANK_TAIL_2026_10_08",portfolioId:"6193a4aa-3235-4057-bddc-209fcf443fc2",grantId:"00000000-0000-4000-8000-000000000001"}))
  if(r.status!==401||Number(requests)!==1)throw new Error("Unknown grant admitted")
  project="uxiyufbsbgzzdujzcdxe";requests=0
  r=await handler(req({}));if(r.status!==409||requests!==0)throw new Error("Production admitted")
 }finally{Deno.serve=serve;Deno.env.get=get;globalThis.fetch=fetch}
})
