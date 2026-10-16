#!/usr/bin/env python3
"""R3 Development-only original quarterly financial filing acquisition.

Public NSE listing discovery is best-effort, never bypasses access controls;
preserve only issuer-authored compact extracted facts in R2/Dev Supabase.
No stock is counted covered merely because it was visited.
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation
from datetime import date, datetime, timezone, timedelta
import hashlib
import json
import os
import re
import sys
import time
from urllib.parse import urlencode, urlparse

import boto3
from bs4 import BeautifulSoup
import psycopg
import requests

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
BUCKET = "portfolioai-history-dev"
PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
R2_PREFIX = "portfolioai-results/development/v1/quarterly/"
SOURCE_CODE = "COMPANY_EXCHANGE_FILING"
KIND = "RESULTS_QUARTERLY_NSE_DISCOVERY_V1"
FIELDS = {
    "revenue from operations": "OPERATING_REVENUE_QUARTER",
    "total profit (loss) for period": "NET_PROFIT_QUARTER",
    "diluted earnings (loss) per share from continuing and discontinued operations": "EPS_DILUTED",
}
# R5 historical comparisons are a separate, explicit Development-only campaign.
# Do not widen ordinary R3 acquisition or reinterpret unverified older rows.
R5_HISTORY_MODE = os.getenv("RESULTS_R5_HISTORICAL_ACQUISITION", "0") == "1"
TARGET_QUARTERS = (
    ("2025-03-31", "2025-06-30") if R5_HISTORY_MODE
    else ("2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30")
)
CORE_METRICS = frozenset(FIELDS.values())
BANK_REQUIRED = frozenset(("NET_INTEREST_INCOME_QUARTER", "NET_PROFIT_QUARTER", "EPS_DILUTED"))
INSURANCE_REQUIRED = frozenset(("NET_PREMIUM_EARNED_QUARTER", "NET_PROFIT_QUARTER", "EPS_DILUTED"))
INSURERS = frozenset(("STARHEALTH",))
# Investment banking cohort is explicit so unrelated non-bank NPA observations
# never reclassify a company into the Banking financial statement contract.
BANK_TICKERS = frozenset((
    "AUBANK", "AXISBANK", "BANDHANBNK", "BANKBARODA", "FEDERALBNK",
    "HDFCBANK", "ICICIBANK", "IDBI", "IDFCFIRSTB", "INDIANB",
    "KARURVYSYA", "KOTAKBANK", "SBIN", "UNIONBANK",
    "BANKINDIA", "CANBK", "RBLBANK",
))
RESULT_METRICS = ("EPS_DILUTED", "OPERATING_REVENUE_QUARTER", "NET_PREMIUM_EARNED_QUARTER", "NET_PROFIT_QUARTER",
                  "OPERATING_PROFIT_QUARTER", "NET_INTEREST_INCOME_QUARTER",
                  "GROSS_NPA_PERCENT", "NET_NPA_PERCENT")

# Source-period identity bridge only for official pre-split filings. Never
# modify canonical security identity, historical backtests or share basis.
HISTORICAL_RESULTS_IDENTITIES = {
    "E2E": {
        "source_isin": "INE255Z01019", "current_isin": "INE255Z01027",
        "ex_date": "2026-06-05", "split_new_per_old": "10",
        "evidence": "MSE/LIST/19135/2026, 2026-06-03",
    },
    "POCL": {
        "source_isin": "INE063E01053", "current_isin": "INE063E01061",
        "ex_date": "2026-07-21", "split_new_per_old": "2.5",
        "evidence": "NSE change in ISIN notice 2026-07-17 / BSE DR-676/2026-2027",
    },
    "BECTORFOOD":{
        "source_isin":"INE495P01012","current_isin":"INE495P01020",
        "ex_date":"2025-12-12","split_new_per_old":"5",
        "evidence":"MSE/LIST/18238/2025, 2025-12-03",
    },
    "V2RETAIL":{
        "source_isin":"INE945H01013","current_isin":"INE945H01021",
        "ex_date":"2026-03-25","split_new_per_old":"10",
        "evidence":"BSE DR-847/2025-2026, March 2026",
    },
    "KOTAKBANK":{
        "source_isin":"INE237A01028","current_isin":"INE237A01036",
        "ex_date":"2026-01-14","split_new_per_old":"5",
        "evidence":"Kotak Mahindra Bank issuer split disclosure 2026-01-16",
    },
    "ANGELONE":{
        "source_isin":"INE732I01013","current_isin":"INE732I01021",
        "ex_date":"2026-02-26","split_new_per_old":"10",
        "evidence":"BSE DR-829/2025-2026; NSE Clearing NCL/CMPT/72965 2026-02-25",
    },
    "TDPOWERSYS":{
        "source_isin":"INE419M01027","current_isin":"INE419M01035",
        "ex_date":"2026-08-24","split_new_per_old":"2",
        "evidence":"NSE/CML/75855 2026-08-20; BSE DR-700/2026-2027",
    },
}

def historical_result_identity(symbol: str, current_isin: str, source_isin: str, period_end: str):
    link=HISTORICAL_RESULTS_IDENTITIES.get(symbol)
    if (link and current_isin==link["current_isin"]
        and source_isin==link["source_isin"]
        and period_end<link["ex_date"]):
        return dict(link)
    return None

NUM = re.compile(r"^\(?-?[\d,]+(?:\.\d+)?\)?$")
DATE = re.compile(r"^\d\d[-/.](?:\d\d|[A-Za-z]{3,9})[-/.]20\d\d$")
CORS = {"User-Agent":"PortfolioAI/1.0 quarterly research; publicly linked issuer statements"}
# NBFC is its own NSE iXBRL format, separate from standard Ind-AS and banking.
ALLOWED_FILE = re.compile(r"^/corporate/ixbrl/(?:INTEGRATED_FILING_(?:INDAS|BANKING|NBFC_INDAS)|GI)_[A-Za-z0-9_]+\.html$",re.I)

def sha(raw: bytes) -> str: return hashlib.sha256(raw).hexdigest()

def required(name: str) -> str:
    value=os.getenv(name, "")
    if not value: raise RuntimeError("REQUIRED_CONFIGURATION_MISSING:"+name)
    return value

def normalize(text: str) -> str:
    return re.sub(r"\s+"," ",text).strip().lower()

def number(text: str) -> Decimal | None:
    text=text.strip().replace(",","")
    if not NUM.fullmatch(text): return None
    if text.startswith("("): text="-"+text[1:-1]
    try: return Decimal(text)
    except InvalidOperation: return None

def html_rows(soup: BeautifulSoup):
    for table in soup.select("table"):
        rows=[]
        for tr in table.select("tr"):
            cells=[re.sub(r"\s+"," ",c.get_text(" ",strip=True)).strip() for c in tr.find_all(["th","td"],recursive=False)]
            if cells: rows.append(cells)
        if rows: yield rows

def field_values(rows, field: str) -> list[str]:
    result=[]
    for cells in rows:
        for i,c in enumerate(cells[:-1]):
            if normalize(c)==field:
                result += [v for v in cells[i+1:] if v.strip()]
    return result

def date_of(text: str) -> str | None:
    t=text.strip()
    if not DATE.fullmatch(t): return None
    t=t.replace("/","-").replace(".","-")
    for fmt in ("%d-%m-%Y", "%d-%b-%Y", "%d-%B-%Y"):
        try: return datetime.strptime(t,fmt).date().isoformat()
        except ValueError: continue
    return None

def unique_field(tables, label: str) -> str | None:
    vals=[]
    for rows in tables: vals+=field_values(rows,label)
    good=list({v.strip() for v in vals if v.strip()})
    return good[0] if len(good)==1 else None

def source_filing_unit(soup, tables):
    """Resolve an explicitly reported INR unit; never infer from magnitudes."""
    declared=[]
    for table in tables:
        declared += field_values(table,"level of rounding used in financial results")
    declared={normalize(x) for x in declared if x.strip()}
    if len(declared)>1:return None,"CONFLICTING_DECLARED_FINANCIAL_UNITS"
    if declared:
        unit=next(iter(declared))
        if unit not in ("lakhs","crores"):
            return None,"UNSUPPORTED_OR_UNKNOWN_UNIT:"+unit[:45]
        return unit,None
    text=soup.get_text(" ",strip=True)
    heads=set(re.findall(
        r"(?:amount|figures)\s+in\s*\(\s*(?:rs\.?\s*|rupees\s*|inr\s*|₹\s*)?(lakhs|crores)\s*\)",
        text,re.I))
    heads={h.lower() for h in heads}
    if len(heads)==1:return next(iter(heads)),None
    if len(heads)>1:return None,"CONFLICTING_EXPLICIT_AMOUNT_HEADINGS"
    return None,"UNSUPPORTED_OR_UNKNOWN_UNIT:None"

def extract(html: str, symbol: str, isin: str):
    soup=BeautifulSoup(html,"html.parser")
    tables=list(html_rows(soup))
    doc_symbol=unique_field(tables,"nse symbol")
    doc_isin=unique_field(tables,"isin")
    if doc_symbol!=symbol or not doc_isin: return None,"IDENTITY_MISMATCH_OR_UNKNOWN"
    unit_kind,reason=source_filing_unit(soup,tables)
    if reason:return None,reason
    scale=Decimal(100) if unit_kind=="lakhs" else Decimal(1)
    original_unit="INR_LAKH" if unit_kind=="lakhs" else "INR_CRORE"
    # Match one genuine Ind-AS financial statement, never the segment reporting
    # table; ambiguous and duplicated statements are not silently selected.
    statements=[]
    for table in tables:
        names={normalize(c) for row in table for c in row}
        if "revenue from operations" in names and "total profit (loss) for period" in names:
            statements.append(table)
    if len(statements)!=1: return None,"STATEMENT_TABLE_NOT_UNIQUE"
    stmt=statements[0]
    # The first reporting column is the QUARTER, not the following YTD or
    # comparative columns. March-quarter YTD and quarter starts differ.
    start_values=field_values(stmt,"date of start of reporting period")
    end_values=field_values(stmt,"date of end of reporting period")
    qstart=date_of(start_values[0]) if start_values else None
    qend=date_of(end_values[0]) if end_values else None
    if not qstart or not qend or qend<"2025-03-31" or qend>date.today().isoformat():
        return None,"PERIOD_NOT_PROVEN"
    if (date.fromisoformat(qend)-date.fromisoformat(qstart)).days not in range(75,100):
        return None,"PERIOD_NOT_THREE_MONTHS"
    scope_values=field_values(stmt,"nature of report standalone or consolidated")
    scope=scope_values[0].upper() if scope_values else None
    if scope not in ("CONSOLIDATED","STANDALONE"):return None,"SCOPE_UNKNOWN"
    report=unique_field(tables,"reporting type")
    if report and normalize(report)!="quarterly":return None,"NOT_QUARTERLY"
    link=historical_result_identity(symbol,isin,doc_isin,qend) if doc_isin!=isin else None
    if doc_isin!=isin and not link:
        return None,"IDENTITY_MISMATCH_OR_UNKNOWN"
    facts={}
    for label,metric in FIELDS.items():
        values=field_values(stmt,label)
        if not values: continue
        n=number(values[0])
        if n is None: continue
        if metric=="EPS_DILUTED":
            if abs(n)>Decimal("100000"):continue
            facts[metric]={"value":str(n),"unit":"INR_PER_SHARE","original_value":str(n),"original_unit":"INR_PER_SHARE"}
        else:
            n/=scale # explicitly reported source unit to INR crore
            if abs(n)>Decimal("100000000"):continue
            facts[metric]={"value":str(n),"unit":"INR_CRORE","original_value":values[0],"original_unit":original_unit}
    if not facts:return None,"NO_QUALIFIED_FINANCIAL_VALUES"
    result={"symbol":symbol,"isin":isin,"period_start":qstart,"period_end":qend,"scope":scope,"facts":facts}
    if link:
        result["source_isin"]=doc_isin
        result["historical_identity_link"]=link
    return result,None

def extract_bank(html: str, symbol: str, isin: str):
    """Financial Results - Banking, NOT Ind-AS. All values from first quarter column."""
    soup=BeautifulSoup(html,"html.parser")
    tables=list(html_rows(soup))
    doc_symbol=unique_field(tables,"nse symbol")
    doc_isin=unique_field(tables,"isin")
    if doc_symbol!=symbol or not doc_isin:
        return None,"IDENTITY_MISMATCH_OR_UNKNOWN"
    unit_kind,reason=source_filing_unit(soup,tables)
    if reason:return None,reason
    scale=Decimal(100) if unit_kind=="lakhs" else Decimal(1)
    original_unit="INR_LAKH" if unit_kind=="lakhs" else "INR_CRORE"
    report=unique_field(tables,"reporting type")
    if report and normalize(report)!="quarterly":
        return None,"NOT_QUARTERLY"
    statements=[]
    for table in tables:
        names={normalize(cell) for row in table for cell in row}
        if {"total interest earned","interest expenses","net profit (loss) for the period"}.issubset(names):
            statements.append(table)
    if len(statements)!=1:
        return None,"BANKING_STATEMENT_NOT_UNIQUE"
    stmt=statements[0]
    starts=field_values(stmt,"date of start of reporting period")
    ends=field_values(stmt,"date of end of reporting period")
    qstart=date_of(starts[0]) if starts else None
    qend=date_of(ends[0]) if ends else None
    if not qstart or not qend or qend not in TARGET_QUARTERS:
        return None,"PERIOD_NOT_PROVEN"
    if (date.fromisoformat(qend)-date.fromisoformat(qstart)).days not in range(75,100):
        return None,"PERIOD_NOT_THREE_MONTHS"
    scopes=field_values(stmt,"nature of report standalone or consolidated")
    scope=scopes[0].upper() if scopes else None
    if scope not in ("STANDALONE","CONSOLIDATED"):
        return None,"SCOPE_UNKNOWN"
    facts={}
    def issuer_number(label):
        values=field_values(stmt,label)
        return (number(values[0]),values[0]) if values else (None,None)
    profit,profit_raw=issuer_number("net profit (loss) for the period")
    if profit is not None:
        facts["NET_PROFIT_QUARTER"]={"value":str(profit/scale),"unit":"INR_CRORE",
          "original_value":profit_raw,"original_unit":original_unit}
    ppop,ppop_raw=issuer_number("operating profit before provision and contingencies")
    if ppop is not None:
        facts["OPERATING_PROFIT_QUARTER"]={"value":str(ppop/scale),"unit":"INR_CRORE",
          "original_value":ppop_raw,"original_unit":original_unit,
          "metric_definition":"PRE_PROVISION_OPERATING_PROFIT"}
    eps,eps_raw=issuer_number("diluted earnings per share after extraordinary items")
    if eps is None:
        # Issuers use differing cell decoration and occasional footnote marks.
        # Accept only explicitly AFTER-extraordinary diluted EPS in the
        # first QUARTER column; never use before-extraordinary or YTD EPS.
        eps_candidates=[]
        # Some Banking iXBRL issuers put analytical ratios / EPS into a
        # sibling HTML table. Stay inside the same identity-proven filing,
        # check any table-local quarter dates, and reject ambiguous values.
        for candidate_table in tables:
            starts=field_values(candidate_table,"date of start of reporting period")
            ends=field_values(candidate_table,"date of end of reporting period")
            if starts and date_of(starts[0]) != qstart: continue
            if ends and date_of(ends[0]) != qend: continue
            labels={normalize(cell) for row in candidate_table for cell in row}
            if not any("earnings per share after extraordinary items" in label for label in labels):
                continue
            for cells in candidate_table:
                for i,label in enumerate(cells[:-1]):
                    normalized=normalize(label).replace("\\u200b","")
                    if ("diluted" in normalized and "earnings per share" in normalized
                        and "after extraordinary" in normalized):
                        for raw_value in cells[i+1:]:
                            normalized_value=re.sub(r"[\\s*†‡#]+$","",raw_value.strip())
                            parsed=number(normalized_value)
                            if parsed is not None:
                                eps_candidates.append((parsed,raw_value))
                                break
        if len({val for val,raw in eps_candidates})==1:
            eps,eps_raw=eps_candidates[0]
    if eps is None:
        # Read the explicit reported first quarter-column value from a
        # financial filing's EPS row, including differently nested tables.
        # Never infer diluted EPS from profit/share capital or use annual EPS.
        candidates=[]
        for tr in soup.find_all("tr"):
            cells=tr.find_all(["th","td"], recursive=False)
            for idx,cell in enumerate(cells[:-1]):
                label=normalize(cell.get_text(" ",strip=True)).replace("\u200b","")
                # Same issuer filing, explicit AFTER-extraordinary diluted EPS;
                # a trailing footnote/qualifier or spacer TD must not make
                # a published first-quarter number disappear.
                if (len(label)>140
                    or "diluted earnings per share after extraordinary items" not in label
                    or "before extraordinary" in label):
                    continue
                for field in cells[idx+1:]:
                    raw=field.get_text(" ",strip=True)
                    candidate=number(re.sub(r"[\\s*†‡#]+$", "",raw))
                    if candidate is not None:
                        candidates.append((candidate,raw))
                        break
        if len({value for value,raw in candidates})==1:
            eps,eps_raw=candidates[0]
    if eps is None:
        # NSE Banking iXBRL nests AFTER-extraordinary EPS and two values
        # inside a single cell. The statement header explicitly orders them
        # QUARTER (first) and YEAR-TO-DATE (second). For Q1 these must be
        # equal; for Q2/Q3 they normally differ. Never admit the cumulative
        # EPS as the quarterly observation, nor before-extraordinary EPS.
        # Require a genuine 3-month first statement column plus one unique
        # first-quarter value across all source rows.
        packed=[]
        pattern=re.compile(
            r"^diluted earnings per share after extraordinary items\s+"
            r"(\(?-?[\d,]+(?:\.\d+)?\)?)\s+"
            r"(\(?-?[\d,]+(?:\.\d+)?\)?)$",re.I)
        for table in tables:
            for row in table:
                for cell in row:
                    match=pattern.fullmatch(normalize(cell).replace("\u200b",""))
                    if not match:continue
                    first,year_to_date=number(match.group(1)),number(match.group(2))
                    if first is not None and year_to_date is not None:
                        if qstart.endswith("-04-01") and qend.endswith("-06-30") and first!=year_to_date:
                            continue  # Q1 cannot disagree with YTD
                        packed.append((first,match.group(1)))
        if len({val for val,raw in packed})==1:
            eps,eps_raw=packed[0]
    if eps is not None and abs(eps)<=Decimal("100000"):
        facts["EPS_DILUTED"]={"value":str(eps),"unit":"INR_PER_SHARE",
          "original_value":eps_raw,"original_unit":"INR_PER_SHARE"}
    earned,earned_raw=issuer_number("total interest earned")
    expense,expense_raw=issuer_number("interest expenses")
    if earned is not None and expense is not None:
        nii=(earned-expense)/scale
        facts["NET_INTEREST_INCOME_QUARTER"]={"value":str(nii),"unit":"INR_CRORE",
          "original_value":None,"original_unit":original_unit,
          "derivation":"TOTAL_INTEREST_EARNED_MINUS_INTEREST_EXPENSES",
          "components":{"total_interest_earned_original":earned_raw,
                        "interest_expenses_original":expense_raw,"source_unit":original_unit}}
    if not facts:
        return None,"NO_QUALIFIED_BANK_FINANCIAL_VALUES"
    link=historical_result_identity(symbol,isin,doc_isin,qend) if doc_isin!=isin else None
    if doc_isin!=isin and not link:
        return None,"IDENTITY_MISMATCH_OR_UNKNOWN"
    result={"symbol":symbol,"isin":isin,"period_start":qstart,
            "period_end":qend,"scope":scope,"facts":facts}
    if link:
        result["source_isin"]=doc_isin
        result["historical_identity_link"]=link
    return result,None

def extract_nbfc(html: str, symbol: str, isin: str):
    """Admit only a genuine single-quarter NSE NBFC financial statement.

    NBFC filings use "Total Revenue From Operations" and "Diluted earnings
    per share" rather than ordinary Ind-AS labels. Do not calculate EPS,
    confuse quarterly with YTD, or read segment revenues as company revenue.
    """
    soup=BeautifulSoup(html,"html.parser")
    tables=list(html_rows(soup))
    if unique_field(tables,"nse symbol")!=symbol:
        return None,"NBFC_SYMBOL_MISMATCH"
    doc_isin=unique_field(tables,"isin")
    if not doc_isin:
        return None,"NBFC_ISIN_UNPROVEN"
    unit,reason=source_filing_unit(soup,tables)
    if reason:return None,reason
    if unit not in ("lakhs","crores"):
        return None,"NBFC_UNSUPPORTED_UNIT"
    scale=Decimal(100) if unit=="lakhs" else Decimal(1)
    original_unit="INR_LAKH" if unit=="lakhs" else "INR_CRORE"
    report=unique_field(tables,"reporting type")
    if report and normalize(report)!="quarterly":
        return None,"NOT_QUARTERLY"
    statements=[]
    for table in tables:
        labels={normalize(c) for row in table for c in row}
        if {"total revenue from operations","total profit (loss) for period",
            "diluted earnings per share"}.issubset(labels):
            statements.append(table)
    if len(statements)!=1:
        return None,"NBFC_STATEMENT_NOT_UNIQUE"
    stmt=statements[0]
    starts=field_values(stmt,"date of start of reporting period")
    ends=field_values(stmt,"date of end of reporting period")
    qstart=date_of(starts[0]) if starts else None
    qend=date_of(ends[0]) if ends else None
    if not qstart or qend not in TARGET_QUARTERS or (date.fromisoformat(qend)-date.fromisoformat(qstart)).days not in range(75,100):
        return None,"NBFC_SINGLE_QUARTER_UNPROVEN"
    scopes=field_values(stmt,"nature of report standalone or consolidated")
    scope=scopes[0].upper() if scopes else None
    if scope not in ("STANDALONE","CONSOLIDATED"):
        return None,"NBFC_SCOPE_UNPROVEN"
    identity=historical_result_identity(symbol,isin,doc_isin,qend) if doc_isin!=isin else None
    if doc_isin!=isin and not identity:
        return None,"NBFC_ISIN_MISMATCH"
    facts={}
    for label,key in (("total revenue from operations","OPERATING_REVENUE_QUARTER"),
                      ("total profit (loss) for period","NET_PROFIT_QUARTER"),
                      ("diluted earnings per share","EPS_DILUTED")):
        values=field_values(stmt,label)
        if not values:continue
        raw=values[0]
        val=number(raw)
        if val is None:continue
        if key=="EPS_DILUTED":
            if abs(val)>Decimal("100000"):continue
            facts[key]={"value":str(val),"unit":"INR_PER_SHARE",
                        "original_value":raw,"original_unit":"INR_PER_SHARE"}
        else:
            if abs(val/scale)>Decimal("100000000"):continue
            facts[key]={"value":str(val/scale),"unit":"INR_CRORE",
                        "original_value":raw,"original_unit":original_unit}
    if set(facts)!=CORE_METRICS:
        return None,"NBFC_INCOMPLETE_OR_AMBIGUOUS_QUARTER"
    result={"symbol":symbol,"isin":isin,"period_start":qstart,"period_end":qend,
            "scope":scope,"facts":facts}
    if identity:
        result["source_isin"]=doc_isin
        result["historical_identity_link"]=identity
    return result,None

def extract_insurance(html: str, symbol: str, isin: str):
    """Use only NSE's GENERAL INSURANCE original, never equate GWP with revenue."""
    if symbol not in INSURERS:return None,"UNAPPROVED_INSURER"
    soup=BeautifulSoup(html,"html.parser")
    tables=list(html_rows(soup))
    if unique_field(tables,"nse symbol")!=symbol or unique_field(tables,"isin")!=isin:
        return None,"INSURANCE_IDENTITY_UNPROVEN"
    unit,reason=source_filing_unit(soup,tables)
    if reason:return None,reason
    if unit not in ("lakhs","crores"):return None,"INSURANCE_UNITS_UNPROVEN"
    scale=Decimal(100) if unit=="lakhs" else Decimal(1)
    original_unit="INR_LAKH" if unit=="lakhs" else "INR_CRORE"
    report=unique_field(tables,"reporting type")
    if report and normalize(report)!="quarterly":return None,"NOT_QUARTERLY"
    def eps_label(x):
        x=normalize(x)
        return "eps after extraordinary items" in x and ("diluted" in x or "diluated" in x)
    matches=[]
    for table in tables:
        names={normalize(c) for row in table for c in row}
        if ("premium earned (net)" in names and "profit / (loss) after tax" in names
            and any(eps_label(n) for n in names)):
            matches.append(table)
    if len(matches)!=1:return None,"INSURANCE_STATEMENT_NOT_UNIQUE"
    stmt=matches[0]
    starts=field_values(stmt,"date of start of reporting period")
    ends=field_values(stmt,"date of end of reporting period")
    qstart=date_of(starts[0]) if starts else None
    qend=date_of(ends[0]) if ends else None
    if not qstart or qend not in TARGET_QUARTERS or not 75<=(date.fromisoformat(qend)-date.fromisoformat(qstart)).days<=100:
        return None,"INSURANCE_QUARTER_UNPROVEN"
    scopes=field_values(stmt,"nature of report standalone or consolidated")
    scope=scopes[0].upper() if scopes else unique_field(tables,"nature of report standalone or consolidated")
    if scope not in ("STANDALONE","CONSOLIDATED"):return None,"INSURANCE_SCOPE_UNPROVEN"
    facts={}
    for label,key in (("premium earned (net)","NET_PREMIUM_EARNED_QUARTER"),
                      ("profit / (loss) after tax","NET_PROFIT_QUARTER")):
        values=field_values(stmt,label)
        val=number(values[0]) if values else None
        if val is None:return None,"INSURANCE_CORE_VALUE_NOT_PROVEN_"+key
        facts[key]={"value":str(val/scale),"unit":"INR_CRORE",
                    "original_value":values[0],"original_unit":original_unit}
    possible=[]
    for cells in stmt:
        for idx,cell in enumerate(cells[:-1]):
            if not eps_label(cell):continue
            for raw in cells[idx+1:]:
                val=number(raw)
                if val is not None:
                    possible.append((val,raw))
                    break
    if len({p[0] for p in possible})!=1:return None,"INSURANCE_DILUTED_EPS_UNPROVEN"
    eps,original=possible[0]
    facts["EPS_DILUTED"]={"value":str(eps),"unit":"INR_PER_SHARE",
                          "original_value":original,"original_unit":"INR_PER_SHARE"}
    return {"symbol":symbol,"isin":isin,"period_start":qstart,
            "period_end":qend,"scope":scope,"facts":facts},None

