"""Physical-column extraction for signed Indian quarterly financial statements.

Numbers are selected by the date column's coordinates, never by numeric tokens
inside the row label. Corrupt numeric cells and unproven columns fail closed.
"""
from datetime import datetime
from decimal import Decimal
import re

DATE=re.compile(r"\b\d{1,2}[./-]\d{1,2}[./-](?:20\d{2}|\d{2})\b|"
    r"\b\d{1,2}[- ](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[- ,]+20\d{2}\b|"
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},?\s*20\d{2}\b|"
    r"\b\d{1,2}\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*20\d{2}\b",re.I)
CELL=re.compile(r"\(?-?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?\)?")

def iso_date(text):
    text=re.sub(r",\s*", " ",text.strip())
    text=re.sub(r"\s+"," ",text)
    for fmt in ("%d.%m.%Y","%d-%m-%Y","%d/%m/%Y","%d.%m.%y","%d-%m-%y",
                "%d/%m/%y","%d %B %Y","%d-%B-%Y","%d %b %Y","%d-%b-%Y",
                "%B %d %Y","%d%b%Y","%d%B%Y","%d %b%Y","%d %B%Y"):
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

MONTH=r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
PARTIAL_DATE=re.compile(r"\b(?:\d{1,2}[- ]"+MONTH+r"|"+MONTH+r" \d{1,2}),?\b",re.I)
UNKNOWN_NAMED_DATE=re.compile(r"\b\d{1,2} [A-Za-z]{3,12} 20\d{2}\b")
SHORT_MONTH_DATE=re.compile(r"\b\d{1,2}-"+MONTH+r"-\d{2}\b",re.I)

def dated_headers(rows):
    """Join explicitly printed date parts only within the same physical column.

    Never infer years or correct OCR glyphs. Ambiguous vertical matches reject.
    Default first-column extraction continues to use the legacy one-row parser.
    """
    complete=[];partial=[]
    for index,(y,words) in enumerate(rows):
        text=row_text(words)
        if re.search(r"financial|statement|results",text,re.I):continue
        spans=[];offset=0
        for w in words:
            spans.append((offset,offset+len(str(w[4])),w));offset+=len(str(w[4]))+1
        occupied=[]
        for match in list(DATE.finditer(text))+list(SHORT_MONTH_DATE.finditer(text)):
            raw=match.group();parsed=iso_date(raw)
            if parsed is None:
                for fmt in ("%d-%b-%y","%d-%B-%y"):
                    try:parsed=datetime.strptime(raw,fmt).date().isoformat();break
                    except ValueError:pass
            if not parsed:continue
            ws=[w for a,b,w in spans if a<match.end() and b>match.start()]
            complete.append((index,y,(parsed,min(w[0] for w in ws),max(w[2] for w in ws))))
            occupied.append((match.start(),match.end()))
        # Retain the physical position of an unreadable, unselected date.
        # Its date stays unknown; it never supplies the requested period.
        for match in UNKNOWN_NAMED_DATE.finditer(text):
            if any(a<match.end() and b>match.start() for a,b in occupied):continue
            ws=[w for a,b,w in spans if a<match.end() and b>match.start()]
            complete.append((index,y,(None,min(w[0] for w in ws),max(w[2] for w in ws))))
            occupied.append((match.start(),match.end()))
        for match in PARTIAL_DATE.finditer(text):
            if any(a<=match.start()<b for a,b in occupied):continue
            ws=[w for a,b,w in spans if a<match.end() and b>match.start()]
            partial.append((index,y,match.group().rstrip(','),min(w[0] for w in ws),max(w[2] for w in ws)))
    # Some statements put only the month above a separate day/year line.
    for index,(y,ws) in enumerate(rows):
        for w in ws:
            month=str(w[4]).strip(",|[]()")
            if not re.fullmatch(MONTH,month,re.I):continue
            # A complete date on this same line must keep its own coordinates.
            if any(i==index and d[1]<=w[0] and d[2]>=w[2] for i,_,d in complete):continue
            matches=[]
            for j,(yy,next_ws) in enumerate(rows):
                if not 2.5<yy-y<=28:continue
                selected=[v for v in next_ws if w[0]-8<=(v[0]+v[2])/2<=w[2]+8]
                printed=row_text(selected).strip(" |[]()")
                m=re.fullmatch(r"(\d{1,2}),?\s*(20\d{2})",printed)
                if not m:continue
                parsed=iso_date(month+" "+m[1]+" "+m[2])
                if parsed:matches.append((j,yy,(parsed,min(w[0],min(v[0] for v in selected)),max(w[2],max(v[2] for v in selected)))))
            if len(matches)==1:complete.append(matches[0])
    for index,y,raw,x0,x2 in partial:
        years=[]
        for j,(yy,ws) in enumerate(rows):
            if not 2.5<yy-y<=28:continue
            for w in ws:
                if re.fullmatch(r"20\d{2}",str(w[4]).strip("|¦[]()")) and x0-8<=(w[0]+w[2])/2<=x2+8:
                    years.append((j,yy,str(w[4]).strip("|¦[]()"),w))
        if len(years)!=1:continue
        j,yy,year,w=years[0];parsed=iso_date(raw+" "+year)
        if parsed:complete.append((j,yy,(parsed,min(x0,w[0]),max(x2,w[2]))))
    yielded=set()
    for index,y,_ in complete:
        candidates=[d for _,yy,d in complete if abs(yy-y)<=28]
        candidates.sort(key=lambda d:(d[1]+d[2])/2)
        merged=[];ambiguous=False
        for d in candidates:
            if merged and abs((d[1]+d[2]-merged[-1][1]-merged[-1][2])/2)<12:
                if d[0]!=merged[-1][0]:ambiguous=True;break
                continue
            merged.append(d)
        if ambiguous or len(merged)<3:continue
        signature=tuple(merged)
        if signature in yielded:continue
        yielded.add(signature)
        last=max(i for i,yy,d in complete if abs(yy-y)<=28)
        yield last,rows[last][0],merged

