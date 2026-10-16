import copy,json,unittest
from pathlib import Path
from g03_remaining_cash import qualify_cells

BATCH=json.loads(Path('supabase/functions/_shared/v14-g03-remaining-cash-review-batch.json').read_text())

def fixture():
 pages={}
 for c in BATCH['cells']:
  key=(c['originalSha256'],c['pdfPage'])
  if key not in pages:pages[key]='March 31, '+str(c['rowFiscalYears'][0])+' March 31, '+str(c['rowFiscalYears'][1])+' Rs. Lakhs INR Crores\n'
  row=c['label']+' '+' '.join(c['rowValues'])
  if row not in pages[key]:pages[key]+=row+'\n'
 for e in BATCH['scopeEvidence']:
  key=(e['originalSha256'],e['pdfPage']);pages[key]=pages.get(key,'')+'\n'+'\n'.join(e['requiredFragments'])
 return pages

class SourceQualification(unittest.TestCase):
 def test_all_literal_cells_and_crore_lakh_conversion(self):self.assertEqual(len(qualify_cells(fixture(),BATCH)),32)
 def test_changed_source_row_fails(self):
  pages=fixture();c=BATCH['cells'][0];pages[(c['originalSha256'],c['pdfPage'])]=pages[(c['originalSha256'],c['pdfPage'])].replace('37,595.92','37,595.91')
  with self.assertRaisesRegex(ValueError,'LABELLED_ANNUAL_ROW'):qualify_cells(pages,BATCH)
 def test_absent_scope_proof_fails(self):
  pages=fixture();e=BATCH['scopeEvidence'][2];pages[(e['originalSha256'],e['pdfPage'])]='Standalone claim without issuer source'
  with self.assertRaisesRegex(ValueError,'STANDALONE_SCOPE'):qualify_cells(pages,BATCH)
 def test_annual_columns_reversed_fails(self):
  pages=fixture();c=BATCH['cells'][0];key=(c['originalSha256'],c['pdfPage']);pages[key]=pages[key].replace('March 31, 2026 March 31, 2025','March 31, 2025 March 31, 2026')
  with self.assertRaisesRegex(ValueError,'COLUMN_ORDER'):qualify_cells(pages,BATCH)
 def test_crore_conversion_not_silently_lakh(self):
  b=copy.deepcopy(BATCH);c=next(c for c in b['cells'] if c['originalUnit']=='INR_CRORE');c['exactINRLakh']=c['originalValue']
  with self.assertRaisesRegex(ValueError,'UNIT_OR_PERIOD'):qualify_cells(fixture(),b)
 def test_overlapping_year_conflict_fails(self):
  b=copy.deepcopy(BATCH);c=next(c for c in b['cells'] if c['symbol']=='DATAPATTNS' and c['fiscalYear']==2025 and c['role']=='CFO');c.update(rowValues=['80.15','(89.87)'],literalValue='(89.87)',originalValue='-89.87',exactINRLakh='-8987.00');next(x for x in b['cells'] if x['symbol']=='DATAPATTNS' and x['fiscalYear']==2026 and x['role']=='CFO')['rowValues']=['80.15','(89.87)'];pages=fixture();key=(c['originalSha256'],c['pdfPage']);pages[key]=pages[key].replace('(89.88)','(89.87)')
  with self.assertRaisesRegex(ValueError,'OVERLAPPING_SELECTED'):qualify_cells(pages,b)
 def test_no_bel_adjustment_is_copied(self):
  b=copy.deepcopy(BATCH);b['periods'][0]['components']['excludedRental']='263'
  with self.assertRaisesRegex(ValueError,'COMPONENT_JOIN'):qualify_cells(fixture(),b)

if __name__=='__main__':unittest.main()