def extract_source(html: str, symbol: str, isin: str, source_url: str):
    if re.search(r"/GI_[A-Za-z0-9_]+\.html$",urlparse(source_url).path,re.I):
        return extract_insurance(html,symbol,isin)
    path=urlparse(source_url).path
    if re.search(r"/INTEGRATED_FILING_NBFC_INDAS_[A-Za-z0-9_]+\.html$",path,re.I):
        return extract_nbfc(html,symbol,isin)
    if re.search(r"/INTEGRATED_FILING_BANKING_[A-Za-z0-9_]+\.html$",path,re.I):
        return extract_bank(html,symbol,isin)
    return extract(html,symbol,isin)

# Individually verified public NSE archive links for missing-company recovery.
# URLs are discovery hints only: all issuer/ISIN/period/unit/metric checks
# still run against the downloaded original bytes before any DB write.
# No guessed archive names or non-official hosts may be added.
OFFICIAL_NSE_SEEDS={
    "JIOFIN":(
        "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_175188_16072026191853_iXBRL_WEB.html",
        "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_151303_17042026225608_iXBRL_WEB.html",
        "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_135158_15012026170908_iXBRL_WEB.html",
    ),
    "ANGELONE":(
        "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_174795_15072026180820_iXBRL_WEB.html",
        "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_NBFC_INDAS_151098_16042026203126_iXBRL_WEB.html",
    ),
    "TDPOWERSYS":(
        "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_185131_11082026172616_iXBRL_WEB.html",
        "https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_138537_29012026173514_iXBRL_WEB.html",
    )
}

