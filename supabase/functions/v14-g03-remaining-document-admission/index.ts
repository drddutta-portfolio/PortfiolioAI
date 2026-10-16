import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import {g03RemainingExecutorQualified} from '../_shared/v14-g03-executor-identity.ts'
import {admitRemainingG03Document} from '../_shared/v14-g03-remaining-document-admission-runtime.ts'
import policy from '../_shared/v14-g03-remaining-authorization.json' with {type:'json'}
const audience=`https://${policy.developmentProject}.supabase.co/functions/v1/v14-g03-remaining-document-admission`,jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
Deno.serve(async req=>{
 const reply=(status:number,code:string,data:Record<string,unknown>={})=>new Response(JSON.stringify({code,...data}),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})
 if(req.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED')
 const url=Deno.env.get('SUPABASE_URL')??'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''
 if(url!==`https://${policy.developmentProject}.supabase.co`||!key)return reply(409,'DEVELOPMENT_ONLY')
 let claims:Record<string,unknown>
 try{claims=(await jwtVerify((req.headers.get('authorization')??'').replace(/^Bearer\s+/i,''),jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'})).payload}catch{return reply(401,'SIGNED_G03_REMAINING_EXECUTOR_REQUIRED')}
 if(!g03RemainingExecutorQualified(claims))return reply(403,'G03_REMAINING_EXECUTOR_SCOPE_INVALID')
 const body=await req.json().catch(()=>null)
 if(!body||typeof body!=='object'||Array.isArray(body))return reply(400,'EXACT_G03_REMAINING_DOCUMENT_REQUIRED')
 try{const result=await admitRemainingG03Document(createClient(url,key,{auth:{persistSession:false}}),body,claims);return reply(200,result.code,result)}catch(e){return reply(409,e instanceof Error&&/^[A-Z0-9_]+$/.test(e.message)?e.message:'G03_REMAINING_DOCUMENT_FAILED')}
})
