#!/usr/bin/env python3
import importlib.util, unittest
from lxml import etree

spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-historical-taxonomy-canary-audit.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

def xml(body):
    return etree.fromstring(body.encode(),etree.XMLParser(resolve_entities=False,huge_tree=True))

class Tests(unittest.TestCase):
    def test_positional_label_rejected_as_business_identity(self):
        self.assertEqual(m.ordinal_from_member("in-bse-fin:FourReportableSegmentRevenue03Member"),3)
        self.assertIsNone(m.ordinal_from_member("PharmaceuticalsMember"))
    def test_recover_actual_segment_name_same_context(self):
        r=xml("""<xbrl xmlns:xbrli='http://www.xbrl.org/2003/instance' xmlns:x='urn:x' xmlns:xbrldi='http://xbrl.org/2006/xbrldi'>
        <xbrli:context id='c1'><xbrli:entity><xbrli:identifier scheme='x'>E</xbrli:identifier><xbrli:segment><xbrldi:explicitMember dimension='x:Seg'>x:FourReportableSegmentRevenue01Member</xbrldi:explicitMember></xbrli:segment></xbrli:entity><xbrli:period><xbrli:instant>2025-03-31</xbrli:instant></xbrli:period></xbrli:context>
        <x:NameOfReportableSegment01 contextRef='c1'>Pharmaceuticals</x:NameOfReportableSegment01></xbrl>""")
        ctx=m.context_index(r); facts=m.facts_index(r,ctx); high,_=m.semantic_candidates(facts,[])
        linked=m.link_positional_semantics(facts,high,"x:FourReportableSegmentRevenue01Member")
        self.assertEqual(linked[0]["value"],"Pharmaceuticals")
    def test_unsupported_diversified_not_promoted(self):
        self.assertIsNone(m.ordinal_from_member("DIVERSIFIED"))
    def test_ambiguous_business_mapping_multiple_routes(self):
        gate={"routes":[
          {"sectors":["HEALTHCARE"],"industries":["PHARMACEUTICALS"],"profileCode":"A","methodologyFamily":"A","state":"SUPPORTED"},
          {"sectors":["HEALTHCARE"],"industries":["PHARMACEUTICALS"],"profileCode":"B","methodologyFamily":"B","state":"SUPPORTED"}]}
        self.assertEqual(len(m.route_matches(gate,"Healthcare","Pharmaceuticals")),2)
    def test_future_evidence_fails(self):
        self.assertFalse(m.latest_revision_ok("2025-04-01T00:00:00+00:00","2025-03-01T00:00:00+00:00"))
    def test_missing_timestamp_fails(self):
        self.assertFalse(m.latest_revision_ok(None,"2025-03-01T00:00:00+00:00"))
    def test_revision_before_decision_allowed(self):
        self.assertTrue(m.latest_revision_ok("2025-02-01T00:00:00+00:00","2025-03-01T00:00:00+00:00"))
    def test_consolidated_standalone_conflict(self):
        facts=[{"local_name":"NatureOfReport","value":"Consolidated","numeric":False},{"local_name":"NatureOfReport","value":"Standalone","numeric":False}]
        self.assertEqual(m.accounting_scope(facts),"CONFLICTING")
    def test_unit_scale_period_are_preserved(self):
        r=xml("""<xbrl xmlns:xbrli='http://www.xbrl.org/2003/instance' xmlns:x='urn:x'><xbrli:context id='c'><xbrli:entity><xbrli:identifier scheme='x'>E</xbrli:identifier></xbrli:entity><xbrli:period><xbrli:instant>2025-03-31</xbrli:instant></xbrli:period></xbrli:context><x:Revenue contextRef='c' unitRef='INR' decimals='-3' scale='3'>100</x:Revenue></xbrl>""")
        f=m.facts_index(r,m.context_index(r))[0]
        self.assertEqual((f["unit_ref"],f["decimals"],f["scale"]),("INR","-3","3"))
        self.assertEqual(f["context"]["period"]["instant"],"2025-03-31")
    def test_absent_route(self):
        self.assertEqual(m.route_matches({"routes":[]},"Banking","Banks"),[])
    def test_missing_four_tier_blocks_classification(self):
        facts=[{"local_name":"Industry","value":"Banks","numeric":False}]
        tx,state,routes,blockers=m.classification_and_route(facts,{"routes":[]})
        self.assertNotEqual(state,"CLASSIFICATION_PROVEN")
        self.assertTrue(any("MISSING_COMPLETE_FOUR_TIER_HIERARCHY" in x for x in blockers))
    def test_deterministic_hash_order(self):
        self.assertEqual(m.stable_hash({"a":1,"b":2}),m.stable_hash({"b":2,"a":1}))

if __name__=="__main__": unittest.main()
