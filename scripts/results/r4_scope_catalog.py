"""Bounded raw NSE catalog lookup for an already selected current XML anchor."""
import json,re
from datetime import datetime,timezone
from urllib.parse import urlencode

API='https://www.nseindia.com/api/integrated-filing-results'

def list_filings(session,symbol):
    if not re.fullmatch(r'[A-Z0-9.&-]{1,30}',symbol):raise ValueError('BOARD_CATALOG_EXACT_SYMBOL_REQUIRED')
    url=API+'?'+urlencode({'index':'equities','symbol':symbol,'type':'Integrated Filing- Financials','page':1,'size':100,'from_date':'01-01-2025','to_date':datetime.now(timezone.utc).strftime('%d-%m-%Y')})
    response=session.get(url,timeout=(15,35),allow_redirects=False);response.raise_for_status()
    if response.status_code!=200 or len(response.content)>5_000_000:raise ValueError('BOARD_CATALOG_RESPONSE_UNPROVEN')
    data=json.loads(response.content);rows=data if isinstance(data,list) else data.get('data',data.get('records',[]))
    if isinstance(rows,dict):rows=rows.get('data',[])
    if not isinstance(rows,list) or len(rows)>=100:raise ValueError('BOARD_CATALOG_COMPLETENESS_UNPROVEN')
    if any(not isinstance(row,dict) or row.get('symbol')!=symbol for row in rows):raise ValueError('BOARD_CATALOG_FOREIGN_ISSUER_ROW')
    return rows