def listing_urls(payload, symbol):
    """Trust only explicitly linked NSE integrated INDAS iXBRL source URLs."""
    records=payload if isinstance(payload,list) else (
        payload.get("data",payload.get("records",[])) if isinstance(payload,dict) else []
    )
    if isinstance(records,dict):records=records.get("data",[])
    if not isinstance(records,list):return []
    urls=[]
    for item in records:
        if not isinstance(item,dict):continue
        if item.get("symbol",item.get("Symbol")) not in (symbol,None):continue
        # R5: official NSE catalog quarter dates prune irrelevant documents.
        # They are discovery hints ONLY; period/scope still must be proven
        # by the retrieved original filing before any admission.
        if R5_HISTORY_MODE and str(item.get("qe_Date","")).upper() not in ("31-MAR-2025","30-JUN-2025"):
            continue
        for attr in ("ixbrl","ixbrlUrl","originalUrl","xbrlFile","xbrl","xbrlUrl","xmlFile","link","url"):
            url=item.get(attr)
            if not isinstance(url,str) or not url.startswith("https://"):continue
            parsed=urlparse(url)
            if parsed.hostname=="nsearchives.nseindia.com" and ALLOWED_FILE.fullmatch(parsed.path):
                urls.append(url)
    return list(dict.fromkeys(urls))

