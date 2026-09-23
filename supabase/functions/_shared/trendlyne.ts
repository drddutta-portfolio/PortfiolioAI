export interface CanonicalIdentity { readonly name:string; readonly symbol:string; readonly isin:string|null; readonly bseCode:string|null }
export interface TrendlyneIdentity { readonly stockId:string; readonly name:string; readonly symbol:string; readonly isin:string|null; readonly bseCode:string|null; readonly sector:string|null; readonly industry:string|null }
export interface TrendlyneSourceRef { readonly source_table:string; readonly source_id:string|number }
export interface MetricValue { readonly code:string; readonly value:string; readonly unit:string|null; readonly periodType:"POINT_IN_TIME"|"TTM"|null; readonly evidenceStatus:"AVAILABLE"|"CONFLICTING"; readonly sourceField:string }
export interface OwnershipValue { readonly code:string; readonly value:string; readonly periodEnd:string|null; readonly unit:string }
export interface DocumentAppearance { readonly providerDocumentId:string; readonly companyName:string; readonly symbol:string; readonly stockId:string; readonly publishedAt:string|null; readonly documentType:"ANNUAL_REPORT"|"QUARTERLY_RESULT"|"INVESTOR_PRESENTATION"|"EARNINGS_CALL"|"OTHER" }

const normalized = (value:string) => value.toUpperCase().replace(/\b(LIMITED|LTD|LTD\.|PRIVATE|PVT|CORPORATION|CORP)\b/g,"").replace(/[^A-Z0-9]/g,"")
const nullable = (value:string|undefined) => !value || value==="None" || value==="null" ? null : value.trim()
const tableRows = (text:string, start:string, end:string) => {
  const block=text.split(start)[1]?.split(end)[0] ?? ""
  return block.split("\n").map(line=>line.trim()).filter(line=>line.includes(" | ")).map(line=>line.split(" | ").map(x=>x.trim()))
}

export function parseSearchCandidates(text:string): Omit<TrendlyneIdentity,"stockId">[] {
  return tableRows(text,"data:","__END__").slice(1).filter(r=>r.length>=7).map(r=>({name:r[0],symbol:nullable(r[1])??"",bseCode:nullable(r[2]),isin:nullable(r[3]),sector:nullable(r[5]),industry:nullable(r[6])}))
}

export function parseOverview(text:string): { identity:TrendlyneIdentity; metrics:MetricValue[] } {
  const line=/stockData:\s*\n\s*([^\n]+)/.exec(text)?.[1]
  if (!line) throw new Error("Trendlyne overview omitted stockData.")
  const r=line.split(",").map(x=>x.trim())
  if (r.length<6) throw new Error("Trendlyne stockData shape is invalid.")
  const metricMap:Readonly<Record<string,readonly [string,"POINT_IN_TIME"|"TTM"|null,"AVAILABLE"|"CONFLICTING"]>>={
    MCAP_Q:["MARKET_CAP_PROVIDER_RAW","POINT_IN_TIME","AVAILABLE"], PE_TTM:["PE_TTM","TTM","AVAILABLE"], PBV_A:["PBV_ADJUSTED_PROVIDER","POINT_IN_TIME","CONFLICTING"],
    SR_TTM:["REVENUE_TTM","TTM","AVAILABLE"], NP_TTM:["NET_PROFIT_TTM","TTM","AVAILABLE"], CFO_A:["CFO_ANNUAL",null,"AVAILABLE"], ROE_A:["ROE_ANNUAL",null,"AVAILABLE"],
  }
  const metrics=tableRows(text,"fundamentalData:","SWOTData:").slice(1).flatMap(row=>{
    const mapping=metricMap[row[7]]; const value=nullable(row[1]); if(!mapping||value===null) return []
    return [{code:mapping[0],value,unit:nullable(row[5]),periodType:mapping[1],evidenceStatus:mapping[2],sourceField:row[7]}]
  })
  return {identity:{name:r[0],stockId:r[1],symbol:r[3],bseCode:nullable(r[4]),isin:nullable(r[5]),sector:nullable(r[17]),industry:nullable(r[17])},metrics}
}

