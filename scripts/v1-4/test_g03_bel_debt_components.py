"""Regression checks for real zero facts, context dates and source-component binding."""
import json
import unittest
from pathlib import Path
from g03_bel_debt_components import xml_cells, verify_components


def original(value='0.00', instant='2024-03-31', nil=''):
    return f'''<xbrl xmlns:x="http://www.xbrl.org/2003/instance" xmlns:i="urn:issuer"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <x:context id="OneI"><x:period><x:instant>{instant}</x:instant></x:period></x:context>
      <i:Symbol contextRef="OneD">BEL</i:Symbol><i:ScripCode contextRef="OneD">500049</i:ScripCode>
      <i:NameOfTheCompany contextRef="OneD">Bharat Electronics Limited</i:NameOfTheCompany>
      <i:NatureOfReportStandaloneConsolidated contextRef="OneD">Standalone</i:NatureOfReportStandaloneConsolidated>
      <i:BorrowingsCurrent contextRef="OneI" unitRef="INR" {nil}>{value}</i:BorrowingsCurrent>
    </xbrl>'''.encode()


CELL = {'tag': 'BorrowingsCurrent', 'context': 'OneI', 'unit': 'INR',
        'literalValue': '0.00', 'fiscalYear': 2024}


class DebtSourceTests(unittest.TestCase):
    def test_explicit_zero_is_valid_but_nil_dash_or_other_company_is_not(self):
        xml_cells(original(), [CELL])
        for data in [original(nil='xsi:nil="true"'), original(value='-'),
                     original().replace(b'>BEL<', b'>BHEL<')]:
            with self.assertRaises(ValueError):
                xml_cells(data, [CELL])

    def test_wrong_instant_and_duplicate_facts_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'CONTEXT_MISMATCH'):
            xml_cells(original(instant='2024-09-30'), [CELL])
        data = original().replace(b'</xbrl>', b'<i:BorrowingsCurrent contextRef="OneI" unitRef="INR">0.00</i:BorrowingsCurrent></xbrl>')
        with self.assertRaisesRegex(ValueError, 'NOT_UNIQUE'):
            xml_cells(data, [CELL])

    def test_fixed_components_reconcile_to_every_original_cell_and_never_swap_cash_units(self):
        b = json.loads(Path('supabase/functions/_shared/v14-g03-debt-review-batch.json').read_text())
        verify_components(b)
        b['periods'][0]['components']['cashEquivalents'] = '1149'
        with self.assertRaisesRegex(ValueError, 'UNIT_BINDING_FAILED'):
            verify_components(b)


if __name__ == '__main__':
    unittest.main()
