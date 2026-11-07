import unittest,json
from r4_bse_structured_review import review_shape
class BseStructuredReviewTests(unittest.TestCase):
    def test_figures_remain_private_and_only_periods_links_are_reviewed(self):
        data={'col2':'Jun 2026','resultinCr':[{'title':'EPS','v1':'99999'}],'resultinS':[{'link':'https://www.bseindia.com/financial/result.pdf'}]}
        result=review_shape(json.dumps(data));self.assertNotIn('99999',json.dumps(result));self.assertEqual(result['periods'],['Jun 2026']);self.assertEqual(result['canonical_facts'],0)
    def test_foreign_credentials_or_query_links_reject(self):
        data={'resultinS':[{'link':u} for u in ('https://evil.test/f.pdf','https://secret@www.bseindia.com/f.pdf','https://www.bseindia.com/f.pdf?token=secret')]}
        self.assertEqual(review_shape(data)['public_exchange_links'],[])
    def test_bad_response_shape_rejects(self):
        with self.assertRaises(ValueError):review_shape([])
if __name__=='__main__':unittest.main()
