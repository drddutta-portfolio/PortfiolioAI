#!/usr/bin/env python3
"""Standalone parse safety tests for the Results quarterly filing collector."""
import importlib.util
from pathlib import Path
import unittest

source=Path(__file__).with_name("r3-live-public-filing-batch.py")
spec=importlib.util.spec_from_file_location("results_acquire",source)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def fixture(qstart="01-04-2026",qend="30-06-2026",isin="INE002A01018",unit="Lakhs",scope="Consolidated"):
    return f"""<html><body>
    <table>
      <tr><td>NSE Symbol</td><td>RELIANCE</td></tr>
      <tr><td>ISIN</td><td>{isin}</td></tr>
      <tr><td>Level of rounding used in financial results</td><td>{unit}</td></tr>
      <tr><td>Reporting Type</td><td>Quarterly</td></tr>
    </table>
    <table>
      <tr><td>Date of start of reporting period</td><td>{qstart}</td><td>01-04-2026</td></tr>
      <tr><td>Date of end of reporting period</td><td>{qend}</td><td>30-06-2026</td></tr>
      <tr><td>Nature of report standalone or consolidated</td><td>{scope}</td><td>{scope}</td></tr>
      <tr><td>Revenue from operations</td><td>3,11,85,000.00</td><td>3,11,85,000.00</td></tr>
      <tr><td>Total profit (loss) for period</td><td>23,19,600.00</td><td>23,19,600.00</td></tr>
      <tr><td>Diluted earnings (loss) per share from continuing and discontinued operations</td><td>15.48</td><td>15.48</td></tr>
    </table>
    <table><tr><td>Revenue from operations</td><td>3,40,25,700.00</td></tr>
    <tr><td>Total Segment Revenue</td><td>3,76,61,400.00</td></tr></table>
    </body></html>"""

