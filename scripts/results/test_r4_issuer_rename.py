import unittest
import fitz
from r4_issuer_rename import RULES,verify_rename_pdf
from r4_nse_issuer_bridge import bridge_from_sources

def authority(symbol="ETERNAL",old_name=None,day="April 09, 2025"):
    rule=RULES[symbol]
    lines=[rule["old_symbol"],symbol,old_name or rule["old_name"],rule["new_name"],day,rule["scrip"]]
    document=fitz.open();page=document.new_page()
    for index,line in enumerate(lines):page.insert_text((30,40+index*25),line)
    raw=document.tobytes();document.close();return raw

class RenameTest(unittest.TestCase):
    def test_official_document_identity_and_effective_date(self):
        raw=authority();proof=verify_rename_pdf(raw,"ETERNAL",RULES["ETERNAL"]["url"])
        self.assertEqual(proof.old_symbol,"ZOMATO")
        self.assertEqual(proof.effective_date,"2025-04-09")
        self.assertEqual(len(proof.sha256),64)

    def test_tmpv_rename_preserves_old_issuer_and_guards_business_comparisons(self):
        raw=authority("TMPV",day="October 24, 2025")
        proof=verify_rename_pdf(raw,"TMPV",RULES["TMPV"]["url"])
        xml=b'<xbrl><Symbol>TATAMOTORS</Symbol><ScripCode>500570</ScripCode><ISIN>INE155A01022</ISIN></xbrl>'
        metadata={"symbol":"TMPV","companyName":"Tata Motors Passenger Vehicles Limited",
            "toDate":"30-Sep-2024","xbrl":"https://nsearchives.nseindia.com/corporate/xbrl/INDAS_123.xml"}
        header={"SecurityCode":"500570","ISIN":"INE155A01022"}
        listing={"SCRIP_CD":"500570","ISIN_NUMBER":"INE155A01022","Issuer_Name":"Tata Motors Passenger Vehicles Ltd"}
        bridge=bridge_from_sources(xml,metadata,"TMPV","INE155A01022",header,listing,proof)
        self.assertTrue(bridge.business_basis_unproven)
        self.assertTrue(bridge.payload()["business_basis_unproven"])
        self.assertEqual(bridge.historical_symbol,"TATAMOTORS")
        with self.assertRaises(ValueError):
            bridge_from_sources(xml,metadata,"TMPV","INE155A01022",header,
                {**listing,"SCRIP_CD":"544569","ISIN_NUMBER":"INE1TAE01010"},proof)
        with self.assertRaises(ValueError):
            bridge_from_sources(xml,metadata,"TMCV","INE1TAE01010",header,listing,proof)

    def test_arbitrary_document_url_is_not_authority(self):
        with self.assertRaises(ValueError):verify_rename_pdf(authority(),"ETERNAL","https://example.com/rename.pdf")

    def test_separately_pinned_official_exchange_notice_is_valid_authority(self):
        alternate=RULES["ETERNAL"]["alternate_urls"][0]
        self.assertEqual(verify_rename_pdf(authority(),"ETERNAL",alternate).source_url,alternate)
        raw=authority("CEMPRO",day="September 17, 2025")
        proof=verify_rename_pdf(raw,"CEMPRO",RULES["CEMPRO"]["url"])
        self.assertEqual(proof.old_symbol,"ITDCEM")

    def test_missing_old_legal_name_rejected(self):
        raw=authority("ALIVUS",old_name="Different Life Sciences",day="January 20, 2025")
        with self.assertRaises(ValueError):verify_rename_pdf(raw,"ALIVUS",RULES["ALIVUS"]["url"])

    def test_wrong_effective_date_rejected(self):
        with self.assertRaises(ValueError):verify_rename_pdf(authority(day="April 10, 2025"),"ETERNAL",RULES["ETERNAL"]["url"])

    def test_pre_rename_source_preserves_original_symbol_and_isin(self):
        proof=verify_rename_pdf(authority(),"ETERNAL",RULES["ETERNAL"]["url"])
        raw=b'<xbrl><Symbol>ZOMATO</Symbol><ScripCode>543320</ScripCode><ISIN>INE758T01015</ISIN></xbrl>'
        metadata={"symbol":"ETERNAL","companyName":"Eternal Limited","toDate":"30-Sep-2024",
            "xbrl":"https://nsearchives.nseindia.com/corporate/xbrl/INDAS_123.xml"}
        header={"SecurityCode":"543320","ISIN":"INE758T01015"}
        listing={"SCRIP_CD":"543320","ISIN_NUMBER":"INE758T01015","Issuer_Name":"Eternal Ltd"}
        with self.assertRaises(ValueError):bridge_from_sources(raw,metadata,"ETERNAL","INE758T01015",header,listing)
        bridge=bridge_from_sources(raw,metadata,"ETERNAL","INE758T01015",header,listing,proof)
        self.assertEqual(bridge.historical_symbol,"ZOMATO")
        self.assertEqual(bridge.xml_reported_isin,"INE758T01015")
        self.assertIn("COMPARABILITY_UNPROVEN",bridge.share_basis)
        self.assertEqual(bridge.payload()["issuer_rename_evidence_sha256"],proof.sha256)
        with self.assertRaises(ValueError):bridge_from_sources(raw,{**metadata,"toDate":"30-Jun-2025"},"ETERNAL","INE758T01015",header,listing,proof)
        with self.assertRaises(ValueError):bridge_from_sources(raw,metadata,"ETERNAL","INE758T01015",header,{**listing,"SCRIP_CD":"500000"},proof)
        with self.assertRaises(ValueError):bridge_from_sources(raw,metadata,"ETERNAL","INE758T01015",header,listing,{"old_symbol":"ZOMATO"})

if __name__=="__main__":unittest.main()
