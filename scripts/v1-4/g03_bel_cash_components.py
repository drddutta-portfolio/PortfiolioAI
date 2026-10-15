"""Read immutable BEL originals, prove exact paired annual cells, then optionally admit.
Never downloads originals, uploads files, calls a provider, or materializes readiness.
"""
import hashlib,json,os,re,subprocess,tempfile
from pathlib import Path
from g03_source_qualification import invoke
ROOT=Path('supabase/functions/_shared')

def normalize(text):
 return re.sub(r'\s+',' ',text.replace('\u00ad','')).strip()

def qualify_source_cells(pages,cells):
 for cell in cells:
  page=normalize(pages[(cell['originalSha256'],cell['pdfPage'])])
  label=normalize(cell['label'])
  # Match the labelled row and both annual columns together, not an isolated
  # number elsewhere on the page. The pinned year headers are mandatory.
  for year in cell['rowFiscalYears']:
   if not re.search(r'31\s+March\s+'+str(year),page):raise ValueError('CASH_ANNUAL_COLUMN_HEADER_MISSING')
  pattern=re.escape(label)+r'\s+'+r'\s+'.join(re.escape(v) for v in cell['rowValues'])
  if len(re.findall(pattern,page))!=1:raise ValueError('CASH_LABELLED_ANNUAL_ROW_NOT_UNIQUE')
  index=cell['rowFiscalYears'].index(cell['fiscalYear'])
  if cell['rowValues'][index]!=cell['literalValue'] or cell['exactValue']!=cell['literalValue'].replace(',','').replace('(','-').replace(')',''):raise ValueError('CASH_PERIOD_VALUE_BINDING_INVALID')
  if cell['scope']!='STANDALONE' or cell['unit']!='INR_LAKH':raise ValueError('CASH_SCOPE_UNIT_NOT_APPROVED')
 return cells

def qualify_cells(pages,cells):
 qualify_source_cells(pages,cells)
 # Original FY25 and regrouped FY25 CFO+CFI agree. The source-derived FY24
 # normalization removes the same named non-operating P&L components; it is not
 # an issuer restatement or a claim about individual cash receipt dates.
 def val(role,year,hash_prefix):
  return int(next(c['exactValue'] for c in cells if c['role']==role and c['fiscalYear']==year and c['originalSha256'].startswith(hash_prefix)))
 if val('CFO',2025,'db47')-val('RENTAL_RECLASS',2025,'db47')-val('MF_RECLASS',2025,'db47')!=val('CFO',2025,'c9bd'):raise ValueError('CASH_CLASSIFICATION_BRIDGE_CFO_INVALID')
 if val('CFO',2025,'db47')+val('CFI',2025,'db47')!=val('CFO',2025,'c9bd')+val('CFI',2025,'c9bd'):raise ValueError('CASH_CLASSIFICATION_BRIDGE_TOTAL_INVALID')
 return cells

def main():
 import boto3
 from botocore.config import Config
 if os.environ['CLOUDFLARE_R2_BUCKET']!='portfolioai-history-dev':raise ValueError('DEVELOPMENT_ONLY')
 batch=json.loads((ROOT/'v14-g03-cash-review-batch.json').read_text());policy=json.loads((ROOT/'v14-g03-financial-authorization.json').read_text())
 if hashlib.sha256(Path(policy['contractDocument']).read_bytes()).hexdigest()!=policy['contractSha256']:raise ValueError('OWNER_APPROVED_CONTRACT_HASH_MISMATCH')
 pins=json.loads((ROOT/'v14-g03-roce-original-pins.json').read_text())
 s3=boto3.client('s3',endpoint_url='https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com',region_name='auto',aws_access_key_id=os.environ['CLOUDFLARE_R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],config=Config(signature_version='s3v4',s3={'addressing_style':'path'},retries={'total_max_attempts':1}))
 pages={};originals=[]
 with tempfile.TemporaryDirectory() as temp:
  for pin in pins:
   sha=pin['original_sha256'];data=s3.get_object(Bucket='portfolioai-history-dev',Key='portfolioai-history/development/v1-4/g03/originals/'+sha+'.pdf')['Body'].read()
   if len(data)!=pin['original_bytes'] or hashlib.sha256(data).hexdigest()!=sha:raise ValueError('CASH_ORIGINAL_HASH_SIZE_INVALID')
   pdf=Path(temp)/(sha+'.pdf');pdf.write_bytes(data)
   whole=subprocess.run(['pdftotext','-layout',str(pdf),'-'],check=True,capture_output=True).stdout.decode()
   if pin['identity_fragment'] not in whole:raise ValueError('CASH_ISSUER_IDENTITY_NOT_PROVEN')
   for n in sorted({c['pdfPage'] for c in batch['cells'] if c['originalSha256']==sha}):
    text=subprocess.run(['pdftotext','-f',str(n),'-l',str(n),'-layout',str(pdf),'-'],check=True,capture_output=True).stdout.decode()
    if 'Standalone' not in text or 'Lakhs' not in text:raise ValueError('CASH_PAGE_SCOPE_UNIT_MISSING')
    pages[(sha,n)]=text
   originals.append({'originalSha256':sha,'bytes':len(data),'identityVerified':True})
 cells=qualify_cells(pages,batch['cells'])
 out=Path('g03-bel-cash-components-result');out.mkdir(exist_ok=True)
 (out/'qualified-cash-cells.json').write_text(json.dumps({'originals':originals,'verifiedCells':cells,'publicationPrecision':'UNKNOWN','fiscal2024Normalization':'PortfolioAI-derived exclusion of rental-income and mutual-fund-gain P&L components on FY2026 classification; not issuer restatement; no historical publication claim','providerCalls':0,'r2Writes':0},indent=2)+'\n')
 if os.environ.get('G03_ADMIT_CASH_COMPONENTS')!='true':
  print(json.dumps({'qualifiedCells':len(cells),'canonicalAdmissions':0}));return
 body={'action':'ADMIT_FIXED_G03_BEL_CASH_COMPONENTS','authorizationHash':policy['contractSha256'],'verifiedCells':cells}
 first=invoke('v14-g02-document-admission',body);repeat=invoke('v14-g02-document-admission',body)
 if first.get('code')!='G03_CASH_COMPONENTS_ADMITTED_NOT_CANONICAL_READY' or [x['reviewId'] for x in first['results']]!=[x['reviewId'] for x in repeat['results']] or not all(x['reused'] for x in repeat['results']):raise ValueError('CASH_ADMISSION_IDEMPOTENCE_NOT_PROVEN')
 (out/'sanitized-admission.json').write_text(json.dumps({'first':first,'repeat':repeat},indent=2)+'\n')
 print(json.dumps({'acceptedPeriodReviews':len(first['results']),'duplicateAdmission':'IDEMPOTENT','providerCalls':0,'canonicalMaterialization':False}))
if __name__=='__main__':main()
