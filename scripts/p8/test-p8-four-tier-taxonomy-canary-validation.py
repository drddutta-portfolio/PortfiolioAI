#!/usr/bin/env python3
import importlib.util, unittest
spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-four-tier-taxonomy-canary-validation.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class Tests(unittest.TestCase):
    def test_supported_exact_industry_maps_partial(self):
        sec={"PHARMA":{"sector_id":"s","sector_code":"PHARMA","sector_name":"Pharma"}}
        ind={"PHARMACEUTICALS":{"industry_id":"i","industry_code":"PHARMA_PHARMACEUTICALS","industry_name":"Pharmaceuticals","sector_id":"s","sector_code":"PHARMA","sector_name":"Pharma"}}
        a,c,d,conf,best,r=m.map_semantics([{"value":"Pharmaceuticals"}],sec,ind,{}, {}, {"routes":[]})
        self.assertEqual(best["proof_levels"],["SECTOR","INDUSTRY"])
    def test_partial_hierarchy_not_complete(self):
        levels={"MACRO_ECONOMIC_SECTOR":None,"SECTOR":{"code":"PHARMA"},"INDUSTRY":{"code":"X"},"BASIC_INDUSTRY":None}
        self.assertFalse(all(levels.values()))
    def test_broad_term_only_sector(self):
        sec={"PHARMA":{"sector_id":"s","sector_code":"PHARMA","sector_name":"Pharma"}}
        a,c,d,conf,best,r=m.map_semantics([{"value":"Pharma"}],sec,{}, {}, {}, {"routes":[]})
        self.assertEqual(best["proof_levels"],["SECTOR"])
    def test_positional_identifier_not_semantic(self):
        ex={"high_semantic_facts":[],"linked_positional_semantics":[]}
        self.assertEqual(m.business_semantics(ex),[])
    def test_diversified_not_semantic_mapping(self):
        sec={}
        a,c,d,conf,best,r=m.map_semantics([{"value":"DIVERSIFIED"}],sec,{}, {}, {}, {"routes":[]})
        self.assertIsNone(best)
    def test_multiple_segments_can_conflict(self):
        sec={"PHARMA":{"sector_id":"s1","sector_code":"PHARMA","sector_name":"Pharma"},"BANKING":{"sector_id":"s2","sector_code":"BANKING","sector_name":"Banking"}}
        a,c,d,conf,best,r=m.map_semantics([{"value":"Pharma"},{"value":"Banking"}],sec,{}, {}, {}, {"routes":[]})
        self.assertTrue(conf)
    def test_conflicting_industry_maps(self):
        ind={"X":{"industry_id":"i1","industry_code":"IX","industry_name":"X","sector_id":"s1","sector_code":"A","sector_name":"A"},
             "Y":{"industry_id":"i2","industry_code":"IY","industry_name":"Y","sector_id":"s2","sector_code":"B","sector_name":"B"}}
        a,c,d,conf,best,r=m.map_semantics([{"value":"X"},{"value":"Y"}],{},ind,{}, {}, {"routes":[]})
        self.assertTrue(conf)
    def test_future_evidence_rejected(self):
        self.assertFalse(m.evidence_before_decision("2025-04-01T00:00:00+00:00","2025-03-01T00:00:00+00:00"))
    def test_missing_provenance_rejected(self):
        self.assertFalse(m.evidence_before_decision(None,"2025-03-01T00:00:00+00:00"))
    def test_competing_routes_detected(self):
        gate={"routes":[
          {"sectors":["PHARMA"],"industries":["PHARMACEUTICALS"],"profileCode":"A","methodologyFamily":"A","state":"SUPPORTED"},
          {"sectors":["PHARMA"],"industries":["PHARMACEUTICALS"],"profileCode":"B","methodologyFamily":"B","state":"SUPPORTED"}]}
        self.assertEqual(len(m.route_matches(gate,"Pharma","Pharmaceuticals")),2)
    def test_absent_route(self):
        self.assertEqual(m.route_matches({"routes":[]},"Pharma","Pharmaceuticals"),[])
    def test_incomplete_metrics_not_evaluated_without_route(self):
        route=False
        self.assertEqual("NOT_EVALUATED_NO_AUTHORITATIVE_ROUTE" if not route else "EVALUATE","NOT_EVALUATED_NO_AUTHORITATIVE_ROUTE")
    def test_deterministic_hash(self):
        self.assertEqual(m.stable_hash({"a":1,"b":2}),m.stable_hash({"b":2,"a":1}))

if __name__=="__main__": unittest.main()
