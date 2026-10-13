import {parseHistoryContractProof,validateStockHistoryReadiness,validateBenchmarkPairReadiness} from "../_shared/v14-history-readiness.ts"
import type {HistoryRow} from "../_shared/p7-ic-input-validation.ts"

// Provider-free projection replay. This is not an owner-authenticated handler invocation.
type StoredRow=readonly [string,string,string,string|null,string|null]
type Target={target:string;rows:readonly StoredRow[]}
const input=JSON.parse(await Deno.readTextFile(Deno.args[0])) as {
 evaluationAsOf:string;stocks:Target[];benchmark:Target;
 proofs:Array<{target_id:string;symbol:string;proof:unknown}>;
 benchmarkMapping:{code:string;mapping_status:string;provider_code:string|null;provider_instrument_id:string|null;verified_at:string|null}
}
const project=(target:Target):HistoryRow[]=>target.rows.map(([period_start,retrieved_at,close,adjusted_close,source_record_id])=>({
 period_start,retrieved_at,close,adjusted_close,provenance:{source_record_id},
}))
// Input projection requires a separate DB readback proving zero null/fixture provenance.
if(input.stocks.length!==13||new Set(input.stocks.map(x=>x.target)).size!==13||input.benchmark.target!=="NIFTY_BANK")throw new Error("BANK_REPLAY_SCOPE_INVALID")
const benchmarkRows=project(input.benchmark),benchmarkProof=parseHistoryContractProof(input.proofs.find(x=>x.target_id==="NIFTY_BANK")?.proof)
const evaluationAsOfMs=Date.parse(input.evaluationAsOf)
const results=input.stocks.map(target=>{
 const selected=input.proofs.find(x=>x.target_id===target.target),stockRows=project(target),stockProof=parseHistoryContractProof(selected?.proof)
 if(!selected||!stockProof)throw new Error("BANK_REPLAY_PROOF_MISSING")
 const stock=validateStockHistoryReadiness({rows:stockRows,minimum:252,evaluationAsOfMs,sourceCutoffAtMs:evaluationAsOfMs,freshnessPolicy:null,proof:stockProof})
 const pair=validateBenchmarkPairReadiness({stockRows,benchmarkRows,minimum:252,evaluationAsOfMs,sourceCutoffAtMs:evaluationAsOfMs,freshnessPolicy:null,benchmark:input.benchmarkMapping,stockProof,benchmarkProof})
 return {symbol:selected.symbol,securityId:target.target,stockHistory:stock,benchmarkPair:pair}
})
console.log(JSON.stringify({version:"BANK_V14_CANONICAL_HISTORY_PROJECTION_REPLAY_V1",evaluationAsOf:input.evaluationAsOf,
 executionBoundary:"EXISTING_CANONICAL_MODULES_OVER_READ_ONLY_DB_PROJECTION; NOT_AUTHENTICATED_HANDLER_OR_MATERIALIZATION",providerCalls:0,canonicalWrites:0,results},null,2))
