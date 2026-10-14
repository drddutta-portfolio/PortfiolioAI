import unittest
from g03_roce_qualification import fixed_cell, retained_original
from unittest.mock import patch


class RoceQualificationTests(unittest.TestCase):
    def setUp(self):
        self.row = {'pdfPage': 1, 'reviewId': 'review', 'originalSha256': 'hash',
                    'fiscalLabel': '2023-24', 'numericValue': '36.44',
                    'supportingNumeratorINRLakh': '534158', 'supportingDenominatorINRLakh': '1466000'}
        self.text = ('L32309KA1954GOI000787\nStandalone Notes to Accounts\n'
                     'Particulars 2024-25 2023-24\n'
                     'Numerator Earnings Before Interest and Tax (EBIT) 7,09,960 5,34,158\n'
                     'Denominator Capital Employed 18,10,176 14,66,000\n'
                     'Return on Capital Employed (in %age) 39.22 36.44 7.63')

    def test_selects_the_fiscal_column_and_verifies_exact_reported_cells(self):
        self.assertEqual(fixed_cell(self.row, self.text)['value'], '36.44')
        for text in [self.text.replace('Standalone', 'Consolidated'),
                     self.text.replace('2023-24', '2022-23'),
                     self.text.replace('36.44', '36.45'),
                     self.text.replace('5,34,158', '5,34,159'),
                     self.text.replace('L32309KA1954GOI000787', 'FOREIGN_ISSUER')]:
            with self.assertRaises(ValueError):
                fixed_cell(self.row, text)

    def test_existing_original_is_read_not_refetched_or_overwritten(self):
        class Store:
            def get_object(self, **_):
                import io
                return {'Body': io.BytesIO(b'original')}
        with patch('g03_roce_qualification.original_valid', side_effect=lambda _, data: data), \
                patch('g03_roce_qualification.urllib.request.urlopen') as network:
            self.assertEqual(retained_original(Store(), {'original_sha256': 'hash'})[1:], (b'original', False))
            network.assert_not_called()

    def test_corrupt_retained_original_cannot_trigger_a_replacement(self):
        class Store:
            def get_object(self, **_):
                import io
                return {'Body': io.BytesIO(b'corrupt')}
        with patch('g03_roce_qualification.original_valid', side_effect=ValueError('HASH_MISMATCH')), \
                patch('g03_roce_qualification.urllib.request.urlopen') as network:
            with self.assertRaises(ValueError):
                retained_original(Store(), {'original_sha256': 'hash'})
            network.assert_not_called()


if __name__ == '__main__':
    unittest.main()
