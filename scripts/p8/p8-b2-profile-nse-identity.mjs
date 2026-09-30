#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const ROOT=process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const analysis=JSON.parse(readFileSync(join(ROOT,"schema-semantic-analysis.json"),"utf8"))

const candidateFields=[
  "FinInstrmId",
  "TckrSymb",
  "SctySrs",
  "FinInstrmNm",
  "ISIN",
  "SctyTpFlg",
  "SctyTp",
  "InstrmNm",
  "MktTpAndId",
  "Xchg"
]

const out={
  version:"P8_B2_NSE_IDENTITY_PROFILE_V1",
  header_counts:analysis.header_counts,
  only_in_v1:analysis.only_in_v1,
  only_in_v2:analysis.only_in_v2,
  schema_transition:analysis.month_versions,
  representatives:{}
}

for(const [version,rep] of Object.entries(analysis.representatives ?? {})){
  const distinct={}
  for(const field of candidateFields){
    const values=rep.distinct_first_5000?.[field]
    if(Array.isArray(values)) distinct[field]=values
  }
  out.representatives[version]={
    month:rep.month,
    decision_date:rep.decision_date,
    distinct
  }
}

writeFileSync(join(ROOT,"identity-profile.json"),JSON.stringify(out,null,2)+"\n")
console.log(JSON.stringify(out,null,2))
