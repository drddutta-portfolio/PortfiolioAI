#!/usr/bin/env python3
"""BSE-first quarterly source protection tests: never fabricate diluted EPS."""
import importlib.util
from pathlib import Path
import sys
import types
import unittest

# Pure parser tests require no database connection or provider credentials.
sys.modules.setdefault("psycopg",types.ModuleType("psycopg"))
module_path=Path(__file__).with_name("r3-bse-current-snapshot.py")
spec=importlib.util.spec_from_file_location("r3_bse",module_path)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class BseR3Tests(unittest.TestCase):
    def test_dated_quarters_only(self):
        self.assertEqual(mod.period_end("Dec-25"),"2025-12-31")
        self.assertEqual(mod.period_end("Jun-26"),"2026-06-30")
        self.assertIsNone(mod.period_end("FY25-26"))
        self.assertIsNone(mod.period_end("Q2FY27"))
        self.assertIsNone(mod.period_end("Sep-24"))

    def test_bse_link_requires_exact_security_code(self):
        row={"LQ":"Dec-25","LLQ":"https://www.bseindia.com/corporates/results.aspx?Code=543320&Company=Test",
             "SQ":"Sep-25","LSQ":"https://www.bseindia.com/corporates/results.aspx?Code=543320"}
        self.assertEqual(len(mod.links_for([row],"543320")),2)
        self.assertEqual(mod.links_for([row],"500180"),{})
        row["LLQ"]="https://other.example/corporates/results.aspx?Code=543320"
        self.assertEqual(len(mod.links_for([row],"543320")),1)

    def test_company_summary_is_not_diluted_eps_or_annual(self):
        sample={"results_in_crores":{"fields":["title","Dec-25","Sep-25","FY24-25"],
                    "data":[["Revenue","2,883.00","2,650.00","8,617.00"],
                            ["Net Profit","657.00","691.00","1,960.00"],
                            ["EPS","0.72","0.76","2.22"]]},
                "period_links":[{"LQ":"Dec-25","LLQ":"https://www.bseindia.com/corporates/results.aspx?Code=543320",
                                 "SQ":"Sep-25","LSQ":"https://www.bseindia.com/corporates/results.aspx?Code=543320"}]}
        result=mod.compact(sample,"543320")
        self.assertEqual(len(result),4)
        self.assertEqual({x["metric_code"] for x in result},
                         {"OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER"})
        self.assertEqual({x["period_end"] for x in result},{"2025-09-30","2025-12-31"})
        self.assertEqual({x["value"] for x in result if x["metric_code"]=="NET_PROFIT_QUARTER"},{"657.00","691.00"})

    def test_conflicting_secondary_values_not_saved(self):
        sample={"results_in_crores":{"fields":["title","Dec-25"],
                  "data":[["Revenue","100"],["Revenue","101"],["Net Profit","9"]]},
                  "period_links":[{"LQ":"Dec-25","LLQ":"https://www.bseindia.com/corporates/results.aspx?Code=543320"}]}
        self.assertEqual([x["metric_code"] for x in mod.compact(sample,"543320")],["NET_PROFIT_QUARTER"])

    def test_numeric_guard(self):
        self.assertEqual(mod.numeric("(35.50)"),"-35.50")
        self.assertIsNone(mod.numeric("--"))
        self.assertIsNone(mod.numeric("N/A"))

if __name__=="__main__":unittest.main()
