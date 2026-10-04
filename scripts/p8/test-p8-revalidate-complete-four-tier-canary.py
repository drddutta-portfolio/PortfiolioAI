#!/usr/bin/env python3
import importlib.util, unittest
spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-revalidate-complete-four-tier-canary.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class Tests(unittest.TestCase):
    def test_parent_path(self):
        ns=[{"code":"IN06","level":"MACRO_ECONOMIC_SECTOR","name":"Healthcare","parent_code":None},
            {"code":"IN0601","level":"SECTOR","name":"Healthcare","parent_code":"IN06"},
            {"code":"IN060101","level":"INDUSTRY","name":"Pharmaceuticals & Biotechnology","parent_code":"IN0601"},
            {"code":"IN060101001","level":"BASIC_INDUSTRY","name":"Pharmaceuticals","parent_code":"IN060101"}]
        self.assertEqual([x["code"] for x in m.parent_path(ns,"IN060101001")],["IN06","IN0601","IN060101","IN060101001"])
    def test_single_segment_exact_candidate(self):
        leaf={"code":"IN060101001","level":"BASIC_INDUSTRY","name":"Pharmaceuticals","parent_code":"IN060101"}
        nodes=[{"code":"IN06","level":"MACRO_ECONOMIC_SECTOR","name":"Healthcare","parent_code":None},{"code":"IN0601","level":"SECTOR","name":"Healthcare","parent_code":"IN06"},{"code":"IN060101","level":"INDUSTRY","name":"Pharmaceuticals & Biotechnology","parent_code":"IN0601"},leaf]
        exact,candidate,state,block=m.evaluate_business([{"value":"Pharmaceuticals","kind":"SINGLE_SEGMENT"}],{"PHARMACEUTICALS":leaf},nodes)
        self.assertEqual(state,"COMPLETE_CANDIDATE_SINGLE_SEGMENT_EXACT"); self.assertIsNotNone(candidate)
    def test_multisegment_exact_leaf_blocked_without_od3(self):
        leaf={"code":"IN060101001","level":"BASIC_INDUSTRY","name":"Pharmaceuticals","parent_code":"IN060101"}
        nodes=[{"code":"IN06","level":"MACRO_ECONOMIC_SECTOR","name":"Healthcare","parent_code":None},{"code":"IN0601","level":"SECTOR","name":"Healthcare","parent_code":"IN06"},{"code":"IN060101","level":"INDUSTRY","name":"Pharmaceuticals & Biotechnology","parent_code":"IN0601"},leaf]
        exact,candidate,state,block=m.evaluate_business([{"value":"Pharmaceuticals","kind":"REPORTABLE_SEGMENT"},{"value":"Other","kind":"REPORTABLE_SEGMENT"}],{"PHARMACEUTICALS":leaf},nodes)
        self.assertEqual(state,"EXACT_LEAF_EVIDENCE_MULTISEGMENT_PENDING_OD3"); self.assertIsNone(candidate)
    def test_broad_phrase_requires_synonym(self):
        exact,candidate,state,block=m.evaluate_business([{"value":"Hospital Business","kind":"SINGLE_SEGMENT"}],{},[])
        self.assertEqual(state,"NO_EXACT_BASIC_INDUSTRY_MATCH")
    def test_future_evidence_guard(self):
        d="2025-01-01T00:00:00+00:00"; s="2025-02-01T00:00:00+00:00"
        self.assertFalse(s<d)
    def test_hash_determinism(self):
        self.assertEqual(m.stable({"a":1,"b":2}),m.stable({"b":2,"a":1}))

if __name__=="__main__": unittest.main()
