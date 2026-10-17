import unittest
from r4_issuer_name import explicit_legal_name,exact_legal_identity

class LegalNameTest(unittest.TestCase):
    def test_complete_single_word_legal_name_is_accepted(self):
        self.assertTrue(explicit_legal_name("Coforge Limited"))
        self.assertTrue(exact_legal_identity("Coforge Limited","Signed results of COFORGE LTD."))

    def test_initials_and_punctuation_are_not_discarded(self):
        self.assertTrue(exact_legal_identity("G M Breweries Limited","G.M. BREWERIES LTD"))
        self.assertFalse(exact_legal_identity("G M Breweries Limited","Other Breweries Limited"))

    def test_generic_or_abbreviated_names_do_not_qualify(self):
        for name in ("Limited","India Limited","Private Limited","COFORGE","AB Ltd"):
            self.assertFalse(explicit_legal_name(name))

    def test_similar_company_or_ticker_only_text_is_rejected(self):
        self.assertFalse(exact_legal_identity("Coforge Limited","Coforge Technologies Limited"))
        self.assertFalse(exact_legal_identity("Coforge Limited","COFORGE quarterly report"))

if __name__=="__main__":unittest.main()