def fetch_json(session, symbol):
    # The first NSE page can omit 2025-09 sources now that FY27 results
    # are arriving. Use bounded paging, never unlimited discovery.
    records=[]
    for page in range(1,5):
        params={"index":"equities","symbol":symbol,
                "type":"Integrated Filing- Financials","page":page,"size":100,
                "from_date":"01-01-2025","to_date":date.today().strftime("%d-%m-%Y")}
        url="https://www.nseindia.com/api/integrated-filing-results?"+urlencode(params)
        r=session.get(url,timeout=22,headers={"Accept":"application/json",
            "Referer":"https://www.nseindia.com/companies-listing/corporate-integrated-filing"})
        if r.status_code in (401,403,429):
            raise RuntimeError("LISTING_ACCESS_DENIED_"+str(r.status_code))
        r.raise_for_status()
        if "json" not in r.headers.get("content-type","").lower():
            raise RuntimeError("LISTING_NOT_JSON")
        payload=r.json()
        page_records=payload if isinstance(payload,list) else (
            payload.get("data",payload.get("records",[])) if isinstance(payload,dict) else [])
        if isinstance(page_records,dict):
            page_records=page_records.get("data",[])
        if not isinstance(page_records,list):
            raise RuntimeError("UNEXPECTED_LISTING_PAGE_STRUCTURE")
        records.extend(page_records)
        if len(page_records)<100:break
        time.sleep(0.8)
    return records

