"""Physical-column extraction for signed Indian quarterly financial statements.

Numbers are selected by the date column's coordinates, never by numeric tokens
inside the row label. Corrupt numeric cells and unproven columns fail closed.
"""
from datetime import datetime
from decimal import Decimal
import re

DATE=re.compile(r"\b\d{1,2}[./-]\d{1,2}[./-](?:20\d{2}|\d{2})\b|"
    r"\b\d{1,2}[- ](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[- ,]+20\d{2}\b|"
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},?\s*20\d{2}\b",re.I)
CELL=re.compile(r"\(?-?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?\)?")

def iso_date(text):
    text=re.sub(r",\s*", " ",text.strip())
    text=re.sub(r"\s+"," ",text)
    for fmt in ("%d.%m.%Y","%d-%m-%Y","%d/%m/%Y","%d.%m.%y","%d-%m-%y",
                "%d/%m/%y","%d %B %Y","%d-%B-%Y","%d %b %Y","%d-%b-%Y",
                "%B %d %Y"):
        try:return datetime.strptime(text,fmt).date().isoformat()
        except ValueError:pass
    return None

def rows_for(page):
    words=sorted(page.get_text("words"),key=lambda w:((w[1]+w[3])/2,w[0]))
    rows=[]
    for w in words:
        y=(w[1]+w[3])/2
        if not rows or abs(y-rows[-1][0])>2.5:rows.append([y,[w]])
        else:rows[-1][1].append(w)
    return [(y,sorted(ws,key=lambda w:w[0])) for y,ws in rows]

def row_text(words):return " ".join(str(w[4]) for w in words)

def date_cells(words):
    text=row_text(words);offset=0;spans=[]
    for w in words:
        spans.append((offset,offset+len(str(w[4])),w))
        offset+=len(str(w[4]))+1
    out=[]
    for match in DATE.finditer(text):
        ws=[w for start,end,w in spans if start<match.end() and end>match.start()]
        parsed=iso_date(match.group())
        if parsed and ws:out.append((parsed,min(w[0] for w in ws),max(w[2] for w in ws)))
    return out

def number(words):
    text=row_text(words).strip()
    # Joining split decimal glyphs would invent punctuation. Keep for OCR review.
    if not CELL.fullmatch(text):raise ValueError("CORRUPT_OR_MISSING_NUMERIC_CELL:"+text[:60])
    if text.startswith("(")!=text.endswith(")"):raise ValueError("UNBALANCED_NUMERIC_CELL")
    return Decimal(text.replace(",","").replace("(","-").replace(")","")),text

def clean_label(text):
    return re.sub(r"^\s*(?:(?:\d+|[ivx]+)[.)]?\s+|\(?[a-z]\s*[)|]\s*|-\s*)","",text,flags=re.I).strip()

def extract_page(page,page_no,period,bank=False,insurer=False):
    rows=rows_for(page)
    for header_index,(y,words) in enumerate(rows):
        dates=date_cells(words)
        if len(dates)<3 or dates[0][0]!=period:continue
        first=(dates[0][1]+dates[0][2])/2
        second=(dates[1][1]+dates[1][2])/2
        third=(dates[2][1]+dates[2][2])/2
        gap=second-first
        if gap<=10:continue
        left=first-gap/2;right=(first+second)/2
        near=[(yy,ws) for yy,ws in rows[:header_index] if y-yy<55]
        quarter_words=[w for _,ws in near for w in ws if re.fullmatch(r"quarters?",str(w[4]),re.I)]
        if not any(left<=w[0]<=third for w in quarter_words):continue
        if any(re.search(r"year|half|nine|six",str(w[4]),re.I)
               for _,ws in near for w in ws if left<=w[0]<first):continue
        header=" ".join(row_text(ws) for _,ws in rows[:header_index])
        upper=header.upper()
        if "FINANCIAL" not in upper:continue
        scopes={s for s in ("CONSOLIDATED","STANDALONE") if re.search(r"\b"+s+r"\b",upper)}
        if len(scopes)!=1:continue
        scope=next(iter(scopes))
        units=[]
        for regex,unit,divisor in [(r"\b(?:LAKHS?|LACS?)\b","INR_LAKH",100),
                                    (r"\bMILLIONS?\b","INR_MILLION",10),
                                    (r"\bCRORES?\b","INR_CRORE",1)]:
            if re.search(regex,upper):units.append((unit,Decimal(divisor)))
        if len(units)!=1:continue
        unit,divisor=units[0]
        found={}
        for yy,ws in rows[header_index+1:]:
            label=clean_label(row_text([w for w in ws if (w[0]+w[2])/2<left]))
            if not label:continue
            metric=None
            if re.match(r"^(?:total\s+)?(?:revenue|income)\s+from\s+operations\b",label,re.I):metric="OPERATING_REVENUE_QUARTER"
            elif re.match(r"^interest\s+earned\b",label,re.I):metric="INTEREST_EARNED"
            elif re.match(r"^interest\s+expended\b",label,re.I):metric="INTEREST_EXPENDED"
            elif re.match(r"^(?:net\s+)?premiums?\s+earned\b",label,re.I):metric="NET_PREMIUM_EARNED_QUARTER"
            elif re.match(r"^(?:net\s+)?profit(?:\s*\(?\s*/\s*loss\)?)?\s+(?:for\s+the\s+(?:period|quarter)|after\s+tax)\b",label,re.I):metric="NET_PROFIT_QUARTER"
            elif re.search(r"\bdiluted\b",label,re.I) and not re.search(r"capital|paid|weighted",label,re.I):metric="EPS_DILUTED"
            if not metric:continue
            cell=[w for w in ws if left<=(w[0]+w[2])/2<right]
            if not cell:continue # A heading without a same-row financial cell.
            value,original=number(cell)
            # Prove that this is a table row with another value in the next column.
            next_right=(second+third)/2
            number([w for w in ws if right<=(w[0]+w[2])/2<next_right])
            fact={"value":str(value if metric=="EPS_DILUTED" else value/divisor),
                "unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_CRORE",
                "original_unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else unit,
                "original_value":original,"evidence_line":row_text(ws)[:800],
                "page":page_no,"column_index":0,"column_bounds":[left,right],
                "row_y":yy,"column_period":period,"extraction_method":"PDF_WORD_COORDINATES_V3"}
            if metric in found and found[metric]["value"]!=fact["value"]:
                raise ValueError("CONFLICTING_GEOMETRIC_ROWS:"+metric)
            found[metric]=fact
        revenue="NET_INTEREST_INCOME_QUARTER" if bank else "NET_PREMIUM_EARNED_QUARTER" if insurer else "OPERATING_REVENUE_QUARTER"
        if bank and all(k in found for k in ("INTEREST_EARNED","INTEREST_EXPENDED")):
            earned,spent=found["INTEREST_EARNED"],found["INTEREST_EXPENDED"]
            found[revenue]={**earned,"value":str(Decimal(earned["value"])-Decimal(spent["value"])),
                "component_values":[earned["original_value"],spent["original_value"]],
                "evidence_line":(earned["evidence_line"]+" || "+spent["evidence_line"])[:800]}
        required=(revenue,"NET_PROFIT_QUARTER","EPS_DILUTED")
        if all(k in found for k in required):
            return {"scope":scope,"page":page_no,"unit":unit,"first_column_period":period,
                "facts":{k:found[k] for k in required},"header_evidence":header[:2500],
                "parser_revision":"PDF_WORD_COORDINATES_V3"}
    raise ValueError("NO_PROVEN_GEOMETRIC_QUARTER_TABLE")
