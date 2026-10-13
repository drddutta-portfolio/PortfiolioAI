import hashlib,io,unittest,gzip
from g02_source_import import ensure_original,original_valid,decode_transport
class Missing(Exception):
    response={'Error':{'Code':'NoSuchKey'}}
class Store:
    def __init__(self,data=None):self.data=data;self.writes=0
    def get_object(self,**kwargs):
        if self.data is None:raise Missing()
        return {'Body':io.BytesIO(self.data)}
    def put_object(self,**kwargs):
        assert kwargs['IfNoneMatch']=='*';self.writes+=1;self.data=kwargs['Body']
class Tests(unittest.TestCase):
    def setUp(self):
        self.data=b'%PDF-test';self.pin={'extension':'pdf','original_bytes':len(self.data),'original_sha256':hashlib.sha256(self.data).hexdigest()}
    def test_upload_verifies_readback_and_second_run_reuses_original(self):
        s=Store();self.assertTrue(ensure_original(s,self.pin,lambda p:self.data)[1]);self.assertFalse(ensure_original(s,self.pin,lambda p: (_ for _ in ()).throw(Exception('must not fetch')))[1]);self.assertEqual(s.writes,1)
    def test_ambiguous_put_response_is_resolved_only_by_matching_readback(self):
        class Ambiguous(Store):
            def put_object(self,**kwargs):
                super().put_object(**kwargs)
                raise RuntimeError('storage response lost')
        s=Ambiguous();self.assertTrue(ensure_original(s,self.pin,lambda p:self.data)[1]);self.assertEqual(s.writes,1)
    def test_conflicting_retained_object_is_never_overwritten(self):
        s=Store(b'%PDF-bad')
        with self.assertRaises(ValueError):ensure_original(s,self.pin,lambda p:self.data)
        self.assertEqual(s.writes,0)
    def test_corrupt_fetch_never_writes(self):
        s=Store()
        with self.assertRaises(ValueError):ensure_original(s,self.pin,lambda p:b'%PDF-bad')
        self.assertEqual(s.writes,0)
    def test_content_encoding_decoding_preserves_exact_original_hash(self):
        self.assertEqual(original_valid(self.pin,decode_transport(gzip.compress(self.data),'gzip')),self.data)
    def test_non_pdf_with_matching_hash_is_not_source(self):
        b=b'<html>login</html>';p={**self.pin,'original_sha256':hashlib.sha256(b).hexdigest(),'original_bytes':len(b)}
        with self.assertRaises(ValueError):original_valid(p,b)
if __name__=='__main__':unittest.main()
