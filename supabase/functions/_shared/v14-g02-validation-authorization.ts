import {g02ValidationRequestQualified} from './v14-g02-validation-scope.ts'
import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import policy from './v14-g02-owner-authorization.json' with {type:'json'}
import {g02ValidationExecutorQualified} from './v14-g02-executor-identity.ts'
const audience=`https://${policy.developmentProject}.supabase.co/functions/v1/p7-ic2-materialize-readiness`
const jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
export {g02ValidationRequestQualified} from './v14-g02-validation-scope.ts'
/** Explicit owner-authorized signed executor, never an impersonated owner session.
 * This capability cannot review evidence, acquire providers, write or materialize. */
export async function authorizeG02SignedValidation(token:string,body:Record<string,unknown>){
 if(!g02ValidationRequestQualified(body))return null
 try{const verified=await jwtVerify(token,jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'});return g02ValidationExecutorQualified(verified.payload)?{portfolioId:policy.portfolioId,authorizingOwnerId:policy.ownerId,authorizationReference:policy.directiveSha256,actor:'OWNER_AUTHORIZED_G02_SIGNED_VALIDATION',executionRunId:verified.payload.run_id}:null}catch{return null}
}
