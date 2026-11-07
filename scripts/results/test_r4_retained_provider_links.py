import unittest,json
from r4_retained_provider_links import original_links
class RetainedLinksTests(unittest.TestCase):
    def test_nested_provider_json_finds_only_public_approved_pdf_origins(self):
        url='https://www.bseindia.com/xml-data/corpfiling/AttachHis/public.pdf'
        value={'content':[{'text':json.dumps({'data':[{'source':url},{'source':'https://evil.test/f.pdf'},{'source':url+'?token=secret'},{'source':'https://www.bseindia.com.evil.test/f.pdf'}]})}]}
        self.assertEqual(original_links(value,'VAML'),[url])
    def test_plain_text_duplicates_and_pdf_punctuation(self):
        url='https://d1rbiogke1jwo5.cloudfront.net/reported.pdf'
        self.assertEqual(original_links('Read ('+url+'). '+url,'VAML'),[url])
    def test_foreign_issuer_origin_and_credentials_reject(self):
        self.assertEqual(original_links(['https://www.starhealth.in/report.pdf','https://secret@www.bseindia.com/f.pdf','http://www.bseindia.com/f.pdf'],'VAML'),[])
    def test_unknown_issuer_and_excessive_depth_fail_closed(self):
        with self.assertRaises(ValueError):original_links({},'UNKNOWN')
        value='https://www.bseindia.com/report.pdf'
        for _ in range(23):value=[value]
        with self.assertRaises(ValueError):original_links(value,'VAML')
if __name__=='__main__':unittest.main()
