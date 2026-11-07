import unittest,base64
from copy import deepcopy
from unittest.mock import patch
from types import SimpleNamespace
import fitz
from test_r4_scope_bridge import example,URL
from r4_scope_board import make_bridge,extract_with_scope_board,sha,printed_precision_match,CaptionView,CONTRACT,REVISION

def fixture():
    doc,old=example()
    page=doc[0]
    page.insert_text((25,550),'Meeting commenced at 2:00 p.m. IST and concluded at 4:00 p.m. IST.',fontsize=8)
    page.insert_text((25,260),'Profit before tax',fontsize=10)
    page.insert_text((25,290),'Total tax expense',fontsize=10)
    for x,pbt,tax in ((475,'2,000','676'),(625,'7,000','235'),(775,'3,000','873')):
        page.insert_text((x,260),pbt,fontsize=10);page.insert_text((x,290),tax,fontsize=10)
    html=base64.b64decode(old['nse_original_base64']).decode().replace('Consolidated','Standalone')
    html+='<table><tr><td>Start date and time of board meeting</td><td>01-11-2025 14:00:00</td></tr><tr><td>End date and time of board meeting</td><td>01-11-2025 16:00:00</td></tr></table>'
    return doc,make_bridge(html.encode(),URL,'2025-09-30')

def audit(raw):
    with fitz.open(stream=raw,filetype='pdf') as d:pages=[p.get_text('text') for p in d]
    return {'original_sha256':sha(raw),'pages':pages,'text_sha256':sha('\n'.join(pages).encode())}

def parse(doc,bridge,period='2024-09-30',**kwargs):
    raw=doc.tobytes()
    return extract_with_scope_board(raw,1,period,'NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',bridge,
        document_audit=audit(raw),**kwargs)

