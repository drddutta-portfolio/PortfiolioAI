"""Synthetic chart mechanics only; actual issuer byte/cell proof runs separately."""
import unittest,json
from pathlib import Path
from g03_bel_order_history import qualify_order_chart
class ChartQualification(unittest.TestCase):
 def fixture(self):
  values=['15,044','17,333','19,820','23,024','26,680','57,570','60,690','75,934','71,650','73,882']
  labels=['Turnover','Order','Book','2022-23','2023-24','2024-25','2025-26','2023','2024','2025','2026']
  xml='<doc>'+''.join(f'<word xMin="{i+1}">{v}</word>' for i,v in enumerate(values+labels))+'</doc>'
  b=json.loads(Path('supabase/functions/_shared/v14-g03-order-review-batch.json').read_text());return xml,'Your Company received orders valued at 30,045 Crore during FY 2025-26',b
 def test_actual_year_stock_dates_are_not_relabelled_as_fiscal_year_end(self):
  x,t,b=self.fixture();facts=qualify_order_chart(x,t,b);self.assertEqual(len(facts),4);self.assertEqual(facts[0]['order_book_as_of'],'2023-04-01');self.assertEqual(facts[0]['turnover_fiscal_label'],'2022-23')
 def test_missing_or_duplicate_chart_cell_fails(self):
  x,t,b=self.fixture()
  for bad in [x.replace('60,690','60,500'),x.replace('</doc>','<word xMin="50">60,690</word></doc>')]:
   with self.assertRaises(ValueError):qualify_order_chart(bad,t,b)
 def test_wrong_column_order_or_missing_order_intake_fails(self):
  x,t,b=self.fixture()
  with self.assertRaises(ValueError):qualify_order_chart(x.replace('xMin="1"','xMin="200"',1),t,b)
  with self.assertRaises(ValueError):qualify_order_chart(x,'forecast 30,045',b)
if __name__=='__main__':unittest.main()
