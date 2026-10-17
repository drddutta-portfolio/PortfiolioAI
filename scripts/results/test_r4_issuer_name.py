import unittest
from r4_issuer_name import exact_legal_identity

class LegalNameTests(unittest.TestCase):
    def test_initial_spacing(self):
        self.assertTrue(exact_legal_identity('G M Breweries Limited','Statement of GM Breweries Ltd.'))
        self.assertTrue(exact_legal_identity('GM Breweries Limited','G. M. Breweries Limited'))
    def test_joined_pdf_words(self):
        self.assertTrue(exact_legal_identity('LG Electronics India Limited','LGElectronicsIndiaLimited'))
    def test_no_missing_or_changed_initial(self):
        for value in ('G Breweries Limited','G N Breweries Limited','Breweries Limited'):
            self.assertFalse(exact_legal_identity('G M Breweries Limited',value))
    def test_no_dropped_legal_words(self):
        self.assertFalse(exact_legal_identity('GM Breweries Limited','GM Breweries Private Limited'))
        self.assertFalse(exact_legal_identity('LG Electronics India Limited','LG Electronics Limited'))
    def test_no_inside_word_match(self):
        self.assertFalse(exact_legal_identity('Coforge Limited','NotCoforge Limited'))

if __name__ == '__main__':unittest.main()
