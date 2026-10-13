import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'

/** Release only this invocation's lease, with the deployed RPC's required
 * cooldown argument. Never replace an unsuccessful release with a success. */
export async function releaseKvbBatchLease(db:SupabaseClient,operation:string,holder:string,response:Response,headers:HeadersInit){
 let releaseCode='LEASE_RELEASE_REQUEST_FAILED'
 try{
  const released=await db.rpc('release_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0})
  if(!released.error&&released.data===true)return response
  releaseCode=released.error?.code&&/^[A-Z0-9_]+$/.test(released.error.code)?released.error.code:'LEASE_RELEASE_NOT_CONFIRMED'
 }catch{/* Preserve credential-free diagnostics and the primary operation result. */}
 let primary:Record<string,unknown>={}
 try{primary=await response.clone().json()}catch{/* Non-JSON primary response is reported by status. */}
 const safe=(v:unknown)=>typeof v==='string'&&/^[A-Z0-9_:]+$/.test(v)?v:null
 return new Response(JSON.stringify({code:'KVB_BATCH_LEASE_RELEASE_FAILED',stage:'LEASE_RELEASE',releaseCode,primaryStatus:response.status,primaryCode:safe(primary.code),primaryStage:safe(primary.stage)}),{status:503,headers})
}
