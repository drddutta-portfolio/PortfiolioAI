#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import Papa from "papaparse"

const ROOT=process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const inspection=JSON.parse(readFileSync(join(ROOT,"schema-inspection.json"),"utf8"))

function sha256(value){
  return createHash("sha256").update(value).digest("hex")
}
function clean(v){ return String(v ?? "").trim() }

const months=[]
const globalByIsin=new Map()
let totalEquityRows=0
let rowsMissingIsin=0
let duplicateIsinRows=0

for(const f of inspection.files){
  const parsed=Papa.parse(readFileSync(f.csv_path,"utf8"),{header:true,skipEmptyLines:true,dynamicTyping:false})
  const equity=(parsed.data??[]).filter(r=>clean(r.SctyTpFlg)==="0")

  const byIsin=new Map()
  const duplicates=[]
  let monthMissingIsin=0

  for(const r of equity){
    const isin=clean(r.ISIN)
    const symbol=clean(r.TckrSymb)
    const series=clean(r.SctySrs)
    const name=clean(r.FinInstrmNm)
    const instrumentId=clean(r.FinInstrmId)

    totalEquityRows++
    if(!isin){
      monthMissingIsin++
      rowsMissingIsin++
      continue
    }

    const record={isin,symbol,series,name,instrument_id:instrumentId}
    if(byIsin.has(isin)){
      duplicateIsinRows++
      duplicates.push({isin,first:byIsin.get(isin),again:record})
    }else{
      byIsin.set(isin,record)
    }

    const history=globalByIsin.get(isin)??{
      isin,
      names:new Set(),
      symbols:new Set(),
      series:new Set(),
      instrument_ids:new Set(),
      first_month:f.month,
      last_month:f.month,
      months:0
    }
    if(name) history.names.add(name)
    if(symbol) history.symbols.add(symbol)
    if(series) history.series.add(series)
    if(instrumentId) history.instrument_ids.add(instrumentId)
    history.last_month=f.month
    history.months++
    globalByIsin.set(isin,history)
  }

  const canonical=[...byIsin.values()].sort((a,b)=>a.isin.localeCompare(b.isin))
  const fingerprint=sha256(JSON.stringify(canonical))

  months.push({
    month:f.month,
    decision_date:f.decision_date,
    equity_rows:equity.length,
    unique_isins:byIsin.size,
    missing_isin_rows:monthMissingIsin,
    duplicate_isin_rows:duplicates.length,
    duplicate_samples:duplicates.slice(0,20),
    fingerprint:`sha256:${fingerprint}`,
    series_counts:Object.entries(equity.reduce((acc,r)=>{
      const s=clean(r.SctySrs)||"<blank>"
      acc[s]=(acc[s]??0)+1
      return acc
    },{})).map(([series,count])=>({series,count})).sort((a,b)=>b.count-a.count)
  })
}

const identityHistory=[...globalByIsin.values()].map(x=>({
  isin:x.isin,
  names:[...x.names].sort(),
  symbols:[...x.symbols].sort(),
  series:[...x.series].sort(),
  instrument_ids:[...x.instrument_ids].sort(),
  first_month:x.first_month,
  last_month:x.last_month,
  month_occurrences:x.months
})).sort((a,b)=>a.isin.localeCompare(b.isin))

const changedIdentity=identityHistory.filter(x=>x.symbols.length>1 || x.series.length>1 || x.names.length>1 || x.instrument_ids.length>1)
const output={
  version:"P8_B2_NSE_EQUITY_DRY_RUN_V1",
  authority:"NSE_MasterData_Technical_Specifications — Instrument Type 0 = Equities",
  eligibility_rule:{field:"SctyTpFlg",eligible_value:"0"},
  files_checked:inspection.files.length,
  total_equity_rows:totalEquityRows,
  rows_missing_isin:rowsMissingIsin,
  duplicate_isin_rows:duplicateIsinRows,
  global_unique_isins:identityHistory.length,
  changed_identity_isins:changedIdentity.length,
  month_summaries:months,
  changed_identity_samples:changedIdentity.slice(0,100),
  global_identity_fingerprint:`sha256:${sha256(JSON.stringify(identityHistory))}`
}
writeFileSync(join(ROOT,"equity-dry-run.json"),JSON.stringify(output,null,2)+"\n")

console.log(JSON.stringify({
  files_checked:output.files_checked,
  total_equity_rows:output.total_equity_rows,
  global_unique_isins:output.global_unique_isins,
  rows_missing_isin:output.rows_missing_isin,
  duplicate_isin_rows:output.duplicate_isin_rows,
  changed_identity_isins:output.changed_identity_isins,
  first_month:months[0],
  last_month:months.at(-1),
  global_identity_fingerprint:output.global_identity_fingerprint,
  output:join(ROOT,"equity-dry-run.json")
},null,2))
