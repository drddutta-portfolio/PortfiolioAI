import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import policy from './v14-g03-owner-authorization.json' with {type:'json'}
import {g03ValidationRequestQualified,g03ValidationExecutorQualified} from './v14-g03-validation-scope.ts'
const audience=`https://${policy.developmentProject}.supabase.co/functions/v1/p7-ic2-materialize-readiness`
const jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
/** Separate G03 read-only capability. No owner impersonation or grant/write scope. */
export async function authorizeG03SignedValidation(token:string,body:Record<string,unknown>){
 if(!g03ValidationRequestQualified(body))return null
 try{const result=await jwtVerify(token,jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'});return g03ValidationExecutorQualified(result.payload)?{portfolioId:policy.portfolioId,authorizingOwnerId:policy.ownerId,authorizationReference:policy.directiveSha256,actor:'OWNER_AUTHORIZED_G03_SIGNED_VALIDATION',executionRunId:result.payload.run_id}:null}catch{return null}
}