def r2_client():
    acc=required("CLOUDFLARE_R2_ACCOUNT_ID").strip()
    # Existing repository secret may contain either an account hex ID or the
    # complete R2 S3 endpoint. Never concatenate https:// onto a URL.
    if re.fullmatch(r"[a-f0-9]{32}",acc):
        endpoint=f"https://{acc}.r2.cloudflarestorage.com"
    elif acc.startswith("https://"):
        parsed=urlparse(acc)
        host=parsed.hostname or ""
        if not re.fullmatch(r"[a-f0-9]{32}\.r2\.cloudflarestorage\.com",host) or parsed.port or parsed.path not in ("","/") or parsed.query or parsed.fragment:
            raise RuntimeError("UNRECOGNIZED_R2_ENDPOINT")
        endpoint=acc.rstrip("/")
    else:
        raise RuntimeError("UNRECOGNIZED_R2_ACCOUNT_ID")
    return boto3.client("s3",endpoint_url=endpoint,
        aws_access_key_id=required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
        aws_secret_access_key=required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
        region_name="auto")

def put_immutable(s3, content:bytes, key:str):
    try:
        old=s3.get_object(Bucket=BUCKET,Key=key)
        oldbody=old["Body"].read()
        if sha(oldbody)!=sha(content):raise RuntimeError("IMMUTABLE_R2_CONFLICT")
        return False
    except s3.exceptions.NoSuchKey: pass
    except Exception as exc:
        if "NoSuchKey" not in str(exc) and "404" not in str(exc):raise
    s3.put_object(Bucket=BUCKET,Key=key,Body=content,ContentType="application/json",IfNoneMatch="*")
    read=s3.get_object(Bucket=BUCKET,Key=key)["Body"].read()
    if sha(read)!=sha(content):raise RuntimeError("R2_HASH_READBACK_FAILED")
    return True

