import {describe,expect,it} from "vitest"
import {BANK_PIT_ORIGINAL_MANIFEST,bankPitImportClaimsQualified,bankPitOriginalReadUrl,bankPitImportSafeError} from "./v14-bank-pit-original-proof.ts"

describe("pinned Development PIT original import",()=>{
 it("never returns signed read capabilities from transport error messages",()=>{
  expect(bankPitImportSafeError(new Error("fetch https://r2.example/original?X-Amz-Signature=secret failed"))).toBe("PIT_ORIGINAL_INTERNAL_FAILURE")
  expect(bankPitImportSafeError(new Error("PIT_ORIGINAL_BYTES_MISMATCH"))).toBe("PIT_ORIGINAL_BYTES_MISMATCH")
 })
 const claims={repository:"drddutta-portfolio/PortfiolioAI",repository_id:"1357024254",repository_owner_id:"324877535",
  ref:"refs/heads/codex/banking-source-remediation",environment:"PortfolioAI-Development",
  sub:"repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development",
  workflow_ref:"drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-pit-source-register.yml@refs/heads/codex/banking-source-remediation",
  event_name:"workflow_dispatch",sha:"a".repeat(40)}
 it("allows the signed source-only workflow and rejects forks, unrelated workflows and Production",()=>{
  expect(bankPitImportClaimsQualified(claims)).toBe(true)
  for(const bad of [{repository_id:"other"},{environment:"Production"},{workflow_ref:"other"},{event_name:"pull_request"},{sha:"unknown"}])
   expect(bankPitImportClaimsQualified({...claims,...bad})).toBe(false)
 })
 it("limits short-lived reads to the exact pinned Development object",()=>{
  const key=BANK_PIT_ORIGINAL_MANIFEST[0]!.r2_object_key
  const url=`https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com/portfolioai-history-dev/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300`
  expect(bankPitOriginalReadUrl(url,key)).toBe(true)
  expect(bankPitOriginalReadUrl(url.replace("Expires=300","Expires=301"),key)).toBe(false)
  expect(bankPitOriginalReadUrl(url.replace("portfolioai-history-dev","portfolioai-history-prod"),key)).toBe(false)
  expect(bankPitOriginalReadUrl(url,key+"other")).toBe(false)
 })
 it("preserves exact original provenance without declaring scope or valuation acceptance",()=>{
  expect(BANK_PIT_ORIGINAL_MANIFEST).toHaveLength(22)
  expect(new Set(BANK_PIT_ORIGINAL_MANIFEST.map(p=>p.original_sha256)).size).toBe(22)
  for(const p of BANK_PIT_ORIGINAL_MANIFEST){
   expect(p.valuation_admitted).toBe(false)
   expect(p.source_scope).toBe("REQUIRES_SOURCE_RECONCILIATION")
   expect(Number.isFinite(Date.parse(p.published_at))).toBe(true)
   expect(p.original_bytes).toBeGreaterThan(0)
  }
 })
})
