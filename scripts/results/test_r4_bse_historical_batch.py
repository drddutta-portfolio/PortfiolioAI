#!/usr/bin/env python3
"""Offline regression for BSE table parsing and historical issuer quarantine."""
import importlib.util
from pathlib import Path
import unittest

import fitz

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("r4_bse_historical_batch",
    HERE/"r4-bse-historical-batch.py")
batch=importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)

def pdf(rows):
    d=fitz.open()
    page=d.new_page(width=1100,height=800)
    for i,row in enumerate(rows):
        page.insert_text((25,36+i*22),row,fontsize=10)
    return d.tobytes()

def fixture(period="30.09.2024",issuer="COMPUTER AGE MANAGEMENT SERVICES LIMITED",units="Lakhs"):
    return pdf([
        issuer,
        "Statement of UNAUDITED CONSOLIDATED FINANCIAL RESULTS for the quarter ended "+period,
        "Amounts in Rs. "+units,
        "Quarter ended "+period+" 30.06.2024 30.09.2023",
        "Revenue from operations 10,000.00 9,000.00 8,000.00",
        "Net profit for the period 1,000.00 900.00 800.00",
        "Diluted earnings per share 5.00 4.00 3.00",
        "Notes follow after financial statement"
    ])

class BseOriginalTest(unittest.TestCase):
    def test_company_period_units(self):
        out=batch.extract(fixture(),"CAMS",
            "Computer Age Management Services Limited","2024-09-30")
        self.assertEqual(out["scope"],"CONSOLIDATED")
        self.assertEqual(out["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"100.00")
        self.assertEqual(out["facts"]["NET_PROFIT_QUARTER"]["value"],"10.00")
        self.assertEqual(out["facts"]["EPS_DILUTED"]["value"],"5.00")

    def test_wrong_period_rejected(self):
        with self.assertRaises(ValueError):
            batch.extract(fixture(),"CAMS",
                "Computer Age Management Services Limited","2024-12-31")

    def test_other_company_rejected(self):
        with self.assertRaises(ValueError):
            batch.extract(fixture(),"AVANTIFEED","Avanti Feeds Limited","2024-09-30")

    def test_no_diluted_eps_rejected(self):
        b=pdf(["COMPUTER AGE MANAGEMENT SERVICES LIMITED",
            "Consolidated Financial Results for the quarter ended 30.09.2024",
            "Rs. in Lakhs",
            "Quarter ended 30.09.2024 30.06.2024 30.09.2023",
            "Revenue from operations 10,000.00 9,000.00 8,000.00",
            "Net profit for the period 1,000.00 900.00 800.00"])
        with self.assertRaises(ValueError):
            batch.extract(b,"CAMS","Computer Age Management Services Limited","2024-09-30")

    def test_separate_financial_row_blocks_are_joined_by_geometry(self):
        d=fitz.open()
        page=d.new_page(width=1100,height=800)
        for i,row in enumerate([
            "COMPUTER AGE MANAGEMENT SERVICES LIMITED",
            "Statement of UNAUDITED CONSOLIDATED FINANCIAL RESULTS for the quarter ended 30.09.2024",
            "Amounts in Rs. Lakhs",
            "Quarter ended 30.09.2024 30.06.2024 30.09.2023"]):
            page.insert_text((25,36+i*22),row,fontsize=10)
        for i,(label,nums) in enumerate([
            ("Revenue from operations",["10,000.00","9,000.00","8,000.00"]),
            ("Net profit for the period",["1,000.00","900.00","800.00"]),
            ("Diluted earnings per share",["5.00","4.00","3.00"])
        ]):
            y=140+i*22
            page.insert_text((25,y),label,fontsize=10)
            for n,value in enumerate(nums):
                page.insert_text((480+n*140,y),value,fontsize=10)
        out=batch.extract(d.tobytes(),"CAMS","Computer Age Management Services Limited","2024-09-30")
        self.assertEqual(out["facts"]["NET_PROFIT_QUARTER"]["value"],"10.00")

    def test_indian_grouping(self):
        self.assertEqual(batch.numeric_cells("2,48,893.10 2,38,788.80 19,000.50")[0],
                         batch.Decimal("248893.10"))

if __name__=="__main__":
    unittest.main()
