export const config={maxDuration:60}
export default {
  async fetch(){
    const out:Record<string,unknown>={node:process.version}
    for(const [name,path] of [
      ["contract","../supabase/functions/_shared/v14-batch-b-contract.ts"],
      ["adapter","../supabase/functions/_shared/p7-ic-benchmark-adapter.ts"],
      ["capture","../supabase/functions/_shared/v14-master-capture.ts"],
    ] as const){
      try{
        const mod=await import(path)
        out[name]={ok:true,exports:Object.keys(mod).slice(0,20)}
      }catch(e){
        out[name]={ok:false,error:e instanceof Error?e.message:String(e),stack:e instanceof Error?e.stack:null}
        break
      }
    }
    return Response.json(out)
  }
}
