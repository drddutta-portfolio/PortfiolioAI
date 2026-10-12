import unittest
from acquire_kvb_pit_share_counts import extract_total


XML = b'''<x:xbrl xmlns:x="http://www.xbrl.org/2003/instance" xmlns:d="http://xbrl.org/2006/xbrldi" xmlns:f="urn:shareholding">
<x:context id="ShareholdingPatternI"><x:entity><x:identifier>KARURVYSYA</x:identifier></x:entity><x:period><x:instant>2021-09-30</x:instant></x:period><x:scenario><d:explicitMember dimension="f:Category">f:ShareholdingPatternMember</d:explicitMember></x:scenario></x:context>
<f:Symbol>KARURVYSYA</f:Symbol><f:ISIN>INE036D01028</f:ISIN><f:NameOfTheCompany>Karur Vysya Bank Limited</f:NameOfTheCompany>
<f:NumberOfFullyPaidUpEquityShares contextRef="PublicI" unitRef="shares" decimals="INF">782382389</f:NumberOfFullyPaidUpEquityShares>
<f:NumberOfFullyPaidUpEquityShares contextRef="ShareholdingPatternI" unitRef="shares" decimals="INF">799321708</f:NumberOfFullyPaidUpEquityShares>
<f:NumberOfPartlyPaidUpEquityShares contextRef="ShareholdingPatternI" unitRef="shares" decimals="INF">0</f:NumberOfPartlyPaidUpEquityShares></x:xbrl>'''


class ExactTotal(unittest.TestCase):
    def test_original_total_is_not_sum_of_overlapping_categories(self):
        self.assertEqual(extract_total(XML, "2021-09-30")["fully_paid_shares"], "799321708")
        revised = XML.replace(b"ShareholdingPatternI", b"ShareholdingPattern_ContextI")
        self.assertEqual(extract_total(revised, "2021-09-30")["fully_paid_shares"], "799321708")

    def test_rejects_wrong_identity_period_partial_capital_and_duplicate_totals(self):
        for raw in [XML.replace(b"INE036D01028", b"IN9036D01018"), XML.replace(b">0<", b">10<"),
                    XML.replace(b'contextRef="PublicI"', b'contextRef="ShareholdingPatternI"')]:
            with self.assertRaises(ValueError): extract_total(raw, "2021-09-30")
        with self.assertRaises(ValueError): extract_total(XML, "2022-03-31")

    def test_external_entities_are_never_loaded(self):
        with self.assertRaises(ValueError): extract_total(b'<!DOCTYPE x [<!ENTITY external SYSTEM "file:///etc/passwd">]>' + XML, "2021-09-30")

    def test_missing_count_requires_explicit_same_period_no_partly_paid_declaration(self):
        start = b'<f:NumberOfPartlyPaidUpEquityShares'
        before, remaining = XML.split(start)
        _, after = remaining.split(b'</f:NumberOfPartlyPaidUpEquityShares>')
        missing = before + after
        with self.assertRaises(ValueError): extract_total(missing, "2021-09-30")
        declaration = b'<f:WhetherTheListedEntityHasIssuedAnyPartlyPaidUpShares contextRef="ShareholdingPatternI">false</f:WhetherTheListedEntityHasIssuedAnyPartlyPaidUpShares>'
        qualified = missing.replace(b'</x:xbrl>', declaration + b'</x:xbrl>')
        result = extract_total(qualified, "2021-09-30")
        self.assertIsNone(result["partly_paid_shares"])
        self.assertEqual(result["partly_paid_proof"]["value"], "false")


if __name__ == "__main__": unittest.main()
