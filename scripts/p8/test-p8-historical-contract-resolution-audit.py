#!/usr/bin/env python3
import importlib.util, pathlib, unittest

P=pathlib.Path("scripts/p8/p8-historical-contract-resolution-audit.py")
spec=importlib.util.spec_from_file_location("auditmod",P)
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class ContractResolutionTests(unittest.TestCase):
    def test_diversified_without_semantics_fails(self):
        ok,reason=m.classification_contract_proven({"classification_label":"DIVERSIFIED"})
        self.assertFalse(ok); self.assertEqual(reason,"DIVERSIFIED_WITHOUT_SEMANTIC_FOUR_TIER_PROOF")
    def test_positional_segment_label_fails(self):
        ok,reason=m.classification_contract_proven({"classification_label":"in-bse-fin:FourReportableSegmentRevenue01Member"})
        self.assertFalse(ok); self.assertEqual(reason,"POSITIONAL_XBRL_MEMBER_NOT_TAXONOMY")
    def test_future_revision_not_selected(self):
        rows=[{"disseminated_at":"2025-01-01T00:00:00+00:00","revision":0},{"disseminated_at":"2025-03-01T00:00:00+00:00","revision":1}]
        got=m.choose_revision(rows,"2025-02-01T00:00:00+00:00")
        self.assertEqual(got["revision"],0)
    def test_revision_after_dissemination_selected(self):
        rows=[{"disseminated_at":"2025-01-01T00:00:00+00:00","revision":0},{"disseminated_at":"2025-03-01T00:00:00+00:00","revision":1}]
        got=m.choose_revision(rows,"2025-04-01T00:00:00+00:00")
        self.assertEqual(got["revision"],1)
    def test_consolidated_preferred_to_standalone(self):
        rows=[{"statement_class":"STANDALONE_EXPLICITLY_ALLOWED","id":"s"},{"statement_class":"CONSOLIDATED_QUARTERLY","id":"cq"},{"statement_class":"CONSOLIDATED_AUDITED_ANNUAL","id":"ca"}]
        self.assertEqual(m.statement_preference(rows)["id"],"ca")
    def test_unit_conflict_blocks_metric(self):
        metric={k:"x" for k in ("source_hash","disseminated_at","period","statement_scope","raw_concept","raw_unit","raw_scale","currency","transformation_version")}
        metric["unit_conflict"]=True
        self.assertEqual(m.validate_normalized_metric(metric),(False,"UNIT_CONFLICT"))
    def test_period_conflict_blocks_metric(self):
        metric={k:"x" for k in ("source_hash","disseminated_at","period","statement_scope","raw_concept","raw_unit","raw_scale","currency","transformation_version")}
        metric["period_conflict"]=True
        self.assertEqual(m.validate_normalized_metric(metric),(False,"PERIOD_CONFLICT"))
    def test_missing_mandatory_provenance_blocks(self):
        metric={k:"x" for k in ("source_hash","disseminated_at","period","statement_scope","raw_concept","raw_unit","raw_scale","currency","transformation_version")}
        del metric["raw_scale"]
        ok,reason=m.validate_normalized_metric(metric)
        self.assertFalse(ok); self.assertIn("raw_scale",reason)
    def test_deterministic_hash(self):
        x={"b":2,"a":1}
        self.assertEqual(m.canonical_hash(x),m.canonical_hash({"a":1,"b":2}))

if __name__=="__main__": unittest.main()
