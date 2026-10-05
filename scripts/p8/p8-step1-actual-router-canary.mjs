import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"
import { routeHistoricalResearchProfileV1 } from "../../src/features/research/researchProfileRouting.ts"

const ROOT = "docs/p8/"
const EXPECTED = "b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce"
const V1 = "45e990981371dba217d12c430f8ce567acbf25fc"
const V3 = "797b7e91d7770f3377d0061ee338c76e8220391f"
const key = r => r.historical_identity_id + "|" + r.decision_at
const load = name => JSON.parse(readFileSync(ROOT + name, "utf8"))
function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}"
  return JSON.stringify(value)
}
function fingerprint(value) {
  const ascii = canonical(value).replace(/[\u0080-\uffff]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))
  return createHash("sha256").update(ascii).digest("hex")
}
export function hierarchyFor(code, taxonomy) {
  const byCode = new Map(taxonomy.nodes.map(n => [n.code, n]))
  const parts = []
  let node = byCode.get(code)
  while (node) {
    parts.unshift(node)
    node = node.parent_code ? byCode.get(node.parent_code) : null
  }
  assert.deepEqual(parts.map(n => n.level), ["MACRO_ECONOMIC_SECTOR", "SECTOR", "INDUSTRY", "BASIC_INDUSTRY"])
  return {
    macroEconomicSectorCode: parts[0].code, macroEconomicSectorName: parts[0].name,
    sectorCode: parts[1].code, sectorName: parts[1].name,
    industryCode: parts[2].code, industryName: parts[2].name,
    basicIndustryCode: parts[3].code, basicIndustryName: parts[3].name,
  }
}
export function classificationFor(row, reviewedMapping) {
  // Reuse the adopted V3 measurement. Do not infer new synonyms or company identity mappings.
  if (!row.v3_conditional_period_fix || !row.v3_comparable_segment_revenue || !row.v3_dominant_business) return null
  if (row.blockers.includes("NONZERO_INTERSEGMENT_WITHOUT_SEGMENT_EXTERNAL_REVENUE")) return null
  const ratio = row.v3_dominant_business.ratio
  // Exact decimal > 0.5 comparison without a financial floating-point calculation.
  const match = /^([0-9]+)(?:\.([0-9]+))?$/.exec(ratio)
  if (!match) return null
  const fraction = match[2] ?? ""
  const scale = 10n ** BigInt(fraction.length)
  const numerator = BigInt(match[1]) * scale + BigInt(fraction || "0")
  if (numerator * 2n <= scale || numerator > scale) return null
  const description = row.v3_dominant_business.description.trim()
  if (description === reviewedMapping.source_description) return reviewedMapping.official_taxonomy.basic_industry.code
  if (description === "Edible Oil" && row.v3_exact_basic_industry?.code === "IN040101001") return "IN040101001"
  return null
}
export function buildAudit() {
  const canary = load("PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json")
  const payload = { ...canary }
  delete payload.membership_fingerprint_sha256
  assert.equal(fingerprint(payload), EXPECTED, "Frozen membership payload changed")
  assert.equal(canary.membership_fingerprint_sha256, EXPECTED)
  assert.equal(canary.members.length, 32)
  const semantic = load("PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_AUDIT_2026-10-04.json")
  const measured = load("PortfolioAI_P8_XBRL_SEGMENT_PERIOD_V3_CANARY_AUDIT_2026-10-04.json")
  const accounting = load("PortfolioAI_P8_SEGMENT_REVENUE_CANARY_SOURCE_ACCOUNTING_AUDIT_2026-10-04.json")
  const policies = load("PortfolioAI_P8_SEGMENT_REVENUE_OWNER_POLICY_ADOPTION_2026-10-04.json")
  const period = load("PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SEMANTICS_V3_OWNER_ADOPTION_2026-10-04.json")
  const synonym = load("PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_OD2_OWNER_ADOPTION_2026-10-04.json")
  const taxonomy = load("PortfolioAI_P8_NSE_FOUR_TIER_TAXONOMY_NOVEMBER_2022.json")
  const gateContract = load("PortfolioAI_P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_CONTRACT_V1.json")
  assert.equal(policies.owner_approval_status, "APPROVED")
  assert.equal(policies.approved_policies.OD3.frozen_git_blob_sha, V1)
  assert.equal(policies.approved_policies.OD4.status, "BLOCKED")
  assert.equal(period.owner_approval_status, "APPROVED")
  assert.equal(period.approved_candidate.frozen_git_blob_sha, V3)
  assert.equal(synonym.owner_approval_status, "APPROVED")
  assert.equal(synonym.frozen_candidate.git_blob_sha, "fd5a683ab595d98c71254ea8c825d5ae82338afb")
  assert.equal(measured.canary_fingerprint, EXPECTED)
  assert.equal(semantic.canary_membership_fingerprint, EXPECTED)
  const index = rows => {
    assert.equal(rows.length, 32)
    const out = new Map(rows.map(r => [key(r), r]))
    assert.equal(out.size, 32, "Duplicate canary pair")
    assert.deepEqual([...out.keys()].sort(), canary.members.map(key).sort(), "Pair membership mismatch")
    return out
  }
  const measurements = index(measured.results)
  const sourceRows = index(accounting.results)
  const semantics = index(semantic.results)
  const results = canary.members.map(member => {
    const r = measurements.get(key(member))
    const source = sourceRows.get(key(member)).selected_source
    const code = classificationFor(r, synonym.approved_entry)
    const economicHierarchy = code ? hierarchyFor(code, taxonomy) : {
      macroEconomicSectorCode: "", macroEconomicSectorName: "",
      sectorCode: "", sectorName: "", industryCode: "", industryName: "",
      basicIndustryCode: "", basicIndustryName: "",
    }
    const routeInput = {
      assetClass: "EQUITY", decisionAt: member.decision_at,
      sourceDisseminatedAt: source?.disseminated_at ?? "",
      classificationState: code ? "AUTHORITATIVE_COMPLETE" : "BLOCKED",
      taxonomyVersion: "NSE_NOVEMBER_2022", economicHierarchy,
      accountingContractBlob: V1, periodSemanticsBlob: V3,
    }
    const route = routeHistoricalResearchProfileV1(routeInput)
    return {
      historical_identity_id: member.historical_identity_id, decision_at: member.decision_at,
      historical_isin: member.historical_isin, stratum: member.canary_stratum,
      source: source ? { sha256: source.sha256, r2_key: source.r2_key, disseminated_at: source.disseminated_at } : null,
      semantic_state: semantics.get(key(member)).semantic_state,
      linked_positional_semantic_count: semantics.get(key(member)).linked_positional_semantic_count,
      classification: code ? economicHierarchy : null,
      classification_basis: code === "IN070205015" ? "OWNER_REVIEWED_OD2_SYNONYM_AND_ADOPTED_V1_V3" : code ? "EXACT_NSE_LEAF_AND_ADOPTED_V1_V3" : "UNPROVEN_OR_BLOCKED",
      route_input: routeInput, actual_router_result: route,
      accounting_blockers: r.blockers,
      negative_control: member.flags.unresolved,
    }
  }).sort((a, b) => key(a).localeCompare(key(b)))
  const repeatedResults = results.map(r => ({ ...r, actual_router_result: routeHistoricalResearchProfileV1(r.route_input) }))
  const negativePromotions = results.filter(r => r.negative_control && (r.classification || r.actual_router_result.state === "ROUTED")).length
  const conditionResults = {
    AT_LEAST_ONE_POSITIONAL_MEMBER_CASE_HAS_SOURCE_CITED_SEMANTIC_RECOVERY: results.some(r => r.semantic_state === "SEMANTIC_RECOVERED" && r.linked_positional_semantic_count > 0),
    AT_LEAST_ONE_CANARY_MEMBER_HAS_COMPLETE_CLASSIFICATION_PROVEN: results.some(r => r.classification),
    AT_LEAST_ONE_COMPLETE_CLASSIFICATION_PROVEN_MEMBER_HAS_EXACTLY_ONE_EXISTING_ROUTE: results.some(r => r.classification && r.actual_router_result.state === "ROUTED"),
    NEGATIVE_CONTROLS_ARE_NOT_PROMOTED_WITHOUT_PROOF: negativePromotions === 0,
    REPEAT_FINGERPRINT_MATCHES: fingerprint(results) === fingerprint(repeatedResults),
  }
  assert.deepEqual(Object.keys(conditionResults).sort(), [...gateContract.canary_expansion_gate.conditions].sort(), "Gate criteria changed")
  const counts = {
    canary_pairs: results.length, authoritative_complete_classifications: results.filter(r => r.classification).length,
    actual_canonical_router_routes: results.filter(r => r.actual_router_result.state === "ROUTED").length,
    negative_controls: results.filter(r => r.negative_control).length, negative_control_promotions: negativePromotions,
    semantic_recovered_from_existing_audit: results.filter(r => r.semantic_state === "SEMANTIC_RECOVERED").length,
  }
  const core = {
    version: "P8_STEP1_ACTUAL_ROUTER_CANARY_VALIDATION_V1", canary_fingerprint: EXPECTED,
    scope: "Original Step 1 policy/classification/route gate; not Step 2 input feasibility",
    upstream_measurements: "Existing frozen source-semantic and V3 accounting audits reused, not re-extracted",
    execution: "Actual routeHistoricalResearchProfileV1 called twice per canary pair for repeatability; no identity-assigned route",
    counts, gate: conditionResults, gate_pass: Object.values(conditionResults).every(Boolean),
    results, result_fingerprint_sha256: fingerprint(results), repeat_fingerprint_sha256: fingerprint(repeatedResults),
    input_feasibility: "BLOCKED_FOR_ROUTED_CASE_BY_EXISTING_HISTORY; NOT_A_STEP1_GATE_CONDITION",
    boundaries: { expansion_executed: false, experiment_frozen: false, b5_b6_bfinal_rebuilt: false, p8_c_started: false, scores_generated: false, writes: 0, provider_calls: 0 },
  }
  return { ...core, fingerprint_sha256: fingerprint(core) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = buildAudit()
  writeFileSync(ROOT + "PortfolioAI_P8_STEP1_ACTUAL_ROUTER_CANARY_VALIDATION_2026-10-05.json", JSON.stringify(audit, null, 2) + "\n")
  console.log(JSON.stringify({ counts: audit.counts, gate: audit.gate, gate_pass: audit.gate_pass, fingerprint: audit.fingerprint_sha256 }, null, 2))
}

