export interface BankDispatchStore {
 acquire():Promise<boolean>
 hasPriorRun():Promise<boolean>
 release():Promise<boolean>
}
export function bankSessionLeaseOperation(action:string,sessionDate:string):string{
 if(!/^[A-Z0-9_]+$/.test(action)||!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate))throw Error("BANK_MAINTENANCE_LEASE_SCOPE_INVALID")
 return `${action}_${sessionDate.replaceAll("-","")}`
}
/** One run per session, including failed/interrupted attempts. A fresh grant
 * is not permission to reset the approved daily ceiling or retry paid calls. */
export async function beginBankSessionDispatch(store:BankDispatchStore):Promise<
 {ok:true;release:()=>Promise<boolean>}|{ok:false;code:string}
>{
 if(!await store.acquire())return{ok:false,code:"BANK_MAINTENANCE_SESSION_LEASE_BUSY"}
 try{
  if(await store.hasPriorRun()){
   if(!await store.release())return{ok:false,code:"BANK_MAINTENANCE_LEASE_RELEASE_FAILED"}
   return{ok:false,code:"BANK_MAINTENANCE_SESSION_ALREADY_ATTEMPTED"}
  }
  return{ok:true,release:()=>store.release()}
 }catch(error){
  if(!await store.release())throw Error("BANK_MAINTENANCE_LEASE_RELEASE_FAILED",{cause:error})
  throw error
 }
}
