"""Exact dated NSE financial columns; no relative-quarter or annual subtraction."""
from datetime import datetime
from decimal import Decimal,InvalidOperation
import re

PERIODS={"2024-09-30":"2024-07-01","2024-12-31":"2024-10-01","2025-03-31":"2025-01-01","2025-06-30":"2025-04-01"}
HISTORICAL=frozenset(PERIODS)
PERIODS.update({"2025-09-30":"2025-07-01","2025-12-31":"2025-10-01","2026-03-31":"2026-01-01","2026-06-30":"2026-04-01"})
CONTRACT="PORTFOLIOAI_RESULTS_NSE_DATED_COLUMN_REPLAY_V1"
KIND="RESULTS_R4_NSE_DATED_COLUMN_V1"
def norm(s):return re.sub(r"\s+"," ",s).strip().lower()
def dateval(value):
    for fmt in ("%d-%m-%Y","%d-%b-%Y","%d-%B-%Y","%d/%m/%Y","%d.%m.%Y"):
        try:return datetime.strptime(value.strip(),fmt).date().isoformat()
        except ValueError:pass
    return None
def number(s):
    s=s.strip()
    if not re.fullmatch(r"\(?-?\d[\d,]*(?:\.\d+)?\)?",s) or s.startswith("(")!=s.endswith(")"):raise ValueError("DATED_COLUMN_NUMBER_UNPROVEN")
    try:value=Decimal(s.replace(",","").replace("(","-").replace(")",""))
    except InvalidOperation:raise ValueError("DATED_COLUMN_NUMBER_UNPROVEN") from None
    if not value.is_finite():raise ValueError("DATED_COLUMN_NONFINITE")
    return value
def fields(table,label):
    rows=[]
    for cells in table:
        positions=[i for i,c in enumerate(cells) if norm(c)==label]
        if not positions:continue
        # Expanded label colspans belong to the label, not the first value.
        if positions!=list(range(positions[0],positions[-1]+1)):raise ValueError("DATED_COLUMN_DUPLICATE_LABEL")
        rows.append(cells[positions[-1]+1:])
    unique={tuple(r) for r in rows}
    if len(unique)>1:raise ValueError("DATED_COLUMN_CONFLICTING_FIELD")
    return list(next(iter(unique))) if unique else []
def unique(tables,label):
    found={v.strip() for table in tables for v in fields(table,label) if v.strip()}
    return next(iter(found)) if len(found)==1 else None
