type Result={data:unknown;error:unknown}
export function verifiedUsageEvent(result:Result):void{
 if(result.error||typeof result.data!=="string"||! /^[0-9a-f-]{36}$/i.test(result.data))throw Error("BANK_MAINTENANCE_USAGE_ACCOUNTING_FAILED")
}
export function verifiedBudgetSettlement(result:Result,expected:{id:string;consumed:number;failed:number;released:number}):void{
 const row=Array.isArray(result.data)&&result.data.length===1?result.data[0]:null
 if(result.error||!row||row.reservation_id!==expected.id||row.status!=="SETTLED"||row.consumed_units!==expected.consumed||row.failed_units!==expected.failed||row.released_units!==expected.released)throw Error("BANK_MAINTENANCE_SETTLEMENT_NOT_VERIFIED")
}
