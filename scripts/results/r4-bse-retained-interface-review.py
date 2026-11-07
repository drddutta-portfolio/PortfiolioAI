#!/usr/bin/env python3
"""Read the public exchange's financial-result link interface; no financial writes."""
import os,re,json,hashlib,importlib.util
from pathlib import Path
from urllib.parse import urlparse,urljoin
from html.parser import HTMLParser

spec=importlib.util.spec_from_file_location('batch',Path(__file__).with_name('r4-bse-historical-batch.py'));batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(batch)
RESPONSE='5231d23abfb899d22340168b631a093cfb6065f28c9af151e746d870e70b79b3'

class Scripts(HTMLParser):
    def __init__(self):super().__init__();self.sources=[]
    def handle_starttag(self,tag,attrs):
        if tag=='script' and dict(attrs).get('src'):self.sources.append(dict(attrs)['src'])

def main():
    if os.environ.get('GITHUB_REPOSITORY')!='drddutta-portfolio/PortfiolioAI' or os.environ.get('GITHUB_REF')!='refs/heads/PortfolioAI-Development' or os.environ.get('CLOUDFLARE_R2_BUCKET')!=batch.BUCKET:raise RuntimeError('DEVELOPMENT_ONLY')
    client=batch.r2_client();key=batch.PREFIX+'bse-structured-result-review/sha256='+RESPONSE+'/response.json';raw=client.get_object(Bucket=batch.BUCKET,Key=key)['Body'].read()
    if hashlib.sha256(raw).hexdigest()!=RESPONSE:raise ValueError('RETAINED_EXCHANGE_RESPONSE_HASH_MISMATCH')
    data=json.loads(raw);data=json.loads(data) if isinstance(data,str) else data
    # These are exchange link identifiers, never financial statement rows.
    print('R4_BSE_RETAINED_PERIOD_LINK_IDENTIFIERS',json.dumps(data.get('resultinS')),flush=True)
    with batch.PortfolioBSE() as bse:
        reviewed=set()
        for url in ('https://www.bseindia.com/corporates/results.aspx?Code=532541&Company=Coforge-Ltd&qtr=131.00&RType=', 'https://www.bseindia.com/corporates/results.aspx?Code=532541&Company=Coforge-Ltd&qtr=125.00&RType=', 'https://www.bseindia.com/corporates/financialres.aspx','https://www.bseindia.com/stock-share-price/coforge-limited/coforge/532541/financials-results/'):
            try:
                response=bse._bse.session.get(url,timeout=(15,35));response.raise_for_status()
                if urlparse(response.url).hostname!='www.bseindia.com' or len(response.content)>5_000_000:raise ValueError('EXCHANGE_INTERFACE_ORIGIN_OR_SIZE_UNPROVEN')
                body=response.text;parser=Scripts();parser.feed(body)
                scripts=[urljoin(response.url,u) for u in parser.sources];scripts=[u for u in scripts if urlparse(u).scheme=='https' and urlparse(u).hostname=='www.bseindia.com']
                scripts.sort(key=lambda u:(not bool(re.search('financ|result|stock|corp|controller|main',u,re.I)),u));print('R4_BSE_PUBLIC_INTERFACE',json.dumps({'url':response.url,'scripts':scripts,'bytes':len(response.content)}),flush=True)
                sources=[(response.url,body)]
                print('R4_BSE_PUBLIC_RESULT_PAGE_MARKUP',json.dumps({'url':response.url,'fragments':re.findall(r'.{0,80}(?:Quarter|Period|Revenue|Profit|Diluted|<select|<option|BseIndiaAPI).{0,180}',body,re.I)[:35]}),flush=True)
                seen=reviewed; pending=list(scripts[:12]); total_bytes=0
                # Angular loads the financial route from first-party lazy chunks.
                while pending and len(seen)<180 and total_bytes<35_000_000:
                    script=pending.pop(0)
                    if script in seen:continue
                    seen.add(script)
                    try:
                        r=bse._bse.session.get(script,timeout=(15,25));r.raise_for_status()
                        if urlparse(r.url).hostname!='www.bseindia.com' or len(r.content)>5_000_000:continue
                        sources.append((r.url,r.text));total_bytes+=len(r.content)
                        children=[urljoin(r.url,m) for m in re.findall(r'''["']([^"']*(?:chunk|financial|result)[^"']*\.js)["']''',r.text,re.I)]
                        children=[u for u in children if urlparse(u).scheme=='https' and urlparse(u).hostname=='www.bseindia.com' and u not in seen]
                        pending.extend(u for u in children if u not in pending)
                    except Exception as e:print('R4_PUBLIC_SCRIPT_UNAVAILABLE',type(e).__name__,flush=True)
                print('R4_PUBLIC_SCRIPT_REVIEW_BOUNDS',json.dumps({'scripts':len(seen),'bytes':total_bytes,'pending':len(pending)}),flush=True)
                for source,text in sources:
                    for match in list(re.finditer(r'resultinS|Corp_FinanceResult|financialres|FinancialResult|TabResults_PAR|StockreachResult|corpFinanceResult|financialres|FinancialResultHeader|financialresult|financeresult',text,re.I))[:15]:
                        fragment=text[max(0,match.start()-150):match.end()+550]
                        print('R4_BSE_PUBLIC_FINANCIAL_INTERFACE_FRAGMENT',json.dumps({'source':source,'fragment':fragment}),flush=True)
                    digest=hashlib.sha256(text.encode()).hexdigest();batch.immutable_put(client,batch.PREFIX+'bse-public-interface-review/sha256='+digest+'/source.txt',text.encode())
            except Exception as e:print('R4_BSE_PUBLIC_INTERFACE_UNAVAILABLE',json.dumps({'url':url,'reason':type(e).__name__}),flush=True)

if __name__=='__main__':main()
