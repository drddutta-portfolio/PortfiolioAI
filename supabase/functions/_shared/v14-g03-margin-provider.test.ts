import {describe,it,expect} from 'vitest'
import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import rows from './v14-g03-margin-provider-fixture.json' with {type:'json'}
import {verifyMarginProviderCaptures} from './v14-g03-margin-admission-runtime.ts'
function fixture(captures:unknown[]=rows,definitionsApproved=true){
 return {from(table:string){let id:string|null=null;const q={select:()=>q,eq:(k:string,v:string)=>{if(k==='id')id=v;return q},in:async()=>({error:null,data:['OPERATING_PROFIT_QUARTER','OPERATING_REVENUE_QUARTER'].map(code=>({code,is_active:true,definition:{selection:definitionsApproved?'REVIEWED':'PROVISIONAL',mapping_version:'R4H_RAW_HISTORY_V1'}}))}),single:async()=>table==='data_sources'?{error:null,data:{is_active:true,entitlement_verified:true,retention_rights_verified:true}}:{error:null,data:captures.find(x=>(x as {id:string}).id===id)}};return q}} as unknown as SupabaseClient
}
describe('BEL raw parameter provenance and caption ambiguity',()=>{
 it('verifies all six actual immutable retained responses and both single-field resolutions',async()=>{
  expect(await verifyMarginProviderCaptures(fixture())).toEqual({verifiedCaptures:6})
 })
 it('rejects omitted sole-field capture, modified payload and provisional raw metric definitions',async()=>{
  await expect(verifyMarginProviderCaptures(fixture(rows.filter(x=>x.raw_payload.research_kind!=='EXACT_PROFIT_Q5')))).rejects.toThrow()
  const changed=structuredClone(rows);changed[0].raw_payload.symbol='OTHER'
  await expect(verifyMarginProviderCaptures(fixture(changed))).rejects.toThrow('G03_MARGIN_CAPTURE_NOT_VERIFIED')
  await expect(verifyMarginProviderCaptures(fixture(rows,false))).rejects.toThrow('G03_MARGIN_REVIEWED_RAW_DEFINITION_NOT_PROVEN')
 })
})
