import {describe,it,expect} from 'vitest'
import {bankSessionLeaseOperation,beginBankSessionDispatch} from './v14-bank-maintenance-dispatch'
describe('G02 acquisition respects the deployed lease and session-once contracts',()=>{
 it('uses the canonical SQL-safe lease identifier for its dated session',()=>{expect(bankSessionLeaseOperation('V1_4_G02_HISTORY_TAIL','2026-10-13')).toMatch(/^[A-Z0-9_]+$/);expect(bankSessionLeaseOperation('V1_4_G02_HISTORY_TAIL','2026-10-13')).not.toBe(bankSessionLeaseOperation('V1_4_G02_HISTORY_TAIL','2026-10-14'));expect(()=>bankSessionLeaseOperation('V1_4_G02_HISTORY_TAIL:','2026-10-13')).toThrow()})
 it('rejects a prior failed session without starting another provider run',async()=>{let released=0;expect(await beginBankSessionDispatch({acquire:async()=>true,hasPriorRun:async()=>true,release:async()=>{released++;return true}})).toEqual({ok:false,code:'BANK_MAINTENANCE_SESSION_ALREADY_ATTEMPTED'});expect(released).toBe(1)})
})
