/** Reconstruct the exact JSON.stringify layout used by the existing
 * v14-g02-market-history-runtime writer. PostgreSQL jsonb reorders keys;
 * a sorted-key hash is a different hash contract. Never rewrite stored hashes. */
export async function historyTailCaptureProducerHash(value:unknown):Promise<string|null>{
 if(!value||typeof value!=='object'||Array.isArray(value))return null
 const r=value as Record<string,unknown>
 const keys=['version','security_id','session_date','requested_from','requested_to','calendar_decision_id','retention_scope','full_provider_response_retained','candles']
 const exact=(v:Record<string,unknown>,names:readonly string[])=>Object.keys(v).length===names.length&&names.every(n=>Object.hasOwn(v,n))
 if(!exact(r,keys)||!Array.isArray(r.candles))return null
 const candles=[]
 for(const value of r.candles){
  if(!value||typeof value!=='object'||Array.isArray(value))return null
  const c=value as Record<string,unknown>,names=['periodStart','open','high','low','close','volume','retrievedAt']
  if(!exact(c,names)||names.some(n=>typeof c[n]!=='string'))return null
  candles.push({periodStart:c.periodStart,open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume,retrievedAt:c.retrievedAt})
 }
 const raw={version:r.version,security_id:r.security_id,session_date:r.session_date,requested_from:r.requested_from,requested_to:r.requested_to,calendar_decision_id:r.calendar_decision_id,retention_scope:r.retention_scope,full_provider_response_retained:r.full_provider_response_retained,candles}
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(raw))))).map(n=>n.toString(16).padStart(2,'0')).join('')
}
