import unittest
import hashlib
import io
import json
import tempfile
import zipfile
from pathlib import Path
from unittest.mock import patch
from extract_verified_bank_raw_months import parse_rows, source_url, read_archive

class RawArchives(unittest.TestCase):
    scope = [{'securityId': 'verified-id', 'symbol': 'KARURVYSYA', 'isin': 'INE036D01028'}]
    csv = b'SYMBOL,SERIES,CLOSE,ISIN,TIMESTAMP\nKARURVYSYA,EQ,120.50,INE036D01028,31-OCT-2023\n'
    def test_exact_identity_date_and_decimal_are_preserved(self):
        self.assertEqual(parse_rows(self.csv, '2023-10-31', self.scope)[0]['raw_close'], '120.50')
    def test_duplicate_identity_wrong_date_and_invalid_close_fail(self):
        for value, date in [(self.csv + self.csv.splitlines(keepends=True)[1], '2023-10-31'), (self.csv, '2023-10-30'), (self.csv.replace(b'120.50', b'NaN'), '2023-10-31')]:
            with self.assertRaises(ValueError): parse_rows(value, date, self.scope)
    def test_udiff_schema_is_supported(self):
        value = b'TckrSymb,SctySrs,ClsPric,ISIN,TradDt\nKARURVYSYA,EQ,120.50,INE036D01028,2023-10-31\n'
        self.assertEqual(parse_rows(value, '2023-10-31', self.scope)[0]['trade_date'], '2023-10-31')
    def test_official_host_and_original_hashes_are_mandatory(self):
        source = {'source_url': 'https://nsearchives.nseindia.com/content/cm/file.csv.zip', 'source_kind': 'NSE_CM_BHAVCOPY_UDIFF', 'compressed_sha256': 'a'*64, 'content_sha256': 'b'*64}
        self.assertEqual(source_url(source), source['source_url'])
        for url in (source['source_url'] + '?key=x', source['source_url'].replace('nsearchives.nseindia.com', 'evil.example')):
            with self.assertRaises(ValueError): source_url({**source, 'source_url': url})
    def test_repackaged_exact_csv_is_preserved_and_cached_without_overwriting_catalog(self):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as archive: archive.writestr('original.csv', self.csv)
        original = buffer.getvalue(); actual = hashlib.sha256(original).hexdigest()
        content = hashlib.sha256(self.csv).hexdigest()
        source = {'id': 'source', 'month_key': '2023-10', 'source_url': 'https://nsearchives.nseindia.com/content/cm/file.csv.zip',
            'source_kind': 'NSE_CM_BHAVCOPY_UDIFF', 'compressed_sha256': 'a'*64, 'content_sha256': content,
            'source_period_start': '2023-10-31', 'source_contract_version': 'verified-catalog'}
        with tempfile.TemporaryDirectory() as temporary:
            cache = Path(temporary); (cache/(actual+'.zip')).write_bytes(original)
            (cache/(content+'.json')).write_text(json.dumps({'actual_compressed_sha256': actual}))
            with patch('urllib.request.urlopen', side_effect=AssertionError('unexpected source acquisition')):
                result = read_archive(source, self.scope, cache)
            self.assertEqual(result['source_downloads'], 0)
            self.assertEqual(result['transport_representation'], 'REPACKAGED_ZIP_EXACT_CSV_CONTENT_MATCH')
            self.assertFalse((cache/('a'*64+'.zip')).exists())
            self.assertEqual(result['catalog_compressed_sha256'], 'a'*64)

if __name__ == '__main__': unittest.main()
