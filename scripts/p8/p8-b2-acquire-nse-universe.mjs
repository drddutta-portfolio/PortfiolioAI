#!/usr/bin/env node
import { createHash } from "node:crypto"
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { gunzipSync } from "node:zlib"
import https from "node:https"

const START = new Date("2024-02-01T00:00:00Z")
const END = new Date("2026-09-30T00:00:00Z")
const OUT = process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const BASE = "https://nsearchives.nseindia.com/content/cm"
const SOURCE_CODE = "NSE_CM_MII_SECURITY_MASTER"

mkdirSync(OUT, { recursive: true })

function ymd(d){ return d.toISOString().slice(0,10) }
function ddmmyyyy(d){
  const dd=String(d.getUTCDate()).padStart(2,"0")
  const mm=String(d.getUTCMonth()+1).padStart(2,"0")
  return `${dd}${mm}${d.getUTCFullYear()}`
}
function lastWeekdayCandidates(year, monthIndex){
  const d=new Date(Date.UTC(year,monthIndex+1,0))
  const out=[]
  while(out.length<7){
    const day=d.getUTCDay()
    if(day!==0 && day!==6) out.push(new Date(d))
    d.setUTCDate(d.getUTCDate()-1)
  }
  return out
}
function monthsBetween(start,end){
  const out=[]
  let y=start.getUTCFullYear(), m=start.getUTCMonth()
  while(y<end.getUTCFullYear() || (y===end.getUTCFullYear() && m<=end.getUTCMonth())){
    out.push([y,m])
    m++; if(m===12){m=0;y++}
  }
  return out
}
function fetchBuffer(url){
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{headers:{"User-Agent":"PortfolioAI-P8-B2/1.0","Accept":"*/*"}},res=>{
      if(res.statusCode===301||res.statusCode===302||res.statusCode===307||res.statusCode===308){
        const loc=res.headers.location
        res.resume()
        if(!loc) return reject(new Error("redirect without location"))
        return fetchBuffer(new URL(loc,url).toString()).then(resolve,reject)
      }
      if(res.statusCode!==200){
        res.resume()
        return reject(Object.assign(new Error(`HTTP ${res.statusCode}`),{statusCode:res.statusCode}))
      }
      const chunks=[]
      res.on("data",c=>chunks.push(c))
      res.on("end",()=>resolve(Buffer.concat(chunks)))
    })
    req.setTimeout(20000,()=>req.destroy(new Error("timeout")))
    req.on("error",reject)
  })
}
function sha256(buf){ return createHash("sha256").update(buf).digest("hex") }

const manifest={
  version:"P8_B2_NSE_UNIVERSE_ACQUISITION_V1",
  source_code:SOURCE_CODE,
  source_base:BASE,
  authority:"National Stock Exchange of India — CM MII Security File",
  file_pattern:"NSE_CM_security_DDMMYYYY.csv.gz",
  experiment_id:"P8_EXP_NSE_MONTHLY_6M_V1",
  universe_version:"P8_NSE_HISTORICAL_UNIVERSE_V1",
  requested_window:["2024-02-01","2026-09-30"],
  months:[],
  notes:[
    "Website dissemination of CM MII security files became effective 2024-02-05 per NSE/MSD/60315.",
    "For each month the runner probes the last seven weekdays backwards and accepts the first official file returning HTTP 200.",
    "No unavailable date is invented; missing months remain explicit blockers.",
    "This runner only acquires immutable source files and a manifest. It performs no database writes."
  ]
}

for(const [year,monthIndex] of monthsBetween(START,END)){
  const month=`${year}-${String(monthIndex+1).padStart(2,"0")}`
  const entry={month,state:"MISSING",decision_date:null,url:null,gzip_sha256:null,csv_sha256:null,bytes:null,error:null}
  for(const date of lastWeekdayCandidates(year,monthIndex)){
    if(date<START || date>END) continue
    const token=ddmmyyyy(date)
    const name=`NSE_CM_security_${token}.csv.gz`
    const url=`${BASE}/${name}`
    try{
      const gz=await fetchBuffer(url)
      const csv=gunzipSync(gz)
      const gzPath=join(OUT,name)
      const csvPath=gzPath.replace(/\.gz$/,"")
      mkdirSync(dirname(gzPath),{recursive:true})
      if(!existsSync(gzPath)) writeFileSync(gzPath,gz)
      if(!existsSync(csvPath)) writeFileSync(csvPath,csv)
      entry.state="ACQUIRED"
      entry.decision_date=ymd(date)
      entry.url=url
      entry.gzip_sha256=sha256(gz)
      entry.csv_sha256=sha256(csv)
      entry.bytes=gz.length
      entry.csv_path=csvPath
      break
    }catch(err){
      entry.error=String(err?.message??err)
    }
  }
  manifest.months.push(entry)
  console.log(month, entry.state, entry.decision_date ?? "", entry.error ?? "")
}

const acquired=manifest.months.filter(x=>x.state==="ACQUIRED").length
manifest.summary={
  months_requested:manifest.months.length,
  months_acquired:acquired,
  months_missing:manifest.months.length-acquired,
  minimum_proven_decision_dates:24,
  minimum_met:acquired>=24,
  generated_at:new Date().toISOString()
}
writeFileSync(join(OUT,"manifest.json"),JSON.stringify(manifest,null,2)+"\n")
console.log(JSON.stringify(manifest.summary,null,2))
if(acquired<24) process.exitCode=2
