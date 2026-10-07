import {describe,expect,it} from "vitest"
import {executableV14BenchmarkCodes,resolveV14BenchmarkAuthority} from "./v14-benchmark-authority-resolution"

describe("V1-4 benchmark authority resolution",()=>{
 it.each(["DOMESTIC_FORMULATIONS","API_BULK_DRUGS","GLOBAL_GENERICS","BIOPHARMA_BIOSIMILARS","CDMO_CRAMS"])("maps reviewed Pharma subprofile %s to NIFTY Pharma",subprofile=>{
  expect(resolveV14BenchmarkAuthority({profileCode:"PHARMA",subprofileCode:subprofile,benchmarkAuthority:["PHARMA_V1_SUBPROFILE_AUTHORITY"]})).toEqual(["NIFTY_PHARMA"])
 })
 it("does not guess an unresolved Pharma subprofile benchmark",()=>{
  expect(resolveV14BenchmarkAuthority({profileCode:"PHARMA",subprofileCode:null,benchmarkAuthority:["PHARMA_V1_SUBPROFILE_AUTHORITY"]})).toEqual(["PHARMA_V1_SUBPROFILE_AUTHORITY"])
 })
 it("keeps context labels visible but excludes non-registry context from executable history",()=>{
  const authority=resolveV14BenchmarkAuthority({profileCode:"SOLID_FUELS_MINING",subprofileCode:null,benchmarkAuthority:["NIFTY_METAL","NIFTY_ENERGY_CONTEXT"]})
  expect(authority).toEqual(["NIFTY_METAL","NIFTY_ENERGY_CONTEXT"])
  expect(executableV14BenchmarkCodes(authority)).toEqual(["NIFTY_METAL"])
 })
})