def parse_html(html):
    """Canonical table/text extraction using the standard HTML parser.

    Preserve document table order, direct row ownership, expanded colspans and
    descendant cell text, including nested tables. No script/style text is data.
    """
    from html.parser import HTMLParser
    class Reader(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.stack=[];self.tables=[];self.text=[];self.hidden=0
        def cell_end(self,table):
            if table['cell'] is not None:
                value=re.sub(r"\s+"," ",' '.join(table['cell'])).strip()
                if table['row'] is not None:table['row'].extend([value]*table['span'])
                table['cell']=None
        def row_end(self,table):
            self.cell_end(table)
            if table['row']:table['rows'].append(table['row'])
            table['row']=None
        def handle_starttag(self,tag,attrs):
            if tag in ('script','style','template'):self.hidden+=1;return
            if self.hidden:return
            if tag=='table':
                table={'rows':[],'row':None,'cell':None,'span':1}
                self.stack.append(table);self.tables.append(table)
            elif self.stack and tag=='tr':
                self.row_end(self.stack[-1]);self.stack[-1]['row']=[]
            elif self.stack and tag in ('td','th'):
                table=self.stack[-1];self.cell_end(table)
                if table['row'] is None:return
                try:span=int(dict(attrs).get('colspan','1'))
                except (TypeError,ValueError):raise ValueError('DATED_COLUMN_SPAN_BOUND') from None
                if not 1<=span<=32:raise ValueError('DATED_COLUMN_SPAN_BOUND')
                table['cell']=[];table['span']=span
        def handle_endtag(self,tag):
            if tag in ('script','style','template'):
                self.hidden=max(0,self.hidden-1);return
            if self.hidden or not self.stack:return
            if tag in ('td','th'):self.cell_end(self.stack[-1])
            elif tag=='tr':self.row_end(self.stack[-1])
            elif tag=='table':self.row_end(self.stack.pop())
        def handle_data(self,data):
            if self.hidden:return
            self.text.append(data)
            for table in self.stack:
                if table['cell'] is not None:table['cell'].append(data)
    reader=Reader();reader.feed(html);reader.close()
    while reader.stack:reader.row_end(reader.stack.pop())
    return re.sub(r"\s+"," ",' '.join(reader.text)).strip(),[t['rows'] for t in reader.tables if t['rows']]

def tables_from_html(html):
    return parse_html(html)[1]

def extract_tables(tables,symbol,isin,period,bank=False,insurer=False):
    if period not in PERIODS:raise ValueError("DATED_COLUMN_OUTSIDE_HISTORICAL_WINDOW")
    if unique(tables,"nse symbol")!=symbol or unique(tables,"isin")!=isin:raise ValueError("DATED_COLUMN_EXACT_IDENTITY_REQUIRED")
    if norm(unique(tables,"reporting type") or "")!="quarterly":raise ValueError("DATED_COLUMN_QUARTERLY_REPORT_REQUIRED")
    unit=norm(unique(tables,"level of rounding used in financial results") or "")
    if unit not in ("lakhs","crores"):raise ValueError("DATED_COLUMN_DECLARED_UNIT_REQUIRED")
    divisor=Decimal(100) if unit=="lakhs" else Decimal(1)
    labels={"NET_PROFIT_QUARTER":("total profit (loss) for period",),
        "EPS_DILUTED":("diluted earnings (loss) per share from continuing and discontinued operations","diluted earnings per share"),
        "OPERATING_REVENUE_QUARTER":("revenue from operations","total revenue from operations")}
    if bank:
        labels={"NET_PROFIT_QUARTER":("net profit (loss) for the period",),"EPS_DILUTED":("diluted earnings per share after extraordinary items",),
            "INTEREST_EARNED":("total interest earned",),"INTEREST_EXPENDED":("interest expenses",)}
    if insurer:
        labels={"NET_PREMIUM_EARNED_QUARTER":("premium earned (net)",),"NET_PROFIT_QUARTER":("profit / (loss) after tax",),
            "EPS_DILUTED":("eps after extraordinary items (in rs.) - diluted","eps after extraordinary items - diluted")}
    candidates=[]
    for table in tables:
        starts=fields(table,"date of start of reporting period");ends=fields(table,"date of end of reporting period")
        if not starts or len(starts)!=len(ends):continue
        indices=[i for i,(start,end) in enumerate(zip(starts,ends)) if dateval(start)==PERIODS[period] and dateval(end)==period]
        scopes=fields(table,"nature of report standalone or consolidated")
        for index in indices:
            scope=(scopes[index] if len(scopes)==len(starts) else scopes[0] if len(scopes)==1 else "").strip().upper()
            if scope not in ("CONSOLIDATED","STANDALONE"):continue
            facts={}
            for metric,names in labels.items():
                options=[]
                for name in names:
                    values=fields(table,name)
                    if len(values)!=len(starts):continue
                    try:value=number(values[index])
                    except ValueError:continue
                    options.append({"value":str(value if metric=="EPS_DILUTED" else value/divisor),
                        "unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_CRORE",
                        "original_value":values[index],"original_unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_LAKH" if unit=="lakhs" else "INR_CRORE",
                        "column_index":index,"column_period_start":PERIODS[period],"column_period_end":period,"source_label":name})
                if len({x["value"] for x in options})>1:raise ValueError("DATED_COLUMN_METRIC_LABEL_CONFLICT")
                if options:facts[metric]=options[0]
            if bank and all(k in facts for k in ("INTEREST_EARNED","INTEREST_EXPENDED")):
                a,b=facts.pop("INTEREST_EARNED"),facts.pop("INTEREST_EXPENDED")
                facts["NET_INTEREST_INCOME_QUARTER"]={**a,"value":str(Decimal(a["value"])-Decimal(b["value"])),
                    "component_values":[a["original_value"],b["original_value"]],"source_label":"total interest earned minus interest expenses"}
            required={"NET_PROFIT_QUARTER","EPS_DILUTED","NET_INTEREST_INCOME_QUARTER" if bank else "NET_PREMIUM_EARNED_QUARTER" if insurer else "OPERATING_REVENUE_QUARTER"}
            if set(facts)!=required:continue
            candidates.append({"symbol":symbol,"isin":isin,"period_start":PERIODS[period],"period_end":period,"scope":scope,
                "filing_period_start":dateval(starts[0]),"filing_period_end":dateval(ends[0]),"facts":facts})
    if not candidates:raise ValueError("DATED_COLUMN_COMPLETE_EXACT_QUARTER_NOT_FOUND")
    distinct={str(sorted((k,f["value"]) for k,f in p["facts"].items()))+p["scope"] for p in candidates}
    if len(distinct)!=1:raise ValueError("DATED_COLUMN_MULTIPLE_STATEMENTS_CONFLICT")
    return candidates[0]

def extract(html,symbol,isin,period,bank=False,insurer=False):
    return extract_tables(tables_from_html(html),symbol,isin,period,bank,insurer)

