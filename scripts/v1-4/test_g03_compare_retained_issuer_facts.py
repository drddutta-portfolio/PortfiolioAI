import unittest
from g03_compare_retained_issuer_facts import cell_after, decimal_cell


class ComparisonBoundaryTest(unittest.TestCase):
    def test_decimal_precision(self):
        self.assertNotEqual(decimal_cell('1.000000000000000001'), decimal_cell('1'))
        self.assertEqual(decimal_cell('(1,200.50)'), -decimal_cell('1200.50'))

    def test_missing_is_not_zero(self):
        for value in ('', '-', 'NaN', 'Infinity'):
            with self.assertRaises(ValueError):
                decimal_cell(value)
        self.assertEqual(decimal_cell('0'), 0)
        with self.assertRaises(ValueError):
            cell_after([['Revenue from operations', '']], 'Revenue from operations')

    def test_first_financial_row_precedes_segment_table(self):
        rows = [['', 'Revenue from operations', '100'], ['', 'Revenue from operations', '0']]
        self.assertEqual(cell_after(rows, 'Revenue from operations'), '100')


if __name__ == '__main__':
    unittest.main()
