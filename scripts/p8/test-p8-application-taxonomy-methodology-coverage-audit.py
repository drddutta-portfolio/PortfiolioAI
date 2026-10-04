#!/usr/bin/env python3
import json, unittest
class T(unittest.TestCase):
    def test_audit_answers(self):
        a=json.load(open("docs/p8/PortfolioAI_P8_APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_AUDIT_2026-10-04.json"))
        self.assertFalse(a["answers"]["either_case_blocked_only_by_missing_wiring"])
        self.assertTrue(a["answers"]["either_requires_additional_historical_business_evidence"])
        self.assertEqual(a["answers"]["registered_but_unimplemented_profile"],"AGRI_PROCESSING")
    def test_agri_not_executable(self):
        a=json.load(open("docs/p8/PortfolioAI_P8_APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_AUDIT_2026-10-04.json"))
        p=a["profile_inventory"]["AGRI_PROCESSING"]
        self.assertTrue(p["registry_present"])
        self.assertFalse(p["router_exposed"])
        self.assertFalse(p["sector_engine_registered"])
    def test_branded_consumer_not_selected_from_leaf_only(self):
        a=json.load(open("docs/p8/PortfolioAI_P8_APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_AUDIT_2026-10-04.json"))
        self.assertEqual(a["edible_oil"]["BRANDED_CONSUMER_FMCG"]["semantic_compatibility"],"NOT_PROVEN_FROM_EDIBLE_OIL_CLASSIFICATION")
    def test_steel_profiles_fail_closed(self):
        a=json.load(open("docs/p8/PortfolioAI_P8_APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_AUDIT_2026-10-04.json"))
        self.assertNotEqual(a["iron_steel_products"]["STEEL_FERROUS"]["semantic_compatibility"],"PROVEN")
        self.assertEqual(a["iron_steel_products"]["CAPITAL_EQUIPMENT_ELECTRICAL"]["semantic_compatibility"],"REJECTED_ON_CURRENT_EVIDENCE")
    def test_frozen_authorities(self):
        a=json.load(open("docs/p8/PortfolioAI_P8_APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_AUDIT_2026-10-04.json"))
        self.assertEqual(a["authorities"]["v1_blob"],"45e990981371dba217d12c430f8ce567acbf25fc")
        self.assertEqual(a["authorities"]["v3_blob"],"797b7e91d7770f3377d0061ee338c76e8220391f")
        self.assertEqual(a["authorities"]["crosswalk_blob"],"fd5a683ab595d98c71254ea8c825d5ae82338afb")
if __name__=="__main__": unittest.main()
