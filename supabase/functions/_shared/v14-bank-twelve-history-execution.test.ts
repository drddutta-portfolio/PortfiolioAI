import {describe,it,expect} from "vitest"
import {verifyTwelveRenewalSourceIntegrity,twelveLatestPrior,twelveRenewalCutoffQualified} from "./v14-bank-twelve-history-execution"
import {bankValueHash} from "./v14-bank-twelve-capital-review"
import type {RenewalSource} from "./v14-bank-twelve-history-renewal"
const source=(id:string,proof:unknown):RenewalSource=>({id,record_kind:"V1_4_HISTORY_CONTRACT_VALIDATION",source_code:"ANGEL_ONE",retrieved_at:"2026-10-12T17:30:00Z",payload_hash:"a".repeat(64),raw_payload:{proof}})
describe("history renewal execution integrity",()=>{
 it("rejects a pinned old ledger hash when the actual raw body changes",async()=>{const s={...source("ca7691ed-b1db-47f5-974f-62054c59017d",{}),payload_hash:"225c4958351cea9cd19384de3a6a4e1e5d4759e0936e19b79651522015a24cfa"};await expect(verifyTwelveRenewalSourceIntegrity(s)).rejects.toThrow("HISTORY_SOURCE_PAYLOAD_HASH_INVALID")})
 it("verifies newly derived immutable proof hashes",async()=>{const s=source("new-proof",{a:1});await expect(verifyTwelveRenewalSourceIntegrity({...s,payload_hash:await bankValueHash(s.raw_payload)})).resolves.toBeUndefined()})
 it("rejects contradictory latest proofs rather than choosing by id",()=>{const a=source("a",{returnBasis:"RAW"}),b=source("b",{returnBasis:"ADJUSTED"});expect(()=>twelveLatestPrior([a,b])).toThrow("HISTORY_CONTRACT_PROOF_CONFLICT");expect(twelveLatestPrior([a,{...a,id:"c"}])).toBe(a)})
 it("requires materialization cutoff after both newly appended qualifications",()=>{const times=["2026-10-12T17:30:00.100Z","2026-10-12T17:30:00.200Z"];expect(twelveRenewalCutoffQualified(times,"2026-10-12T17:30:00Z")).toBe(false);expect(twelveRenewalCutoffQualified(times,"2026-10-12T17:30:00.201Z")).toBe(true);expect(twelveRenewalCutoffQualified(["invalid",times[1]!],"2026-10-12T17:30:01Z")).toBe(false)})
})
