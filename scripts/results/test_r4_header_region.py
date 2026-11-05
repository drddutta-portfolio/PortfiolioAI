"""Supplemental header OCR must never import financial amounts."""
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from test_r4_pdf_geometry import fixture
from r4_ocr_dated_geometry import HeaderRegionOCRPage,LabelRegionOCRPage,audit_document,_cached_document_audit

class HeaderRegionTest(unittest.TestCase):
    def test_unread_supplemental_label_cannot_delete_a_readable_original_profit_row(self):
        doc,base=self.base();original=base.get_text('words')
        region_words=[w for w in original if w[2]<430 and 145<w[1]<230 and not 175<w[1]<200]
        region_words.append((25,185,60,195,'xyz'))
        region=SimpleNamespace(get_text=lambda kind:region_words)
        with patch('r4_ocr_dated_geometry.TableOCRPage',return_value=region):
            result=LabelRegionOCRPage(base,300,preserve_unread_rows=True)
        from r4_pdf_geometry import extract_page
        parsed=extract_page(result,1,'2024-09-30',allow_comparative=True)
        self.assertEqual(parsed['facts']['NET_PROFIT_QUARTER']['original_value'],'1,324')
        self.assertNotIn('xyz',[w[4] for w in result.get_text('words')])

    def test_original_audit_cache_is_exact_bounded_and_isolated_from_mutation(self):
        doc,page=fixture();raw=doc.tobytes()
        _cached_document_audit.cache_clear()
        with patch('r4_ocr_dated_geometry.OCRPage') as render:
            render.return_value.get_text.return_value='Unchanged original audit'
            first=audit_document(raw,40)
            first['pages'][0]='tampered by a consumer'
            again=audit_document(raw,40)
            self.assertEqual(again['pages'],['Unchanged original audit'])
            self.assertEqual(render.call_count,1)
            audit_document(raw,120)
            self.assertEqual(render.call_count,2)
            page.insert_text((25,330),'Different original bytes')
            audit_document(doc.tobytes(),40)
            self.assertEqual(render.call_count,3)
            with self.assertRaisesRegex(ValueError,'UNAPPROVED_DOCUMENT_AUDIT_PAGE_BOUND'):
                audit_document(raw,500)
        _cached_document_audit.cache_clear()

    def base(self):
        doc,page=fixture()
        return doc,SimpleNamespace(page=page,get_text=page.get_text)

    def test_only_header_words_are_replaced_and_financial_words_are_identical(self):
        doc,base=self.base()
        original=base.get_text('words')
        region_words=[w for w in original if 85<(w[1]+w[3])/2<145]
        region=SimpleNamespace(get_text=lambda kind:region_words)
        with patch('r4_ocr_dated_geometry.TableOCRPage',return_value=region) as render:
            result=HeaderRegionOCRPage(base,300)
        evidence=result.header_region_evidence
        self.assertIsNotNone(evidence)
        clip=render.call_args.kwargs['clip']
        self.assertLess(clip.y1,evidence['financial_row_glyph_top'])
        self.assertFalse(evidence['financial_words_changed'])
        self.assertEqual([w for w in result.get_text('words') if w[1]>=clip.y1],
                         [w for w in original if w[1]>=clip.y1])
        self.assertEqual(result.get_text('text'),base.get_text('text'))

    def test_unreadable_header_does_not_replace_any_word(self):
        doc,base=self.base()
        region=SimpleNamespace(get_text=lambda kind:[])
        with patch('r4_ocr_dated_geometry.TableOCRPage',return_value=region):
            result=HeaderRegionOCRPage(base,450)
        self.assertIsNone(result.header_region_evidence)
        self.assertEqual(result.get_text('words'),base.get_text('words'))

    def test_label_region_preserves_every_amount_and_rejects_numeric_imports(self):
        doc,base=self.base()
        original=base.get_text('words')
        region_words=[w for w in original if w[2]<430 and w[1]>145]
        region_words.append((35,160,65,170,'99999'))
        region=SimpleNamespace(get_text=lambda kind:region_words)
        with patch('r4_ocr_dated_geometry.TableOCRPage',return_value=region):
            result=LabelRegionOCRPage(base,300)
        evidence=result.label_region_evidence
        self.assertIsNotNone(evidence)
        right=evidence['clip'][2]
        self.assertEqual([w for w in result.get_text('words') if w[0]>=right],
                         [w for w in original if w[0]>=right])
        self.assertNotIn('99999',[w[4] for w in result.get_text('words')])
        self.assertEqual(result.get_text('text'),base.get_text('text'))

    def test_numeric_word_crossing_label_boundary_aborts_supplement(self):
        doc,base=self.base()
        original=base.get_text('words')
        # Fixture date centres give a first-column left boundary near 405.
        from r4_pdf_geometry import dated_headers,rows_for
        dates=list(dated_headers(rows_for(base)))[0][2]
        centres=[(d[1]+d[2])/2 for d in dates]
        right=centres[0]-(centres[1]-centres[0])/2
        original.append((right-5,165,right+5,175,'123.45'))
        base.get_text=lambda kind:original if kind=='words' else ''
        with patch('r4_ocr_dated_geometry.TableOCRPage') as render:
            result=LabelRegionOCRPage(base,450)
        render.assert_not_called()
        self.assertIsNone(result.label_region_evidence)
        self.assertEqual(result.get_text('words'),original)

if __name__=='__main__':unittest.main()
