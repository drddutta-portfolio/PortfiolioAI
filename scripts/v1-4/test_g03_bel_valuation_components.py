import copy
import json
import unittest
from pathlib import Path
from g03_bel_valuation_components import verify_availability, verify_components

ROOT = Path('supabase/functions/_shared')


class BelDatedValuationQualification(unittest.TestCase):
    def test_reused_original_keeps_its_existing_canonical_pin_metadata(self):
        old = {p['original_sha256']: p for name in ['v14-g03-debt-original-pins.json', 'v14-g03-original-pins.json'] for p in json.loads((ROOT / name).read_text())}
        for pin in json.loads((ROOT / 'v14-g03-valuation-original-pins.json').read_text()):
            if pin['original_sha256'] in old:
                self.assertEqual(pin, old[pin['original_sha256']])

    def fixture(self):
        batch = json.loads((ROOT / 'v14-g03-valuation-review-batch.json').read_text())
        originals = {c['originalSha256']: (Path('scripts/v1-4/fixtures/g03-bel-valuations') / (c['originalSha256'] + '.json')).read_bytes() for c in batch['catalogs']}
        return batch, originals

    def test_actual_original_publication_rows_and_exact_share_count(self):
        batch, originals = self.fixture()
        verify_availability(batch, originals)
        verify_components(batch)
        self.assertEqual({p['components']['shares'] for p in batch['periods']}, {'7309778829'})
        self.assertNotEqual(batch['periods'][0]['shareSourceSha256'], batch['periods'][1]['shareSourceSha256'])

    def test_no_retrieval_backdating_or_borrowed_catalogue_identity(self):
        batch, originals = self.fixture()
        changed = copy.deepcopy(batch)
        changed['availability'][0]['publishedAt'] = '2026-10-15T14:35:00+00:00'
        with self.assertRaises(ValueError):
            verify_availability(changed, originals)
        changed = copy.deepcopy(batch)
        changed['availability'][0]['catalogRow']['symbol'] = 'OTHER'
        with self.assertRaises(ValueError):
            verify_availability(changed, originals)

    def test_source_amounts_not_rounded_capital_or_forecasts_and_three_dates_required(self):
        batch, _ = self.fixture()
        for field, value in [('shares', '7309800000'), ('annualPat', '999999'), ('annualCfo', '0'), ('grossDebt', '0'), ('scope', 'CONSOLIDATED'), ('shareAvailabilityAt', '2026-10-16T10:00:00Z')]:
            changed = copy.deepcopy(batch)
            changed['periods'][0]['components'][field] = value
            with self.assertRaises(ValueError):
                verify_components(changed)
        changed = copy.deepcopy(batch)
        changed['periods'][1]['valuationDate'] = changed['periods'][0]['valuationDate']
        with self.assertRaises(ValueError):
            verify_components(changed)

    def test_actual_dissemination_must_bind_the_same_original_not_another_report(self):
        batch, originals = self.fixture()
        changed = copy.deepcopy(batch)
        changed['availability'][0]['originalSha256'] = batch['availability'][1]['originalSha256']
        with self.assertRaisesRegex(ValueError, 'ORIGINAL_URL_MISMATCH'):
            verify_availability(changed, originals)
        changed = copy.deepcopy(originals)
        key = batch['catalogs'][0]['originalSha256']
        changed[key] = changed[key] + b' '
        with self.assertRaisesRegex(ValueError, 'CATALOG_ORIGINAL_HASH_INVALID'):
            verify_availability(batch, changed)


if __name__ == '__main__':
    unittest.main()
