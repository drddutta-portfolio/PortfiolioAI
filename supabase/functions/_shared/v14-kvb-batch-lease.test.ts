import {describe,it,expect,vi} from 'vitest'
import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {releaseKvbBatchLease} from './v14-kvb-batch-lease.ts'
const holder='00000000-0000-4000-8000-000000000001'
const headers={'content-type':'application/json'}
const response=(code='KVB_SOURCE_QUALIFIED_NOT_ADMITTED',status=200)=>new Response(JSON.stringify({code,stage:'PROPOSAL'}),{status,headers})
describe('KVB batch lease release uses the live RPC contract',()=>{
 it('supplies cooldown and confirms boolean release before returning the original result',async()=>{const rpc=vi.fn().mockResolvedValue({error:null,data:true}),primary=response();expect(await releaseKvbBatchLease({rpc} as unknown as SupabaseClient,'KVB_PB_PE_OWNER_BATCH_V1',holder,primary,headers)).toBe(primary);expect(rpc).toHaveBeenCalledExactlyOnceWith('release_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:'KVB_PB_PE_OWNER_BATCH_V1',p_lease_holder:holder,p_cooldown_seconds:0})})
 it('fails closed on replay or a lease owned by another invocation',async()=>{const rpc=vi.fn().mockResolvedValue({error:null,data:false});const result=await releaseKvbBatchLease({rpc} as unknown as SupabaseClient,'op',holder,response(),headers);expect(result.status).toBe(503);expect(await result.json()).toMatchObject({code:'KVB_BATCH_LEASE_RELEASE_FAILED',primaryStatus:200,primaryCode:'KVB_SOURCE_QUALIFIED_NOT_ADMITTED'})})
 it('preserves a primary failure when cleanup also fails without exposing database details',async()=>{const rpc=vi.fn().mockResolvedValue({error:{code:'PGRST202',message:'secret diagnostic'},data:null});const result=await releaseKvbBatchLease({rpc} as unknown as SupabaseClient,'op',holder,response('NSE_CURRENT_SESSION_HTTP_403',409),headers);const body=await result.json();expect(body).toMatchObject({releaseCode:'PGRST202',primaryStatus:409,primaryCode:'NSE_CURRENT_SESSION_HTTP_403',primaryStage:'PROPOSAL'});expect(JSON.stringify(body)).not.toContain('secret diagnostic')})
})
