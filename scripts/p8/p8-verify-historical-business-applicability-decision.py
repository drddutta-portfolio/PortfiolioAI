#!/usr/bin/env python3
from pathlib import Path
import json, hashlib

ROUTER=Path("src/features/research/researchProfileRouting.ts").read_text()
METALS=Path("src/features/research/metalsCommoditiesK4aMethodologyContract.ts").read_text()
FMCG=Path("src/features/research/consumerFmcgK4aMethodologyContract.ts").read_text()
ENGINES=Path("src/features/research/sectorEngineRegistry.ts").read_text()
P7=Path("supabase/functions/_shared/p7-ic-profile-contracts.ts").read_text()
CLOSURE=Path("docs/p8/PortfolioAI_P8_HISTORICAL_BUSINESS_APPLICABILITY_CLOSURE_AUDIT_2026-10-05.json")

assert '"IRON_STEEL_PRODUCTS"' in METALS
assert '"VEGETABLE_OILS_PRODUCTS"' in FMCG
assert '"EDIBLE_OIL"' not in FMCG
assert '"AGRI_PROCESSING"' in P7
assert '"AGRI_PROCESSING"' not in ROUTER
assert '"AGRI_PROCESSING"' not in ENGINES
assert '"STEEL_FERROUS"' in ROUTER
assert '"STEEL_FERROUS"' in ENGINES
assert '"BRANDED_CONSUMER_FMCG"' in ROUTER
assert '"BRANDED_CONSUMER_FMCG"' in ENGINES

j=json.loads(CLOSURE.read_text())
assert j["cases"]["steel_pipes"]["outcome"]=="A_EXISTING_METHODOLOGY_APPLICABILITY_PROVEN"
assert j["cases"]["edible_oil"]["branded_consumer"]["selector_mapping_state"]=="OWNER_DECISION_REQUIRED"
assert j["cases"]["edible_oil"]["agri_processing"]["capability_extension_required"] is True
fp=hashlib.sha256(CLOSURE.read_bytes()).hexdigest()
print(json.dumps({"status":"PASS","closure_sha256":fp},indent=2))
