import {describe,it,expect,vi} from 'vitest'
import {refreshG03CurrentSessionStatus} from './v14-g03-session-status-runtime.ts'
import {G03_FINANCIAL_POLICY as p} from './v14-g03-cash-components.ts'
import {g03SessionStatusExecutorQualified} from './v14-g03-executor-identity.ts'
import {hashG02} from './v14-g02-source-import.ts'
import {NSE_CASH_TIMING_KIND,NSE_CASH_TIMING_ORIGINAL} from './v14-bank-open-session-timing.ts'
type Row=Record<string,unknown>
const at='2026-10-15T04:45:00.000Z',semantic='64b65c5f42f6694cc1ad30feada7272e7f5dff28226b50083f7b45accbd6c295'
const body={action:'QUALIFY_G03_BEL_CURRENT_SESSION',authorizationHash:p.contractSha256,portfolioId:p.portfolioId,securityId:p.securityId}
async function database(){
 const timing={source_url:'https://www.nseindia.com/market-data/market-timings',original_sha256:NSE_CASH_TIMING_ORIGINAL,original_bytes:330721,market:'CAPITAL_MARKET',normal_open:'09:15',normal_close:'15:30',opening_quote:'Normal / Odd lot market Open 09:15 hrs',closing_quote:'Normal / Odd lot market Close 15:30 hrs',r2_verified_sha256:NSE_CASH_TIMING_ORIGINAL,r2_bucket:'portfolioai-history-dev',r2_object_key:`portfolioai-history/development/v1-4/banking/pit-originals/${NSE_CASH_TIMING_ORIGINAL}.html`,cash_table_fragment:'<td>Normal / Odd lot market Open</td><td>09:15 hrs</td><td>Normal / Odd lot market Close</td><td>15:30 hrs</td>'}
 const rows:Record<string,Row[]>={portfolios:[{id:p.portfolioId,user_id:p.ownerId}],data_source_records:[
  {id:'timing',source_code:'NSE_OFFICIAL',record_kind:NSE_CASH_TIMING_KIND,retrieved_at:'2026-10-13T05:22:00+00:00',raw_payload:timing,payload_hash:await hashG02(timing)},
  {id:'d3a39583-b851-4a5a-99b6-dcc412c4ad26',source_code:'NSE_OFFICIAL',record_kind:'V1_4_NSE_TRADING_CALENDAR_2026_BASE',retrieved_at:'2026-10-10T00:00:00+00:00',raw_payload:{version:'V1_4_NSE_CM_CALENDAR_2026_BASE_V1',segment:'CAPITAL_MARKET',source_url:'https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf',verification_horizon_end:'2026-12-31',weekday_trading_holidays:[],special_sessions_pending:[]}},
  {id:'8e9e7299-7dfc-46fc-b6bd-4d04e23aedbc',source_code:'NSE_OFFICIAL',record_kind:'V1_4_NSE_CALENDAR_APPROVED_BASELINE',retrieved_at:'2026-10-10T00:00:00+00:00',raw_payload:{source_url:'https://www.nseindia.com/resources/exchange-communication-holidays?apiversion=v2',semantic_fingerprint_sha256:semantic}},
  {id:'refresh',source_code:'NSE_OFFICIAL',record_kind:'V1_4_NSE_CALENDAR_REFRESH_CAPTURE',retrieved_at:'2026-10-14T13:25:00+00:00',raw_payload:{source_url:'https://www.nseindia.com/resources/exchange-communication-holidays?apiversion=v2',semantic_fingerprint_sha256:semantic,status_code:200}},
 ]}
 const value=(r:Row,k:string)=>k.includes('->>')?(r[k.split('->>')[0]] as Row)?.[k.split('->>')[1]]:r[k]
 class Query{
  filters:Array<(r:Row)=>boolean>=[];bound=Infinity
  constructor(readonly table:string){}
  select(){return this}eq(k:string,v:unknown){this.filters.push(r=>value(r,k)===v);return this}in(k:string,vs:unknown[]){this.filters.push(r=>vs.includes(value(r,k)));return this}lte(k:string,v:string){this.filters.push(r=>String(value(r,k))<=v);return this}order(){return this}limit(n:number){this.bound=n;return this}
  result(){return (rows[this.table]??[]).filter(r=>this.filters.every(f=>f(r))).slice(0,this.bound)}
  then(resolve:(v:unknown)=>unknown){return Promise.resolve({data:this.result(),error:null}).then(resolve)}
  async single(){const r=this.result();return {data:r[0]??null,error:r.length!==1?{code:'SINGLE'}:null}}
  async maybeSingle(){return {data:this.result()[0]??null,error:null}}
  async insert(row:Row){if(rows[this.table].some(r=>r.id===row.id))return {error:{code:'23505'}};rows[this.table].push(row);return {error:null}}
 }
 return {rows,db:{from:(table:string)=>new Query(table)} as unknown as Parameters<typeof refreshG03CurrentSessionStatus>[0]}
}
const payload=(changes:Row={})=>({marketState:[{market:'Capital Market',marketStatus:'Open',marketStatusMessage:'Normal Market is Open',tradeDate:'15-Oct-2026 10:15',...changes}],indicativenifty50:{status:'CLOSE',dateTime:'14-Oct-2026 15:30'}})
describe('G03 bounded transport reuses the existing authoritative NSE current-session proof',()=>{
 it('captures once, verifies five-source lineage and reuses a still-current status without another public request',async()=>{
  const {rows,db}=await database(),fetcher=vi.fn(async()=>new Response(JSON.stringify(payload()),{status:200}))
  const first=await refreshG03CurrentSessionStatus(db,body,fetcher,()=>at),repeat=await refreshG03CurrentSessionStatus(db,body,fetcher,()=>at)
  expect(first).toMatchObject({code:'G03_CURRENT_OPEN_SESSION_QUALIFIED',publicSourceRequests:1,providerApiCalls:0,canonicalMaterialization:false,proof:{sessionDate:'2026-10-15',latestCompletedSession:'2026-10-14'}})
  expect(first.proof?.sourceRecordIds).toHaveLength(5);expect(repeat).toMatchObject({recordId:first.recordId,reused:true,publicSourceRequests:0});expect(fetcher).toHaveBeenCalledTimes(1)
  expect(rows.data_source_records.filter(r=>r.record_kind==='V1_4_NSE_CURRENT_OPEN_SESSION_STATUS')).toHaveLength(1)
 })
 it('never turns a stale/closed/malformed official status into a current proof',async()=>{
  for(const data of [payload({marketStatus:'Closed'}),payload({tradeDate:'15-Oct-2026 10:05'}),{...payload(),indicativenifty50:{status:'CLOSE',dateTime:'13-Oct-2026 15:30'}}]){
   const {rows,db}=await database(),count=rows.data_source_records.length
   await expect(refreshG03CurrentSessionStatus(db,body,async()=>new Response(JSON.stringify(data)),()=>at)).rejects.toThrow('G03_CURRENT_OPEN_SESSION_NOT_QUALIFIED')
   expect(rows.data_source_records).toHaveLength(count)
  }
 })
 it('has no paid provider retry, calendar fallback or out-of-scope owner path',async()=>{
  const {db,rows}=await database(),fetcher=vi.fn(async()=>{throw Error('network')})
  await expect(refreshG03CurrentSessionStatus(db,{...body,securityId:'foreign'},fetcher,()=>at)).rejects.toThrow('EXACT_SCOPE')
  expect(fetcher).not.toHaveBeenCalled()
  await expect(refreshG03CurrentSessionStatus(db,body,fetcher,()=>at)).rejects.toThrow('network');expect(fetcher).toHaveBeenCalledTimes(1)
  rows.portfolios[0].user_id='foreign';await expect(refreshG03CurrentSessionStatus(db,body,fetcher,()=>at)).rejects.toThrow('OWNER_NOT_PROVEN')
  expect(fetcher).toHaveBeenCalledTimes(1)
 })
 it('accepts only the exact protected dispatched canonical workflow',()=>{
  const claims={repository:'drddutta-portfolio/PortfiolioAI',repository_id:'1357024254',ref:'refs/heads/codex/g02-industry-evidence',environment:'PortfolioAI-Development',sub:'repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development',event_name:'workflow_dispatch',workflow_ref:'drddutta-portfolio/PortfiolioAI/.github/workflows/g03-canonical-validation.yml@refs/heads/codex/g02-industry-evidence'}
  expect(g03SessionStatusExecutorQualified(claims)).toBe(true)
  for(const change of [{event_name:'push'},{environment:'Production'},{ref:'refs/heads/main'},{workflow_ref:claims.workflow_ref.replace('g03-canonical-validation','g03-bel-cash-components')}])expect(g03SessionStatusExecutorQualified({...claims,...change})).toBe(false)
 })
})
