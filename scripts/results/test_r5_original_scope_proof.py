import importlib.util
import unittest
from pathlib import Path

p=Path(__file__).with_name("r4-verify-quarterly.py")
spec=importlib.util.spec_from_file_location("r4scopeproof",p)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class R5OriginalScopeProof(unittest.TestCase):
    def rows(self,symbol,quarter,scope,doc,pat=10):
        core=module.BANK_REQUIRED if symbol in module.BANKS else module.OTHER_REQUIRED
        return [
            dict(symbol=symbol,period_end=quarter,consolidation_scope=scope,
                 id=doc+"-"+metric,security_id="test-security",
                 source_record_id=doc,metric_code=metric,
                 numeric_value=pat if metric=="NET_PROFIT_QUARTER" else 100)
            for metric in core
        ]

    def test_reuses_original_same_scope_trios_without_promoting_any_data(self):
        facts=(self.rows("BBOX","2025-06-30","STANDALONE","old-issuer")+
               self.rows("BBOX","2025-09-30","STANDALONE","new-issuer")+
               self.rows("BBOX","2025-09-30","CONSOLIDATED","other-issuer"))
        result=module.r5_verified_scope_continuity(facts)
        self.assertGreaterEqual(result["historical_pairs_checked"],24)
        candidate=next(x for x in result["candidate_rows"]
                       if x["symbol"]=="BBOX" and x["quarter"]=="2025-09-30")
        self.assertEqual(candidate["source_original_scope_evidence"],["STANDALONE"])
        self.assertFalse(result["source_admission_performed"])
        self.assertFalse(result["repository_selection_overwrite"])

    def test_identical_replayed_originals_corroborate_same_scope(self):
        facts=(self.rows("ITCHOTELS","2024-12-31","STANDALONE","prior")+
               self.rows("ITCHOTELS","2025-03-31","STANDALONE","same-b")+
               self.rows("ITCHOTELS","2025-03-31","STANDALONE","same-a"))
        result=module.r5_verified_scope_continuity(facts)
        matched=[p for p in result["comparison_only_original_proofs"]
                 if p["symbol"]=="ITCHOTELS" and p["periodEnd"]=="2025-03-31"
                 and p["scope"]=="STANDALONE"]
        self.assertEqual(len(matched),1)
        self.assertEqual(matched[0]["sourceRecordId"],"same-a")
        self.assertEqual(set(matched[0]["observations"]),module.OTHER_REQUIRED)
        self.assertEqual(result["equivalent_original_copies_collapsed"],1)
        self.assertFalse(result["source_admission_performed"])
        self.assertFalse(result["repository_selection_overwrite"])

    def test_conflicting_originals_never_collapse(self):
        facts=(self.rows("SHARDACROP","2025-03-31","STANDALONE","doc-a",pat=10)+
               self.rows("SHARDACROP","2025-03-31","STANDALONE","doc-b",pat=11))
        result=module.r5_verified_scope_continuity(facts)
        self.assertFalse(any(p["symbol"]=="SHARDACROP" and
            p["periodEnd"]=="2025-03-31" and p["scope"]=="STANDALONE"
            for p in result["comparison_only_original_proofs"]))
        self.assertEqual(result["equivalent_original_copies_collapsed"],0)

    def test_refuses_conflicting_same_scope_issuer_values(self):
        facts=(self.rows("CAMS","2025-06-30","STANDALONE","doc-a",pat=10)+
               self.rows("CAMS","2025-06-30","STANDALONE","doc-b",pat=11)+
               self.rows("CAMS","2025-09-30","STANDALONE","doc-c",pat=12))
        result=module.r5_verified_scope_continuity(facts)
        candidate=next(x for x in result["candidate_rows"]
                       if x["symbol"]=="CAMS" and x["quarter"]=="2025-09-30")
        self.assertEqual(candidate["source_original_scope_evidence"],[])
        self.assertEqual(candidate["decision"],"NO_PROVEN_SAME_SCOPE_SOURCE_PAIR")

    def test_requires_complete_single_issuer_record(self):
        rows=self.rows("ICEMAKE","2025-09-30","STANDALONE","one")
        rows=[x for x in rows if x["metric_code"]!="EPS_DILUTED"]
        rows+=self.rows("ICEMAKE","2025-06-30","STANDALONE","two")
        result=module.r5_verified_scope_continuity(rows)
        candidate=next(x for x in result["candidate_rows"]
                       if x["symbol"]=="ICEMAKE" and x["quarter"]=="2025-09-30")
        self.assertFalse(candidate["source_original_scope_evidence"])

if __name__=="__main__":
    unittest.main()
