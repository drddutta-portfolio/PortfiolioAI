import {it,expect} from 'vitest'
import {historyTailCaptureProducerHash} from './v14-history-tail-capture-integrity.ts'
it('verifies the original writer hash after JSONB key reordering without accepting changed values or schema',async()=>{
 const candle={periodStart:'2026-10-14T18:30:00.000Z',open:'380.45',high:'382.5',low:'377.3',close:'380.4',volume:'9100694',retrievedAt:'2026-10-15T13:45:53.562Z'}
 const raw={version:'V1_4_G03_HISTORY_TAIL',security_id:'BEL',session_date:'2026-10-15',requested_from:'2026-10-14',requested_to:'2026-10-15',calendar_decision_id:'verified',retention_scope:'OWNER_PRIVATE_NORMALIZED_DAILY_OHLCV_CACHE',full_provider_response_retained:false,candles:[candle]}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(raw))))).map(n=>n.toString(16).padStart(2,'0')).join('')
 const shuffled={...Object.fromEntries(Object.entries(raw).reverse()),candles:[Object.fromEntries(Object.entries(candle).reverse())]}
 expect(await historyTailCaptureProducerHash(shuffled)).toBe(hash)
 expect(await historyTailCaptureProducerHash({...shuffled,candles:[{...candle,close:'381'}]})).not.toBe(hash)
 expect(await historyTailCaptureProducerHash({...shuffled,unexpected:true})).toBeNull()
 expect(await historyTailCaptureProducerHash({...shuffled,candles:[{...candle,close:380.4}]})).toBeNull()
})
