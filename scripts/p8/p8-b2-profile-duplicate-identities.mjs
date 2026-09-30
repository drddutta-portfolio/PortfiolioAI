#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import Papa from "papaparse"

const ROOT=process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const inspection=JSON.parse(readFileSync(join(ROOT,"schema-inspection.json"),"utf8"))

function clean(v){ return String(v ?? "").trim() }

const monthSummaries=[]
let duplicateIsinMonths=0
let duplicateGroups=0
let multiSymbolGroups=0
let multiSeriesGroups=0
let multiNameGroups=0
let multiInstrumentIdGroups=0
const examples={multiSymbol:[],multiSeries:[],multiName:[],multiInstrumentId:[]}

for(const f of inspection.files){
  const parsed=Papa.parse(readFileSync(f.csv_path,"utf8"),{header:true,skipEmptyLines:true,dynamicTyping:false})
  const equity=(parsed.data??[]).filter(r=>clean(r.SctyTpFlg)==="0")
  const byIsin=new Map()

  for(const r of equity){
    const isin=clean(r.ISIN)
    if(!isin) continue
    const arr=byIsin.get(isin)??[]
    arr.push({
      symbol:clean(r.TckrSymb),
      series:clean(r.SctySrs),
      name:clean(r.FinInstrmNm),
      instrument_id:clean(r.FinInstrmId)
    })
    byIsin.set(isin,arr)
  }

  let monthGroups=0
  for(const [isin,rows] of byIsin){
    if(rows.length<2) continue
    monthGroups++
    duplicateGroups++
    const symbols=[...new Set(rows.map(x=>x.symbol).filter(Boolean))]
    const series=[...new Set(rows.map(x=>x.series).filter(Boolean))]
    const names=[...new Set(rows.map(x=>x.name).filter(Boolean))]
    const ids=[...new Set(rows.map(x=>x.instrument_id).filter(Boolean))]

    if(symbols.length>1){
      multiSymbolGroups++
      if(examples.multiSymbol.length<20) examples.multiSymbol.push({month:f.month,isin,symbols,series,names,ids,rows:rows.slice(0,10)})
    }
    if(series.length>1){
      multiSeriesGroups++
      if(examples.multiSeries.length<20) examples.multiSeries.push({month:f.month,isin,symbols,series,names,ids,rows:rows.slice(0,10)})
    }
    if(names.length>1){
      multiNameGroups++
      if(examples.multiName.length<20) examples.multiName.push({month:f.month,isin,symbols,series,names,ids,rows:rows.slice(0,10)})
    }
    if(ids.length>1){
      multiInstrumentIdGroups++
      if(examples.multiInstrumentId.length<20) examples.multiInstrumentId.push({month:f.month,isin,symbols,series,names,ids,rows:rows.slice(0,10)})
    }
  }

  if(monthGroups>0) duplicateIsinMonths++
  monthSummaries.push({
    month:f.month,
    decision_date:f.decision_date,
    equity_rows:equity.length,
    unique_isins:byIsin.size,
    duplicate_isin_groups:monthGroups
  })
}

const out={
  version:"P8_B2_NSE_DUPLICATE_IDENTITY_PROFILE_V1",
  files_checked:inspection.files.length,
  duplicate_isin_months:duplicateIsinMonths,
  duplicate_isin_groups:duplicateGroups,
  multi_symbol_groups:multiSymbolGroups,
  multi_series_groups:multiSeriesGroups,
  multi_name_groups:multiNameGroups,
  multi_instrument_id_groups:multiInstrumentIdGroups,
  month_summaries:monthSummaries,
  examples
}
writeFileSync(join(ROOT,"duplicate-identity-profile.json"),JSON.stringify(out,null,2)+"\n")

console.log(JSON.stringify({
  files_checked:out.files_checked,
  duplicate_isin_months:out.duplicate_isin_months,
  duplicate_isin_groups:out.duplicate_isin_groups,
  multi_symbol_groups:out.multi_symbol_groups,
  multi_series_groups:out.multi_series_groups,
  multi_name_groups:out.multi_name_groups,
  multi_instrument_id_groups:out.multi_instrument_id_groups,
  first_multi_symbol_examples:out.examples.multiSymbol.slice(0,5),
  first_multi_series_examples:out.examples.multiSeries.slice(0,5),
  output:join(ROOT,"duplicate-identity-profile.json")
},null,2))
