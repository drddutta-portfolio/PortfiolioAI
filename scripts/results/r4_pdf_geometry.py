"""Physical-column extraction for signed Indian quarterly financial statements.

Numbers are selected by the date column's coordinates, never by numeric tokens
inside the row label. Corrupt numeric cells and unproven columns fail closed.
"""
from datetime import datetime
from decimal import Decimal
import re

DAY=r'\d{1,2}(?:st|nd|rd|th)?'
DATE=re.compile(r"\b\d{1,2}[./-]\d{1,2}[./-](?:20\d{2}|\d{2})\b|"
    r"\b"+DAY+r"[- ](?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[- ,]+20\d{2}\b|"
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December) "+DAY+r",?\s*20\d{2}\b|"
    r"\b"+DAY+r"\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*20\d{2}\b",re.I)
CELL=re.compile(r"\(?-?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d+)?\)?")

def iso_date(text,named_abbreviations=False,compact_named_dates=False):
    if named_abbreviations:text=re.sub(r'\bSept\b','Sep',text,flags=re.I)
    text=re.sub(r'(?<=\d)(?:st|nd|rd|th)(?=\s|[-,./]|$|'+MONTH+r')','',text,flags=re.I)
    text=re.sub(r",\s*", " ",text.strip())
    text=re.sub(r"\s+"," ",text)
    formats=("%d.%m.%Y","%d-%m-%Y","%d/%m/%Y","%d.%m.%y","%d-%m-%y",
                "%d/%m/%y","%d %B %Y","%d-%B-%Y","%d %b %Y","%d-%b-%Y",
                "%B %d %Y","%d%b%Y","%d%B%Y","%d %b%Y","%d %B%Y","%d-%b-%y","%d-%B-%y")
    if named_abbreviations:formats+=("%b %d %Y",)
    if compact_named_dates:formats+=("%b%d%Y","%B%d%Y","%b %d%Y","%B %d%Y","%b%d %Y","%B%d %Y")
    for fmt in formats:
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
PARTIAL_DATE=re.compile(r"\b(?:"+DAY+r"[- ]"+MONTH+r"|"+MONTH+r" "+DAY+r"),?\b",re.I)
UNKNOWN_NAMED_DATE=re.compile(r"\b"+DAY+r" [A-Za-z]{3,12} 20\d{2}\b",re.I)
SHORT_MONTH_DATE=re.compile(r"\b"+DAY+r"-"+MONTH+r"-\d{2}\b",re.I)
EXTENDED_MONTH=MONTH.replace('Sep(?:tember)?','Sep(?:t(?:ember)?)?')
EXTENDED_DATE=re.compile(DATE.pattern+r'|\b'+EXTENDED_MONTH+r'\s+'+DAY+r',?\s+20\d{2}\b|\b'+DAY+r'[- ]'+EXTENDED_MONTH+r'[- ,]+20\d{2}\b',re.I)
EXTENDED_SHORT_DATE=re.compile(r'\b'+DAY+r'-'+EXTENDED_MONTH+r'-\d{2}\b',re.I)
EXTENDED_PARTIAL_DATE=re.compile(r'\b(?:'+DAY+r'[- ]'+EXTENDED_MONTH+r'|'+EXTENDED_MONTH+r' '+DAY+r'),?\b',re.I)
EXTENDED_UNKNOWN_DATE=re.compile(r'\b'+DAY+r' [A-Za-z]{3,12} 20[0-9A-Za-z]{2}\b|\b[A-Za-z]{3,12} '+DAY+r',?\s+20[0-9A-Za-z]{2}\b',re.I)
COMPACT_DATE=re.compile(EXTENDED_DATE.pattern+r'|\b'+EXTENDED_MONTH+r'\s*'+DAY+r',?\s*20\d{2}\b|\b'+DAY+r'\s*'+EXTENDED_MONTH+r'\s*20\d{2}\b',re.I)
COMPACT_UNKNOWN_DATE=re.compile(EXTENDED_UNKNOWN_DATE.pattern+r'|\b'+EXTENDED_MONTH+r'\s*[0-9A-Za-z]{1,2}\s*20[0-9A-Za-z]{2}\b|\b[0-9A-Za-z]{1,2}\s*'+EXTENDED_MONTH+r'\s*20[0-9A-Za-z]{2}\b',re.I)

