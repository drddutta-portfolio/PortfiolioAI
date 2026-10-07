import {P7_IC_BENCHMARK_REGISTRY,type P7IcBenchmarkCode} from "./p7-ic-benchmark-adapter.ts"

export const V1_4_BENCHMARK_AUTHORITY_RESOLUTION_VERSION="V1_4_BENCHMARK_AUTHORITY_RESOLUTION_V1" as const
const EXECUTABLE=new Set<string>(P7_IC_BENCHMARK_REGISTRY.map(x=>x.code))
const PHARMA_SUBPROFILES=new Set([
 "DOMESTIC_FORMULATIONS",
 "API_BULK_DRUGS",
 "GLOBAL_GENERICS",
 "BIOPHARMA_BIOSIMILARS",
 "CDMO_CRAMS",
])

export function resolveV14BenchmarkAuthority(input:{
 readonly profileCode:string
 readonly subprofileCode:string|null
 readonly benchmarkAuthority:readonly string[]
}):string[]{
 const mapped=input.benchmarkAuthority.flatMap(code=>{
  if(code==="PHARMA_V1_SUBPROFILE_AUTHORITY"&&input.profileCode==="PHARMA"&&input.subprofileCode&&PHARMA_SUBPROFILES.has(input.subprofileCode))return["NIFTY_PHARMA"]
  return[code]
 })
 return[...new Set(mapped)]
}

export function executableV14BenchmarkCodes(authority:readonly string[]):P7IcBenchmarkCode[]{
 return[...new Set(authority.filter((code):code is P7IcBenchmarkCode=>EXECUTABLE.has(code)))]
}