def persist(conn,s3,parsed,url,original_sha):
    manifest={
        "contract":"PORTFOLIOAI_RESULTS_PUBLIC_FILING_V1",
        "symbol":parsed["symbol"],"isin":parsed["isin"],
        "period_start":parsed["period_start"],"period_end":parsed["period_end"],
        "consolidation_scope":parsed["scope"],
        "issuer_filing_url":url,"original_sha256_unretained":original_sha,
        "raw_nse_bytes_retained":False,"publication_timestamp":None,
        "figures_review_pending":True,"facts":parsed["facts"]
    }
    if parsed.get("historical_identity_link"):
        manifest["source_isin"]=parsed["source_isin"]
        manifest["historical_identity_link"]=parsed["historical_identity_link"]
        manifest["eps_as_originally_reported_before_split"]=True
    payload=json.dumps(manifest,sort_keys=True,separators=(",",":")).encode()
    ph=sha(payload)
    key=(R2_PREFIX+f"security_id={parsed['isin']}/period_end={parsed['period_end']}/"
         +f"source_version={ph}/manifest.json")
    put_immutable(s3,payload,key) # R2 first; no dangling DB ref
    record={**manifest,"r2_key":key,"r2_manifest_sha256":ph}
    raw=json.dumps(record,sort_keys=True,separators=(",",":"))
    h=sha(raw.encode())
    with conn.cursor() as cur:
        cur.execute("""SELECT id FROM public.securities WHERE symbol=%s AND isin=%s AND asset_class='EQUITY'""",
                    (parsed["symbol"],parsed["isin"]))
        security=cur.fetchone()
        if not security:raise RuntimeError("CANONICAL_SECURITY_NOT_FOUND")
        cur.execute("""
          INSERT INTO public.data_source_records
             (source_code,record_kind,external_record_id,source_url,payload_hash,raw_payload,terms_snapshot)
          VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s::jsonb)
          ON CONFLICT (source_code,record_kind,external_record_id,payload_hash)
            DO NOTHING RETURNING id
        """,(SOURCE_CODE,KIND,parsed["symbol"]+":"+original_sha,url,h,raw,
              '{"retention":"COMPACT_FACTS_ONLY","original_nse_bytes_retained":false,"results_review":"PENDING"}'))
        new=cur.fetchone()
        if new: rec=new[0]
        else:
            cur.execute("""SELECT id FROM public.data_source_records
                WHERE source_code=%s AND record_kind=%s AND external_record_id=%s AND payload_hash=%s""",
                (SOURCE_CODE,KIND,parsed["symbol"]+":"+original_sha,h))
            prior=cur.fetchone()
            if not prior:raise RuntimeError("SOURCE_INSERT_READBACK_MISSING")
            rec=prior[0]
        saved=0
        for metric,fact in parsed["facts"].items():
            cur.execute("""
               INSERT INTO public.fundamental_observations
                (security_id,metric_code,source_record_id,source_code,numeric_value,currency,unit,
                 period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status)
               VALUES (%s,%s,%s,%s,%s,'INR',%s,%s,%s,'QUARTER',%s,now(),now()+interval '120 days','AVAILABLE')
               ON CONFLICT (security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id)
               DO NOTHING
               RETURNING id
            """,(security[0],metric,rec,SOURCE_CODE,Decimal(fact["value"]),fact["unit"],
                 parsed["period_start"],parsed["period_end"],parsed["scope"]))
            if cur.fetchone():saved+=1
    conn.commit()
    return saved

def missing_r4_selected_quarters(rows):
    """Only an existing R4 selection closes a requalification target period."""
    return {str(row[0]) for row in rows if str(row[0]) in TARGET_QUARTERS}

def completed_quarters(rows, banking=False, insurance=False):
    """Require complete same-source metrics and correct business-type contract."""
    by_filing = {}
    required = INSURANCE_REQUIRED if insurance else BANK_REQUIRED if banking else CORE_METRICS
    for period_end, scope, source_record_id, metric_code in rows:
        if str(period_end) not in TARGET_QUARTERS or not scope or not source_record_id:
            continue
        by_filing.setdefault((str(period_end), scope, str(source_record_id)), set()).add(metric_code)
    return {period for (period, _, _), metrics in by_filing.items()
            if required.issubset(metrics)}