def dated_headers(rows,named_abbreviations=False,compact_named_dates=False,footnoted_quarter_headers=False,initial_issuer_layout=False):
    """Join explicitly printed date parts only within the same physical column.

    Never infer years or correct OCR glyphs. Ambiguous vertical matches reject.
    Default first-column extraction continues to use the legacy one-row parser.
    """
    complete=[];partial=[]
    date_pattern=COMPACT_DATE if compact_named_dates else EXTENDED_DATE if named_abbreviations else DATE
    short_pattern=EXTENDED_SHORT_DATE if named_abbreviations else SHORT_MONTH_DATE
    partial_pattern=EXTENDED_PARTIAL_DATE if named_abbreviations else PARTIAL_DATE
    unknown_pattern=COMPACT_UNKNOWN_DATE if compact_named_dates else EXTENDED_UNKNOWN_DATE if named_abbreviations else UNKNOWN_NAMED_DATE
    for index,(y,words) in enumerate(rows):
        text=row_text(words)
        if re.search(r"financial|statement|results",text,re.I):continue
        spans=[];offset=0
        for w in words:
            spans.append((offset,offset+len(str(w[4])),w));offset+=len(str(w[4]))+1
        occupied=[]
        # PDF text layers may split a printed numeric date into adjacent glyph
        # runs. Rejoin only tightly adjacent runs, retaining every printed digit
        # and separator. This also prevents a split four-digit year being read
        # as a different two-digit year or shifting the physical columns.
        used=set()
        for start in range(len(words)):
            if start in used:continue
            joined='';parts=[]
            for stop in range(start,min(start+7,len(words))):
                word=words[stop];token=str(word[4])
                if not re.fullmatch(r'[0-9./-]+',token):break
                if parts and not -0.5<=word[0]-parts[-1][2]<=2.0:break
                joined+=token;parts.append(word)
                if len(joined)>10:break
                if len(parts)>1 and re.fullmatch(r'\d{1,2}[./-]\d{1,2}[./-]20\d{2}',joined):
                    parsed=iso_date(joined)
                    if parsed:
                        complete.append((index,y,(parsed,min(w[0] for w in parts),max(w[2] for w in parts))))
                        occupied.append((spans[start][0],spans[stop][1]));used.update(range(start,stop+1))
                    break
        for match in list(date_pattern.finditer(text))+list(short_pattern.finditer(text)):
            if any(a<match.end() and b>match.start() for a,b in occupied):continue
            raw=match.group();parsed=iso_date(raw,named_abbreviations,compact_named_dates)
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
        for match in unknown_pattern.finditer(text):
            if any(a<match.end() and b>match.start() for a,b in occupied):continue
            ws=[w for a,b,w in spans if a<match.end() and b>match.start()]
            complete.append((index,y,(None,min(w[0] for w in ws),max(w[2] for w in ws))))
            occupied.append((match.start(),match.end()))
        for match in partial_pattern.finditer(text):
            if any(a<=match.start()<b for a,b in occupied):continue
            ws=[w for a,b,w in spans if a<match.end() and b>match.start()]
            partial.append((index,y,match.group().rstrip(','),min(w[0] for w in ws),max(w[2] for w in ws)))
    # Some statements put only the month above a separate day/year line.
    for index,(y,ws) in enumerate(rows):
        for w in ws:
            month=str(w[4]).strip(",|[]()")
            if not re.fullmatch(EXTENDED_MONTH if named_abbreviations else MONTH,month,re.I):continue
            # A complete date on this same line must keep its own coordinates.
            if any(i==index and d[1]<=w[0] and d[2]>=w[2] for i,_,d in complete):continue
            matches=[]
            for j,(yy,next_ws) in enumerate(rows):
                if not 2.5<yy-y<=28:continue
                selected=[v for v in next_ws if w[0]-8<=(v[0]+v[2])/2<=w[2]+8]
                printed=row_text(selected).strip(" |[]()")
                m=re.fullmatch(r"(\d{1,2})(?:st|nd|rd|th)?,?\s*(20\d{2})",printed,re.I)
                if not m:continue
                parsed=iso_date(month+" "+m[1]+" "+m[2],named_abbreviations,compact_named_dates)
                if parsed:matches.append((j,yy,(parsed,min(w[0],min(v[0] for v in selected)),max(w[2],max(v[2] for v in selected)))))
            if len(matches)==1:complete.append(matches[0])
    for index,y,raw,x0,x2 in partial:
        years=[]
        for j,(yy,ws) in enumerate(rows):
            if not 2.5<yy-y<=28:continue
            for w in ws:
                year_token=str(w[4]).strip("|¦[]()")
                marker_pattern=r"20\d{2}[*•†‡]" if initial_issuer_layout else r"20\d{2}\*"
                if footnoted_quarter_headers and re.fullmatch(marker_pattern,year_token):year_token=year_token[:-1]
                if re.fullmatch(r"20\d{2}",year_token) and x0-8<=(w[0]+w[2])/2<=x2+8:
                    years.append((j,yy,year_token,w))
        if len(years)!=1:continue
        j,yy,year,w=years[0];parsed=iso_date(raw+" "+year,named_abbreviations,compact_named_dates)
        if parsed:complete.append((j,yy,(parsed,min(x0,w[0]),max(x2,w[2]))))
    yielded=set()
    for index,y,_ in complete:
        candidates=[d for _,yy,d in complete if abs(yy-y)<=28]
        candidates.sort(key=lambda d:(d[1]+d[2])/2)
        merged=[];ambiguous=False
        for d in candidates:
            if merged and abs((d[1]+d[2]-merged[-1][1]-merged[-1][2])/2)<12:
                if d[0]!=merged[-1][0]:
                    # Unreadable cumulative-period dates cannot supply a quarter.
                    # The first three dated positions must remain unambiguous.
                    if not footnoted_quarter_headers or len(merged)<=3:ambiguous=True;break
                    merged[-1]=(None,min(d[1],merged[-1][1]),max(d[2],merged[-1][2]))
                continue
            merged.append(d)
        if ambiguous or len(merged)<3:continue
        signature=tuple(merged)
        if signature in yielded:continue
        yielded.add(signature)
        last=max(i for i,yy,d in complete if abs(yy-y)<=28)
        yield last,rows[last][0],merged

def number(words,allow_annualisation_marker=False,edge_vertical_rules=False):
    words=[w for w in words if str(w[4]) not in ("|","¦","*","†","‡")]
    text=row_text(words).strip()
    if edge_vertical_rules:text=text.strip('|¦').strip()
    original=text
    if allow_annualisation_marker and re.fullmatch(r"\(?-?[\d,]+(?:\.\d+)?\)?\*",text):
        text=text[:-1]
    # A printed decimal point may be split into a separate PDF word. Preserve
    # the original text and join only adjacent numeric glyphs within this cell;
    # never supply a missing decimal point or join separated numbers.
    if not CELL.fullmatch(text) and len(words)>1:
        joined=''.join(str(w[4]) for w in words)
        if ('.' in joined and CELL.fullmatch(joined)
            and all(re.fullmatch(r'[0-9,().-]+',str(w[4])) for w in words)
            and all(-0.5<=b[0]-a[2]<=2.0 for a,b in zip(words,words[1:]))):
            text=joined
    if not CELL.fullmatch(text):raise ValueError("CORRUPT_OR_MISSING_NUMERIC_CELL:"+text[:60])
    if text.startswith("(")!=text.endswith(")"):raise ValueError("UNBALANCED_NUMERIC_CELL")
    return Decimal(text.replace(",","").replace("(","-").replace(")","")),original

def clean_label(text):
    # Table ruling glyphs are layout, not part of the metric's name. This
    # never changes the independently extracted numeric cell.
    text=re.sub(r"[|¦\[\]]"," ",text)
    text=re.sub(r"^[^A-Za-z0-9]+","",text)
    text=re.sub(r"^\d{1,2}[.)]?(?=[A-Za-z])","",text)
    return re.sub(r"^\s*(?:(?:\d+|[ivx]+)[.)]?\s+|\(?[a-z]\s*[)|]\s*|-\s*)","",text,flags=re.I).strip()

