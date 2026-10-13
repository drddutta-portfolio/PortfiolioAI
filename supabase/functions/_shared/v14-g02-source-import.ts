import pins from './v14-g02-original-pins.json' with {type:'json'}
import policy from './v14-g02-owner-authorization.json' with {type:'json'}
export {pins as G02_ORIGINAL_PINS,policy as G02_OWNER_POLICY}
export const G02_ORIGINAL_KIND='V1_4_G02_REGISTERED_OFFICIAL_ORIGINAL'
export const G02_R2_BUCKET='portfolioai-history-dev'
export {g02SourceExecutorQualified} from './v14-g02-executor-identity.ts'
export const stableG02=(v:unknown):string=>Array.isArray(v)?'['+v.map(stableG02).join(',')+']':v!==null&&typeof v==='object'?'{'+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+stableG02(x)).join(',')+'}':JSON.stringify(v)??'null'
export const hashG02=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stableG02(v))))).map(x=>x.toString(16).padStart(2,'0')).join('')
export const bytesHashG02=async(v:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(v).buffer))).map(x=>x.toString(16).padStart(2,'0')).join('')
export async function g02StableId(v:unknown){const h=await hashG02(v);return h.slice(0,8)+'-'+h.slice(8,12)+'-5'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32)}
export function g02SourcePin(hash:string){const pin=pins.find(p=>p.original_sha256===hash);if(!pin||!policy.securityIds.includes(pin.security_id))throw Error('G02_EXACT_ORIGINAL_NOT_APPROVED');return pin}
export function g02R2Key(hash:string){const pin=g02SourcePin(hash);return 'portfolioai-history/development/v1-4/g02/originals/'+hash+'.'+pin.extension}
export function g02ReadUrlAllowed(hash:string,raw:string){try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com'&&!u.username&&!u.password&&!u.port&&!u.hash&&decodeURIComponent(u.pathname)==='/'+G02_R2_BUCKET+'/'+g02R2Key(hash)&&u.searchParams.get('X-Amz-Algorithm')==='AWS4-HMAC-SHA256'&&Number(u.searchParams.get('X-Amz-Expires'))>0&&Number(u.searchParams.get('X-Amz-Expires'))<=300}catch{return false}}
export async function verifyG02Original(hash:string,bytes:Uint8Array){const p=g02SourcePin(hash);if(bytes.length!==p.original_bytes||bytes.length>64*1024*1024||await bytesHashG02(bytes)!==hash)throw Error('G02_ORIGINAL_BYTES_MISMATCH');if(p.extension==='pdf'&&new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('G02_ORIGINAL_PDF_REQUIRED');if(p.extension==='html'){const text=new TextDecoder().decode(bytes);if(!text.includes(p.symbol)||!text.includes('INE067A01029'))throw Error('G02_HTML_ISSUER_IDENTITY_MISMATCH')}return p}
export async function prepareG02Source(hash:string,verifiedAt:string){const p=g02SourcePin(hash);if(!Number.isFinite(Date.parse(verifiedAt))||Date.parse(p.first_observed_at)>Date.parse(verifiedAt))throw Error('G02_SOURCE_VERIFICATION_TIME_INVALID');const raw={version:'G02_REGISTERED_ORIGINAL_V1',security_id:p.security_id,symbol:p.symbol,original_url:p.original_url,original_sha256:hash,original_bytes:p.original_bytes,original_bytes_verified_at:verifiedAt,first_observed_at:p.first_observed_at,publication_precision:'UNKNOWN',proven_availability_at:verifiedAt,identity_fragment:p.identity_fragment,title:p.title,r2_bucket:G02_R2_BUCKET,r2_object_key:g02R2Key(hash),financial_admission:false};return{id:await g02StableId({kind:G02_ORIGINAL_KIND,security:p.security_id,hash}),source_code:p.source_code,record_kind:G02_ORIGINAL_KIND,external_record_id:'G02:'+p.security_id+':'+hash,source_url:p.original_url,retrieved_at:verifiedAt,published_at:null,payload_hash:await hashG02(raw),raw_payload:raw,terms_snapshot:{mode:'OWNER_AUTHORIZED_SOURCE_REGISTRATION_ONLY',authorization_reference:policy.directiveSha256,no_owner_session_attribution:true,provider_api_calls:0}}}

export async function readG02Original(response:Response,expectedBytes:number){
 if(!response.body||!Number.isInteger(expectedBytes)||expectedBytes<1||expectedBytes>64*1024*1024)throw Error('G02_ORIGINAL_LENGTH_MISMATCH')
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let total=0
 try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>expectedBytes)throw Error('G02_ORIGINAL_LENGTH_MISMATCH');chunks.push(value)}}finally{await reader.cancel()}
 if(total!==expectedBytes)throw Error('G02_ORIGINAL_LENGTH_MISMATCH')
 const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return bytes
}
