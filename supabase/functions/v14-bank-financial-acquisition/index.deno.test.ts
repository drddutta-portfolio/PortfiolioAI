let handler:(r:Request)=>Promise<Response>
Deno.test("bank financial refresh stays inside four frozen slices and rejects wrong project/scope/grant before spending",async()=>{
 const serve=Deno.serve,get=Deno.env.get,fetch=globalThis.fetch
 let project="lrgpjimipfkyoqbpsqzz",requests=0
 try{
  Deno.serve=((fn:typeof handler)=>{handler=fn;return {}}) as typeof Deno.serve
  Deno.env.get=(name:string)=>name==="SUPABASE_URL"?`https://${project}.supabase.co`:"test-only-non-secret"
  globalThis.fetch=(async()=>{requests++;throw new Error("Unexpected external request")}) as typeof fetch
  const {BANK_FINANCIAL_SLICES,financialQuery,financialTransportContainsEvidence}=await import("./index.ts")
  const banks=Object.values(BANK_FINANCIAL_SLICES).flat();if(banks.length!==13||new Set(banks).size!==13)throw Error("Frozen bank scope changed")
  for(const raw of ["status: error\nmessage: unavailable","",'{"status":"error","message":"failed"}','{"markdown_data":""}'])if(financialTransportContainsEvidence(raw))throw Error("Business failure accepted")
  const query=financialQuery([{symbol:"SBIN",securityId:"fixture",instrumentId:"1193"}]);if(!query.includes("SBIN verified Trendlyne instrument 1193")||!query.includes("reporting start/end")||!query.includes("Do not infer"))throw Error("Source-contract query lost identity or proof boundary")
  const invoke=(patch:Record<string,unknown>={})=>handler(new Request("https://example.invalid",{method:"POST",body:JSON.stringify({action:"V1_4_BANK_FINANCIAL_CAPTURE_2026_10_09",portfolioId:"6193a4aa-3235-4057-bddc-209fcf443fc2",sliceId:"BANK-P1-01",...patch})}))
  let r=await invoke();if(r.status!==401||requests!==0)throw Error("Missing scoped grant admitted")
  r=await invoke({action:"V1_4_BANK_TOOL_CATALOG_2026_10_09"});if(r.status!==401||requests!==0)throw Error("Catalog request admitted without scoped grant")
  r=await invoke({action:"V1_4_BANK_TOOL_CATALOG_2026_10_09",sliceId:"BANK-P1-02"});if(r.status!==400||requests!==0)throw Error("Catalog scope broadened")
  for(const parameters of [[],["roea",3],Array(11).fill("roea"),["roea","roea"]]){r=await invoke({action:"V1_4_BANK_EXACT_PARAMETERS_2026_10_09",parameters});if(r.status!==400||requests!==0)throw Error("Unbounded or partially invalid exact-parameter scope admitted")}
  r=await invoke({action:"V1_4_BANK_PARAMETER_SEARCH_2026_10_09",queryKey:"ARBITRARY_QUERY"});if(r.status!==400||requests!==0)throw Error("Arbitrary parameter query admitted")
  for(const sliceId of ["ARBITRARY_STOCKS","__proto__","toString"]){r=await invoke({sliceId});if(r.status!==400||requests!==0)throw Error("Arbitrary slice admitted")}
  project="uxiyufbsbgzzdujzcdxe";r=await invoke();if(r.status!==409||requests!==0)throw Error("Production admitted")
 }finally{Deno.serve=serve;Deno.env.get=get;globalThis.fetch=fetch}
})
