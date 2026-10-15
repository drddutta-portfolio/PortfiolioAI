import copy,json,unittest
from pathlib import Path
from g03_bel_cash_components import qualify_cells
class CashSourceQualification(unittest.TestCase):
 def setUp(self):
  self.cells=json.loads(Path('supabase/functions/_shared/v14-g03-cash-review-batch.json').read_text())['cells'];self.pages={}
  seen=set()
  for c in self.cells:
   key=(c['originalSha256'],c['pdfPage']);row=c['label']+' '+' '.join(c['rowValues'])
   if (key,row) not in seen:self.pages[key]=self.pages.get(key,'')+' '+row;seen.add((key,row))
  for key in self.pages:self.pages[key]='31 March 2024 31 March 2025 31 March 2026 '+self.pages[key]
 def test_paired_columns_and_cash_neutral_bridge(self):self.assertEqual(qualify_cells(self.pages,self.cells),self.cells)
 def test_wrong_year_or_unlabelled_number_does_not_qualify(self):
  pages={k:v.replace('Net Cash from / (used in) Operating Activities','Unrelated row') for k,v in self.pages.items()}
  with self.assertRaisesRegex(ValueError,'LABELLED_ANNUAL_ROW'):qualify_cells(pages,self.cells)
  cells=copy.deepcopy(self.cells);cells[0]['literalValue']='45,725'
  with self.assertRaisesRegex(ValueError,'PERIOD_VALUE'):qualify_cells(self.pages,cells)
 def test_scope_and_conflicting_bridge_rejected(self):
  cells=copy.deepcopy(self.cells);cells[0]['scope']='CONSOLIDATED'
  with self.assertRaisesRegex(ValueError,'SCOPE_UNIT'):qualify_cells(self.pages,cells)
  cells=copy.deepcopy(self.cells)
  for c in cells:
   if c['role']=='CFI' and c['originalSha256'].startswith('c9bd'):
    c['rowValues']=['1,74,739','77,158']
    if c['fiscalYear']==2025:c['literalValue']='77,158';c['exactValue']='77158'
  pages={k:v.replace('77,157','77,158') for k,v in self.pages.items()}
  with self.assertRaisesRegex(ValueError,'BRIDGE_TOTAL'):qualify_cells(pages,cells)
if __name__=='__main__':unittest.main()