class ResultsAcquisitionTests(unittest.TestCase):
    def test_nbfc_catalog_and_seed_discovery_is_identity_bounded(self):
        url="https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_175188_16072026191853_iXBRL_WEB.html"
        catalog=[{"symbol":"JIOFIN","ixbrl":url},{"symbol":"ANGELONE","ixbrl":url},
                 {"symbol":"JIOFIN","ixbrl":"https://untrusted.example/x"}]
        self.assertEqual(module.listing_urls(catalog,"JIOFIN"),[url])
        self.assertEqual(module.listing_urls(catalog,"ANGELONE"),[url])
        self.assertIn(url,module.OFFICIAL_NSE_SEEDS["JIOFIN"])
        self.assertEqual(len(module.OFFICIAL_NSE_SEEDS["ANGELONE"]),2)

    def test_nbfc_original_jiofin_q1_fy27_consolidated_first_column(self):
        html="""<h2>INTEGRATED FILING NBFC</h2>
          <table><tr><td>NSE Symbol</td><td>JIOFIN</td></tr>
            <tr><td>ISIN</td><td>INE758E01017</td></tr>
            <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>
            <tr><td>Reporting Type</td><td>Quarterly</td></tr></table>
          <table><tr><td>Date of start of reporting period</td><td>01-04-2026</td><td>01-04-2026</td></tr>
            <tr><td>Date of end of reporting period</td><td>30-06-2026</td><td>30-06-2026</td></tr>
            <tr><td>Nature of report standalone or consolidated</td><td>Consolidated</td><td>Consolidated</td></tr>
            <tr><td>Total Revenue From Operations</td><td>2,00,447.00</td><td>2,00,447.00</td></tr>
            <tr><td>Total profit (loss) for period</td><td>83,025.00</td><td>83,025.00</td></tr>
            <tr><td>Basic earnings per share</td><td>1.27</td><td>1.27</td></tr>
            <tr><td>Diluted earnings per share</td><td>1.27</td><td>1.27</td></tr></table>
          <table><tr><td>Date of end of reporting period</td><td>30-06-2026</td></tr>
            <tr><td>Revenue from operations</td><td>2,00,447.00</td></tr></table>"""
        url="https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_175188_16072026191853_iXBRL_WEB.html"
        self.assertIsNotNone(module.ALLOWED_FILE.fullmatch("/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_175188_16072026191853_iXBRL_WEB.html"))
        parsed,reason=module.extract_source(html,"JIOFIN","INE758E01017",url)
        self.assertIsNone(reason)
        self.assertEqual(parsed["period_end"],"2026-06-30")
        self.assertEqual(parsed["scope"],"CONSOLIDATED")
        self.assertEqual(parsed["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"2004.47")
        self.assertEqual(parsed["facts"]["NET_PROFIT_QUARTER"]["value"],"830.25")
        self.assertEqual(parsed["facts"]["EPS_DILUTED"]["value"],"1.27")
        self.assertEqual(parsed["facts"]["EPS_DILUTED"]["original_unit"],"INR_PER_SHARE")

    def test_nbfc_disallow_ytd_or_identity_guess(self):
        html="""<table><tr><td>NSE Symbol</td><td>ANGELONE</td></tr>
          <tr><td>ISIN</td><td>INE732I01021</td></tr>
          <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr></table>
          <table><tr><td>Date of start of reporting period</td><td>01-04-2025</td></tr>
          <tr><td>Date of end of reporting period</td><td>31-12-2025</td></tr>
          <tr><td>Nature of report standalone or consolidated</td><td>Consolidated</td></tr>
          <tr><td>Total revenue from operations</td><td>10000</td></tr>
          <tr><td>Total profit (loss) for period</td><td>500</td></tr>
          <tr><td>Diluted earnings per share</td><td>1.5</td></tr></table>"""
        self.assertEqual(module.extract_nbfc(html,"ANGELONE","INE732I01021")[1],"NBFC_SINGLE_QUARTER_UNPROVEN")
        self.assertEqual(module.extract_nbfc(html,"JIOFIN","INE758E01017")[1],"NBFC_SYMBOL_MISMATCH")


    def test_r3_requires_three_selected_metrics_from_the_same_original(self):
        rows=[
            ("2025-09-30","CONSOLIDATED","issuer-1","OPERATING_REVENUE_QUARTER"),
            ("2025-09-30","CONSOLIDATED","issuer-1","NET_PROFIT_QUARTER"),
            ("2025-09-30","CONSOLIDATED","issuer-2","EPS_DILUTED"),
            ("2025-12-31","CONSOLIDATED","issuer-3","OPERATING_REVENUE_QUARTER"),
            ("2025-12-31","CONSOLIDATED","issuer-3","NET_PROFIT_QUARTER"),
            ("2025-12-31","CONSOLIDATED","issuer-3","EPS_DILUTED"),
        ]
        self.assertEqual(module.completed_quarters(rows),{"2025-12-31"})
        rows.append(("2025-09-30","CONSOLIDATED","issuer-1","EPS_DILUTED"))
        self.assertEqual(module.completed_quarters(rows),{"2025-09-30","2025-12-31"})

    def test_r3_unionbank_uses_bank_nii_pnl_and_eps_contract(self):
        self.assertIn("UNIONBANK",module.BANK_TICKERS)
        self.assertIn("BANKINDIA",module.BANK_TICKERS)
        bank_rows=[
            ("2026-06-30","STANDALONE","issuer-bank","NET_INTEREST_INCOME_QUARTER"),
            ("2026-06-30","STANDALONE","issuer-bank","NET_PROFIT_QUARTER"),
            ("2026-06-30","STANDALONE","issuer-bank","EPS_DILUTED"),
        ]
        self.assertEqual(module.completed_quarters(bank_rows,banking=True),{"2026-06-30"})
        self.assertEqual(module.completed_quarters(bank_rows,banking=False),set())

    def test_td_power_systems_official_august_split_keeps_original_eps(self):
        link=module.historical_result_identity("TDPOWERSYS","INE419M01035","INE419M01027","2026-06-30")
        self.assertIsNotNone(link)
        self.assertEqual(link["split_new_per_old"],"2")
        self.assertIn("NSE/CML/75855",link["evidence"])
        self.assertIsNone(module.historical_result_identity("TDPOWERSYS","INE419M01035","INE419M01027","2026-09-30"))

    def test_angelone_official_2026_february_split_prevents_false_isin_rejection(self):
        link=module.historical_result_identity("ANGELONE","INE732I01021","INE732I01013","2025-12-31")
        self.assertIsNotNone(link)
        self.assertEqual(link["split_new_per_old"],"10")
        self.assertIn("DR-829/2025-2026",link["evidence"])
        self.assertIsNone(module.historical_result_identity("ANGELONE","INE732I01021","INE732I01013","2026-03-31"))

    def test_r4_requalification_ignores_unselected_observation_presence(self):
        found=module.missing_r4_selected_quarters([("2026-03-31",),("2026-12-31",)])
        self.assertEqual(found,{"2026-03-31"})
        self.assertNotIn("2026-06-30",found)
    def test_confirmed_historical_isin_mapping_for_new_cohort(self):
        self.assertIsNotNone(module.historical_result_identity(
            "BECTORFOOD","INE495P01020","INE495P01012","2025-09-30"))
        self.assertIsNotNone(module.historical_result_identity(
            "V2RETAIL","INE945H01021","INE945H01013","2025-12-31"))
        self.assertIsNotNone(module.historical_result_identity(
            "KOTAKBANK","INE237A01036","INE237A01028","2025-12-31"))
        self.assertIsNone(module.historical_result_identity(
            "KOTAKBANK","INE237A01036","INE237A01028","2026-03-31"))
        self.assertIsNone(module.historical_result_identity(
            "SHAILY","INE151G01028","INE151G10208","2025-09-30"))
    def test_quarter_and_exact_unit_conversion(self):
        v,reason=module.extract(fixture(),"RELIANCE","INE002A01018")
        self.assertIsNone(reason)
        self.assertEqual(v["period_start"],"2026-04-01")
        self.assertEqual(v["period_end"],"2026-06-30")
        self.assertEqual(v["scope"],"CONSOLIDATED")
        self.assertEqual(v["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"311850.00")
        self.assertEqual(v["facts"]["NET_PROFIT_QUARTER"]["value"],"23196.00")
        self.assertEqual(v["facts"]["EPS_DILUTED"]["value"],"15.48")
    def test_original_crores_unit_no_lakhs_conversion(self):
        sample=fixture(unit="Crores").replace("3,11,85,000.00","3210.00")
        value,reason=module.extract(sample,"RELIANCE","INE002A01018")
        self.assertIsNone(reason)
        self.assertEqual(value["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"3210.00")
        self.assertEqual(value["facts"]["OPERATING_REVENUE_QUARTER"]["original_unit"],"INR_CRORE")
    def test_explicit_amount_heading_when_rounding_field_absent(self):
        html=fixture().replace(
            "<tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>",
            "")
        html=html.replace("<table>","<h3>Amount in (Lakhs)</h3><table>",1)
        value,reason=module.extract(html,"RELIANCE","INE002A01018")
        self.assertIsNone(reason)
        self.assertEqual(value["facts"]["OPERATING_REVENUE_QUARTER"]["value"],"311850.00")
    def test_conflicting_explicit_amount_headings_rejected(self):
        html=fixture().replace(
            "<tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>",
            "")
        html=html.replace("<table>","<h3>Amount in (Lakhs)</h3><h3>Amount in (Crores)</h3><table>",1)
        value,reason=module.extract(html,"RELIANCE","INE002A01018")
        self.assertIsNone(value)
        self.assertEqual(reason,"CONFLICTING_EXPLICIT_AMOUNT_HEADINGS")
    def test_missing_rounding_and_headings_rejected(self):
        html=fixture().replace(
            "<tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>",
            "")
        value,reason=module.extract(html,"RELIANCE","INE002A01018")
        self.assertIsNone(value)
        self.assertEqual(reason,"UNSUPPORTED_OR_UNKNOWN_UNIT:None")
    def test_identity_must_match(self):
        v,reason=module.extract(fixture(isin="INE999999999"),"RELIANCE","INE002A01018")
        self.assertIsNone(v)
        self.assertEqual(reason,"IDENTITY_MISMATCH_OR_UNKNOWN")
    def test_period_not_three_months(self):
        v,reason=module.extract(fixture(qstart="01-04-2025"),"RELIANCE","INE002A01018")
        self.assertIsNone(v)
        self.assertEqual(reason,"PERIOD_NOT_THREE_MONTHS")
    def test_e2e_verified_prior_isin_quarter(self):
        html=fixture(qstart="01-10-2025",qend="31-12-2025",isin="INE255Z01019")
        html=html.replace("<td>RELIANCE</td>","<td>E2E</td>")
        v,reason=module.extract(html,"E2E","INE255Z01027")
        self.assertIsNone(reason)
        self.assertEqual(v["source_isin"],"INE255Z01019")
        self.assertEqual(v["historical_identity_link"]["split_new_per_old"],"10")
        self.assertEqual(v["facts"]["EPS_DILUTED"]["value"],"15.48")
    def test_pocl_verified_prior_isin_quarter(self):
        html=fixture(qstart="01-10-2025",qend="31-12-2025",isin="INE063E01053")
        html=html.replace("<td>RELIANCE</td>","<td>POCL</td>")
        v,reason=module.extract(html,"POCL","INE063E01061")
        self.assertIsNone(reason)
        self.assertEqual(v["source_isin"],"INE063E01053")
        self.assertEqual(v["historical_identity_link"]["split_new_per_old"],"2.5")
    def test_identity_bridge_rejects_post_split_old_isin(self):
        html=fixture(qstart="01-07-2026",qend="30-09-2026",isin="INE255Z01019")
        html=html.replace("<td>RELIANCE</td>","<td>E2E</td>")
        v,reason=module.extract(html,"E2E","INE255Z01027")
        self.assertIsNone(v)
        self.assertEqual(reason,"IDENTITY_MISMATCH_OR_UNKNOWN")
    def test_unit_not_proven(self):
        v,reason=module.extract(fixture(unit="Millions"),"RELIANCE","INE002A01018")
        self.assertIsNone(v)
        self.assertTrue(reason.startswith("UNSUPPORTED_OR_UNKNOWN_UNIT:"), reason)
    def test_bank_original_filing_extract(self):
        html="""<html><body><table>
        <tr><td>NSE Symbol</td><td>BANDHANBNK</td></tr>
        <tr><td>ISIN</td><td>INE545U01014</td></tr>
        <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>
        <tr><td>Reporting Type</td><td>Quarterly</td></tr></table>
        <table>
        <tr><td>Date of start of reporting period</td><td>01-10-2025</td><td>01-04-2025</td></tr>
        <tr><td>Date of end of reporting period</td><td>31-12-2025</td><td>31-12-2025</td></tr>
        <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td><td>Standalone</td></tr>
        <tr><td>Total interest earned</td><td>500,000.00</td><td>1,400,000.00</td></tr>
        <tr><td>Interest expenses</td><td>275,000.00</td><td>800,000.00</td></tr>
        <tr><td>Operating profit before provision and contingencies</td><td>135,000.00</td><td>300,000.00</td></tr>
        <tr><td>Net profit (loss) for the period</td><td>50,000.00</td><td>120,000.00</td></tr>
        <tr><td>Diluted earnings per share after extraordinary items</td><td>3.11</td><td>8.62</td></tr></table></body></html>"""
        url="https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_BANKING_123_01012026_iXBRL_WEB.html"
        value,reason=module.extract_source(html,"BANDHANBNK","INE545U01014",url)
        self.assertIsNone(reason)
        self.assertEqual(value["period_end"],"2025-12-31")
        self.assertEqual(value["facts"]["NET_INTEREST_INCOME_QUARTER"]["value"],"2250.00")
        self.assertEqual(value["facts"]["NET_PROFIT_QUARTER"]["value"],"500.00")
        self.assertEqual(value["facts"]["OPERATING_PROFIT_QUARTER"]["value"],"1350.00")
        self.assertEqual(value["facts"]["EPS_DILUTED"]["value"],"3.11")
        self.assertEqual(value["scope"],"STANDALONE")
    def test_banking_eps_footnote_and_decorated_label(self):
        html="""<html><body><table>
        <tr><td>NSE Symbol</td><td>BANDHANBNK</td></tr>
        <tr><td>ISIN</td><td>INE545U01014</td></tr>
        <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>
        <tr><td>Reporting Type</td><td>Quarterly</td></tr></table><table>
        <tr><td>Date of start of reporting period</td><td>01-10-2025</td></tr>
        <tr><td>Date of end of reporting period</td><td>31-12-2025</td></tr>
        <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td></tr>
        <tr><td>Total interest earned</td><td>900,000.00</td></tr>
        <tr><td>Interest expenses</td><td>600,000.00</td></tr>
        <tr><td>Net profit (loss) for the period</td><td>45,000.00</td></tr>
        <tr><td>Diluted earnings per share AFTER EXTRAORDINARY items (not annualised)</td><td>3.11*</td></tr>
        </table></body></html>"""
        v,reason=module.extract_bank(html,"BANDHANBNK","INE545U01014")
        self.assertIsNone(reason)
        self.assertEqual(v["facts"]["EPS_DILUTED"]["value"],"3.11")
        self.assertEqual(v["facts"]["EPS_DILUTED"]["original_value"],"3.11*")
    def test_bank_eps_in_separate_analytical_table(self):
        html="""<html><body>
        <table>
        <tr><td>NSE Symbol</td><td>BANDHANBNK</td></tr>
        <tr><td>ISIN</td><td>INE545U01014</td></tr>
        <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>
        <tr><td>Reporting Type</td><td>Quarterly</td></tr>
        </table>
        <table>
        <tr><td>Date of start of reporting period</td><td>01-10-2025</td></tr>
        <tr><td>Date of end of reporting period</td><td>31-12-2025</td></tr>
        <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td></tr>
        <tr><td>Total interest earned</td><td>900,000.00</td></tr>
        <tr><td>Interest expenses</td><td>600,000.00</td></tr>
        <tr><td>Net profit (loss) for the period</td><td>45,000.00</td></tr>
        </table>
        <table>
        <tr><td>Earnings per share after extraordinary items</td><td></td></tr>
        <tr><td>Diluted earnings per share after extraordinary items</td><td>3.11</td></tr>
        </table></body></html>"""
        v,reason=module.extract_bank(html,"BANDHANBNK","INE545U01014")
        self.assertIsNone(reason)
        self.assertEqual(v["facts"]["EPS_DILUTED"]["value"],"3.11")
    def test_bank_after_extraordinary_eps_with_footnote_and_blank_spacer(self):
        html="""<table>
         <tr><td>NSE Symbol</td><td>HDFCBANK</td></tr>
         <tr><td>ISIN</td><td>INE040A01034</td></tr>
         <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>
         <tr><td>Reporting Type</td><td>Quarterly</td></tr></table>
         <table><tr><td>Date of start of reporting period</td><td>01-04-2026</td></tr>
          <tr><td>Date of end of reporting period</td><td>30-06-2026</td></tr>
          <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td></tr>
          <tr><td>Total interest earned</td><td>79,36,278.00</td></tr>
          <tr><td>Interest expenses</td><td>45,82,883.00</td></tr>
          <tr><td>Net profit (loss) for the period</td><td>19,05,972.00</td></tr></table>
          <table><tr><td>Diluted earnings per share after extraordinary items [Quarterly]</td>
            <td> </td><td>12.35</td><td>12.35</td></tr></table>"""
        value,reason=module.extract_bank(html,"HDFCBANK","INE040A01034")
        self.assertIsNone(reason)
        self.assertEqual(value["facts"]["EPS_DILUTED"]["value"],"12.35")
        self.assertEqual(value["facts"]["NET_INTEREST_INCOME_QUARTER"]["value"],"33533.95")
    def test_hdfc_packed_after_extraordinary_q1_eps(self):
        sample="""<table>
          <tr><td>NSE Symbol</td><td>HDFCBANK</td></tr>
          <tr><td>ISIN</td><td>INE040A01034</td></tr>
          <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>
          <tr><td>Reporting Type</td><td>Quarterly</td></tr>
          </table>
          <table><tr><td>Date of start of reporting period</td><td>01-04-2026</td></tr>
          <tr><td>Date of end of reporting period</td><td>30-06-2026</td></tr>
          <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td></tr>
          <tr><td>Total interest earned</td><td>79,36,278.00</td></tr>
          <tr><td>Interest expenses</td><td>45,82,883.00</td></tr>
          <tr><td>Net profit (loss) for the period</td><td>19,05,972.00</td></tr>
          <tr><td></td><td>Diluted earnings per share before extraordinary items 99.00 99.00</td></tr>
          <tr><td></td><td>Diluted earnings per share after extraordinary items 12.35 12.35</td></tr></table>"""
        value,reason=module.extract_bank(sample,"HDFCBANK","INE040A01034")
        self.assertIsNone(reason)
        self.assertEqual(value["facts"]["EPS_DILUTED"]["value"],"12.35")
        self.assertNotEqual(value["facts"]["EPS_DILUTED"]["value"],"99.00")
    def test_packed_q1_eps_requires_matching_year_to_date(self):
        sample="""<table><tr><td>NSE Symbol</td><td>HDFCBANK</td></tr>
          <tr><td>ISIN</td><td>INE040A01034</td></tr>
          <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr></table>
          <table><tr><td>Date of start of reporting period</td><td>01-04-2026</td></tr>
          <tr><td>Date of end of reporting period</td><td>30-06-2026</td></tr>
          <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td></tr>
          <tr><td>Total interest earned</td><td>200.00</td></tr>
          <tr><td>Interest expenses</td><td>100.00</td></tr>
          <tr><td>Net profit (loss) for the period</td><td>50.00</td></tr>
          <tr><td></td><td>Diluted earnings per share after extraordinary items 12.35 13.35</td></tr></table>"""
        value,reason=module.extract_bank(sample,"HDFCBANK","INE040A01034")
        self.assertIsNone(reason)
        self.assertNotIn("EPS_DILUTED",value["facts"])
    def test_bank_q3_packed_reported_eps_vs_cumulative(self):
        html="""<table><tr><td>NSE Symbol</td><td>KOTAKBANK</td></tr>
          <tr><td>ISIN</td><td>INE237A01028</td></tr>
          <tr><td>Level of rounding used in financial results</td><td>Lakhs</td></tr>
          <tr><td>Reporting Type</td><td>Quarterly</td></tr></table>
          <table><tr><td>Date of start of reporting period</td><td>01-10-2025</td></tr>
          <tr><td>Date of end of reporting period</td><td>31-12-2025</td></tr>
          <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td></tr>
          <tr><td>Total interest earned</td><td>15,00,000.00</td></tr>
          <tr><td>Interest expenses</td><td>7,43,543.00</td></tr>
          <tr><td>Net profit (loss) for the period</td><td>3,44,614.00</td></tr>
          <tr><td></td><td>Diluted earnings per share before extraordinary items 99.00 199.00</td></tr>
          <tr><td></td><td>Diluted earnings per share after extraordinary items 3.47 10.04</td></tr></table>"""
        # Extract the genuine historical source ISIN using approved issuer
        # split mapping, not the current listed security identity.
        value,reason=module.extract_bank(html,"KOTAKBANK","INE237A01036")
        self.assertIsNone(reason)
        self.assertEqual(value["facts"]["EPS_DILUTED"]["value"],"3.47")
        self.assertNotEqual(value["facts"]["EPS_DILUTED"]["value"],"10.04")
        self.assertEqual(value["source_isin"],"INE237A01028")
    def test_bank_crores_unit_no_lakhs_conversion(self):

        sample="""<html><body><table>
        <tr><td>NSE Symbol</td><td>BANDHANBNK</td></tr>
        <tr><td>ISIN</td><td>INE545U01014</td></tr>
        <tr><td>Level of rounding used in financial results</td><td>Crores</td></tr>
        <tr><td>Reporting Type</td><td>Quarterly</td></tr></table>
        <table><tr><td>Date of start of reporting period</td><td>01-10-2025</td></tr>
        <tr><td>Date of end of reporting period</td><td>31-12-2025</td></tr>
        <tr><td>Nature of report standalone or consolidated</td><td>Standalone</td></tr>
        <tr><td>Total interest earned</td><td>500.00</td></tr>
        <tr><td>Interest expenses</td><td>250.00</td></tr>
        <tr><td>Net profit (loss) for the period</td><td>90.00</td></tr></table></body></html>"""
        value,reason=module.extract_bank(sample,"BANDHANBNK","INE545U01014")
        self.assertIsNone(reason)
        self.assertEqual(value["facts"]["NET_INTEREST_INCOME_QUARTER"]["value"],"250.00")
        self.assertEqual(value["facts"]["NET_PROFIT_QUARTER"]["original_unit"],"INR_CRORE")
    def test_bank_eligibility_does_not_depend_on_foreign_npa(self):
        rows=[("2025-09-30","STANDALONE","source-a","OPERATING_REVENUE_QUARTER"),
              ("2025-09-30","STANDALONE","source-a","NET_PROFIT_QUARTER"),
              ("2025-09-30","STANDALONE","source-a","EPS_DILUTED"),
              ("2025-09-30","STANDALONE","source-b","GROSS_NPA_PERCENT")]
        self.assertEqual(module.completed_quarters(rows,banking=False), {"2025-09-30"})
        self.assertEqual(module.completed_quarters(rows,banking=True), set())
    def test_bank_npa_only_not_complete(self):
        rows=[("2026-06-30","STANDALONE","source-npa","GROSS_NPA_PERCENT")]
        self.assertEqual(module.completed_quarters(rows),set())
    def test_bank_formatted_date(self):
        self.assertEqual(module.date_of("01-Apr-2025"),"2025-04-01")
    def test_bank_allowed_listing(self):
        payload={"data":[{"symbol":"BANDHANBNK","ixbrl":"https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_BANKING_176500_21072026172514_iXBRL_WEB.html"}]}
        self.assertEqual(len(module.listing_urls(payload,"BANDHANBNK")),1)

    def test_listing_links_only_allow_trusted_source(self):
        items={"data":[{"symbol":"RELIANCE","ixbrl":"https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_175608_17072026195004_iXBRL_WEB.html"},
                       {"symbol":"SOMEBODY","ixbrl":"https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_444_fake.html"},
                       {"symbol":"RELIANCE","ixbrl":"https://example.com/download.html"}]}
        urls=module.listing_urls(items,"RELIANCE")
        self.assertEqual(len(urls),1)

    def test_r5_history_catalog_prunes_noncomparison_quarters_without_admitting_values(self):
        url="https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_111_30042025222801_iXBRL_WEB.html"
        entries={"data":[{"symbol":"RELIANCE","qe_Date":"31-MAR-2025","ixbrl":url},
                         {"symbol":"RELIANCE","qe_Date":"30-JUN-2026","ixbrl":url.replace("111","222")},
                         {"symbol":"RELIANCE","qe_Date":"30-JUN-2025","ixbrl":url.replace("111","333")}]}
        prior=module.R5_HISTORY_MODE
        try:
            module.R5_HISTORY_MODE=True
            self.assertEqual(len(module.listing_urls(entries,"RELIANCE")),2)
            module.R5_HISTORY_MODE=False
            self.assertEqual(len(module.listing_urls(entries,"RELIANCE")),3)
        finally:
            module.R5_HISTORY_MODE=prior

if __name__=="__main__":unittest.main()