export function verifyIdentity(expected:CanonicalIdentity,candidates:readonly Omit<TrendlyneIdentity,"stockId">[],overview:ReturnType<typeof parseOverview>): TrendlyneIdentity {
  const exact=candidates.filter(c=>c.symbol===expected.symbol || (expected.isin!==null && c.isin===expected.isin))
  if(exact.length!==1) throw new Error(exact.length ? "AMBIGUOUS_PROVIDER_IDENTITY" : "NO_EXACT_PROVIDER_IDENTITY")
  const actual=overview.identity, candidate=exact[0]
  const canonicalNameIsPlaceholder=normalized(expected.name)===normalized(expected.symbol)
  if(actual.symbol!==expected.symbol || actual.symbol!==candidate.symbol || (expected.isin!==null&&(actual.isin!==expected.isin||candidate.isin!==expected.isin)) || (expected.bseCode&&actual.bseCode!==expected.bseCode) || (!canonicalNameIsPlaceholder&&normalized(actual.name)!==normalized(expected.name))) throw new Error("CONFLICTING_PROVIDER_IDENTITY")
  return {...actual,sector:candidate.sector,industry:candidate.industry}
}

export function reconcileTrendlyneIdentityDiscovery(expected:CanonicalIdentity,candidates:readonly Omit<TrendlyneIdentity,"stockId">[],overview:ReturnType<typeof parseOverview>):TrendlyneIdentity {
  const exact=candidates.filter(candidate=>candidate.symbol===expected.symbol&&candidate.isin?.toUpperCase()===expected.isin?.toUpperCase())
  if(exact.length===0)throw new Error("NO_EXACT_PROVIDER_IDENTITY")
  if(exact.length>1)throw new Error("AMBIGUOUS_PROVIDER_IDENTITY")
  const candidate=exact[0],actual=overview.identity
  if(actual.symbol!==expected.symbol||candidate.symbol!==expected.symbol)throw new Error("PROVIDER_SYMBOL_MISMATCH")
  if(!expected.isin||actual.isin?.toUpperCase()!==expected.isin.toUpperCase()||candidate.isin?.toUpperCase()!==expected.isin.toUpperCase())throw new Error("PROVIDER_ISIN_MISMATCH")
  const canonicalNameIsPlaceholder=normalized(expected.name)===normalized(expected.symbol)
  if(!canonicalNameIsPlaceholder&&normalized(actual.name)!==normalized(expected.name))throw new Error("PROVIDER_COMPANY_IDENTITY_CONFLICT")
  if(expected.bseCode&&(actual.bseCode!==expected.bseCode||candidate.bseCode!==expected.bseCode))throw new Error("PROVIDER_BSE_CODE_CONFLICT")
  if(!actual.stockId)throw new Error("PROVIDER_INSTRUMENT_ID_MISSING")
  return {...actual,sector:candidate.sector,industry:candidate.industry}
}

