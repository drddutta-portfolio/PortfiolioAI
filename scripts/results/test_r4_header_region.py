"""Supplemental header OCR must never import financial amounts."""
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from test_r4_pdf_geometry import fixture
from r4_ocr_dated_geometry import HeaderRegionOCRPage,LabelRegionOCRPage

class HeaderRegionTest(unittest.TestCase):
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
