"""Qualify four actual issuer chart periods from one retained current report.
No provider call, original upload, historical publication inference or score calculation.
"""
import hashlib,json,os,re,subprocess,tempfile,xml.etree.ElementTree as ET
from pathlib import Path
from g03_source_qualification import invoke
ROOT=Path('supabase/functions/_shared')
def qualify_order_chart(bbox_xml,order_text,batch):
 tree=ET.fromstring(bbox_xml);words=[(e.text or '',float(e.attrib['xMin'])) for e in tree.iter() if e.tag.rsplit('}',1)[-1]=='word']
 for values in [['15,044','17,333','19,820','23,024','26,680'],['57,570','60,690','75,934','71,650','73,882']]:
  selected=[]
  for value in values:
   hits=[x for text,x in words if text==value]
   if len(hits)!=1:raise ValueError('G03_ORDER_CHART_CELL_NOT_UNIQUE')
   selected.append(hits[0])
  if selected!=sorted(selected) or len(set(selected))!=5:raise ValueError('G03_ORDER_CHART_CHRONOLOGY_MISMATCH')
 body=' '.join(t for t,_ in words)
 for label in ['Turnover','Order','Book','2022-23','2023-24','2024-25','2025-26','2023','2024','2025','2026']:
  if label not in body:raise ValueError('G03_ORDER_CHART_DATE_IDENTITY_MISSING')
 if '30,045' not in order_text or 'FY 2025-26' not in order_text or 'orders valued at' not in re.sub(r'\s+',' ',order_text):raise ValueError('G03_CURRENT_ORDER_INFLOW_NOT_VERIFIED')
 return [{'turnover_crore':b['turnoverCrore'],'turnover_fiscal_label':b['turnoverFiscalLabel'],'order_book_crore':b['orderBookCrore'],'order_book_as_of':b['orderBookAsOf'],'latest_order_inflow_crore':b['latestOrderInflowCrore'],'pdf_page':b['pdfPage'],'latest_order_inflow_pdf_page':b['latestOrderInflowPdfPage'],'source_report_period_end':b['sourceReportPeriodEnd']} for b in batch]
def main():
 import boto3
 from botocore.config import Config
 if os.environ['CLOUDFLARE_R2_BUCKET']!='portfolioai-history-dev':raise ValueError('DEVELOPMENT_ONLY')
 policy=json.loads((ROOT/'v14-g03-order-authorization.json').read_text());batch=json.loads((ROOT/'v14-g03-order-review-batch.json').read_text());pin=json.loads((ROOT/'v14-g03-original-pins.json').read_text())[0]
 s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',s3={'addressing_style':'path'},retries={'total_max_attempts':1}))
 data=s3.get_object(Bucket='portfolioai-history-dev',Key='portfolioai-history/development/v1-4/g03/originals/'+pin['original_sha256']+'.pdf')['Body'].read()
 if len(data)!=pin['original_bytes'] or hashlib.sha256(data).hexdigest()!=pin['original_sha256']:raise ValueError('G03_ORDER_ORIGINAL_BYTES_NOT_VERIFIED')
 out=Path('g03-bel-order-history-result');out.mkdir(exist_ok=True)
 with tempfile.TemporaryDirectory() as temp:
  pdf=Path(temp)/'original.pdf';pdf.write_bytes(data)
  page=subprocess.run(['pdftotext','-f','47','-l','47','-bbox',str(pdf),'-'],check=True,capture_output=True).stdout.decode()
  inflow=subprocess.run(['pdftotext','-f','35','-l','35','-layout',str(pdf),'-'],check=True,capture_output=True).stdout.decode()
  text=subprocess.run(['pdftotext','-layout',str(pdf),'-'],check=True,capture_output=True).stdout.decode()
  if pin['identity_fragment'] not in text:raise ValueError('G03_ORDER_ORIGINAL_IDENTITY_MISSING')
  (out/'issuer-page-47-bbox.html').write_text(page);(out/'issuer-page-35.txt').write_text(inflow)
  cells=qualify_order_chart(page,inflow,batch)
 results=[]
 for b,cell in zip(batch,cells):
  body={'action':'ADMIT_FIXED_G03_ORDER_HISTORY','authorizationHash':policy['directiveSha256'],'securityId':b['securityId'],'requirementCode':b['requirementCode'],'reportingPeriodEnd':b['reportingPeriodEnd'],'originalHash':b['originalHash'],'normalizedFragment':b['fragment'],'extractionMethod':'POPPLER_LAYOUT_WHITESPACE_NORMALIZED_ORIGINAL_BYTES','verifiedOrderCells':cell}
  first=invoke('v14-g02-document-admission',body);repeat=invoke('v14-g02-document-admission',body)
  if first.get('code')!='G03_DOCUMENT_REVIEW_ADMITTED_NOT_CANONICAL_READY' or repeat.get('reviewId')!=first.get('reviewId') or repeat.get('reused') is not True:raise ValueError('G03_ORDER_REVIEW_NOT_IDEMPOTENT')
  results.append({**first,'periodEnd':b['reportingPeriodEnd'],'verifiedOrderCells':cell,'duplicateAdmission':'IDEMPOTENT'})
  (out/'sanitized-results.json').write_text(json.dumps(results,indent=2)+'\n')
 print(json.dumps({'actualOrderHistoryReviews':len(results),'originalReacquisitions':0,'r2Writes':0,'providerCalls':0,'canonicalMaterialization':False}))
if __name__=='__main__':main()
