const ROOT="portfolioai-research/development/v1-4/official-documents/";
const CAPTURE=ROOT+"content/";
const TESTS=ROOT+"tests/";
const MAX=64*1024*1024;
const TOKEN_SHA256="a975f44698cbc12c688ce48da0100afa49ea6ca8bcc7d49b391164dc3e39828d";
async function sha256(s){const b=new TextEncoder().encode(s);const h=new Uint8Array(await crypto.subtle.digest("SHA-256",b));return Array.from(h).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function auth(req){const h=req.headers.get("authorization")||"";if(!h.startsWith("Bearer "))return false;return (await sha256(h.slice(7)))===TOKEN_SHA256}
function key(req){return req.headers.get("x-v14-object-key")||""}
function allowed(k){return /^portfolioai-research\/development\/v1-4\/official-documents\/content\/[a-f0-9]{64}\.pdf$/u.test(k)}
function testKey(k){return k.startsWith(TESTS)}
export default {async fetch(req,env){
 if(!(await auth(req))) return new Response("Unauthorized",{status:401});
 const k=key(req); if(!allowed(k)) return new Response("Forbidden object key",{status:403});
 if(req.method==="PUT"){
   const lengthHeader=req.headers.get("content-length"); const cl=Number(lengthHeader); if(!lengthHeader||!Number.isSafeInteger(cl)||cl<=0) return new Response("Exact length required",{status:411}); if(cl>MAX) return new Response("Too large",{status:413});
   if(!req.body) return new Response("Body required",{status:400});
   try{
     if(await env.DOC_BUCKET.head(k)) return new Response("Object exists",{status:412});
     const fixed=new FixedLengthStream(cl);
     const abort=new AbortController();
     const pumping=req.body.pipeTo(fixed.writable,{signal:abort.signal});
     const headers=new Headers({"If-None-Match":"*"});
     const storing=env.DOC_BUCKET.put(k,fixed.readable,{onlyIf:headers,httpMetadata:{contentType:req.headers.get("content-type")||"application/octet-stream"},customMetadata:{purpose:testKey(k)?"b0-synthetic-test":"v14-official-document"}}).then(obj=>{if(!obj)abort.abort();return obj},error=>{abort.abort();throw error});
     const [stored,pumped]=await Promise.allSettled([storing,pumping]);
     if(stored.status==="fulfilled"&&!stored.value)return new Response("Object exists",{status:412});
     if(stored.status==="rejected")throw stored.reason;
     if(pumped.status==="rejected")throw pumped.reason;
     const obj=stored.value;
     if(!obj) return new Response("Object exists",{status:412});
     return Response.json({ok:true,key:obj.key,size:obj.size,etag:obj.etag});
   }catch(e){const m=String(e&&e.message||e);return new Response(m.includes("B0_OBJECT_TOO_LARGE")?"Too large":"Upload failed",{status:m.includes("B0_OBJECT_TOO_LARGE")?413:500})}
 }
 if(req.method==="HEAD"){
   const obj=await env.DOC_BUCKET.head(k); if(!obj) return new Response(null,{status:404});
   return new Response(null,{status:200,headers:{"x-b0-size":String(obj.size),"etag":obj.etag}});
 }
 if(req.method==="GET"){
   const obj=await env.DOC_BUCKET.get(k); if(!obj) return new Response("Not found",{status:404});
   const h=new Headers();h.set("content-type",obj.httpMetadata?.contentType||"application/octet-stream");h.set("x-b0-size",String(obj.size));h.set("etag",obj.etag);
   return new Response(obj.body,{status:200,headers:h});
 }
 if(req.method==="DELETE"){
   if(!testKey(k)) return new Response("Delete forbidden",{status:403});
   return new Response("Delete forbidden",{status:403});
 }
 return new Response("Method not allowed",{status:405});
}}
