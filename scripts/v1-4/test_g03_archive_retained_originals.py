import hashlib
import io
import unittest
from g03_archive_retained_originals import archive, BUCKET, PREFIX


class Missing(Exception):
    response = {'Error': {'Code': 'NoSuchKey'}}


class Store:
    def __init__(self):
        self.body = None
        self.puts = 0

    def get_object(self, **kwargs):
        assert kwargs['Bucket'] == BUCKET and kwargs['Key'].startswith(PREFIX)
        if self.body is None:
            raise Missing()
        return {'Body': io.BytesIO(self.body)}

    def put_object(self, **kwargs):
        assert kwargs['IfNoneMatch'] == '*'
        self.puts += 1
        self.body = kwargs['Body']


class ArchiveBoundaryTest(unittest.TestCase):
    def setUp(self):
        self.data = b'%PDF-1.7\nfixture'
        self.row = {'symbol': 'BEL', 'sha256': hashlib.sha256(self.data).hexdigest(),
                    'byte_length': len(self.data)}

    def test_idempotent_conditional_archive(self):
        s = Store()
        self.assertTrue(archive(s, self.row, self.data)[1])
        self.assertFalse(archive(s, self.row, self.data)[1])
        self.assertEqual(s.puts, 1)

    def test_retained_conflict_never_overwrites(self):
        s = Store()
        s.body = b'%PDF-conflict'
        with self.assertRaises(ValueError):
            archive(s, self.row, self.data)
        self.assertEqual(s.puts, 0)

    def test_foreign_symbol_and_changed_bytes_rejected(self):
        s = Store()
        with self.assertRaises(ValueError):
            archive(s, {**self.row, 'symbol': 'BANKBARODA'}, self.data)
        with self.assertRaises(ValueError):
            archive(s, self.row, b'%PDF-changed')
        self.assertEqual(s.puts, 0)


if __name__ == '__main__':
    unittest.main()
