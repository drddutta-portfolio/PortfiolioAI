#!/usr/bin/env python3
import importlib.util, unittest
spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-build-official-four-tier-taxonomy.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class Tests(unittest.TestCase):
    def test_levels(self):
        self.assertEqual(m.level_for("IN06"),"MACRO_ECONOMIC_SECTOR")
        self.assertEqual(m.level_for("IN0601"),"SECTOR")
        self.assertEqual(m.level_for("IN060101"),"INDUSTRY")
        self.assertEqual(m.level_for("IN060101001"),"BASIC_INDUSTRY")
    def test_parentage(self):
        nodes={
          "IN06":{"code":"IN06","level":"MACRO_ECONOMIC_SECTOR","name":"Healthcare"},
          "IN0601":{"code":"IN0601","level":"SECTOR","name":"Healthcare"},
          "IN060101":{"code":"IN060101","level":"INDUSTRY","name":"Pharmaceuticals & Biotechnology"},
          "IN060101001":{"code":"IN060101001","level":"BASIC_INDUSTRY","name":"Pharmaceuticals"}
        }
        m.build_hierarchy(nodes)
        self.assertEqual(nodes["IN0601"]["parent_code"],"IN06")
        self.assertEqual(nodes["IN060101"]["parent_code"],"IN0601")
        self.assertEqual(nodes["IN060101001"]["parent_code"],"IN060101")
    def test_validation_orphan(self):
        nodes={"IN0601":{"code":"IN0601","level":"SECTOR","name":"Healthcare","parent_code":"IN06"}}
        counts,errors=m.validate(nodes)
        self.assertTrue(any(x.startswith("ORPHAN:") for x in errors))
    def test_clean(self):
        self.assertEqual(m.clean("  Health\n Care  "),"Health Care")

if __name__=="__main__": unittest.main()