def number(words):
    text=row_text([w for w in words if str(w[4]) not in ("|","¦")]).strip()
    # Joining split decimal glyphs would invent punctuation. Keep for OCR review.
    if not CELL.fullmatch(text):raise ValueError("CORRUPT_OR_MISSING_NUMERIC_CELL:"+text[:60])
    if text.startswith("(")!=text.endswith(")"):raise ValueError("UNBALANCED_NUMERIC_CELL")
    return Decimal(text.replace(",","").replace("(","-").replace(")","")),text

def clean_label(text):
    # Table ruling glyphs are layout, not part of the metric's name. This
    # never changes the independently extracted numeric cell.
    text=re.sub(r"[|¦\[\]]"," ",text)
    text=re.sub(r"^[^A-Za-z0-9]+","",text)
    text=re.sub(r"^\d{1,2}[.)]?(?=[A-Za-z])","",text)
    return re.sub(r"^\s*(?:(?:\d+|[ivx]+)[.)]?\s+|\(?[a-z]\s*[)|]\s*|-\s*)","",text,flags=re.I).strip()

def extract_page(page,page_no,period,bank=False,insurer=False,allow_comparative=False,scope_hint=None):
    rows=rows_for(page)
    headers=dated_headers(rows) if allow_comparative else ((i,y,date_cells(ws)) for i,(y,ws) in enumerate(rows))
    for header_index,y,dates in headers:
        if len(dates)<3 or dates[0][0] is None:continue
        matching=[i for i,d in enumerate(dates[:3]) if d[0]==period]
        if allow_comparative:
            if len(matching)!=1:continue
            column=matching[0]
        else:
            if dates[0][0]!=period:continue
            column=0
        first=(dates[0][1]+dates[0][2])/2
        second=(dates[1][1]+dates[1][2])/2
        third=(dates[2][1]+dates[2][2])/2
        gap=second-first
        if gap<=10:continue
        first_left=first-gap/2
        left=first_left;right=(first+second)/2
        near=[(yy,ws) for yy,ws in rows[:header_index] if y-yy<(100 if allow_comparative else 55)]
        quarter_words=[w for _,ws in near for w in ws if re.fullmatch(r"quarters?",str(w[4]),re.I)]
        if allow_comparative:
            group_right=third+(third-second)/2
            # Financial-page titles often say "quarter and year ended".
            # Only actual column-group headings prove quarter/annual scope.
            group_near=[(yy,ws) for yy,ws in near if not re.search(r"financial|statements?|results",row_text(ws),re.I)]
            group_quarters=[w for _,ws in group_near for w in ws if re.fullmatch(r"(?:quarters?|qtrs?)(?:ended)?",str(w[4]).strip("‘’\""),re.I)]
            three_months=[]
            for _,ws in group_near:
                for a,b in zip(ws,ws[1:]):
                    if re.fullmatch(r"3|three",str(a[4]),re.I) and re.fullmatch(r"months?",str(b[4]),re.I) and 0<=b[0]-a[2]<20:
                        three_months.append(a)
            if not any(first_left<=(w[0]+w[2])/2<=group_right for w in group_quarters+three_months):continue
            if any(re.fullmatch(r"years?(?:ended|[-‑–]?to[-‑–]?date)?|annual|ytd|half(?:[-‑–]?year)?|nine|six",str(w[4]),re.I)
                   for _,ws in group_near for w in ws if first_left<=(w[0]+w[2])/2<=group_right):continue
            centers=[(d[1]+d[2])/2 for d in dates]
            center=centers[column]
            left=(centers[column-1]+center)/2 if column else first_left
            right=(center+centers[column+1])/2 if column+1<len(centers) else center+(center-centers[column-1])/2
        else:
            if not any(left<=w[0]<=third for w in quarter_words):continue
            if any(re.search(r"year|half|nine|six",str(w[4]),re.I)
                   for _,ws in near for w in ws if left<=w[0]<first):continue
        header=" ".join(row_text(ws) for _,ws in rows[:header_index])
        upper=header.upper()
        if "FINANCIAL" not in upper:continue
        scope_header=upper
        if allow_comparative:
            titles=[]
            for i,(yy,ws) in enumerate(rows[:header_index]):
                if y-yy>180 or not re.search(r"\bfinancial\b",row_text(ws),re.I):continue
                title=" ".join(row_text(r[1]) for r in rows[max(0,i-1):min(header_index,i+2)])
                if len({s for s in ("CONSOLIDATED","STANDALONE") if re.search(r"\b"+s+r"\b",title,re.I)})==1:titles.append(title)
            if not titles and scope_hint in ("STANDALONE","CONSOLIDATED"):
                titles=[row_text(ws) for yy,ws in rows[:header_index] if y-yy<180 and re.search(r"\bfinancial\b",row_text(ws),re.I)]
            if not titles:continue
            scope_header=titles[-1].upper()
        scopes={s for s in ("CONSOLIDATED","STANDALONE") if re.search(r"\b"+s+r"\b",scope_header)}
        scope_hint_used=False
        if not scopes and allow_comparative and scope_hint in ("STANDALONE","CONSOLIDATED"):
            scopes={scope_hint};scope_hint_used=True
        if len(scopes)!=1:continue
        scope=next(iter(scopes))
        if scope_hint is not None and scope!=scope_hint:continue
        units=[]
        for regex,unit,divisor in [(r"\b(?:LAKHS?|LACS?)\b","INR_LAKH",100),
                                    (r"\bMILLIONS?\b","INR_MILLION",10),
                                    (r"\bCRORES?\b","INR_CRORE",1)]:
            unit_header=(" ".join(row_text(ws) for yy,ws in rows[:header_index] if y-yy<180).upper() if allow_comparative else upper)
            if re.search(regex,unit_header):units.append((unit,Decimal(divisor)))
        if allow_comparative and not units and re.search(r"\b(?:INR|Rs[.,]?)\s+(?:in\s+)?Mn\b",unit_header,re.I):
            units.append(("INR_MILLION",Decimal(10)))
        if len(units)!=1:continue
        unit,divisor=units[0]
        found={}
        for yy,ws in rows[header_index+1:]:
            label=clean_label(row_text([w for w in ws if (w[0]+w[2])/2<(first_left if allow_comparative else left)]))
            if not label:continue
            metric=None
            if re.match(r"^(?:total\s+)?(?:revenue|income)\s+from\s+operations\b",label,re.I):metric="OPERATING_REVENUE_QUARTER"
            elif re.match(r"^interest\s+earned\b",label,re.I):metric="INTEREST_EARNED"
            elif re.match(r"^interest\s+expended\b",label,re.I):metric="INTEREST_EXPENDED"
            elif re.match(r"^(?:net\s+)?premiums?\s+earned\b",label,re.I):metric="NET_PREMIUM_EARNED_QUARTER"
            elif re.match(r"^profit\s*(?:/\s*\(?loss\)?|\(loss\))?\s+before\s+tax\b",label,re.I):metric="PROFIT_BEFORE_TAX"
            elif allow_comparative and bank and re.match(r"^profit\s+from\s+ordinary\s+activities\s+before\s+tax\b",label,re.I):metric="PROFIT_BEFORE_TAX"
            elif re.match(r"^(?:total\s+)?tax\s+expenses?\b",label,re.I):metric="TAX_EXPENSE"
            elif re.match(r"^current\s+tax\b",label,re.I):metric="CURRENT_TAX"
            elif re.match(r"^deferred\s+tax\b",label,re.I):metric="DEFERRED_TAX"
            elif allow_comparative and re.match(r"^tax\s+(?:relating to|in respect of)\s+earlier\s+years?\b",label,re.I):metric="TAX_EARLIER_YEARS"
            elif re.match(r"^(?:net\s+)?profit(?:\s*\(?\s*/\s*loss\)?)?\s+(?:for\s+the\s+(?:period|quarter)|after\s+tax)\b",label,re.I):metric="NET_PROFIT_QUARTER"
            elif allow_comparative and re.match(r"^(?:net\s+)?profit\s*/\s*\(?loss\)?\s+(?:for\s+the\s+(?:period|quarter|year)|after\s+tax)\b",label,re.I):metric="NET_PROFIT_QUARTER"
            elif re.search(r"\bdiluted\b",label,re.I) and not re.search(r"capital|paid|weighted",label,re.I):metric="EPS_DILUTED"
            if not metric:continue
            if allow_comparative and metric in ("NET_PROFIT_QUARTER","PROFIT_BEFORE_TAX","TAX_EXPENSE","CURRENT_TAX","DEFERRED_TAX","TAX_EARLIER_YEARS","EPS_DILUTED") and re.search(r"continuing|discontinued",label,re.I):continue
            if allow_comparative and metric=="NET_PROFIT_QUARTER" and re.search(r"attributable|owners|non[ -]?controlling|before\s+tax",label,re.I):continue
            if allow_comparative and metric=="EPS_DILUTED" and re.search(r"adjusted|cash|normali[sz]ed|before extraordinary",label,re.I):continue
            cell=[w for w in ws if left<=(w[0]+w[2])/2<right]
            if not cell:continue # A heading without a same-row financial cell.
            value,original=number(cell)
            # Prove that this is a table row with another value in the next column.
            if allow_comparative:
                other=1 if column==0 else column-1
                other_left=(centers[other-1]+centers[other])/2 if other else first_left
                other_right=(centers[other]+centers[other+1])/2
                number([w for w in ws if other_left<=(w[0]+w[2])/2<other_right])
            else:
                next_right=(second+third)/2
                number([w for w in ws if right<=(w[0]+w[2])/2<next_right])
            fact={"value":str(value if metric=="EPS_DILUTED" else value/divisor),
                "unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_CRORE",
                "original_unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else unit,
                "original_value":original,"evidence_line":row_text(ws)[:800],
                "page":page_no,"column_index":column,"column_bounds":[left,right],
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
            arithmetic=None
            if "PROFIT_BEFORE_TAX" in found:
                tax=(Decimal(found["TAX_EXPENSE"]["value"]) if "TAX_EXPENSE" in found else
                     Decimal(found["CURRENT_TAX"]["value"])+Decimal(found["DEFERRED_TAX"]["value"])+(Decimal(found["TAX_EARLIER_YEARS"]["value"]) if "TAX_EARLIER_YEARS" in found else Decimal(0))
                     if "CURRENT_TAX" in found and "DEFERRED_TAX" in found else None)
                if tax is not None:
                    difference=Decimal(found["PROFIT_BEFORE_TAX"]["value"])-tax-Decimal(found["NET_PROFIT_QUARTER"]["value"])
                    if abs(difference)>Decimal("0.02")/divisor:
                        raise ValueError("PROFIT_TAX_RECONCILIATION_FAILED")
                    arithmetic={"contract":"PBT_MINUS_TAX_EQUALS_PAT","difference_crore":str(difference),
                        "pbt":found["PROFIT_BEFORE_TAX"],"tax_crore":str(tax)}
            result={"scope":scope,"page":page_no,"unit":unit,"first_column_period":dates[0][0],
                "facts":{k:found[k] for k in required},"header_evidence":header[:2500],
                "arithmetic_validation":arithmetic,
                "parser_revision":"PDF_WORD_COORDINATES_V3"}
            if allow_comparative:result.update(parser_revision="PDF_WORD_COORDINATES_DATED_COLUMN_V1",selected_column_period=period,column_index=column,header_periods=[d[0] for d in dates[:3]],scope_hint_used=scope_hint_used)
            return result
    raise ValueError("NO_PROVEN_GEOMETRIC_QUARTER_TABLE")

