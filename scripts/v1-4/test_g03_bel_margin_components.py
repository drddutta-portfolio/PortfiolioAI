import copy
import json
import unittest
from pathlib import Path
from g03_bel_margin_components import xml_cells, verify_pairs


class BelMarginQualification(unittest.TestCase):
    def test_real_eight_pairs_and_explicit_ambiguity(self):
        batch = json.loads(Path('supabase/functions/_shared/v14-g03-margin-review-batch.json').read_text())
        verify_pairs(batch)
        q5 = next(p for p in batch['periods'] if p['profitField']['parameterToken'] == 'opqmq5')
        self.assertTrue(q5['captionDiscrepancy'])
        for change in ('scope', 'profit', 'revenue'):
            altered = copy.deepcopy(batch)
            altered['periods'][0]['components'][change] = 'STANDALONE' if change == 'scope' else '1'
            with self.assertRaises(ValueError):
                verify_pairs(altered)

    def test_no_short_series_or_ambiguous_multifield_fallback(self):
        batch = json.loads(Path('supabase/functions/_shared/v14-g03-margin-review-batch.json').read_text())
        short = copy.deepcopy(batch)
        short['periods'].pop()
        with self.assertRaises(ValueError):
            verify_pairs(short)
        altered = copy.deepcopy(batch)
        next(p for p in altered['periods'] if p['profitField']['parameterToken'] == 'opqmq5')['profitField']['singleFieldRequired'] = False
        with self.assertRaises(ValueError):
            verify_pairs(altered)

    def test_original_identity_period_unit_and_literal_are_required(self):
        xml = b'''<root><context id="OneD"><startDate>2024-07-01</startDate><endDate>2024-09-30</endDate></context><Symbol contextRef="OneD">BEL</Symbol><ScripCode contextRef="OneD">500049</ScripCode><NameOfTheCompany contextRef="OneD">Bharat Electronics Limited</NameOfTheCompany><NatureOfReportStandaloneConsolidated contextRef="OneD">Consolidated</NatureOfReportStandaloneConsolidated><RevenueFromOperations contextRef="OneD" unitRef="INR">46049000000.00</RevenueFromOperations></root>'''
        cells = [{'tag': 'RevenueFromOperations', 'context': 'OneD', 'unit': 'INR', 'literalValue': '46049000000.00', 'periodStart': '2024-07-01', 'periodEnd': '2024-09-30'}]
        xml_cells(xml, cells)
        for bad in (xml.replace(b'Consolidated</Nature', b'Standalone</Nature'), xml.replace(b'2024-09-30', b'2024-12-31'), xml.replace(b'unitRef="INR"', b'unitRef="USD"'), xml.replace(b'46049000000.00', b'46049000000.01')):
            with self.assertRaises(ValueError):
                xml_cells(bad, cells)


if __name__ == '__main__':
    unittest.main()