def previous_year_quarter_heading(group_rows,centers,index):
    """An explicit corresponding three-month heading is still a quarter.

    Bind the phrase to one physical column. A previous-year label alone,
    a six/nine-month label, or a year-ended label supplies no such proof.
    """
    left=(centers[index-1]+centers[index])/2 if index else centers[0]-(centers[1]-centers[0])/2
    right=(centers[index]+centers[index+1])/2 if index+1<len(centers) else centers[index]+(centers[index]-centers[index-1])/2
    text=' '.join(row_text([w for w in ws if left<=(w[0]+w[2])/2<right]) for _,ws in group_rows)
    text=re.sub(r'[^A-Za-z0-9]+',' ',text).strip()
    return (len(re.findall(r'\byears?\b',text,re.I))==1
        and not re.search(r'\byear\s+ended\b|\b(?:six|nine|6|9|half)\b',text,re.I)
        and bool(re.search(r'\bcorresponding\s+(?:quarter|(?:3|three)\s+months?)\s+ended\s+(?:in\s+)?(?:the\s+)?previous\s+year\b',text,re.I)))

def statutory_profit_loss_title(text):
    return bool(re.search(r'\bstatements?\s+of\s+(?:standalone|consolidated)\s+profit\s+(?:and|&)\s+loss\b',text,re.I))

def statutory_metric_label(text):
    # An unreadable row-number glyph before an explicit table separator is
    # decoration, not part of the financial label. Never turn it into a row
    # reference: printed_rows still comes from the untouched original words.
    metric=r'(?:profit|net|revenue|income|tax|current|deferred|diluted|basic|share|total|interest)\b'
    text=re.sub(r'^\s*(?:(?:[IVXRL1!‘’]\s*){1,4}|\d{1,2}\s*)[|¦\]_.}]+\s*(?='+metric+r')','',text,flags=re.I)
    return clean_label(text)

def statement_layout_label(text,advanced=False):
    # A separated row-number glyph is decoration, never a row reference.
    if advanced:
        metric=r'(?:profit|net|revenue|income|tax|current|deferred|diluted|basic|share|total|interest)\b'
        text=re.sub(r'^\s*(?:(?:[IVXRL1!‘’]\s*){1,4}|\d{1,2}\s*)(?:[|¦\]_.}]\s*)+(?='+metric+r')','',text,flags=re.I)
    text=re.sub(r'^\s*[|¦\[\]]*\s*J\s*[|¦\[\]]\s*(?=Revenue\s*from\s*operations\b)','',text,flags=re.I)
    text=statutory_metric_label(text)
    # OCR may join the words of this exact label; no financial token changes.
    text=re.sub(r'^(?:revenue\s*from\s*operations)\b','Revenue from operations',text,flags=re.I)
    text=re.sub(r'^profit\s*before\s*tax\b','Profit before tax',text,flags=re.I)
    text=re.sub(r'^profit\s*for\s*the\s*(period|quarter|year)\b',lambda m:'Profit for the '+m[1],text,flags=re.I)
    text=re.sub(r'\b(period|year)\s*from\s*(continuing|discontinued)\s*operations\b',lambda m:m[1]+' from '+m[2]+' operations',text,flags=re.I)
    text=re.sub(r'\b(period|year)\s*from\b',lambda m:m[1]+' from',text,flags=re.I)
    return re.sub(r'\bfrom\s*(continuing|discontinued)\s*operations\b',lambda m:'from '+m[1]+' operations',text,flags=re.I)

def align_statement_rows(rows,centers,first_left,quarter_columns,advanced=False):
    """Join an overlapping label/amount line split by publisher font boxes.

    Only a bare numeric preceding row can join a recognized metric label.
    Column collisions, non-overlapping glyphs and distant rows stay separate.
    No character, amount, column or printed coordinate is changed.
    """
    output=[];evidence={}
    numeric=lambda w:bool(re.fullmatch(r'[0-9.,()\-–—|¦_=]+',str(w[4])))
    columns=lambda ws:{min(range(len(centers)),key=lambda i:abs(centers[i]-(w[0]+w[2])/2))
                       for w in ws if (w[0]+w[2])/2>=first_left and re.search(r'\d',str(w[4]))}
    for y,words in rows:
        label_words=[w for w in words if (w[0]+w[2])/2<first_left]
        label=statement_layout_label(row_text(label_words),advanced)
        recognized=bool(re.match(r'^(?:revenue\s+from\s+operations|interest\s+(?:earned|expended)|(?:net\s+)?premiums?\s+earned|(?:net\s+)?profit|(?:\(?loss\)?\s*/\s*)profit|(?:total\s+)?tax\s+expense|current\s+tax|deferred\s+tax|diluted|basic)\b',label,re.I))
        if output and recognized and label_words:
            prior_y,prior=output[-1]
            prior_left=[w for w in prior if (w[0]+w[2])/2<first_left and str(w[4]).strip('|¦_=')]
            prior_values=[w for w in prior if (w[0]+w[2])/2>=first_left]
            previous_columns=columns(prior);current_columns=columns(words)
            overlap=(min(max(w[3] for w in label_words),max((w[3] for w in prior_values),default=0))
                     -max(min(w[1] for w in label_words),min((w[1] for w in prior_values),default=0)))
            if (2.5<y-prior_y<=4.5 and not prior_left and prior_values and all(numeric(w) for w in prior_values)
                and overlap>=.5 and not previous_columns.intersection(current_columns)
                and any(c<quarter_columns for c in previous_columns)
                and len({c for c in previous_columns|current_columns if c<quarter_columns})>=2):
                output.pop();words=sorted(prior+words,key=lambda w:w[0])
                evidence[y]={'contract':'OVERLAPPING_ORIGINAL_LABEL_AND_DISJOINT_NUMERIC_ROWS_V1',
                    'original_numeric_row_y':prior_y,'original_label_row_y':y,'glyph_overlap_points':overlap,
                    'amount_characters_changed':False}
        output.append((y,words))
    return output,evidence

