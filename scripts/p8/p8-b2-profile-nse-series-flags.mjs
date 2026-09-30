#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import Papa from "papaparse"

const ROOT=process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const inspection=JSON.parse(readFileSync(join(ROOT,"schema-inspection.json"),"utf8"))

const aggregate=new Map()
const monthSummaries=[]

for(const f of inspection.files){
  const raw=readFileSync(f.csv_path,"utf8")
  const parsed=Papa.parse(raw,{header:true,skipEmptyLines:true,dynamicTyping:false})
  const monthMap=new Map()

  for(const row of parsed.data ?? []){
    const series=String(row.SctySrs ?? "").trim() || "<blank>"
    const flag=String(row.SctyTpFlg ?? "").trim() || "<blank>"
    const key=`${series}||${flag}`
    const rec=aggregate.get(key) ?? {series,flag,count:0,samples:[]}
    rec.count++
    if(rec.samples.length<5){
      rec.samples.push({
        ticker:String(row.TckrSymb ?? "").trim(),
        isin:String(row.ISIN ?? "").trim(),
        name:String(row.FinInstrmNm ?? "").trim(),
        instrument_id:String(row.FinInstrmId ?? "").trim()
      })
    }
    aggregate.set(key,rec)

    const mrec=monthMap.get(key) ?? {series,flag,count:0}
    mrec.count++
    monthMap.set(key,mrec)
  }

  monthSummaries.push({
    month:f.month,
    decision_date:f.decision_date,
    rows:parsed.data.length,
    series_flag_counts:[...monthMap.values()].sort((a,b)=>b.count-a.count)
  })
}

const combinations=[...aggregate.values()].sort((a,b)=>b.count-a.count)
const seriesTotals=new Map()
for(const x of combinations){
  seriesTotals.set(x.series,(seriesTotals.get(x.series)??0)+x.count)
}

const out={
  version:"P8_B2_NSE_SERIES_FLAG_PROFILE_V1",
  files_checked:inspection.files.length,
  combinations,
  series_totals:[...seriesTotals.entries()].map(([series,count])=>({series,count})).sort((a,b)=>b.count-a.count),
  month_summaries:monthSummaries
}
writeFileSync(join(ROOT,"series-flag-profile.json"),JSON.stringify(out,null,2)+"\n")

console.log(JSON.stringify({
  files_checked:out.files_checked,
  top_series_totals:out.series_totals.slice(0,30),
  top_series_flag_combinations:out.combinations.slice(0,40),
  output:join(ROOT,"series-flag-profile.json")
},null,2))
