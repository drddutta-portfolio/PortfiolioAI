import unittest
from r4_nse_issuer_bridge import bridge_from_sources

XML=b'<xbrl><Symbol>ACME</Symbol><ScripCode>500001</ScripCode></xbrl>'
META={"symbol":"ACME","companyName":"Acme Industries Limited","isin":"OLD_RETAINED_ISIN",
      "xbrl":"https://nsearchives.nseindia.com/corporate/xbrl/INDAS_123.xml"}
HEADER={"SecurityCode":"500001","ISIN":"CURRENT_ISIN"}
LISTING={"SCRIP_CD":"500001","ISIN_NUMBER":"CURRENT_ISIN","Issuer_Name":"Acme Industries Ltd."}

class IssuerBridgeTest(unittest.TestCase):
    def test_exact_original_exchange_code_lineage_preserves_catalog(self):
        proof=bridge_from_sources(XML,META,"ACME","CURRENT_ISIN",HEADER,LISTING)
        self.assertEqual(proof.catalog_isin,"OLD_RETAINED_ISIN")
        self.assertIsNone(proof.xml_reported_isin)
        self.assertEqual(META["isin"],"OLD_RETAINED_ISIN")
        self.assertIn("COMPARABILITY_UNPROVEN",proof.share_basis)
    def test_wrong_issuer_name_rejected(self):
        with self.assertRaises(ValueError):
            bridge_from_sources(XML,{**META,"companyName":"Different Industries Limited"},"ACME","CURRENT_ISIN",HEADER,LISTING)
    def test_other_historical_stock_code_rejected(self):
        with self.assertRaises(ValueError):
            bridge_from_sources(XML.replace(b"500001",b"500002"),META,"ACME","CURRENT_ISIN",HEADER,LISTING)
    def test_no_embedded_stock_symbol_rejected(self):
        with self.assertRaises(ValueError):
            bridge_from_sources(b"<xbrl><ScripCode>500001</ScripCode></xbrl>",META,"ACME","CURRENT_ISIN",HEADER,LISTING)
    def test_other_share_class_rejected(self):
        with self.assertRaises(ValueError):
            bridge_from_sources(XML,META,"ACME","CURRENT_ISIN",HEADER,{**LISTING,"ISIN_NUMBER":"OTHER_ISIN"})
    def test_ambiguous_issuer_field_rejected(self):
        with self.assertRaises(ValueError):
            bridge_from_sources(XML.replace(b"</xbrl>",b"<Symbol>OTHER</Symbol></xbrl>"),META,"ACME","CURRENT_ISIN",HEADER,LISTING)

if __name__=="__main__":unittest.main()
