import unittest
from bind_kvb_pit_denominator_candidates import available_bvps

def document(published, value='100', period='2025-03-31', code='BVPS_REPORTED'):
    return {'source_available_at': published, 'exchange_original_url': 'official-source', 'exchange_original_sha256': 'a'*64,
        'observations': [{'code': code, 'period_end': period, 'numeric_value': value}]}

class AsKnown(unittest.TestCase):
    def test_after_close_publication_cannot_enter_same_day(self):
        self.assertEqual(available_bvps([document('2025-05-30T10:01:00Z')], '2025-05-30')['state'], 'NO_THEN_AVAILABLE_BVPS')
        self.assertEqual(available_bvps([document('2025-05-30T09:59:59Z')], '2025-05-30')['state'], 'THEN_AVAILABLE_LITERAL_BVPS_CANDIDATE')
    def test_later_restated_value_does_not_backdate_or_silently_win(self):
        documents = [document('2025-05-19T08:00:00Z','148.17'), document('2025-07-24T10:00:00Z','145.57')]
        self.assertEqual(available_bvps(documents, '2025-06-30')['literal_values'], ['148.17'])
        self.assertEqual(available_bvps(documents, '2025-07-31')['state'], 'THEN_AVAILABLE_BVPS_VALUE_CONFLICT')
    def test_latest_reported_period_wins_but_annual_eps_is_never_bvps(self):
        documents = [document('2025-05-19T08:00:00Z'), document('2026-05-07T08:00:00Z','145.95','2026-03-31'), document('2026-05-07T08:00:00Z','25.98','2026-03-31','EPS_ANNUAL_REPORTED')]
        self.assertEqual(available_bvps(documents, '2026-05-29')['literal_values'], ['145.95'])

if __name__ == '__main__': unittest.main()
