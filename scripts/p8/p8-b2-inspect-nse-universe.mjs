#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import Papa from "papaparse"

const ROOT = process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const MANIFEST = join(ROOT, "manifest.json")

function sha256(buf){ return createHash("sha256").update(buf).digest("hex") }

const manifest=JSON.parse(readFileSync(MANIFEST,"utf8"))
const acquired=manifest.months.filter(x=>x.state==="ACQUIRED")
if(acquired.length!==manifest.summary.months_acquired){
  throw new Error(`manifest acquired count mismatch: entries=${acquired.length} summary=${manifest.summary.months_acquired}`)
}

const files=[]
let commonHeaders=null
let allHashesPass=true

for(const entry of acquired){
  const csvPath=entry.csv_path
  if(!csvPath) throw new Error(`missing csv_path for ${entry.month}`)
  const buf=readFileSync(csvPath)
  const hash=sha256(buf)
  const hashPass=hash===entry.csv_sha256
  if(!hashPass) allHashesPass=false

  const text=buf.toString("utf8")
  const parsed=Papa.parse(text,{header:true,skipEmptyLines:true,dynamicTyping:false})
  const headers=(parsed.meta.fields??[]).map(x=>String(x).trim())
  const sample=(parsed.data??[])[0]??null

  if(commonHeaders===null) commonHeaders=headers
  else if(JSON.stringify(commonHeaders)!==JSON.stringify(headers)){
    commonHeaders=[]
  }

  files.push({
    month:entry.month,
    decision_date:entry.decision_date,
    csv_path:csvPath,
    rows:parsed.data.length,
    headers,
    hash_expected:entry.csv_sha256,
    hash_actual:hash,
    hash_pass:hashPass,
    parse_errors:(parsed.errors??[]).slice(0,10),
    sample_row:sample
  })
}

const uniqueHeaderSets=[...new Set(files.map(f=>JSON.stringify(f.headers)))].map(x=>JSON.parse(x))
const rows=files.reduce((n,f)=>n+f.rows,0)
const output={
  version:"P8_B2_NSE_SCHEMA_INSPECTION_V1",
  manifest_summary:manifest.summary,
  files_checked:files.length,
  all_hashes_pass:allHashesPass,
  total_rows_across_files:rows,
  unique_header_set_count:uniqueHeaderSets.length,
  unique_header_sets:uniqueHeaderSets,
  files
}
writeFileSync(join(ROOT,"schema-inspection.json"),JSON.stringify(output,null,2)+"\n")

console.log(JSON.stringify({
  files_checked:output.files_checked,
  all_hashes_pass:output.all_hashes_pass,
  total_rows_across_files:output.total_rows_across_files,
  unique_header_set_count:output.unique_header_set_count,
  first_headers:uniqueHeaderSets[0]??[],
  output:join(ROOT,"schema-inspection.json")
},null,2))

if(!allHashesPass || uniqueHeaderSets.length!==1) process.exitCode=2
