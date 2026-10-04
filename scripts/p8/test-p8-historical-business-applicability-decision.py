#!/usr/bin/env python3
import json, subprocess, unittest
class ApplicabilityDecisionTests(unittest.TestCase):
    def test_verifier(self):
        p=subprocess.run(["python","scripts/p8/p8-verify-historical-business-applicability-decision.py"],capture_output=True,text=True,check=True)
        self.assertIn('"status": "PASS"',p.stdout)
    def test_frozen_authorities(self):
        j=json.load(open("docs/p8/PortfolioAI_P8_HISTORICAL_BUSINESS_APPLICABILITY_CLOSURE_AUDIT_2026-10-05.json"))
        self.assertEqual(j["frozen_authorities"]["v1"],"45e990981371dba217d12c430f8ce567acbf25fc")
        self.assertEqual(j["frozen_authorities"]["v3"],"797b7e91d7770f3377d0061ee338c76e8220391f")
        self.assertEqual(j["frozen_authorities"]["crosswalk"],"fd5a683ab595d98c71254ea8c825d5ae82338afb")
    def test_population_boundary(self):
        j=json.load(open("docs/p8/PortfolioAI_P8_HISTORICAL_BUSINESS_APPLICABILITY_CLOSURE_AUDIT_2026-10-05.json"))
        self.assertEqual(j["population_25761"],"NOT_AUTHORIZED_NOT_MEASURED")
if __name__=="__main__": unittest.main()
