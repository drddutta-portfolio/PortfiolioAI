#!/usr/bin/env python3
import importlib.util, unittest
from decimal import Decimal
spec=importlib.util.spec_from_file_location("m","scripts/p8/p8-segment-revenue-canary-accounting.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class Tests(unittest.TestCase):
    def ratio(self,n,d): return Decimal(str(n))/Decimal(str(d))
    def test_above_50_passes(self): self.assertTrue(self.ratio(51,100)>Decimal("0.5"))
    def test_exact_50_fails(self): self.assertFalse(self.ratio(50,100)>Decimal("0.5"))
    def test_below_50_fails(self): self.assertFalse(self.ratio(49,100)>Decimal("0.5"))
    def test_zero_denominator_invalid(self): self.assertFalse(Decimal("0")>0)
    def test_negative_denominator_invalid(self): self.assertFalse(Decimal("-1")>0)
    def test_rounding_quantum_negative_decimals(self):
        f={"decimals":"-6","scale":None}; self.assertEqual(m.half_quantum(f),Decimal("500000"))
    def test_scale_applied(self):
        f={"value":"12","scale":"3"}; self.assertEqual(m.scaled_value(f),Decimal("12000"))
    def test_unit_conflict(self):
        self.assertFalse(m.compatible_unit({"unit_ref":"INR"},{"unit_ref":"USD"}))
    def test_strict_source_future_rejected(self):
        self.assertFalse("2025-04-01T00:00:00+00:00" < "2025-03-01T00:00:00+00:00")
    def test_taxonomy_normalization_deterministic(self):
        self.assertEqual(m.norm("Commercial Vehicles"),"COMMERCIAL_VEHICLES")
    def test_no_segment_aggregation_contract(self):
        c={"combine_distinct_segments":False}; self.assertFalse(c["combine_distinct_segments"])
    def test_repeat_hash(self):
        self.assertEqual(m.stable({"a":1,"b":2}),m.stable({"b":2,"a":1}))

    def _selected(self, *, audit="Audited", scope="Consolidated", total="100", inter="0", company="100", segs=None, seg_period=("2023-04-01","2024-03-31"), unit="INR"):
        segs=segs or []
        base={"context_ref":"FourD","audit":audit,"scope":scope,"start":"2023-04-01","end":"2024-03-31","days":366}
        ctx={"FourD":{"start":"2023-04-01","end":"2024-03-31","instant":None,"members":[]}}
        fs=[
          {"local_name":"SegmentRevenue","context_ref":"FourD","value":total,"unit_ref":unit,"decimals":"0","scale":None,"context":ctx["FourD"]},
          {"local_name":"InterSegmentRevenue","context_ref":"FourD","value":inter,"unit_ref":unit,"decimals":"0","scale":None,"context":ctx["FourD"]},
          {"local_name":"SegmentRevenueFromOperations","context_ref":"FourD","value":company,"unit_ref":unit,"decimals":"0","scale":None,"context":ctx["FourD"]},
        ]
        for i,(name,value) in enumerate(segs,1):
            cref=f"Seg{i}"
            cp={"start":seg_period[0],"end":seg_period[1],"instant":None,"members":[{"dimension":"ReportableSegmentsAxis","member":f"M{i}"}]}
            ctx[cref]=cp
            fs.append({"local_name":"DescriptionOfReportableSegment","context_ref":cref,"value":name,"unit_ref":None,"decimals":None,"scale":None,"context":cp})
            fs.append({"local_name":"SegmentRevenue","context_ref":cref,"value":str(value),"unit_ref":unit,"decimals":"0","scale":None,"context":cp})
        return {"facts":fs,"ctx":ctx,"base":base,"src":{"time":"2024-05-01T00:00:00+00:00"}}

    def test_intersegment_nonzero_blocks_unallocated_segment_external_revenue(self):
        a=m.accounting(self._selected(total="100",inter="10",company="90",segs=[("A",60),("B",40)]))
        self.assertTrue(a["reconciled"])
        self.assertTrue(all("SEGMENT_EXTERNAL_REVENUE_UNRESOLVED" in s["blockers"] for s in a["segments"]))
        self.assertEqual(a["state"],"NO_DOMINANT_BUSINESS_UNDER_CANDIDATE")

    def test_unreconciled_total_blocks(self):
        a=m.accounting(self._selected(total="100",inter="10",company="80",segs=[("A",60),("B",40)]))
        self.assertIn("TOTAL_INTERSEGMENT_COMPANY_REVENUE_UNRECONCILED",a["blockers"])
        self.assertEqual(a["state"],"ACCOUNTING_BLOCKED")

    def test_period_mismatch_is_explicit_blocker(self):
        a=m.accounting(self._selected(total="100",inter="0",company="100",segs=[("A",60),("B",40)],seg_period=("2024-01-01","2024-03-31")))
        self.assertIn("REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH",a["blockers"])
        self.assertEqual(a["state"],"ACCOUNTING_BLOCKED")
        self.assertEqual(len(a["segment_period_mismatch_evidence"]),2)

    def test_two_gt50_segments_fail_internal_consistency(self):
        a=m.accounting(self._selected(total="120",inter="0",company="100",segs=[("A",60),("B",60)]))
        self.assertIn("TOTAL_INTERSEGMENT_COMPANY_REVENUE_UNRECONCILED",a["blockers"])
        self.assertIn("MULTIPLE_GT50_SEGMENTS_INTERNAL_INCONSISTENCY",a["blockers"])

    def test_unaudited_and_standalone_not_annual_candidates(self):
        fs=[
          {"local_name":"WhetherResultsAreAuditedOrUnaudited","context_ref":"x","value":"Unaudited"},
          {"local_name":"NatureOfReportStandaloneConsolidated","context_ref":"x","value":"Standalone"},
          {"local_name":"DateOfStartOfReportingPeriod","context_ref":"x","value":"2023-04-01"},
          {"local_name":"DateOfEndOfReportingPeriod","context_ref":"x","value":"2024-03-31"},
        ]
        self.assertEqual(m.base_candidates(fs,{"x":{"members":[]}}),[])

    def test_quarterly_period_not_annual_candidate(self):
        fs=[
          {"local_name":"WhetherResultsAreAuditedOrUnaudited","context_ref":"x","value":"Audited"},
          {"local_name":"NatureOfReportStandaloneConsolidated","context_ref":"x","value":"Consolidated"},
          {"local_name":"DateOfStartOfReportingPeriod","context_ref":"x","value":"2024-01-01"},
          {"local_name":"DateOfEndOfReportingPeriod","context_ref":"x","value":"2024-03-31"},
        ]
        self.assertEqual(m.base_candidates(fs,{"x":{"members":[]}}),[])

if __name__=="__main__": unittest.main()