def main():
    db=required("SUPABASE_DB_URL")
    if PROJECT_REF not in db:raise RuntimeError("NON_DEVELOPMENT_DATABASE_FORBIDDEN")
    if required("CLOUDFLARE_R2_BUCKET")!=BUCKET:raise RuntimeError("NON_DEVELOPMENT_R2_FORBIDDEN")
    if R5_HISTORY_MODE and os.getenv("RESULTS_R5_HISTORICAL_ACK") != "2025_MAR_JUN_ONLY":
        raise RuntimeError("R5_HISTORICAL_PERIOD_SCOPE_NOT_APPROVED")
    maxstocks=int(os.getenv("RESULTS_MAX_STOCKS","262"))
    if maxstocks<1 or maxstocks>262:raise RuntimeError("INVALID_STOCK_BUDGET")
    s3=r2_client()
    with psycopg.connect(db,autocommit=False) as conn:
        with conn.cursor() as cur:
            # Revised owner approval: include all 262 open and closed equity
            # identities, not only the earlier 231 source-covered issuers.
            # Existing source selections are still reused and cannot be overwritten.
            cur.execute("""SELECT DISTINCT s.symbol,s.isin,s.id
                FROM public.transactions t JOIN public.securities s ON t.security_id=s.id
                WHERE t.portfolio_id=%s AND t.superseded_at IS NULL
                  AND s.asset_class='EQUITY' AND s.isin IS NOT NULL
                ORDER BY s.symbol LIMIT %s""",(PORTFOLIO_ID,maxstocks))
            stocks=cur.fetchall()
        # Narrow optional Development backfill; never expand the set or
        # silently process unrelated securities when a caller requests a
        # specific audited company shortlist.
        raw_targets=os.getenv("RESULTS_TARGET_SYMBOLS","").strip()
        if raw_targets:
            target=set(x.strip().upper() for x in raw_targets.split(","))
            if len(target)>12 or not target or any(not re.fullmatch(r"[A-Z0-9&-]{2,24}",x) for x in target):
                raise RuntimeError("INVALID_TARGET_STOCK_SET")
            stocks=[x for x in stocks if x[0] in target]
            if {x[0] for x in stocks}!=target:
                raise RuntimeError("TARGET_SECURITY_NOT_IN_QUALIFIED_COHORT")
        requalify=os.getenv("RESULTS_R4_REQUALIFY","0")=="1"
        qualified_sets=({"HCLTECH","HDFCBANK"},{"BECTORFOOD","KOTAKBANK","V2RETAIL"})
        if requalify and {x[0] for x in stocks} not in qualified_sets:
            raise RuntimeError("REQUALIFICATION_NOT_TARGETED_APPROVED_COHORT")
        conn.rollback()
        session=requests.Session()
        session.headers.update({"User-Agent":"Mozilla/5.0 (compatible; PortfolioAIResearch/1.0)","Accept-Language":"en-IN,en;q=0.8"})
        bootstrap_error=None
        try:
            seed=session.get("https://www.nseindia.com/companies-listing/corporate-integrated-filing",timeout=20)
            if seed.status_code in (401,403,429):
                bootstrap_error="PUBLIC_LISTING_UNAVAILABLE_"+str(seed.status_code)
        except requests.RequestException:
            bootstrap_error="PUBLIC_LISTING_UNAVAILABLE"
        # A blocked listing never licenses bypassing its access restriction.
        # Separately published NSE archive URLs are independent public
        # originals and may be checked as exact-source hints when available.
        log={"universe_target":len(stocks),"target_period_ends":list(TARGET_QUARTERS),
             "access_ok":bootstrap_error is None,"listing_error":bootstrap_error,"visited":0,"already_complete":0,"with_documents":0,
             "documents_parsed":0,"observations_inserted":0,"blocked":[],
             "stock_outcomes":[]}
        for symbol,isin,security_id in stocks:
            entry={"symbol":symbol,"qualified":0,"observations":0,"reason":None}
            with conn.cursor() as cur:
                # Source availability is NOT completed R3 coverage. Count only
                # R4 source-selected same-filing core observations as complete.
                cur.execute("""SELECT f.period_end,f.consolidation_scope,
                                      f.source_record_id,f.metric_code
                    FROM public.fundamental_observation_decisions d
                    JOIN public.fundamental_observations f
                      ON f.id=d.selected_observation_id
                    WHERE f.security_id=%s AND f.period_end=ANY(%s::date[])
                      AND f.period_type='QUARTER' AND f.numeric_value IS NOT NULL
                      AND f.source_code='COMPANY_EXCHANGE_FILING'
                      AND f.evidence_status='AVAILABLE' AND f.currency='INR'
                      AND ((f.metric_code='EPS_DILUTED' AND f.unit='INR_PER_SHARE')
                          OR (f.metric_code<>'EPS_DILUTED' AND f.unit='INR_CRORE'))
                      AND f.metric_code=ANY(%s)""",
                    (security_id,list(TARGET_QUARTERS),list(CORE_METRICS | BANK_REQUIRED | INSURANCE_REQUIRED)))
                completed=completed_quarters(cur.fetchall(), banking=symbol in BANK_TICKERS, insurance=symbol in INSURERS)
                # Qualified but unselected original observations must be
                # reconciled by the R4 source verifier, not repulled as if new.
                cur.execute("""SELECT period_end,consolidation_scope,
                                      source_record_id,metric_code
                    FROM public.fundamental_observations
                    WHERE security_id=%s AND period_end=ANY(%s::date[])
                      AND period_type='QUARTER' AND numeric_value IS NOT NULL
                      AND source_code='COMPANY_EXCHANGE_FILING'
                      AND evidence_status='AVAILABLE' AND currency='INR'
                      AND ((metric_code='EPS_DILUTED' AND unit='INR_PER_SHARE')
                          OR (metric_code<>'EPS_DILUTED' AND unit='INR_CRORE'))
                      AND metric_code=ANY(%s)""",
                    (security_id,list(TARGET_QUARTERS),list(CORE_METRICS | BANK_REQUIRED | INSURANCE_REQUIRED)))
                already_sourced=completed_quarters(cur.fetchall(), banking=symbol in BANK_TICKERS, insurance=symbol in INSURERS)
                pending_review=already_sourced-completed
                if requalify:
                    cur.execute("""SELECT DISTINCT period_end
                        FROM public.fundamental_observation_decisions
                        WHERE security_id=%s AND period_type='QUARTER'
                        AND selected_observation_id IS NOT NULL
                        AND period_end=ANY(%s::date[])""",
                        (security_id,list(TARGET_QUARTERS)))
                    completed=missing_r4_selected_quarters(cur.fetchall())
            conn.rollback()
            acquired=set()
            if len(completed)==len(TARGET_QUARTERS):
                entry["reason"]="FOUR_QUARTERS_ALREADY_COMPLETE"
                log["already_complete"]+=1
            elif len(completed | pending_review)==len(TARGET_QUARTERS):
                entry["reason"]="FOUR_QUARTERS_ORIGINALS_EXIST_R4_SELECTION_PENDING"
            else:
                try:
                    urls=list(OFFICIAL_NSE_SEEDS.get(symbol,()))
                    if bootstrap_error is None:
                        try:
                            listing=fetch_json(session,symbol)
                            urls=list(dict.fromkeys(urls+listing_urls(listing,symbol)))
                        except (requests.RequestException,ValueError,RuntimeError) as exc:
                            entry["listing_error"]=type(exc).__name__
                            # Do not retry or evade access controls. Archive
                            # seed URLs have independently verified public
                            # issuer identities and are checked separately.
                    if not urls:
                        entry["reason"]="NO_QUALIFIED_LISTING_URL"
                    else:
                        log["with_documents"]+=1
                        # Older September/December filings may be beyond the
                        # first eight links. Inspect the bounded issuer list,
                        # never infer the reporting quarter from the URL.
                        for url in urls[:40]:
                            time.sleep(1.2)
                            res=session.get(url,timeout=22,headers={"Accept":"text/html"})
                            if res.status_code in (401,403,429):
                                raise RuntimeError("FILING_ACCESS_DENIED_"+str(res.status_code))
                            if res.status_code==404:
                                entry["reason"]="FILING_NOT_FOUND"
                                continue
                            res.raise_for_status()
                            if len(res.content)>6_000_000:
                                entry["reason"]="FILING_TOO_LARGE"
                                continue
                            data,reason=extract_source(res.text,symbol,isin,url)
                            if not data:
                                entry["reason"]=reason
                                if reason.startswith("UNSUPPORTED_OR_UNKNOWN_UNIT"):
                                    examples=entry.setdefault("unit_source_diagnostics",[])
                                    if len(examples)<3:
                                        public_soup=BeautifulSoup(res.text,"html.parser")
                                        tt=list(html_rows(public_soup))
                                        declared=[v for table in tt for v in field_values(
                                            table,"level of rounding used in financial results")]
                                        headings=re.findall(
                                            r"(?i)(?:amount|figures)[^<\\n]{0,110}(?:lakhs|crores|millions|rupees|inr)",
                                            res.text)[:3]
                                        examples.append({"issuer_url":url,
                                                         "declared_values":declared[:6],
                                                         "html_amount_fragments":headings,
                                                         "text_excerpt":public_soup.get_text(" ",strip=True)[:220]})
                                if reason=="IDENTITY_MISMATCH_OR_UNKNOWN":
                                    examples=entry.setdefault("identity_source_diagnostics",[])
                                    if len(examples)<3:
                                        tt=list(html_rows(BeautifulSoup(res.text,"html.parser")))
                                        examples.append({"issuer_url":url,
                                                         "nse_symbol":unique_field(tt,"nse symbol"),
                                                         "source_isin":unique_field(tt,"isin")})
                                continue
                            if (data["period_end"] not in TARGET_QUARTERS
                                or data["period_end"] in completed
                                or data["period_end"] in pending_review
                                or data["period_end"] in acquired):
                                continue  # Reuse source facts and avoid duplicate downloads/writes.
                            entry["qualified"]+=1
                            log["documents_parsed"]+=1
                            entry["observations"]+=persist(conn,s3,data,url,sha(res.content))
                            if (INSURANCE_REQUIRED if symbol in INSURERS else BANK_REQUIRED if symbol in BANK_TICKERS else CORE_METRICS).issubset(data["facts"]):
                                acquired.add(data["period_end"])
                            # A capture is pending R4 selection, not already complete.
                            if len(completed | pending_review | acquired)==len(TARGET_QUARTERS):
                                break
                        if not entry["qualified"] and not entry["reason"]:
                            entry["reason"]="NO_NEW_QUALIFIED_QUARTER"
                except Exception as exc:
                    conn.rollback()
                    entry["reason"]=str(exc)[:100]
                    if "ACCESS_DENIED" in entry["reason"]:
                        log["blocked"].append(entry["reason"])
                        entry["missing_quarters"]=sorted(set(TARGET_QUARTERS)-completed)
                        log["stock_outcomes"].append(entry)
                        break  # Respect source blocks/rate limits; never bypass.
            entry["pending_selection_quarters"]=sorted(pending_review | acquired)
            entry["missing_quarters"]=sorted(set(TARGET_QUARTERS)-completed)
            log["visited"]+=1
            log["observations_inserted"]+=entry["observations"]
            log["stock_outcomes"].append(entry)
            if len(completed)!=len(TARGET_QUARTERS):
                time.sleep(1.2)
    log["all_four_quarters_complete"] = sum(not row["missing_quarters"] for row in log["stock_outcomes"])
    log["incomplete_stocks"] = sum(bool(row["missing_quarters"]) for row in log["stock_outcomes"])
    log["missing_stock_quarter_slots"] = sum(len(row["missing_quarters"]) for row in log["stock_outcomes"])
    print(json.dumps(log,indent=2,sort_keys=True))
    if log["blocked"]:return 2
    return 0

if __name__=="__main__":
    try: sys.exit(main())
    except Exception as e:
        print(json.dumps({"status":"BLOCKED","error":str(e)[:150]}),file=sys.stderr)
        sys.exit(3)