const quarterEnd=(label:string):string|null=>{ const m=/^(Mar|Jun|Sep|Dec) (\d{4})$/.exec(label); if(!m)return null; const month:{[k:string]:string}={Mar:"03-31",Jun:"06-30",Sep:"09-30",Dec:"12-31"}; return `${m[2]}-${month[m[1]]}` }
export function parseOwnership(text:string):OwnershipValue[]{
  const map:Readonly<Record<string,string>>={Promoter:"SHAREHOLDING_PROMOTER_PERCENT",FII:"SHAREHOLDING_FII_FPI_PERCENT",DII:"SHAREHOLDING_DII_PERCENT",MF:"SHAREHOLDING_MUTUAL_FUND_PERCENT",Public:"SHAREHOLDING_PUBLIC_PERCENT"}
  const out:OwnershipValue[]=[]
  for(const [heading,code] of Object.entries(map)){
    const block=text.split(`  ${heading}:`)[1]?.split(/\n {2}[A-Z][^\n]*:/)[0]??""; const values=[...block.matchAll(/\["(Mar|Jun|Sep|Dec) (\d{4})",(-?\d+(?:\.\d+)?)/g)]
    const last=values.at(-1); if(last) out.push({code,value:last[3],periodEnd:quarterEnd(`${last[1]} ${last[2]}`),unit:"PERCENT"})
  }
  const pledge=[...text.matchAll(/(?:Promoter Pledge|Pledged Promoter Holding)[^\n\d-]*(-?\d+(?:\.\d+)?)/gi)].at(-1)
  if(pledge) out.push({code:"SHAREHOLDING_PROMOTER_PLEDGE_PERCENT",value:pledge[1],periodEnd:null,unit:"PERCENT_OF_PROMOTER_HOLDING"})
  return out
}

export function assertExpectedStockId(expected:string,actual:string):void { if(actual!==expected) throw new Error("UNEXPECTED_PROVIDER_SECURITY") }
export function parseDocumentAppearances(text:string):DocumentAppearance[]{
  let decoded=text
  try{const object=JSON.parse(text) as {markdown_data?:unknown};if(typeof object.markdown_data==="string")decoded=object.markdown_data}catch{/* non-JSON provider text is handled below */}
  const seen=new Set<string>(),result:DocumentAppearance[]=[]
  for(const match of decoded.matchAll(/(?:^|\n)"?(\d+)\|([^|\n]+)\|([A-Z0-9&-]+)\|(\d+)\|([^|\n]+)\|(20\d{2}-\d{2}-\d{2})(?=\\n|\n|$)/g)){
    if(seen.has(match[1]))continue;seen.add(match[1]);const kind=match[5].toLowerCase();const documentType=kind.includes("annual")?"ANNUAL_REPORT":kind.includes("presentation")?"INVESTOR_PRESENTATION":kind.includes("call")||kind.includes("concall")?"EARNINGS_CALL":kind.includes("result")?"QUARTERLY_RESULT":"OTHER";result.push({providerDocumentId:match[1],companyName:match[2],symbol:match[3],stockId:match[4],publishedAt:`${match[6]}T00:00:00Z`,documentType})
  }
  return result
}
export function parseMcpResult(body:string):unknown {
  let payload:Record<string,unknown>
  try {
    const events=body.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith("data:")).map(x=>x.slice(5).trim()).filter(x=>x&&x!=="[DONE]")
    payload=(events.length ? events.map(JSON.parse).at(-1) : JSON.parse(body)) as Record<string,unknown>
  }
  catch { throw new Error("PROVIDER_PROTOCOL_ERROR") }
  if(!payload)throw new Error("PROVIDER_PROTOCOL_ERROR")
  if(payload.error) throw new Error("PROVIDER_RPC_ERROR")
  return payload.result
}

export class TrendlyneMcpClient {
  #session:string|null=null; #next=1
  constructor(private readonly endpoint:string,private readonly fetcher:typeof fetch=fetch){}
  async #post(payload:unknown):Promise<unknown>{
    const headers:Record<string,string>={"Content-Type":"application/json","Accept":"application/json, text/event-stream"}; if(this.#session)headers["Mcp-Session-Id"]=this.#session
    let response:Response
    try { response=await this.fetcher(this.endpoint,{method:"POST",headers,body:JSON.stringify(payload)}) }
    catch { throw new Error("PROVIDER_NETWORK_ERROR") }
    if(!response.ok)throw new Error(`PROVIDER_HTTP_${response.status}`)
    this.#session=response.headers.get("mcp-session-id")??this.#session; const body=await response.text(); return body.trim()?parseMcpResult(body):null
  }
  async initialize():Promise<void>{ await this.#post({jsonrpc:"2.0",id:this.#next++,method:"initialize",params:{protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"PortfolioAI",version:"1"}}}); await this.#post({jsonrpc:"2.0",method:"notifications/initialized",params:{}}) }
  async call(name:string,args:Readonly<Record<string,unknown>>):Promise<string>{ if(!this.#session)await this.initialize(); const result=await this.#post({jsonrpc:"2.0",id:this.#next++,method:"tools/call",params:{name,arguments:args}}) as {content?:{type:string;text?:string}[];structuredContent?:{result?:string}}; const text=result?.structuredContent?.result??result?.content?.find(x=>x.type==="text")?.text; if(typeof text!=="string")throw new Error("PROVIDER_RESULT_MISSING"); return text }
  async searchParameters(query:string,sourceTable="stockprofile"):Promise<string>{return this.call("search_parameters",{query,source_table:sourceTable})}
  async getParameterValues(stocks:readonly TrendlyneSourceRef[],parameters:readonly string[]):Promise<string>{return this.call("get_parameter_values",{stocks:[...stocks],parameters:[...parameters]})}
}
