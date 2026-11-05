"""Share a fresh independent original audit across isolated receipt workers.

Only this verification process owns the cache. No collector/database audit is
accepted. The original bytes and approved bound define each audit, and workers
receive private copies while financial receipt replay remains independent.
"""
import copy
import hashlib
from collections import OrderedDict
from concurrent.futures import Future
from threading import Lock

def independent_audit(raw,max_pages):
    from r4_ocr_dated_geometry import audit_document
    from r4_recovery_queue import run_with_timeout
    return run_with_timeout(audit_document,(raw,max_pages),480)

class VerificationAuditCache:
    def __init__(self,compute=independent_audit,max_entries=8):
        self.compute=compute;self.max_entries=max_entries
        self.entries=OrderedDict();self.lock=Lock()

    def get(self,raw,max_pages,expected_sha):
        if max_pages not in (40,120):raise ValueError('UNAPPROVED_DOCUMENT_AUDIT_PAGE_BOUND')
        digest=hashlib.sha256(raw).hexdigest()
        if digest!=expected_sha:raise ValueError('VERIFICATION_AUDIT_ORIGINAL_HASH_MISMATCH')
        key=(digest,max_pages)
        with self.lock:
            future=self.entries.get(key)
            creator=future is None
            if creator:
                future=Future();self.entries[key]=future
            self.entries.move_to_end(key)
        if creator:
            try:
                audit=self.compute(raw,max_pages)
                if audit.get('original_sha256')!=digest:
                    raise ValueError('VERIFICATION_AUDIT_RESULT_ORIGINAL_MISMATCH')
                future.set_result(audit)
            except BaseException as error:
                future.set_exception(error)
                with self.lock:
                    if self.entries.get(key) is future:self.entries.pop(key)
                raise
            with self.lock:
                while len(self.entries)>self.max_entries:
                    completed=next((k for k,v in self.entries.items() if v.done()),None)
                    if completed is None:break
                    self.entries.pop(completed)
        return copy.deepcopy(future.result())
