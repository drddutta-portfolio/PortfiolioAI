export interface BankBudgetControls{ingestion_enabled:boolean;daily_internal_attempt_limit:number;rolling_internal_attempt_limit:number;rolling_window_days:number;per_run_internal_attempt_limit:number;concurrency_limit:number}
export interface BankBudgetUsage{attempted_at:string;actual_internal_units:number}
export interface BankBudgetReservation{expires_at:string;estimated_units:number;consumed_units:number;failed_units:number;released_units:number;ingestion_run_id:string}
const fail=()=>{throw Error('BANK_MAINTENANCE_BUDGET_PREFLIGHT_UNPROVEN')}
/** Advisory only: the unchanged locked reservation RPC remains the final authority. */
export function bankBudgetWindowDelay(controls:BankBudgetControls,usage:readonly BankBudgetUsage[],reservations:readonly BankBudgetReservation[],now:number,requested:number):number{
 if(!Number.isFinite(now)||!Number.isInteger(requested)||requested<1||requested>14||controls.ingestion_enabled!==true)fail()
 for(const n of [controls.daily_internal_attempt_limit,controls.rolling_internal_attempt_limit,controls.rolling_window_days,controls.per_run_internal_attempt_limit,controls.concurrency_limit])if(!Number.isInteger(n)||n<1)fail()
 if(requested>controls.per_run_internal_attempt_limit)fail()
 const window=controls.rolling_window_days*86400000,start=Date.parse(new Date(now).toISOString().slice(0,10)+'T00:00:00Z')
 const events=usage.map(u=>{const t=Date.parse(u.attempted_at);if(!Number.isFinite(t)||t>now||!Number.isInteger(u.actual_internal_units)||u.actual_internal_units<0)fail();return{t,units:u.actual_internal_units}})
 let active=0;const runs=new Set<string>()
 for(const r of reservations){const expiry=Date.parse(r.expires_at);if(!Number.isFinite(expiry))fail();for(const n of [r.estimated_units,r.consumed_units,r.failed_units,r.released_units])if(!Number.isInteger(n)||n<0)fail();const left=r.estimated_units-r.consumed_units-r.failed_units-r.released_units;if(left<0||!r.ingestion_run_id)fail();if(expiry>now){active+=left;runs.add(r.ingestion_run_id)}}
 if(runs.size>=controls.concurrency_limit||events.filter(e=>e.t>=start).reduce((n,e)=>n+e.units,0)+active+requested>controls.daily_internal_attempt_limit)fail()
 const rolling=events.filter(e=>e.t>=now-window).sort((a,b)=>a.t-b.t)
 let remaining=rolling.reduce((n,e)=>n+e.units,0)+active+requested
 if(remaining<=controls.rolling_internal_attempt_limit)return 0
 for(const event of rolling){remaining-=event.units;if(remaining<=controls.rolling_internal_attempt_limit){const delay=event.t+window-now+100;if(delay<0||delay>60000)fail();return delay}}
 return fail()
}
export async function waitForBankBudgetWindow(read:(now:number)=>Promise<{controls:BankBudgetControls;usage:BankBudgetUsage[];reservations:BankBudgetReservation[]}>,clock:()=>number=Date.now,wait:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms))):Promise<number>{
 const now=clock(),snapshot=await read(now),delay=bankBudgetWindowDelay(snapshot.controls,snapshot.usage,snapshot.reservations,now,14)
 if(delay){await wait(delay);const after=clock();if(after<now+delay||after>now+60000)fail();const fresh=await read(after);if(bankBudgetWindowDelay(fresh.controls,fresh.usage,fresh.reservations,after,14)!==0)fail()}
 return delay
}
