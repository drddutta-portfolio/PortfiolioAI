import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {spoolArtifact} from '../server/b0-artifact-spool.ts'
const bytes=new TextEncoder().encode('[{"raw":"évidence"}]')
async function* chunks(){yield bytes.slice(0,7);yield bytes.slice(7)}
const a=await spoolArtifact(chunks(),1024)
try{assert.equal(a.byteLength,bytes.length);assert.equal(a.sha256,createHash('sha256').update(bytes).digest('hex'));assert.deepEqual(new Uint8Array(await new Response(a.stream()).arrayBuffer()),bytes)}finally{await a.cleanup()}
await assert.rejects(spoolArtifact(chunks(),1),/TOO_LARGE/)
class FixedLengthStream{constructor(n){let count=0;const t=new TransformStream({transform(chunk,c){count+=chunk.length;if(count>n)throw Error('length mismatch');c.enqueue(chunk)},flush(){if(count!==n)throw Error('length mismatch')}});this.writable=t.writable;this.readable=t.readable;this.readable.fixedLength=n}}
let source=await readFile(new URL('../cloudflare/portfolioai-b0-r2-gateway-dev/worker.js',import.meta.url),'utf8')
const token='fixture-only',hash=createHash('sha256').update(token).digest('hex')
source=source.replace(/const TOKEN_SHA256="[a-f0-9]+";/,`const TOKEN_SHA256="${hash}";`).replace('export default','return')
const worker=new Function('FixedLengthStream',source)(FixedLengthStream)
const objects=new Map()
const env={B0_BUCKET:{async head(k){return objects.get(k)||null},async put(k,body,opts){assert.equal(opts.onlyIf.get('If-None-Match'),'*');assert.ok(body.fixedLength);const b=new Uint8Array(await new Response(body).arrayBuffer());assert.equal(b.length,body.fixedLength);const o={key:k,size:b.length,etag:'test',body:b};objects.set(k,o);return o},async get(k){return objects.get(k)||null},async delete(k){objects.delete(k)}}}
const key='portfolioai-capture/development/v1/b0/tests/fixture/master.json'
function req(method,k=key,len=bytes.length,auth=token){const h={authorization:'Bearer '+auth,'x-b0-object-key':k};if(len!==null)h['content-length']=String(len);return new Request('https://test',{method,headers:h,...(method==='PUT'?{body:bytes}: {})})}
assert.equal((await worker.fetch(req('PUT',key,bytes.length,'bad'),env)).status,401)
assert.equal((await worker.fetch(req('PUT','portfolioai-history/development/p8/x'),env)).status,403)
assert.equal((await worker.fetch(req('PUT',key,null),env)).status,411)
assert.equal((await worker.fetch(req('PUT',key,64*1024*1024+1),env)).status,413)
assert.equal((await worker.fetch(req('PUT'),env)).status,200)
assert.equal((await worker.fetch(req('PUT'),env)).status,412)
assert.deepEqual(new Uint8Array(await (await worker.fetch(req('GET'),env)).arrayBuffer()),bytes)
assert.equal((await worker.fetch(req('DELETE'),env)).status,204)
assert.equal((await worker.fetch(req('PUT',key,bytes.length+1),env)).status,500)
assert.equal(objects.size,0)
assert.equal((await worker.fetch(req('DELETE','portfolioai-capture/development/v1/b0/angel-one/instrument-master/x'),env)).status,403)
console.log('B0 spool + fixed-length gateway contract: PASS; zero provider requests')
