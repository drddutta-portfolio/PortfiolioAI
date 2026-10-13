import{describe,it,expect}from'vitest'
import{bankBudgetWindowDelay,waitForBankBudgetWindow}from'./v14-bank-budget-window.ts'
const now=Date.parse('2026-10-13T13:30:03.468Z'),c={ingestion_enabled:true,daily_internal_attempt_limit:14,rolling_internal_attempt_limit:14,rolling_window_days:1,per_run_internal_attempt_limit:14,concurrency_limit:1}
const rows=[{attempted_at:'2026-10-12T13:30:05.013Z',actual_internal_units:1},{attempted_at:'2026-10-12T13:30:27.257Z',actual_internal_units:13}]
describe('bank first-reservation budget window',()=>{
 it('waits through the last included prior usage boundary plus jitter',()=>{expect(bankBudgetWindowDelay(c,rows,[],now,14)).toBe(23889);expect(bankBudgetWindowDelay(c,rows,[],now+23889,14)).toBe(0)})
 it('allows partial requested units once enough prior units expire',()=>expect(bankBudgetWindowDelay(c,rows,[],now,1)).toBe(1645))
 it('includes the exact SQL >= boundary',()=>expect(bankBudgetWindowDelay(c,rows,[],Date.parse(rows[1].attempted_at)+86400000,14)).toBe(100))
 it('fails closed beyond sixty seconds, active reservations, daily limits and invalid timestamps',()=>{for(const args of [[rows,[],now-60000],[rows,[{expires_at:'2026-10-13T14:00Z',estimated_units:1,consumed_units:0,failed_units:0,released_units:0,ingestion_run_id:'other'}],now],[[{attempted_at:'2026-10-13T12:00Z',actual_internal_units:1}],[],now],[[{attempted_at:'bad',actual_internal_units:1}],[],now]]as const)expect(()=>bankBudgetWindowDelay(c,args[0],args[1],args[2],14)).toThrow()})
 it('waits once, rereads authoritative state and returns without a reservation retry',async()=>{let clock=now,calls=0,waits=0;const result=await waitForBankBudgetWindow(async()=>{calls++;return{controls:c,usage:rows,reservations:[]}},()=>clock,async ms=>{waits++;clock+=ms});expect(result).toBe(23889);expect(calls).toBe(2);expect(waits).toBe(1)})
 it('rereads once before any reservation and rejects concurrent new usage without another wait',async()=>{let clock=now,calls=0;const read=async()=>{calls++;return{controls:c,usage:calls===1?rows:[...rows,{attempted_at:'2026-10-13T13:30:28Z',actual_internal_units:1}],reservations:[]}};await expect(waitForBankBudgetWindow(read,()=>clock,async ms=>{clock+=ms})).rejects.toThrow();expect(calls).toBe(2)})
})
