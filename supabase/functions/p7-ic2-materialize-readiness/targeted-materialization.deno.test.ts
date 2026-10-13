import {readOnlySecurityIds,ReadOnlyTargetError} from "../_shared/p7-ic-read-only-targeting.ts"

const assert=(value:boolean,message:string)=>{if(!value)throw new Error(message)}
const a="00000000-0000-4000-8000-000000000001"
const b="00000000-0000-4000-8000-000000000002"

Deno.test("explicit canonical writes require the exact grant-scoped targeting mode",()=>{
  let rejected=false
  try{
    readOnlySecurityIds({action:"P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS",securityIds:[a,b]})
  }catch(error){
    rejected=error instanceof ReadOnlyTargetError&&error.code==="SECURITY_IDS_REQUIRE_AUTHENTICATED_VALIDATION_OR_GRANT_SCOPED_WRITE"
  }
  assert(rejected,"Targeted write was accepted without grant-scoped targeting mode")

  const ids=readOnlySecurityIds({
    action:"P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS",
    targetingMode:"P4_GRANT_SCOPED_SECURITY_IDS_V1",
    securityIds:[a,b],
  })
  assert(JSON.stringify(ids)==JSON.stringify([a,b]),"Grant-scoped write targeting changed ordered IDs")

  rejected=false
  try{
    readOnlySecurityIds({
      action:"P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS",
      targetingMode:"P4_GRANT_SCOPED_SECURITY_IDS_V1",
      securityIds:[a,b],
      offset:0,
    })
  }catch(error){
    rejected=error instanceof ReadOnlyTargetError&&error.code==="SECURITY_IDS_CANNOT_COMBINE_WITH_PAGINATION"
  }
  assert(rejected,"Grant-scoped targeting combined with pagination")
})
