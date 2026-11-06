import copy,io,unittest
from unittest.mock import Mock
from r4_source_archive import compact_payload,resolve_payload,canonical,sha,BUCKET

def original():
    return {'contract':'RESULTS_R4_BSE_DATED_PDF_REVIEW_V1','diagnostic_only':True,
            'symbol':'IGL','isin':'INE203G01027','security_id':'issuer','period_end':'2024-12-31',
            'bse_identity':{'unchanged':'identity'},'candidates':[{'original_sha256':'a'*64}],
            'all_sources':[{'source_url':'https://www.bseindia.com/original.pdf',
               'original_sha256':'a'*64,'original_r2_key':'private/original.pdf',
               'header_layouts':[{'words':['original evidence']*1000}],
               'basis_excerpts':['original reporting basis']*1000,'review_basis_flags':['restated']}]}

def archive(payload):
    raw=canonical(payload);digest=sha(raw);index=compact_payload(payload,digest)
    client=Mock();client.get_object.return_value={'Body':io.BytesIO(raw)}
    return digest,index,client

class ArchiveTests(unittest.TestCase):
    def test_lossless_private_original_and_compact_filter_fields(self):
        payload=original();digest,index,client=archive(payload)
        self.assertLess(len(canonical(index)),len(canonical(payload))/3)
        self.assertEqual(index['bse_identity'],payload['bse_identity'])
        self.assertEqual(index['symbol'],payload['symbol'])
        self.assertEqual(index['all_sources'][0]['review_basis_flags'],['restated'])
        self.assertNotIn('header_layouts',index['all_sources'][0])
        self.assertIn('header_layouts',payload['all_sources'][0])
        self.assertEqual(resolve_payload(client,index,digest),payload)
        self.assertEqual(client.get_object.call_args.kwargs['Bucket'],BUCKET)
    def test_existing_inline_payload_stays_compatible_without_r2_read(self):
        payload=original();client=Mock()
        self.assertIs(resolve_payload(client,payload,sha(canonical(payload))),payload)
        client.get_object.assert_not_called()
    def test_mutated_archive_original_fails_closed(self):
        digest,index,client=archive(original());client.get_object.return_value={'Body':io.BytesIO(b'changed')}
        with self.assertRaises(ValueError):resolve_payload(client,index,digest)
    def test_index_identity_and_external_reference_cannot_be_forged(self):
        for change in ('symbol','bucket','key','hash'):
            digest,index,client=archive(original())
            if change=='symbol':index['symbol']='OTHER'
            elif change=='bucket':index['archive_reference']['bucket']='public'
            elif change=='key':index['archive_reference']['r2_key']='unrelated/object'
            else:index['archive_reference']['original_payload_sha256']='b'*64
            with self.assertRaises(ValueError):resolve_payload(client,index,digest)
            client.get_object.assert_not_called()
    def test_non_diagnostic_and_financial_records_cannot_be_compacted(self):
        for field,value in (('diagnostic_only',False),('contract','RESULTS_R4_OFFICIAL_ISSUER_DATED_ORIGINAL_V1')):
            payload={**original(),field:value}
            with self.assertRaises(ValueError):compact_payload(payload,sha(canonical(payload)))
    def test_ocr_diagnostics_keep_exact_original_in_r2(self):
        payload={**original(),'contract':'RESULTS_R4_DATED_OCR_HEADER_DIAGNOSTIC_V1','page':3,
                 'rows':[['source word',1,2]]*1000}
        payload.pop('all_sources');digest,index,client=archive(payload)
        self.assertNotIn('rows',index);self.assertEqual(index['page'],3)
        self.assertEqual(resolve_payload(client,index,digest),payload)
    def test_small_indexes_are_not_expanded(self):
        payload={'contract':'RESULTS_R4_DATED_OCR_HEADER_DIAGNOSTIC_V1','diagnostic_only':True}
        self.assertIs(compact_payload(payload,sha(canonical(payload))),payload)

if __name__=='__main__':unittest.main()