class BoardScopeTests(unittest.TestCase):
    def test_identified_single_statement_preserves_literal_historical_figures(self):
        doc,b=fixture();p,e=parse(doc,b)
        self.assertEqual(p['scope'],'STANDALONE')
        self.assertEqual(p['facts']['NET_PROFIT_QUARTER']['value'],'212.7')
        self.assertEqual(p['facts']['EPS_DILUTED']['original_value'],'11.88')
        self.assertEqual(e['board_start'],'14:00:00');self.assertEqual(e['board_end'],'16:00:00')
        self.assertTrue(e['historical_values_from_pdf_only']);self.assertTrue(e['comparison_basis_unproven'])

    def test_wrapped_meeting_clocks_match_without_changing_any_component(self):
        from r4_scope_board import match_board
        from datetime import time
        self.assertTrue(match_board('July 13, 2026 commenced\nat 2:40 p.m. and concluded at 4:00 p.m.', '2026-07-13',time(14,40),time(16,0)))
        with self.assertRaisesRegex(ValueError,'START_AND_END'):
            match_board('July 13, 2026 commenced\nat 2:41 p.m. and concluded at 4:00 p.m.', '2026-07-13',time(14,40),time(16,0))

    def test_unread_second_financial_page_cannot_be_hidden_by_native_uniqueness(self):
        doc,b=fixture();doc.new_page();raw=doc.tobytes();a=audit(raw)
        a['pages'][1]='Revenue from operations 123 Diluted earnings per share 4'
        a['text_sha256']=sha('\n'.join(a['pages']).encode())
        with self.assertRaisesRegex(ValueError,'FULL_AUDIT_SINGLE_FINANCIAL_PAGE'):
            extract_with_scope_board(raw,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b,document_audit=a)

    def test_other_board_clock_does_not_bind_even_with_same_financial_numbers(self):
        doc,b=fixture();html=base64.b64decode(b['nse_original_base64']).replace(b'14:00:00',b'14:01:00')
        b=make_bridge(html,URL,'2025-09-30')
        with self.assertRaisesRegex(ValueError,'START_AND_END'):parse(doc,b)

    def test_other_issuer_or_changed_primary_bytes_reject(self):
        doc,b=fixture();bad=deepcopy(b);bad['nse_original_sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'HASH_MISMATCH'):parse(doc,bad)
        raw=doc.tobytes()
        with self.assertRaisesRegex(ValueError,'EXACT_IDENTITY'):
            extract_with_scope_board(raw,1,'2024-09-30','NATCOPHARM','INE000000000','NATCO PHARMA LIMITED',b,document_audit=audit(raw))

    def test_duplicate_statements_are_ambiguous_even_when_numbers_match(self):
        doc,b=fixture();clone=fitz.open(stream=doc.tobytes(),filetype='pdf');doc.insert_pdf(clone)
        with self.assertRaises(ValueError):parse(doc,b)

    def test_wrong_trio_is_not_a_tolerance_based_scope_guess(self):
        doc,b=fixture();html=base64.b64decode(b['nse_original_base64']).replace(b'<td>474.8</td>',b'<td>475.8</td>')
        with self.assertRaisesRegex(ValueError,'TRIO_DISAGREES'):parse(doc,make_bridge(html,URL,'2025-09-30'))

    def test_rounding_is_only_the_printed_representation_never_a_new_historical_value(self):
        pdf={'unit':'INR_CRORE','original_unit':'INR_MILLION','original_value':'15,146.7','value':'1514.67'}
        self.assertTrue(printed_precision_match(pdf,{'unit':'INR_CRORE','value':'1514.669'}))
        self.assertFalse(printed_precision_match(pdf,{'unit':'INR_CRORE','value':'1514.675'}))
        self.assertFalse(printed_precision_match(pdf,{'unit':'INR_CRORE','value':'1514.676'}))
        self.assertFalse(printed_precision_match(pdf,{'unit':'INR_LAKH','value':'1514.67'}))

    def test_grouping_comma_whitespace_preserves_literal_amount_and_precision(self):
        fact={'unit':'INR_CRORE','value':'4114.394','original_value':'41 ,143.94','original_unit':'INR_MILLION'}
        self.assertTrue(printed_precision_match(fact,{'unit':'INR_CRORE','value':'4114.394'}))
        self.assertFalse(printed_precision_match({**fact,'original_value':'4 1143.94'},{'unit':'INR_CRORE','value':'4114.394'}))
        self.assertFalse(printed_precision_match({**fact,'value':'4114.395'},{'unit':'INR_CRORE','value':'4114.395'}))
        self.assertFalse(printed_precision_match(fact,{'unit':'INR_CRORE','value':'4114.3945'}))

    def test_conflicting_scope_group_and_restatement_contexts_remain_rejected(self):
        for text,reason in [('Consolidated financial results','OTHER_DOCUMENT_SCOPE'),('The Company and its subsidiaries','GROUP_CONTEXT'),('Comparative figures restated for a business combination','BUSINESS_PERIMETER')]:
            doc,b=fixture();doc[0].insert_text((25,600),text,fontsize=8)
            with self.subTest(text=text),self.assertRaisesRegex(ValueError,reason):parse(doc,b)

    def test_consolidated_and_zero_trios_are_outside_this_separate_contract(self):
        doc,b=fixture();html=base64.b64decode(b['nse_original_base64']).replace(b'Standalone',b'Consolidated')
        with self.assertRaisesRegex(ValueError,'SINGLE_COMPANY'):parse(doc,make_bridge(html,URL,'2025-09-30'))
        with self.assertRaisesRegex(ValueError,'NONBANK'):parse(doc,b,bank=True)

    def test_unreported_quarter_cannot_be_manufactured_from_the_current_trio(self):
        doc,b=fixture()
        with self.assertRaises(ValueError):parse(doc,b,period='2024-12-31')

    def test_audit_digest_must_belong_to_the_complete_original(self):
        doc,b=fixture();raw=doc.tobytes();bad=audit(raw);bad['text_sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'FULL_ORIGINAL_AUDIT'):
            extract_with_scope_board(raw,1,'2024-09-30','NATCOPHARM','INE987654321','NATCO PHARMA LIMITED',b,document_audit=bad)

    def test_independent_bse_replay_requires_declared_v2_and_exact_evidence(self):
        from test_r4_bse_dated_proof import proof_fixture
        from r4_bse_dated_proof import validate_original
        doc,b=fixture();raw=doc.tobytes();parsed,evidence=parse(doc,b)
        _,m,identity=proof_fixture()
        m.update(original_sha256_retained=sha(raw),consolidation_scope='STANDALONE',facts=parsed['facts'],parser_revision=REVISION,scope_evidence_basis=CONTRACT)
        identity.update(original_sha256=sha(raw),scope_bridge=b,scope_board_evidence=evidence)
        self.assertEqual(validate_original(raw,m,identity,audit(raw))['facts'],parsed['facts'])
        bad=deepcopy(identity);bad['scope_board_evidence']['board_start']='14:01:00'
        with self.assertRaisesRegex(ValueError,'EVIDENCE_REPLAY_MISMATCH'):validate_original(raw,m,bad,audit(raw))
        for field,value in [('scope_evidence_basis',None),('parser_revision','PDF_WORD_COORDINATES_DATED_COLUMN_V1')]:
            bad=deepcopy(m);bad[field]=value
            with self.assertRaisesRegex(ValueError,'SCOPE_BRIDGE_PROOF'):validate_original(raw,bad,identity,audit(raw))

    def test_full_cohort_replay_keeps_unreported_quarters_and_failed_anchors_separate(self):
        import importlib.util
        from pathlib import Path
        spec=importlib.util.spec_from_file_location('collector',Path(__file__).with_name('r4-scope-board-recovery.py'))
        collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
        from test_r4_bse_dated_proof import proof_fixture
        doc,b=fixture();raw=doc.tobytes();_,m,identity=proof_fixture()
        source={'source_url':m['issuer_filing_url'],'original_sha256':sha(raw)}
        bad=deepcopy(b);bad['nse_original_sha256']='0'*64
        anchors=[{'id':'old','hash':'a'*64,'period':'2025-09-30','bridge':bad},{'id':'good','hash':'b'*64,'period':'2025-09-30','bridge':b}]
        with patch('r4_ocr_dated_geometry.audit_document',return_value=audit(raw)):
            groups,rejections=collector.replay(raw,source,identity,m['symbol'],m['isin'],['2024-09-30','2024-12-31'],anchors)
        self.assertEqual(len(groups['2024-09-30']),1)
        self.assertEqual(groups['2024-12-31'],[])
        self.assertEqual(groups['2024-09-30'][0]['anchor']['id'],'good')
        self.assertGreater(rejections['BOARD_SCOPE_PRIMARY_HASH_MISMATCH'],0)

    def test_disagreeing_unit_caption_renders_never_supply_a_scale_factor(self):
        doc,b=fixture();doc[0].insert_text((25,75),'Currency: Indian Rupee in Mllllanl',fontsize=8)
        reads=[SimpleNamespace(stdout=b'(Currency: Indian Rupee in Million)'),SimpleNamespace(stdout=b'(Currency: Indian Rupee in Crore)')]
        with patch('r4_scope_board.subprocess.run',side_effect=reads):
            with self.assertRaisesRegex(ValueError,'UNIT_CAPTION_RENDERS_DISAGREE'):CaptionView(doc[0])

if __name__=='__main__':unittest.main()
