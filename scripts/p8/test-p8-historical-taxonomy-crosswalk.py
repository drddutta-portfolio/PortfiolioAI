#!/usr/bin/env python3
import json, unittest
class Tests(unittest.TestCase):
    def test_frozen_candidate_has_no_convenient_application_target(self):
        c=json.load(open("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1.json"))
        self.assertTrue(all(e.get("application_target") is None for e in c["entries"]))
    def test_edible_oil_is_exact_but_unsupported(self):
        c=json.load(open("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1.json"))
        e=next(x for x in c["entries"] if x["source_description"]=="Edible Oil")
        self.assertEqual(e["official_taxonomy"]["basic_industry"]["code"],"IN040101001")
        self.assertEqual(e["route_state"],"UNSUPPORTED_EXISTING_METHODOLOGY")
    def test_steel_pipes_requires_review(self):
        c=json.load(open("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1.json"))
        e=next(x for x in c["entries"] if x["source_description"]=="Manufacturing- Steel Pipes")
        self.assertEqual(e["od2_review_state"],"REVIEW_REQUIRED")
        self.assertIsNone(e["application_target"])
    def test_broad_descriptions_fail_closed(self):
        c=json.load(open("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1.json"))
        for d in ["IT and Business Service","EPC/Engineering Services","Textile","Automotive Segment"]:
            e=next(x for x in c["entries"] if x["source_description"]==d)
            self.assertIsNone(e["application_target"])
    def test_contract_blobs_preserved(self):
        c=json.load(open("docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1.json"))
        self.assertEqual(c["frozen_authorities"]["v1_blob"],"45e990981371dba217d12c430f8ce567acbf25fc")
        self.assertEqual(c["frozen_authorities"]["v3_blob"],"797b7e91d7770f3377d0061ee338c76e8220391f")
if __name__=="__main__": unittest.main()
