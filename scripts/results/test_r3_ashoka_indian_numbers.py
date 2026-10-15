#!/usr/bin/env python3
"""Regression against dropped Indian comma groups in the original source reader."""
import importlib.util
import unittest
from decimal import Decimal
from pathlib import Path

spec=importlib.util.spec_from_file_location("ashoka_orig",Path(__file__).with_name("r3-bse-2024-ashoka-pdf.py"))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class NumericIndianGroupingTest(unittest.TestCase):
    def test_revenue_sep(self):
        self.assertEqual(a.first_number("2,48,893.10 2,46,539.26 2,15,431.07 4,95,432.36 4,08,947.23 9,79,846.22","REVENUE"),Decimal("248893.10"))
    def test_revenue_dec(self):
        self.assertEqual(a.first_number("2,38,788.80 2,48,893.10 2,65,712.01 7,34,221.16 6,74,659.24 9,79,846.22","REVENUE"),Decimal("238788.80"))
    def test_pat(self):
        self.assertEqual(a.first_number("46,246.90 15,793.10 10,652.97 62,040.00 16,815.64 52,122.50","PAT"),Decimal("46246.90"))
    def test_eps(self):
        self.assertEqual(a.first_number("16.28 5.36 3.56 21.64 5.60 17.92","EPS"),Decimal("16.28"))
    def test_western_and_unformatted(self):
        self.assertEqual(a.first_number("2,488,931.10 1,000.00 1,000.00 1,000.00 1,000.00","CHECK"),Decimal("2488931.10"))
    def test_reject_incomplete(self):
        with self.assertRaises(ValueError):
            a.first_number("2,48,893.10 2,48,893.10","REVENUE")
if __name__=="__main__":unittest.main()