def extract_page(page,page_no,period,bank=False,insurer=False,allow_comparative=False,scope_hint=None,required_metrics=None,statement_layout=False,advanced_statement_layout=False,footnoted_quarter_headers=False,initial_issuer_layout=False):
    if initial_issuer_layout and not footnoted_quarter_headers:raise ValueError("INITIAL_LAYOUT_REQUIRES_FOOTNOTED_HEADERS")
    if footnoted_quarter_headers and not advanced_statement_layout:raise ValueError("FOOTNOTE_HEADERS_REQUIRE_V6_LAYOUT")
    if advanced_statement_layout and not statement_layout:raise ValueError('ADVANCED_LAYOUT_REQUIRES_EXPLICIT_STATEMENT_LAYOUT')
    if statement_layout and not allow_comparative:raise ValueError('STATEMENT_LAYOUT_REQUIRES_DATED_COLUMNS')
    normalize=(lambda text:statement_layout_label(text,advanced_statement_layout)) if statement_layout else clean_label
    if required_metrics is not None and (not allow_comparative or tuple(required_metrics) not in (
        ('OPERATING_REVENUE_QUARTER','NET_PROFIT_QUARTER'),('EPS_DILUTED',))):
        raise ValueError('UNAPPROVED_CONTINUATION_METRIC_SET')
    rows=rows_for(page)
    annualisation_marker=any(re.fullmatch(r"\*\s*not\s+annuali[sz]ed[.]?",row_text(ws).strip(),re.I) for _,ws in rows)
    # A successful page must contain the same explicit revenue row used below.
    # Reject covers/notes before the expensive split-date geometry search.
    if allow_comparative:
        revenue_pattern=(r"^interest\s+earned\b" if bank else
                         r"^(?:net\s+)?premiums?\s+earned\b" if insurer else
                         r"^(?:total\s+)?(?:revenue|income)\s+from\s+operations\b")
        if required_metrics!=('EPS_DILUTED',) and not any(re.match(revenue_pattern,normalize(row_text(ws)),re.I) for _,ws in rows):
            raise ValueError("NO_PROVEN_GEOMETRIC_QUARTER_TABLE")
    headers=dated_headers(rows,named_abbreviations=statement_layout,compact_named_dates=advanced_statement_layout,footnoted_quarter_headers=footnoted_quarter_headers,initial_issuer_layout=initial_issuer_layout) if allow_comparative else ((i,y,date_cells(ws)) for i,(y,ws) in enumerate(rows))
    for header_index,y,dates in headers:
        if len(dates)<3 or dates[0][0] is None:continue
        if not allow_comparative:
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
            centers=[(d[1]+d[2])/2 for d in dates]
            group_right=third+(third-second)/2
            # Financial-page titles often say "quarter and year ended".
            # Only actual column-group headings prove quarter/annual scope.
            title_continuations=set()
            for i,(yy,ws) in enumerate(rows[:header_index]):
                if not i or not ws or not re.match(r'^and\s+(?:year|nine|six|half)\b',row_text(ws),re.I):continue
                prior_y,prior_words=rows[i-1]
                prior_text=row_text(prior_words)
                # A slightly skewed title may be split into coordinate rows:
                # "Financial results for the quarter" / "and year ended".
                # Prove that it continues the SAME printed title line, rather
                # than discarding a separate annual column-group heading.
                if (0<yy-prior_y<=5 and prior_words
                    and re.search(r'\bfinancial\b',prior_text,re.I)
                    and re.sub(r'\s+','',prior_text).lower().endswith('quarter')
                    and 0<=ws[0][0]-prior_words[-1][2]<=20):title_continuations.add(yy)
            group_near=[(yy,ws) for yy,ws in near if yy not in title_continuations and not re.search(r"financial|statements?|results",row_text(ws),re.I)]
            group_quarters=[w for _,ws in group_near for w in ws if re.fullmatch(r"(?:quarters?|qtrs?)(?:ended)?",str(w[4]).strip("‘’\""),re.I)]
            three_months=[]
            for _,ws in group_near:
                for a,b in zip(ws,ws[1:]):
                    if re.fullmatch(r"3|three",str(a[4]),re.I) and re.fullmatch(r"months?",str(b[4]),re.I) and 0<=b[0]-a[2]<20:
                        three_months.append(a)
            if not any(first_left<=(w[0]+w[2])/2<=group_right for w in group_quarters+three_months):continue
            cumulative=[]
            for _,ws in group_near:
                for w in ws:
                    x=(w[0]+w[2])/2
                    if not first_left<=x<=group_right or not re.fullmatch(r"years?(?:ended|[-‑–]?to[-‑–]?date)?|annual|ytd|half(?:[-‑–]?year)?|nine|six",str(w[4]),re.I):continue
                    index=min(range(3),key=lambda i:abs(centers[i]-x))
                    if re.fullmatch(r'year',str(w[4]),re.I) and previous_year_quarter_heading(group_near,centers,index):continue
                    cumulative.append(w)
            quarter_columns=3
            if cumulative:
                # Some statements print two quarter columns followed by YTD
                # or annual columns. Their explicit separate group headings
                # prove only the first two columns as quarters.
                boundary=(second+third)/2
                quarter_labels=group_quarters+three_months
                if (not any(first_left<=(w[0]+w[2])/2<boundary for w in quarter_labels)
                    or any((w[0]+w[2])/2<boundary for w in cumulative)
                    or any(boundary<=(w[0]+w[2])/2<=group_right for w in quarter_labels)):
                    continue
                quarter_columns=2
            matching=[i for i,d in enumerate(dates[:quarter_columns]) if d[0]==period]
            if len(matching)!=1:continue
            column=matching[0]
            center=centers[column]
            left=(centers[column-1]+center)/2 if column else first_left
            right=(center+centers[column+1])/2 if column+1<len(centers) else center+(center-centers[column-1])/2
        else:
            if not any(left<=w[0]<=third for w in quarter_words):continue
            if any(re.search(r"year|half|nine|six",str(w[4]),re.I)
                   for _,ws in near for w in ws if left<=w[0]<first):continue
        header=" ".join(row_text(ws) for _,ws in rows[:header_index])
        upper=header.upper()
        statutory_title_used='FINANCIAL' not in upper and allow_comparative and statutory_profit_loss_title(header)
        if 'FINANCIAL' not in upper and not statutory_title_used:continue
        scope_header=upper
        if allow_comparative:
            titles=[]
            for i,(yy,ws) in enumerate(rows[:header_index]):
                if y-yy>180 or not (re.search(r"\bfinancial\b",row_text(ws),re.I) or statutory_profit_loss_title(row_text(ws))):continue
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
        unit_rows=rows[:header_index]
        if allow_comparative:
            # A unit caption may sit below the dates but above the first amount.
            # Stop at the first financial row; never borrow a unit from a note.
            for yy,ws in rows[header_index:]:
                if yy-y>35 or re.match(revenue_pattern,normalize(row_text(ws)),re.I):break
                unit_rows=unit_rows+[(yy,ws)]
        for regex,unit,divisor in [(r"\b(?:LAKHS?|LACS?)\b","INR_LAKH",100),
                                    (r"\bMILLIONS?\b","INR_MILLION",10),
                                    ((r"\b(?:IN)?CRORES?\b" if initial_issuer_layout else r"\bCRORES?\b"),"INR_CRORE",1)]:
            unit_header=(" ".join(row_text(ws) for yy,ws in unit_rows if y-yy<180).upper() if allow_comparative else upper)
            if re.search(regex,unit_header):units.append((unit,Decimal(divisor)))
        if allow_comparative and not units and re.search(r"\b(?:INR|Rs[.,]?)(?:\s+(?:INR|Rs[.,]?))*\s+(?:in\s+)*Mn\b",unit_header,re.I):
            units.append(("INR_MILLION",Decimal(10)))
        if len(units)!=1:continue
        unit,divisor=units[0]
        found={};printed_rows={};last_metric=None;unavailable_tax_components=set();auxiliary_tax_errors=[];eps_context="";eps_group_started=False;layout_components_seen=set()
        table_rows=rows[header_index+1:]
        alignment={}
        if statement_layout:table_rows,alignment=align_statement_rows(table_rows,centers,first_left,quarter_columns,advanced_statement_layout)
        for row_index,(yy,ws) in enumerate(table_rows):
            printed_label=row_text([w for w in ws if (w[0]+w[2])/2<(first_left if allow_comparative else left)])
            label=normalize(printed_label) if statement_layout else statutory_metric_label(printed_label) if statutory_title_used else clean_label(printed_label)
            row_match=re.match(r'^\s*(\d{1,2}|[IVXivx]{1,5})[.)]?\s+',printed_label)
            row_code=row_match[1].upper() if row_match else None
            preceding_evidence=''
            if statement_layout and row_index+1<len(table_rows):
                next_y,next_words=table_rows[row_index+1]
                next_label=normalize(row_text([w for w in next_words if (w[0]+w[2])/2<first_left]))
                if (2.5<next_y-yy<=16 and not any((w[0]+w[2])/2>=first_left and str(w[4]).strip('|¦_') for w in next_words)
                    and ((re.search(r'\bfrom\s+continuing$',label,re.I) and re.match(r'^operations\b',next_label,re.I))
                         or (re.search(r'\bfrom$',label,re.I) and re.match(r'^discontinued\s+operations\b',next_label,re.I)))):
                    label+=' '+next_label;preceding_evidence=row_text(next_words)+' || '
            if (statutory_title_used and row_index and row_index+1<len(table_rows)
                and re.fullmatch(r'[IVXivx]{1,5}',printed_label.strip())):
                prior_y,prior_words=table_rows[row_index-1]
                next_y,next_words=table_rows[row_index+1]
                prior_label=statutory_metric_label(row_text([w for w in prior_words if (w[0]+w[2])/2<first_left]))
                next_label=statutory_metric_label(row_text([w for w in next_words if (w[0]+w[2])/2<first_left]))
                if (2.5<yy-prior_y<=6 and 2.5<next_y-yy<=10
                    and re.fullmatch(r'profit(?:\s*/\s*\(?loss\)?)?\s+before\s+tax\s+after\s+exceptional',prior_label,re.I)
                    and re.fullmatch(r'items\s*\([IVXivx]+\s*[+-]\s*[IVXivx]+\)\s*[_|]*',next_label)
                    and not any((w[0]+w[2])/2>=first_left and str(w[4]).strip('|¦_') for w in prior_words+next_words)):
                    label=prior_label+' '+next_label
                    row_code=printed_label.strip().upper()
                    preceding_evidence=row_text(prior_words)+' || '+row_text(next_words)+' || '
            if statutory_title_used and row_index and re.match(r'^items\s*\(',label,re.I):
                prior_y,prior_words=table_rows[row_index-1]
                prior_printed=row_text([w for w in prior_words if (w[0]+w[2])/2<first_left])
                prior_label=statutory_metric_label(prior_printed)
                if (2.5<yy-prior_y<=16
                    and re.match(r'^profit(?:\s*/\s*\(?loss\)?)?\s+before\s+tax\s+after\s+exceptional$',prior_label,re.I)
                    and not any((w[0]+w[2])/2>=first_left for w in prior_words)):
                    label=prior_label+' '+label;preceding_evidence=row_text(prior_words)+' || '
            # Equity-accounted associate earnings may print their amount on
            # a separate "net of tax" line. Bind only this explicit nearby
            # label-only continuation; never borrow another financial row.
            if allow_comparative and row_index and re.fullmatch(r'net\s+of\s+tax[.,]?',label,re.I):
                previous_y,previous_words=table_rows[row_index-1]
                previous_printed=row_text([w for w in previous_words if (w[0]+w[2])/2<first_left])
                previous_label=clean_label(previous_printed)
                if (2.5<yy-previous_y<=16
                    and re.match(r'^share\s+of\s+(?:net\s+)?profit(?:\s*(?:/\s*)?\(?loss\)?)?\s+of\s+associates?\b',previous_label,re.I)
                    and not any((w[0]+w[2])/2>=first_left for w in previous_words)):
                    label=previous_label+' '+label
                    previous_code=re.match(r'^\s*(\d{1,2}|[IVXivx]{1,5})[.)]?\s+',previous_printed)
                    row_code=previous_code[1].upper() if previous_code else None
                    preceding_evidence=row_text(previous_words)+' || '
            # Some bank statements place the figures on the second line of
            # "Diluted EPS (before and after extraordinary / items)". Require
            # that exact continuation, a nearby label-only preceding line,
            # and no intervening financial cell before associating the label.
            if allow_comparative and row_index and re.fullmatch(r'items[.)]*',label,re.I):
                previous_y,previous_words=table_rows[row_index-1]
                previous_label=clean_label(row_text([w for w in previous_words if (w[0]+w[2])/2<first_left]))
                if (2.5<yy-previous_y<=16 and re.match(r'^diluted\s+eps\b',previous_label,re.I)
                    and re.search(r'before\s+and\s+after\s+extraordinary',previous_label,re.I)
                    and not any((w[0]+w[2])/2>=first_left for w in previous_words)):
                    label=previous_label+' '+label
                    preceding_evidence=row_text(previous_words)+' || '
            if not label:continue
            if allow_comparative:
                if re.search(r"\bearnings?\s+per\s+(?:equity\s+)?share\b",label,re.I):
                    eps_context=label;eps_group_started=False
                    # A wrapped qualifier belongs to this heading only until
                    # the first Basic/Diluted row, never to a later subsection.
                    for _,following in table_rows[row_index+1:row_index+4]:
                        following_label=clean_label(row_text([w for w in following if (w[0]+w[2])/2<first_left]))
                        if re.match(r"^(?:basic|diluted)\b",following_label,re.I) or re.search(r"earnings?\s+per",following_label,re.I):break
                        eps_context+=" "+following_label
                elif eps_context and re.match(r"^(?:\(?[ivx]+\)?[.)]?\s*)?(?:before|after)\s+net\s+movement\s+in\s+regulatory\s+deferral\s+balances\b",label,re.I):
                    eps_context=label;eps_group_started=False
                elif eps_context and eps_group_started and re.match(r"^(?:[a-c]\s*[.)]\s*)?(?:from\s+|for\s+)?(?:continuing|discontinued)\b",label,re.I):
                    eps_context=label;eps_group_started=False
                if re.match(r"^(?:basic|diluted)\b",label,re.I):eps_group_started=True
            metric=None
            profit_label=bool(re.match(r'^(?:net\s+)?(?:\(?loss\)?\s*/\s*)?profit(?:\s*/\s*\(?loss\)?)?\s+(?:after\s+tax|for\s+the\s+(?:period|quarter|year))\b',label,re.I))
            if statement_layout and profit_label and re.search(r'\bfrom\s+continuing\s+operations\b',label,re.I):
                metric='CONTINUING_PAT';layout_components_seen.add(metric)
            elif statement_layout and profit_label and re.search(r'\bfrom\s+discontinued\s+operations\b',label,re.I):
                metric='DISCONTINUED_PAT';layout_components_seen.add(metric)
            elif re.match(r"^(?:total\s+)?(?:revenue|income)\s+from\s+operations\b",label,re.I):metric="OPERATING_REVENUE_QUARTER"
            elif re.match(r"^interest\s+earned\b",label,re.I):metric="INTEREST_EARNED"
            elif re.match(r"^interest\s+expended\b",label,re.I):metric="INTEREST_EXPENDED"
            elif re.match(r"^(?:net\s+)?premiums?\s+earned\b",label,re.I):metric="NET_PREMIUM_EARNED_QUARTER"
            elif re.match(r"^profit\s*(?:/\s*\(?loss\)?|\(loss\))?\s+before\s+tax\b",label,re.I):metric="PROFIT_BEFORE_TAX"
            elif allow_comparative and bank and re.match(r"^profit\s+from\s+ordinary\s+activities\s+before\s+tax\b",label,re.I):metric="PROFIT_BEFORE_TAX"
            elif allow_comparative and re.match(r"^share\s+of\s+(?:net\s+)?profit(?:\s*(?:/\s*)?\(?loss\)?)?\s+(?:of|in)\s+(?:associates?|joint\s+ventures?)\b",label,re.I):metric="SHARE_PROFIT_ASSOCIATES"
            elif re.match(r"^(?:total\s+)?tax\s+expenses?\b",label,re.I):metric="TAX_EXPENSE"
            elif allow_comparative and re.match(r"^(?:(?:current|deferred)\s+)?tax(?:\s+expense)?\s+(?:relating to|in respect of)\s+(?:earlier|previous)\s+years?\b",label,re.I):metric="TAX_EARLIER_YEARS"
            elif re.match(r"^current\s+tax\b",label,re.I):metric="CURRENT_TAX"
            elif re.match(r"^deferred\s+tax\b",label,re.I):metric="DEFERRED_TAX"
            elif allow_comparative and re.match(r"^tax\s+(?:relating to|in respect of)\s+earlier\s+years?\b",label,re.I):metric="TAX_EARLIER_YEARS"
            elif re.match(r"^(?:net\s+)?profit(?:\s*\(?\s*/\s*loss\)?|\s*\(loss\))?\s+(?:for\s+the\s+(?:period|quarter)|after\s+tax)\b",label,re.I):metric="NET_PROFIT_QUARTER"
            elif allow_comparative and re.match(r"^(?:(?:net|total)\s+)?profit\s*/\s*\(?loss\)?\s+(?:for\s+the\s+(?:period|quarter|year)|after\s+tax)\b",label,re.I):metric="NET_PROFIT_QUARTER"
            elif allow_comparative and re.match(r'^(?:(?:net\s+)?profit\s+after\s+taxes|total\s+profit\s+for\s+the\s+(?:period|quarter|year))\b',label,re.I):metric='NET_PROFIT_QUARTER'
            elif re.search(r"\bdiluted\b",label,re.I) and not re.search(r"capital|paid|weighted",label,re.I):
                if advanced_statement_layout and not re.match(r'^(?:diluted\b|basic\s*(?:and|&|/)\s*diluted\b|(?:earnings?\s+per\b|eps\b).*\bdiluted\b)',label,re.I):continue
                # An explanatory anti-dilution footnote is not an EPS row,
                # even when its prose crosses the financial column bounds.
                if allow_comparative and re.search(r'\bwill\s+be\s+(?:the\s+)?same\s+as\s+basic\b',label,re.I):continue
                if (allow_comparative and re.search(r'\bfor\s+all\s+periods?\s+except\b',row_text(ws),re.I)
                    and re.search(r'\bnot\s+annuali[sz]ed\b',row_text(ws),re.I)):continue
                metric="EPS_DILUTED"
            if not metric:continue
            context=label+(" "+eps_context if metric=="EPS_DILUTED" else "")
            component=bool(re.search(r"\bcontinuing\b",context,re.I)) != bool(re.search(r"\bdiscontinued\b",context,re.I))
            if allow_comparative and metric in ("NET_PROFIT_QUARTER","PROFIT_BEFORE_TAX","TAX_EXPENSE","CURRENT_TAX","DEFERRED_TAX","TAX_EARLIER_YEARS","EPS_DILUTED") and component:continue
            if allow_comparative and metric in ("NET_PROFIT_QUARTER",'CONTINUING_PAT','DISCONTINUED_PAT') and re.search(r"attributable|owners|non[ -]?controlling|before\s+tax",label,re.I):continue
            if allow_comparative and metric=="EPS_DILUTED" and re.search(r"adjusted|cash|normali[sz]ed|before extraordinary|before\s+net\s+movement\s+in\s+regulatory\s+deferral",context,re.I):continue
            cell=[w for w in ws if left<=(w[0]+w[2])/2<right]
            if not cell:continue # A heading without a same-row financial cell.
            if allow_comparative and metric in ('CURRENT_TAX','DEFERRED_TAX','TAX_EARLIER_YEARS') and row_text(cell).strip() in ('-','—','–'):
                unavailable_tax_components.add(metric)
                continue # An unavailable auxiliary component is not a reported zero.
            annotated_eps=allow_comparative and metric=="EPS_DILUTED" and annualisation_marker
            try:value,original=number(cell,allow_annualisation_marker=annotated_eps,edge_vertical_rules=advanced_statement_layout)
            except ValueError as error:
                if not (allow_comparative and metric in ('CURRENT_TAX','DEFERRED_TAX','TAX_EARLIER_YEARS')):raise
                unavailable_tax_components.add(metric);auxiliary_tax_errors.append((metric,error));continue
            # Prove that this is a table row with another value in the next column.
            if allow_comparative:
                adjacent=1 if column==0 else column-1
                supporting_columns=len(centers) if initial_issuer_layout else quarter_columns
                other_columns=[adjacent]+[i for i in range(supporting_columns) if i not in (column,adjacent)]
                last_error=None
                for other in other_columns:
                    other_left=(centers[other-1]+centers[other])/2 if other else first_left
                    other_right=(centers[other]+centers[other+1])/2 if other+1<len(centers) else centers[other]+(centers[other]-centers[other-1])/2
                    try:
                        number([w for w in ws if other_left<=(w[0]+w[2])/2<other_right],allow_annualisation_marker=annotated_eps,edge_vertical_rules=advanced_statement_layout)
                        break
                    except ValueError as error:last_error=error
                else:
                    if metric in ('CURRENT_TAX','DEFERRED_TAX','TAX_EARLIER_YEARS'):
                        unavailable_tax_components.add(metric);auxiliary_tax_errors.append((metric,last_error));continue
                    raise last_error
            else:
                next_right=(second+third)/2
                number([w for w in ws if right<=(w[0]+w[2])/2<next_right])
            fact={"value":str(value if metric=="EPS_DILUTED" else value/divisor),
                "unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else "INR_CRORE",
                "original_unit":"INR_PER_SHARE" if metric=="EPS_DILUTED" else unit,
                "original_value":original,"evidence_line":(preceding_evidence+row_text(ws))[:800],
                "page":page_no,"column_index":column,"column_bounds":[left,right],
                "row_y":yy,"column_period":period,"extraction_method":"PDF_WORD_COORDINATES_V3"}
            if yy in alignment:fact['row_alignment_evidence']=alignment[yy]
            if advanced_statement_layout and row_text(cell).strip().strip('|¦').strip()!=row_text(cell).strip():
                fact['numeric_ruling_evidence']={'contract':'EDGE_VERTICAL_TABLE_RULES_EXCLUDED_V1',
                    'original_cell_text':row_text(cell),'financial_characters_changed':False}
            if metric in found and found[metric]["value"]!=fact["value"]:
                # Some consolidated formats explicitly show intermediate PBT,
                # share of associates, then final PBT. Never choose the later
                # amount without the printed row references AND reconciliation.
                share=found.get('SHARE_PROFIT_ASSOCIATES')
                formula=re.search(r'\(\s*(\d{1,2}|[IVXivx]{1,5})\s*\+\s*(\d{1,2}|[IVXivx]{1,5})\s*\)',label)
                references=tuple(x.upper() for x in formula.groups()) if formula else ()
                expected=(printed_rows.get('PROFIT_BEFORE_TAX'),printed_rows.get('SHARE_PROFIT_ASSOCIATES'))
                if (allow_comparative and metric=='PROFIT_BEFORE_TAX' and share is not None
                    and last_metric=='SHARE_PROFIT_ASSOCIATES' and None not in expected
                    and references in (expected,expected[::-1]) and row_code is not None
                    and row_code not in expected and found[metric]['row_y']<share['row_y']<yy
                    and yy-found[metric]['row_y']<=45
                    and abs(Decimal(found[metric]['value'])+Decimal(share['value'])-Decimal(fact['value']))<=Decimal('0.02')/divisor):
                    fact['pre_tax_share_reconciliation']={'contract':'PRINTED_INTERMEDIATE_PBT_PLUS_ASSOCIATE_SHARE_EQUALS_FINAL_PBT_V1',
                        'printed_row_references':list(references),'intermediate_pbt':found[metric],'share_profit':share}
                else:raise ValueError("CONFLICTING_GEOMETRIC_ROWS:"+metric)
            found[metric]=fact
            printed_rows[metric]=row_code;last_metric=metric
        revenue="NET_INTEREST_INCOME_QUARTER" if bank else "NET_PREMIUM_EARNED_QUARTER" if insurer else "OPERATING_REVENUE_QUARTER"
        if bank and all(k in found for k in ("INTEREST_EARNED","INTEREST_EXPENDED")):
            earned,spent=found["INTEREST_EARNED"],found["INTEREST_EXPENDED"]
            found[revenue]={**earned,"value":str(Decimal(earned["value"])-Decimal(spent["value"])),
                "component_values":[earned["original_value"],spent["original_value"]],
                "evidence_line":(earned["evidence_line"]+" || "+spent["evidence_line"])[:800]}
        required=tuple(required_metrics) if required_metrics is not None else (revenue,"NET_PROFIT_QUARTER","EPS_DILUTED")
        if all(k in found for k in required):
            arithmetic=None
            split_pat=statement_layout and bool(layout_components_seen)
            if split_pat:
                if not all(k in found for k in ('CONTINUING_PAT','DISCONTINUED_PAT','NET_PROFIT_QUARTER')):
                    raise ValueError('PRINTED_CONTINUING_DISCONTINUED_TOTAL_PAT_REQUIRED')
                continuing,discontinued,total=(found[k] for k in ('CONTINUING_PAT','DISCONTINUED_PAT','NET_PROFIT_QUARTER'))
                if (not continuing['row_y']<discontinued['row_y']<total['row_y']
                    or total['row_y']-continuing['row_y']>60):
                    raise ValueError('PRINTED_TOTAL_PAT_ROW_SEQUENCE_UNPROVEN')
                split_difference=Decimal(continuing['value'])+Decimal(discontinued['value'])-Decimal(total['value'])
                if abs(split_difference)>Decimal('0.02')/divisor:
                    raise ValueError('PRINTED_CONTINUING_DISCONTINUED_TOTAL_PAT_MISMATCH')
            if "PROFIT_BEFORE_TAX" in found and "NET_PROFIT_QUARTER" in found:
                tax=(Decimal(found["TAX_EXPENSE"]["value"]) if "TAX_EXPENSE" in found else
                     Decimal(found["CURRENT_TAX"]["value"])+Decimal(found["DEFERRED_TAX"]["value"])+(Decimal(found["TAX_EARLIER_YEARS"]["value"]) if "TAX_EARLIER_YEARS" in found else Decimal(0))
                     if "CURRENT_TAX" in found and "DEFERRED_TAX" in found and not unavailable_tax_components else None)
                if tax is not None:
                    difference=Decimal(found["PROFIT_BEFORE_TAX"]["value"])-tax-Decimal(found['CONTINUING_PAT' if split_pat else 'NET_PROFIT_QUARTER']["value"])
                    if abs(difference)>Decimal("0.02")/divisor:
                        raise ValueError("PROFIT_TAX_RECONCILIATION_FAILED")
                    arithmetic={"contract":"PBT_MINUS_TAX_EQUALS_PAT","difference_crore":str(difference),
                        "pbt":found["PROFIT_BEFORE_TAX"],"tax_crore":str(tax)}
                    if split_pat:
                        arithmetic.update(contract='PRINTED_PBT_MINUS_TAX_EQUALS_CONTINUING_PAT_AND_COMPONENTS_EQUAL_TOTAL_PAT_V1',
                            continuing_pat=continuing,discontinued_pat=discontinued,reported_total_pat=total,
                            component_difference_crore=str(split_difference))
            if split_pat and arithmetic is None:raise ValueError('CONTINUING_PAT_REQUIRES_INDEPENDENT_PBT_TAX_RECONCILIATION')
            if statement_layout and arithmetic is None and any('row_alignment_evidence' in found[k] for k in required):
                raise ValueError('OVERLAPPING_ROWS_REQUIRE_PBT_TAX_RECONCILIATION')
            if auxiliary_tax_errors and ('TAX_EXPENSE' not in found or arithmetic is None):
                raise auxiliary_tax_errors[0][1]
            result={"scope":scope,"page":page_no,"unit":unit,"first_column_period":dates[0][0],
                "facts":{k:found[k] for k in required},"header_evidence":header[:2500],
                "arithmetic_validation":arithmetic,
                "parser_revision":"PDF_WORD_COORDINATES_V3"}
            if allow_comparative:
                result.update(parser_revision="PDF_WORD_COORDINATES_DATED_COLUMN_V1",selected_column_period=period,column_index=column,header_periods=[d[0] for d in dates[:quarter_columns]],scope_hint_used=scope_hint_used)
                if quarter_columns==2:result.update(quarter_group_contract='TWO_EXPLICIT_QUARTER_COLUMNS_BEFORE_CUMULATIVE_V1')
            if auxiliary_tax_errors:
                result['unavailable_tax_component_evidence']=[{'metric':metric,'status':str(error).split(':')[0],
                    'authority':'NOT_USED; EXPLICIT_TOTAL_TAX_AND_PBT_MINUS_TAX_EQUALS_PAT_REQUIRED'} for metric,error in auxiliary_tax_errors]
            if statutory_title_used:result['financial_title_basis']='EXPLICIT_STATEMENT_STANDALONE_OR_CONSOLIDATED_PROFIT_AND_LOSS'
            if statement_layout:
                result['parser_revision']='PDF_WORD_COORDINATES_EXPLICIT_STATEMENT_LAYOUT_V4'
                result['statement_row_layout_contract']='EXPLICIT_NAMED_DATES_AND_PRINTED_TOTAL_PAT_V1'
                for fact in result['facts'].values():fact['extraction_method']='PDF_WORD_COORDINATES_EXPLICIT_STATEMENT_LAYOUT_V4'
            if advanced_statement_layout:
                result['parser_revision']='PDF_WORD_COORDINATES_EXPLICIT_STATEMENT_LAYOUT_V5'
                result['statement_row_layout_contract']='EXPLICIT_NAMED_DATES_PRINTED_TOTAL_PAT_AND_FINANCIAL_EPS_ROWS_V2'
                for fact in result['facts'].values():fact['extraction_method']='PDF_WORD_COORDINATES_EXPLICIT_STATEMENT_LAYOUT_V5'
            if footnoted_quarter_headers:
                result['parser_revision']='PDF_WORD_COORDINATES_FOOTNOTED_QUARTER_HEADERS_V6'
                for fact in result['facts'].values():fact['extraction_method']='PDF_WORD_COORDINATES_FOOTNOTED_QUARTER_HEADERS_V6'
            if initial_issuer_layout:
                result['parser_revision']='PDF_WORD_COORDINATES_INITIAL_ISSUER_LAYOUT_V7'
                result['supporting_column_contract']='UNSELECTED_DATED_COLUMNS_PROVE_ROW_PRESENCE_ONLY; NEVER_SUPPLY_SELECTED_AMOUNTS'
                for fact in result['facts'].values():fact['extraction_method']='PDF_WORD_COORDINATES_INITIAL_ISSUER_LAYOUT_V7'
            return result
    raise ValueError("NO_PROVEN_GEOMETRIC_QUARTER_TABLE")
