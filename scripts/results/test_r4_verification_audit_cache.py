import hashlib
import unittest
from concurrent.futures import ThreadPoolExecutor
from threading import Event,Lock
from r4_verification_audit_cache import VerificationAuditCache

class IndependentAuditCacheTests(unittest.TestCase):
    def test_concurrent_receipts_share_one_fresh_audit_and_private_copies(self):
        started=Event();release=Event();calls=[];lock=Lock();raw=b'original PDF bytes'
        digest=hashlib.sha256(raw).hexdigest()
        def compute(value,bound):
            with lock:calls.append((value,bound))
            started.set()
            if not release.wait(3):raise TimeoutError('test release missing')
            return {'original_sha256':digest,'pages':['original audit text']}
        cache=VerificationAuditCache(compute)
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures=[pool.submit(cache.get,raw,120,digest) for _ in range(4)]
            self.assertTrue(started.wait(2));release.set()
            results=[f.result(timeout=3) for f in futures]
        self.assertEqual(calls,[(raw,120)])
        results[0]['pages'][0]='changed by caller'
        self.assertEqual(results[1]['pages'],['original audit text'])
        self.assertEqual(cache.get(raw,120,digest)['pages'],['original audit text'])

    def test_bytes_bounds_and_expected_hash_never_share_unaudited_evidence(self):
        calls=[]
        def compute(raw,bound):
            calls.append((raw,bound))
            return {'original_sha256':hashlib.sha256(raw).hexdigest(),'pages':[]}
        cache=VerificationAuditCache(compute)
        for raw,bound in ((b'a',40),(b'a',120),(b'b',40)):
            cache.get(raw,bound,hashlib.sha256(raw).hexdigest())
        self.assertEqual(len(calls),3)
        with self.assertRaisesRegex(ValueError,'ORIGINAL_HASH_MISMATCH'):
            cache.get(b'b',40,hashlib.sha256(b'a').hexdigest())
        with self.assertRaisesRegex(ValueError,'UNAPPROVED'):
            cache.get(b'a',500,hashlib.sha256(b'a').hexdigest())
        self.assertEqual(len(calls),3)

    def test_failed_audit_is_not_reused_and_does_not_poison_another_original(self):
        attempts=[]
        def compute(raw,bound):
            attempts.append(raw)
            if len(attempts)==1:raise TimeoutError('bounded source failure')
            return {'original_sha256':hashlib.sha256(raw).hexdigest(),'pages':[]}
        cache=VerificationAuditCache(compute)
        with self.assertRaises(TimeoutError):cache.get(b'a',40,hashlib.sha256(b'a').hexdigest())
        cache.get(b'b',40,hashlib.sha256(b'b').hexdigest())
        cache.get(b'a',40,hashlib.sha256(b'a').hexdigest())
        self.assertEqual(attempts,[b'a',b'b',b'a'])

    def test_audit_result_for_other_original_is_rejected(self):
        cache=VerificationAuditCache(lambda raw,bound:{'original_sha256':'0'*64})
        with self.assertRaisesRegex(ValueError,'RESULT_ORIGINAL_MISMATCH'):
            cache.get(b'a',40,hashlib.sha256(b'a').hexdigest())
        self.assertFalse(cache.entries)

if __name__=='__main__':unittest.main()
