import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash, webcrypto} from 'node:crypto'
import {stripTypeScriptTypes} from 'node:module'
import vm from 'node:vm'
import {test} from 'node:test'

const entry=new URL('../supabase/functions/p7-ic-b0-node-control/index.ts',import.meta.url)
async function harness(){
  const writes=[]
  let updates=0,handler
  let source=readFileSync(entry,'utf8').replace(/^import .*\n/gm,'')
  const fixtureToken='provider-free-test-token'
  const fixtureHash=createHash('sha256').update(fixtureToken).digest('hex')
  source=source.replace(/const AUTH_SHA256="[a-f0-9]+"/,`const AUTH_SHA256="${fixtureHash}"`)
  const snapshot=source.match(/const CAPACITY_SNAPSHOT_AT="([^"]+)"/)[1]
  class TestDate extends Date{static now(){return Date.parse(snapshot)+1000}}
  const admin={from(table){return{
    async insert(row){writes.push({table,row});return{error:null}},
    update(){updates++;throw Error('Provider accounting and audit events are append-only.')},
  }}}
  const context=vm.createContext({Request,Response,Date:TestDate,crypto:webcrypto,TextEncoder,console,
    createClient:()=>admin,consumeP4ExecutionGrant:async()=>({ok:true}),
    Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://lrgpjimipfkyoqbpsqzz.supabase.co':'test-only'},serve:fn=>{handler=fn}},
  })
  new vm.Script(stripTypeScriptTypes(source)).runInContext(context)
  return{writes,get updates(){return updates},async call(body,authorized=true){
    return handler(new Request('https://test.invalid',{method:'POST',headers:{authorization:'Bearer '+(authorized?fixtureToken:'invalid'),'content-type':'application/json'},body:JSON.stringify(body)}))
  }}
}
test('successful HTTP response is appended without updating immutable provider usage',async()=>{
  const h=await harness()
  const response=await h.call({action:'MARK_STAGE',grantId:'test-grant',stage:'RESPONSE_RECEIVED',requestOutcome:'SUCCEEDED',httpStatus:200})
  assert.equal(response.status,200)
  assert.equal(h.updates,0)
  assert.equal(h.writes.length,1)
  assert.equal(h.writes[0].table,'data_source_records')
  assert.equal(h.writes[0].row.raw_payload.http_status,200)
  assert.equal(h.writes[0].row.raw_payload.stage,'RESPONSE_RECEIVED')
})
test('failed HTTP response also remains append-only',async()=>{
  const h=await harness()
  const response=await h.call({action:'MARK_STAGE',grantId:'test-grant',stage:'RESPONSE_RECEIVED',requestOutcome:'FAILED',httpStatus:503})
  assert.equal(response.status,200)
  assert.equal(h.updates,0)
  assert.equal(h.writes[0].row.raw_payload.request_outcome,'FAILED')
})
test('invalid authentication performs no writes',async()=>{
  const h=await harness()
  const response=await h.call({action:'MARK_STAGE'},false)
  assert.equal(response.status,401)
  assert.equal(h.writes.length,0)
})
