import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const SOURCE_CODE="OWNER_REVIEWED_CLASSIFICATION"
const GRANT_KIND="P4_EXECUTION_GRANT"
const ACTION="P7_IC2_ORCHESTRATE"
const MAX_TRENDLYNE_CAMPAIGN_CALLS=920
const MAX_SLICE_SECURITIES=5
const TREND_BATCHES={
  "TID01": {
    "phase": "IDENTITY",
    "plannedCalls": 40,
    "symbols": [
      "YATHARTH",
      "SYRMA",
      "LT",
      "NH",
      "MANKIND",
      "SONACOMS",
      "PERSISTENT",
      "SKYGOLD",
      "MFSL",
      "RELIANCE",
      "USHAMART",
      "SUPRIYA",
      "PAYTM",
      "NAM-INDIA",
      "DEEPINDS",
      "RADICO",
      "SHARDAMOTR",
      "PPLPHARMA",
      "E2E",
      "VISHNU"
    ]
  },
  "TID02": {
    "phase": "IDENTITY",
    "plannedCalls": 40,
    "symbols": [
      "TATVA",
      "GMBREW",
      "TATAPOWER",
      "GRSE",
      "ANGELONE",
      "SUNPHARMA",
      "MAXHEALTH",
      "PREMIERENE",
      "SRHHYPOLTD",
      "SENCO",
      "ZYDUSWELL",
      "NHPC",
      "ETHOSLTD",
      "MEDANTA",
      "THANGAMAYL",
      "AWHCL",
      "TIMETECHNO",
      "EIEL",
      "VAML",
      "GESHIP"
    ]
  },
  "TID03": {
    "phase": "IDENTITY",
    "plannedCalls": 40,
    "symbols": [
      "RATEGAIN",
      "SHARDACROP",
      "ERIS",
      "LTFOODS",
      "SHRIRAMFIN",
      "PHOENIXLTD",
      "NATIONALUM",
      "TATACAP",
      "CPPLUS",
      "TMCV",
      "PRIVISCL",
      "NCC",
      "HBLENGINE",
      "VEDL",
      "LEMONTREE",
      "KRN",
      "LTF",
      "TI",
      "FORTIS",
      "IRMENERGY"
    ]
  },
  "TID04": {
    "phase": "IDENTITY",
    "plannedCalls": 40,
    "symbols": [
      "ICIL",
      "WOCKPHARMA",
      "LENSKART",
      "HCLTECH",
      "GOLDIAM",
      "CEMPRO",
      "ZYDUSLIFE",
      "SHAILY",
      "GRANULES",
      "VINATIORGA",
      "SSWL",
      "VOLTAS",
      "SBCL",
      "MUTHOOTFIN",
      "GROWW",
      "UPL",
      "ALIVUS",
      "LGEINDIA",
      "PAR",
      "SAGILITY"
    ]
  },
  "TID05": {
    "phase": "IDENTITY",
    "plannedCalls": 40,
    "symbols": [
      "VENTIVE",
      "SRF",
      "ZENTEC",
      "PENIND",
      "CHOLAFIN",
      "NYKAA",
      "VINCOFE",
      "HAL",
      "ONESOURCE",
      "PANAMAPET",
      "TBZ",
      "BECTORFOOD",
      "ICEMAKE",
      "UTIAMC",
      "STARHEALTH",
      "UNITDSPR",
      "MGL",
      "SHAKTIPUMP",
      "LUPIN",
      "UTLSOLAR"
    ]
  },
  "TID06": {
    "phase": "IDENTITY",
    "plannedCalls": 40,
    "symbols": [
      "POCL",
      "RBLBANK",
      "PRAJIND",
      "PCBL",
      "SANGAMIND",
      "WELENT",
      "SAIL",
      "SOLARA",
      "KPIGREEN",
      "JASH",
      "ONGC",
      "UNIONBANK",
      "WELSPUNLIV",
      "SUZLON",
      "GNFC",
      "SYNGENE",
      "EMSLIMITED",
      "POWERGRID",
      "AVTNPL",
      "PINELABS"
    ]
  },
  "TID07": {
    "phase": "IDENTITY",
    "plannedCalls": 40,
    "symbols": [
      "GOPAL",
      "V2RETAIL",
      "RRKABEL",
      "VGUARD",
      "YATRA",
      "POLICYBZR",
      "MPHASIS",
      "DLINKINDIA",
      "DHARMAJ",
      "TMPV",
      "RHIM",
      "IGL",
      "NATCOPHARM",
      "JKLAKSHMI",
      "GOKEX",
      "PNBHOUSING",
      "INOXWIND",
      "QUESS",
      "FAZE3Q",
      "ZENSARTECH"
    ]
  },
  "TRS01": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "M&M",
      "BHARTIARTL",
      "SBIN",
      "HDFCBANK",
      "WABAG",
      "TITAN",
      "TDPOWERSYS",
      "MTARTECH",
      "TORNTPHARM",
      "FEDERALBNK"
    ]
  },
  "TRS02": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "NETWEB",
      "MOTHERSON",
      "TVSMOTOR",
      "ARVIND",
      "WAAREEENER",
      "JUBLPHARMA",
      "VBL",
      "PIIND",
      "KPITTECH",
      "ZAGGLE"
    ]
  },
  "TRS03": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "YATHARTH",
      "SYRMA",
      "LT",
      "NH",
      "MANKIND",
      "SONACOMS",
      "PERSISTENT",
      "SKYGOLD",
      "MFSL",
      "RELIANCE"
    ]
  },
  "TRS04": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "USHAMART",
      "SUPRIYA",
      "PAYTM",
      "NAM-INDIA",
      "DEEPINDS",
      "RADICO",
      "SHARDAMOTR",
      "PPLPHARMA",
      "E2E",
      "VISHNU"
    ]
  },
  "TRS05": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "TATVA",
      "GMBREW",
      "TATAPOWER",
      "GRSE",
      "ANGELONE",
      "SUNPHARMA",
      "MAXHEALTH",
      "PREMIERENE",
      "SRHHYPOLTD",
      "SENCO"
    ]
  },
  "TRS06": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "ZYDUSWELL",
      "NHPC",
      "ETHOSLTD",
      "MEDANTA",
      "THANGAMAYL",
      "AWHCL",
      "TIMETECHNO",
      "EIEL",
      "VAML",
      "GESHIP"
    ]
  },
  "TRS07": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "RATEGAIN",
      "SHARDACROP",
      "ERIS",
      "LTFOODS",
      "SHRIRAMFIN",
      "PHOENIXLTD",
      "NATIONALUM",
      "TATACAP",
      "CPPLUS",
      "TMCV"
    ]
  },
  "TRS08": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "PRIVISCL",
      "NCC",
      "HBLENGINE",
      "VEDL",
      "LEMONTREE",
      "KRN",
      "LTF",
      "TI",
      "FORTIS",
      "IRMENERGY"
    ]
  },
  "TRS09": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "ICIL",
      "WOCKPHARMA",
      "LENSKART",
      "HCLTECH",
      "GOLDIAM",
      "CEMPRO",
      "ZYDUSLIFE",
      "SHAILY",
      "GRANULES",
      "VINATIORGA"
    ]
  },
  "TRS10": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "SSWL",
      "VOLTAS",
      "SBCL",
      "MUTHOOTFIN",
      "GROWW",
      "UPL",
      "ALIVUS",
      "LGEINDIA",
      "PAR",
      "SAGILITY"
    ]
  },
  "TRS11": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "VENTIVE",
      "SRF",
      "ZENTEC",
      "PENIND",
      "CHOLAFIN",
      "NYKAA",
      "VINCOFE",
      "HAL",
      "ONESOURCE",
      "PANAMAPET"
    ]
  },
  "TRS12": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "TBZ",
      "BECTORFOOD",
      "ICEMAKE",
      "UTIAMC",
      "STARHEALTH",
      "UNITDSPR",
      "MGL",
      "SHAKTIPUMP",
      "LUPIN",
      "UTLSOLAR"
    ]
  },
  "TRS13": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "POCL",
      "RBLBANK",
      "PRAJIND",
      "PCBL",
      "SANGAMIND",
      "WELENT",
      "SAIL",
      "SOLARA",
      "KPIGREEN",
      "JASH"
    ]
  },
  "TRS14": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "ONGC",
      "UNIONBANK",
      "WELSPUNLIV",
      "SUZLON",
      "GNFC",
      "SYNGENE",
      "EMSLIMITED",
      "POWERGRID",
      "AVTNPL",
      "PINELABS"
    ]
  },
  "TRS15": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "GOPAL",
      "V2RETAIL",
      "RRKABEL",
      "VGUARD",
      "YATRA",
      "POLICYBZR",
      "MPHASIS",
      "DLINKINDIA",
      "DHARMAJ",
      "TMPV"
    ]
  },
  "TRS16": {
    "phase": "CURRENT_RESEARCH",
    "plannedCalls": 40,
    "symbols": [
      "RHIM",
      "IGL",
      "NATCOPHARM",
      "JKLAKSHMI",
      "GOKEX",
      "PNBHOUSING",
      "INOXWIND",
      "QUESS",
      "FAZE3Q",
      "ZENSARTECH"
    ]
  }
} as const
const HISTORY_BATCHES={
  "H1": {
    "phase": "STOCK_HISTORY",
    "plannedCalls": 40,
    "symbols": [
      "M&M",
      "BHARTIARTL",
      "SBIN",
      "HDFCBANK",
      "WABAG",
      "BANKBARODA",
      "TITAN",
      "TDPOWERSYS",
      "MTARTECH",
      "ICICIBANK",
      "AVALON",
      "TORNTPHARM",
      "BEL",
      "LAURUSLABS",
      "DEEPAKFERT",
      "GRASIM",
      "CAPLIPOINT",
      "KALYANKJIL",
      "GLENMARK",
      "FEDERALBNK",
      "ASTRAMICRO",
      "INDHOTEL",
      "KARURVYSYA",
      "NETWEB",
      "JINDALSTEL",
      "ABCAPITAL",
      "CIPLA",
      "CGPOWER",
      "KOTAKBANK",
      "ANANTRAJ",
      "KPIL",
      "MOTHERSON",
      "ICICIAMC",
      "HINDALCO",
      "BBOX",
      "HINDZINC",
      "DATAPATTNS",
      "AXISBANK",
      "ASTRAL",
      "TVSMOTOR"
    ]
  },
  "H2": {
    "phase": "STOCK_HISTORY",
    "plannedCalls": 40,
    "symbols": [
      "ENDURANCE",
      "ETERNAL",
      "DMART",
      "CGCL",
      "GRAVITA",
      "KAYNES",
      "ECLERX",
      "IKS",
      "CAMS",
      "AUROPHARMA",
      "APLAPOLLO",
      "ARVIND",
      "HYUNDAI",
      "ACMESOLAR",
      "EBGNG",
      "IDFCFIRSTB",
      "COROMANDEL",
      "HINDUNILVR",
      "INDIANB",
      "IONEXCHANG",
      "AUBANK",
      "WAAREEENER",
      "JUBLFOOD",
      "BLUESTARCO",
      "HDFCAMC",
      "BANDHANBNK",
      "JSWENERGY",
      "INDUSTOWER",
      "JUBLPHARMA",
      "ITCHOTELS",
      "DELHIVERY",
      "AKUMS",
      "EPL",
      "EMCURE",
      "BIOCON",
      "GAIL",
      "HINDCOPPER",
      "GOODLUCK",
      "CCL",
      "COALINDIA"
    ]
  },
  "H3": {
    "phase": "STOCK_HISTORY",
    "plannedCalls": 40,
    "symbols": [
      "BIKAJI",
      "VBL",
      "JTLIND",
      "PIIND",
      "JIOFIN",
      "CROMPTON",
      "INFY",
      "CIEINDIA",
      "IREDA",
      "IDBI",
      "KPITTECH",
      "IPL",
      "JYOTHYLAB",
      "HUDCO",
      "EXIDEIND",
      "ZAGGLE",
      "HEXT",
      "BLUSPRING",
      "YATHARTH",
      "SYRMA",
      "LT",
      "NH",
      "MANKIND",
      "SONACOMS",
      "PERSISTENT",
      "SKYGOLD",
      "MFSL",
      "RELIANCE",
      "USHAMART",
      "SUPRIYA",
      "PAYTM",
      "NAM-INDIA",
      "DEEPINDS",
      "RADICO",
      "SHARDAMOTR",
      "PPLPHARMA",
      "E2E",
      "VISHNU",
      "TATVA",
      "GMBREW"
    ]
  },
  "H4": {
    "phase": "STOCK_HISTORY",
    "plannedCalls": 40,
    "symbols": [
      "TATAPOWER",
      "GRSE",
      "ANGELONE",
      "SUNPHARMA",
      "MAXHEALTH",
      "PREMIERENE",
      "SRHHYPOLTD",
      "SENCO",
      "ZYDUSWELL",
      "NHPC",
      "ETHOSLTD",
      "MEDANTA",
      "THANGAMAYL",
      "AWHCL",
      "TIMETECHNO",
      "EIEL",
      "VAML",
      "GESHIP",
      "RATEGAIN",
      "SHARDACROP",
      "ERIS",
      "LTFOODS",
      "SHRIRAMFIN",
      "PHOENIXLTD",
      "NATIONALUM",
      "TATACAP",
      "CPPLUS",
      "TMCV",
      "PRIVISCL",
      "NCC",
      "HBLENGINE",
      "VEDL",
      "LEMONTREE",
      "KRN",
      "LTF",
      "TI",
      "FORTIS",
      "IRMENERGY",
      "ICIL",
      "WOCKPHARMA"
    ]
  },
  "H5": {
    "phase": "STOCK_HISTORY",
    "plannedCalls": 40,
    "symbols": [
      "LENSKART",
      "HCLTECH",
      "GOLDIAM",
      "CEMPRO",
      "ZYDUSLIFE",
      "SHAILY",
      "GRANULES",
      "VINATIORGA",
      "SSWL",
      "VOLTAS",
      "SBCL",
      "MUTHOOTFIN",
      "GROWW",
      "UPL",
      "ALIVUS",
      "LGEINDIA",
      "PAR",
      "SAGILITY",
      "VENTIVE",
      "SRF",
      "ZENTEC",
      "PENIND",
      "CHOLAFIN",
      "NYKAA",
      "VINCOFE",
      "HAL",
      "ONESOURCE",
      "PANAMAPET",
      "TBZ",
      "BECTORFOOD",
      "ICEMAKE",
      "UTIAMC",
      "STARHEALTH",
      "UNITDSPR",
      "MGL",
      "SHAKTIPUMP",
      "LUPIN",
      "UTLSOLAR",
      "POCL",
      "RBLBANK"
    ]
  },
  "H6": {
    "phase": "STOCK_HISTORY",
    "plannedCalls": 38,
    "symbols": [
      "PRAJIND",
      "PCBL",
      "SANGAMIND",
      "WELENT",
      "SAIL",
      "SOLARA",
      "KPIGREEN",
      "JASH",
      "ONGC",
      "UNIONBANK",
      "WELSPUNLIV",
      "SUZLON",
      "GNFC",
      "SYNGENE",
      "EMSLIMITED",
      "POWERGRID",
      "AVTNPL",
      "PINELABS",
      "GOPAL",
      "V2RETAIL",
      "RRKABEL",
      "VGUARD",
      "YATRA",
      "POLICYBZR",
      "MPHASIS",
      "DLINKINDIA",
      "DHARMAJ",
      "TMPV",
      "RHIM",
      "IGL",
      "NATCOPHARM",
      "JKLAKSHMI",
      "GOKEX",
      "PNBHOUSING",
      "INOXWIND",
      "QUESS",
      "FAZE3Q",
      "ZENSARTECH"
    ]
  }
} as const
const BENCHMARK_CODES=[
  "NIFTY_500",
  "NIFTY_AUTO",
  "NIFTY_BANK",
  "NIFTY_CAPITAL_GOODS",
  "NIFTY_CHEMICALS",
  "NIFTY_CONSUMER_DURABLES",
  "NIFTY_CONSUMER_SERVICES",
  "NIFTY_FINANCIAL_SERVICES",
  "NIFTY_FINANCIAL_SERVICES_EX_BANK",
  "NIFTY_FMCG",
  "NIFTY_HOSPITALS",
  "NIFTY_INDIA_DEFENCE",
  "NIFTY_INFRASTRUCTURE",
  "NIFTY_IT",
  "NIFTY_METAL",
  "NIFTY_OIL_GAS",
  "NIFTY_PHARMA",
  "NIFTY_POWER",
  "NIFTY_REALTY",
  "NIFTY_SERVICES_SECTOR",
  "NIFTY_TELECOM",
  "NIFTY_TRANSPORTATION_LOGISTICS"
] as const
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
const projectRef=(v:string)=>{try{return new URL(v).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(b=>b.toString(16).padStart(2,"0")).join("")
type Admin=ReturnType<typeof createClient>
type Security={id:string;symbol:string;asset_class:string}
async function createGrant(admin:Admin,action:string,securityId:string){
 const id=crypto.randomUUID(),now=Date.now(),payload={environment:"PortfolioAI Dev",project_ref:DEV_REF,action,portfolio_id:PORTFOLIO_ID,security_id:securityId,expires_at:new Date(now+20*60_000).toISOString()}
 const r=await admin.from("data_source_records").insert({id,source_code:SOURCE_CODE,record_kind:GRANT_KIND,external_record_id:id,payload_hash:await hash(payload),raw_payload:payload,retrieved_at:new Date(now).toISOString(),terms_snapshot:{mode:"P7_IC2_ONE_TIME_EXECUTION_GRANT",secret_transport:false}})
 if(r.error)throw r.error
 return id
}
async function invoke(url:string,body:Record<string,unknown>){
 const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
 let p:Record<string,unknown>;try{p=await r.json()}catch{p={error:"NON_JSON_RESPONSE"}}
 return{ok:r.ok,status:r.status,payload:p}
}
Deno.serve(async request=>{
 if(request.method!=="POST")return reply(405,{error:"Method not allowed."})
 const supabaseUrl=Deno.env.get("SUPABASE_URL")??"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",ref=projectRef(supabaseUrl)
 if(ref===PROD_REF)return reply(409,{error:"IC2 orchestrator refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET",providerCalls:0})
 if(ref!==DEV_REF||!serviceKey)return reply(500,{error:"PortfolioAI Dev runtime configuration is incomplete.",providerCalls:0})
 try{
   const body=await request.json() as {action?:unknown;grantId?:unknown;batchId?:unknown;offset?:unknown;limit?:unknown}
   if(body.action!==ACTION||typeof body.batchId!=="string")return reply(400,{error:"Exact IC2 orchestration action and batchId are required.",providerCalls:0})
   const batchId=body.batchId.trim().toUpperCase(),offset=Number(body.offset??0),limit=Number(body.limit??MAX_SLICE_SECURITIES)
   if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>MAX_SLICE_SECURITIES)return reply(400,{error:"offset/limit outside frozen IC2 slice bounds.",providerCalls:0})
   const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
   const sentinel=`${batchId}:${offset}:${limit}`
   const outer=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:sentinel})
   if(!outer.ok)return reply(401,{error:outer.message,code:outer.code,providerCalls:0})
   const control=await admin.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,actual_provider_quota").eq("source_code","TRENDLYNE_MCP").single()
   const externalDaily=Number((control.data?.actual_provider_quota as {daily_limit?:unknown}|null)?.daily_limit??0),internalDaily=Number(control.data?.daily_internal_attempt_limit??0)
   if(control.error||!control.data.ingestion_enabled||control.data.actual_provider_quota_status!=="VERIFIED"||!Number.isFinite(externalDaily)||externalDaily<=0||internalDaily!==externalDaily||Number(control.data.per_run_internal_attempt_limit)!==40)return reply(409,{error:"IC2 Trendlyne control envelope does not match the verified provider entitlement.",code:"IC2_CONTROL_ENVELOPE_MISMATCH",providerCalls:0,externalDaily,internalDaily})
   if(batchId==="BMARK01"){
      if(offset!==0)return reply(400,{error:"Benchmark batch does not support offset.",providerCalls:0})
      const child=await createGrant(admin,"P7_IC2_EXECUTE",`P7_IC2_BENCHMARKS:${BENCHMARK_CODES.join(",")}`)
      const r=await invoke(`${supabaseUrl}/functions/v1/p7-ic-benchmark-refresh`,{action:"P7_IC2_EXECUTE",portfolioId:PORTFOLIO_ID,benchmarkCodes:BENCHMARK_CODES,confirmation:"OWNER_CONFIRMED_P7_IC2_BENCHMARK_REFRESH",grantId:child})
      return reply(r.ok?200:r.status,{status:r.ok?"BATCH_COMPLETE":"BLOCKED",batchId,providerCalls:Number(r.payload.providerCalls??0),result:r.payload})
   }
   const batch=(TREND_BATCHES as Record<string,{phase:string;plannedCalls:number;symbols:readonly string[]}>)[batchId]??(HISTORY_BATCHES as Record<string,{phase:string;plannedCalls:number;symbols:readonly string[]}>)[batchId]
   if(!batch)return reply(400,{error:"BatchId is not in the frozen IC2 package.",providerCalls:0})
   const symbols=batch.symbols.slice(offset,offset+limit)
   if(!symbols.length)return reply(200,{status:"SLICE_COMPLETE",batchId,offset,processed:0,nextOffset:null,providerCalls:0,results:[]})
   if(symbols.includes("BLUEJET"))return reply(409,{error:"BLUEJET is explicitly excluded from IC2 provider execution.",code:"BLUEJET_REVIEW_REQUIRED",providerCalls:0})
   const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
   if(holdings.error)throw holdings.error
   const openIds=new Set((holdings.data??[]).filter(r=>Number(r.current_quantity)>0).map(r=>r.security_id))
   const sec=await admin.from("securities").select("id,symbol,asset_class").in("symbol",symbols)
   if(sec.error)throw sec.error
   const bySymbol=new Map((sec.data??[] as Security[]).map(s=>[s.symbol,s]))
   const ordered=symbols.map(symbol=>bySymbol.get(symbol)).filter((s):s is Security=>Boolean(s))
   if(ordered.length!==symbols.length||ordered.some(s=>s.asset_class!=="EQUITY"||!openIds.has(s.id)))return reply(409,{error:"Frozen IC2 batch no longer matches the open held-equity universe.",code:"IC2_FROZEN_SCOPE_MISMATCH",providerCalls:0})
   if(batch.phase==="CURRENT_RESEARCH"){
      const ids=ordered.map(s=>s.id)
      const identities=await admin.from("security_identity_observations").select("security_id,provider_instrument_id,evidence_status").in("security_id",ids).eq("source_code","TRENDLYNE_MCP").eq("evidence_status","MATCHED").not("provider_instrument_id","is",null)
      if(identities.error)throw identities.error
      const ready=new Set((identities.data??[]).map(r=>r.security_id))
      const missing=ordered.filter(s=>!ready.has(s.id)).map(s=>s.symbol)
      if(missing.length)return reply(409,{error:"Research slice blocked because exact Trendlyne identity is missing.",code:"TRENDLYNE_IDENTITY_PREREQUISITE_MISSING",missing,providerCalls:0})
   }
   if(batch.phase==="IDENTITY"||batch.phase==="CURRENT_RESEARCH"){
      const usage=await admin.from("provider_usage_events").select("actual_internal_units").eq("source_code","TRENDLYNE_MCP").eq("accounting_class","PROVIDER_TOOL_ATTEMPT").gte("attempted_at",new Date(new Date().setUTCHours(0,0,0,0)).toISOString())
      if(usage.error)throw usage.error
      const used=(usage.data??[]).reduce((sum,row)=>sum+Number(row.actual_internal_units??0),0),expected=symbols.length*(batch.phase==="IDENTITY"?2:4)
      if(used+expected>Math.min(MAX_TRENDLYNE_CAMPAIGN_CALLS,externalDaily))return reply(429,{error:"Verified Trendlyne daily entitlement would be exceeded.",code:"IC2_VERIFIED_DAILY_CALL_CEILING",used,expected,externalDaily,providerCalls:0})
   }
   const results:Record<string,unknown>[]=[]
   let providerCalls=0
   for(const security of ordered){
      let r:{ok:boolean;status:number;payload:Record<string,unknown>}
      if(batch.phase==="IDENTITY"){
        const child=await createGrant(admin,"P4B_EXECUTE",security.id)
        r=await invoke(`${supabaseUrl}/functions/v1/resolve-trendlyne-identity`,{action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,confirmation:"OWNER_CONFIRMED_POST_D_P4B_IDENTITY_DISCOVERY",grantId:child})
      }else if(batch.phase==="CURRENT_RESEARCH"){
        const child=await createGrant(admin,"P7_IC2_EXECUTE",security.id)
        r=await invoke(`${supabaseUrl}/functions/v1/complete-research-refresh`,{action:"P7_IC2_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,confirmation:"OWNER_CONFIRMED_P7_IC2_RESEARCH_EVIDENCE_REFRESH",grantId:child})
      }else{
        const child=await createGrant(admin,"P4B_EXECUTE",security.id)
        r=await invoke(`${supabaseUrl}/functions/v1/refresh-market-history`,{action:"P4B_EXECUTE",portfolioId:PORTFOLIO_ID,securityId:security.id,confirmation:"OWNER_CONFIRMED_POST_D_P4B_MARKET_HISTORY",grantId:child})
      }
      const calls=Number(r.payload.providerCalls??(batch.phase==="STOCK_HISTORY"&&r.ok?1:0));providerCalls+=Number.isFinite(calls)?calls:0
      results.push({symbol:security.symbol,httpStatus:r.status,status:r.ok?"READY":"BLOCKED",providerCalls:calls,...r.payload})
      if(!r.ok)return reply(r.status,{status:"BLOCKED",batchId,offset,providerCalls,results})
      await new Promise(resolve=>setTimeout(resolve,batch.phase==="STOCK_HISTORY"?1300:250))
   }
   const nextOffset=offset+symbols.length<batch.symbols.length?offset+symbols.length:null
   return reply(200,{status:"SLICE_COMPLETE",batchId,phase:batch.phase,offset,processed:symbols.length,nextOffset,providerCalls,results})
 }catch(error){return reply(500,{error:"IC2 orchestrator failed safely.",code:error instanceof Error?error.message:"IC2_ORCHESTRATOR_FAILED",providerCalls:0})}
})
