#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import Papa from "papaparse"

const ROOT=process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const inspection=JSON.parse(readFileSync(join(ROOT,"schema-inspection.json"),"utf8"))
const headerSets=inspection.unique_header_sets
if(!Array.isArray(headerSets) || headerSets.length!==2){
  throw new Error(`Expected exactly two header sets, found ${headerSets?.length ?? "unknown"}`)
}

const common=headerSets[0].filter(x=>headerSets[1].includes(x))
const only1=headerSets[0].filter(x=>!headerSets[1].includes(x))
const only2=headerSets[1].filter(x=>!headerSets[0].includes(x))
const relevantPattern=/(isin|symb|symbol|srs|series|instrm|scty|security|name|status|list|trade|trdg|segment|board|mkt|issue|face|exch|xchg|eqty|equity|asset|class)/i
const relevantCommon=common.filter(x=>relevantPattern.test(x))

function versionFor(headers){
  if(JSON.stringify(headers)===JSON.stringify(headerSets[0])) return "V1"
  if(JSON.stringify(headers)===JSON.stringify(headerSets[1])) return "V2"
  return "UNKNOWN"
}

const representatives={}
for(const f of inspection.files){
  const v=versionFor(f.headers)
  if(v!=="UNKNOWN" && !representatives[v]) representatives[v]=f
}

const samples={}
for(const [version,f] of Object.entries(representatives)){
  const raw=readFileSync(f.csv_path,"utf8")
  const parsed=Papa.parse(raw,{header:true,skipEmptyLines:true,dynamicTyping:false})
  const fields=[...new Set([...relevantCommon,...only1,...only2])].filter(x=>f.headers.includes(x))
  const rows=(parsed.data??[]).slice(0,12).map(row=>Object.fromEntries(fields.map(k=>[k,row[k] ?? null])))
  const distinct={}
  for(const field of fields){
    distinct[field]=[...new Set((parsed.data??[]).slice(0,5000).map(r=>String(r[field]??"").trim()).filter(Boolean))].slice(0,30)
  }
  samples[version]={
    month:f.month,
    decision_date:f.decision_date,
    csv_path:f.csv_path,
    relevant_fields:fields,
    sample_rows:rows,
    distinct_first_5000:distinct
  }
}

const monthVersions=inspection.files.map(f=>({
  month:f.month,
  decision_date:f.decision_date,
  header_version:versionFor(f.headers)
}))

const out={
  version:"P8_B2_NSE_SCHEMA_SEMANTIC_ANALYSIS_V1",
  header_counts:[headerSets[0].length,headerSets[1].length],
  only_in_v1:only1,
  only_in_v2:only2,
  relevant_common_fields:relevantCommon,
  month_versions:monthVersions,
  representatives:samples
}
writeFileSync(join(ROOT,"schema-semantic-analysis.json"),JSON.stringify(out,null,2)+"\n")

console.log(JSON.stringify({
  header_counts:out.header_counts,
  only_in_v1:out.only_in_v1,
  only_in_v2:out.only_in_v2,
  relevant_common_fields:out.relevant_common_fields,
  schema_transition:monthVersions,
  representative_months:Object.fromEntries(Object.entries(samples).map(([k,v])=>[k,{month:v.month,decision_date:v.decision_date,relevant_fields:v.relevant_fields}])),
  output:join(ROOT,"schema-semantic-analysis.json")
},null,2))
