import {ownerMatches,validKvbGrantRequest,BANK_V14_ACTION,BANK_V14_PORTFOLIO,BANK_V14_KVB} from "./request-guard.ts";
const base={action:BANK_V14_ACTION,portfolioId:BANK_V14_PORTFOLIO,securityId:BANK_V14_KVB,confirmation:"ISSUE_KVB_V14_SINGLE_USE_MATERIALIZATION_GRANT",requestId:"123e4567-e89b-42d3-a456-426614174000"};
Deno.test("only authenticated matching portfolio owner is authorized",()=>{
 if(!ownerMatches("owner-id","owner-id"))throw Error("Owner rejected");
 for(const x of [["attacker","owner-id",false],["owner-id","attacker",false],["owner-id","owner-id",true],[null,"owner-id",false]] as const)
  if(ownerMatches(x[0],x[1],x[2]))throw Error("Wrong/anonymous owner accepted");
});
Deno.test("grant request is bound to exact materializer, portfolio and KVB",()=>{
 if(!validKvbGrantRequest(base))throw Error("Valid scoped request rejected");
 for(const patch of [{action:"V1_4_BANK_MAINTENANCE_DAILY_V1"},{portfolioId:"other"},{securityId:"d77abadc-d171-49d9-bfee-0b34dd0281f4"},{confirmation:"YES"},{requestId:"not-uuid"}])
  if(validKvbGrantRequest({...base,...patch}))throw Error("Wrong scope accepted");
});
