import unittest
from g03_acquire_official_originals import allowed_url, checked_pdf, MAX_BYTES


class SourceBoundaryTest(unittest.TestCase):
    def test_official_and_exchange_urls(self):
        self.assertTrue(allowed_url('https://mtar.in/report.pdf'))
        self.assertTrue(allowed_url('https://www.bseindia.com/xml-data/corpfiling/AttachLive/report.pdf'))

    def test_lookalikes_credentials_and_transport(self):
        for url in ['https://mtar.in.evil.example/report.pdf', 'http://mtar.in/report.pdf',
                    'https://user:secret@mtar.in/report.pdf', 'https://mtar.in:8443/report.pdf',
                    'https://mtar.in/report.pdf#fragment', 'https://mtar.in/login.html']:
            self.assertFalse(allowed_url(url), url)

    def test_html_and_overflow_are_rejected(self):
        with self.assertRaises(ValueError):
            checked_pdf(b'<html>Access denied</html>')
        with self.assertRaises(ValueError):
            checked_pdf(b'%PDF-' + b'x' * MAX_BYTES)
        self.assertEqual(len(checked_pdf(b'%PDF-1.7\nfixture')), 64)


if __name__ == '__main__':
    unittest.main()
