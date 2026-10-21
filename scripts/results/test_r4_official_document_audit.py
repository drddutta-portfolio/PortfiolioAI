import hashlib,types,unittest
from unittest.mock import patch
import fitz
from r4_ocr_dated_geometry import audit_document

class FullOriginalAuditBounds(unittest.TestCase):
    def original(self,pages):
        with fitz.open() as pdf:
            for _ in range(pages):pdf.new_page()
            return pdf.tobytes()

    def test_official_report_scans_every_page_including_late_business_basis_note(self):
        raw=self.original(61);visited=[]
        def rendered(page,dpi):
            visited.append((page.number,dpi))
            text='carve-out warning on the final page' if page.number==60 else 'Original page '+str(page.number)
            return types.SimpleNamespace(get_text=lambda kind:text)
        with patch('r4_ocr_dated_geometry.OCRPage',side_effect=rendered):result=audit_document(raw,max_pages=120)
        self.assertEqual(len(result['pages']),61);self.assertEqual(len(visited),61)
        self.assertEqual(set(dpi for _,dpi in visited),{150})
        self.assertIn('carve-out',result['pages'][-1])
        self.assertEqual(result['text_sha256'],hashlib.sha256('\n'.join(result['pages']).encode()).hexdigest())

    def test_legacy_default_document_bound_remains_forty(self):
        with self.assertRaisesRegex(ValueError,'PAGE_BOUND'):audit_document(self.original(41))

    def test_new_report_bound_is_still_finite_and_explicit(self):
        with self.assertRaisesRegex(ValueError,'PAGE_BOUND'):audit_document(self.original(121),max_pages=120)
        with self.assertRaisesRegex(ValueError,'UNAPPROVED'):audit_document(self.original(1),max_pages=10000)

if __name__=='__main__':unittest.main()
