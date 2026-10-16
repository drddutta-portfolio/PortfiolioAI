"""Explicit exchange-code lineage; never claim a current ISIN existed historically.

A historical issuer-original XML must name the exact NSE symbol and BSE scrip.
The dated NSE catalog legal name must equal the independently fetched BSE legal
issuer name. Two BSE endpoints must tie that same scrip to the canonical ISIN.
The original catalog ISIN is retained, not rewritten or called a share adjustment.
"""
from dataclasses import dataclass,asdict
import re,xml.etree.ElementTree as ET
from decimal import Decimal
from urllib.parse import urlparse

CONTRACT="RESULTS_R4_NSE_XML_EXCHANGE_CODE_ISSUER_LINEAGE_V1"

def local(tag):return tag.rsplit("}",1)[-1]
def legal_key(name):
    text=str(name or "").upper().replace("&"," AND ")
    text=re.sub(r"\b(?:LTD|LIMITED)\b","",text)
    return "".join(re.findall(r"[A-Z0-9]+",text))

def catalog_issuer_name(metadata):
    # Legacy financial-results uses companyName; integrated-filing uses the
    # stock-master legal name smName. cmName can retain the historical name.
    integrated="qe_Date" in metadata and "seq_Id" in metadata
    field="smName" if integrated else "companyName"
    name=metadata.get(field)
    if not isinstance(name,str) or not legal_key(name):
        raise ValueError("EXACT_CATALOG_LEGAL_ISSUER_NAME_UNPROVEN")
    other=metadata.get("companyName" if integrated else "smName")
    if isinstance(other,str) and legal_key(other) and legal_key(other)!=legal_key(name):
        raise ValueError("CONFLICTING_CATALOG_SCHEMA_IDENTITY_FIELDS")
    return name.strip()

@dataclass(frozen=True)
class IssuerBridge:
    symbol:str
    canonical_isin:str
    bse_scrip_code:str
    issuer_name:str
    catalog_company_name:str
    catalog_isin:str|None
    xml_reported_isin:str|None
    contract:str=CONTRACT
    share_basis:str="AS_FILED_EPS_ONLY_CORPORATE_ACTION_COMPARABILITY_UNPROVEN"
    def payload(self):return asdict(self)

def bridge_from_sources(raw,metadata,symbol,isin,bse_meta,bse_listing):
    origin=urlparse(metadata.get("xbrl",""))
    if origin.scheme!="https" or origin.hostname!="nsearchives.nseindia.com" or not re.fullmatch(r"/corporate/xbrl/[A-Za-z0-9_.-]+\.xml",origin.path) or origin.query or origin.fragment:
        raise ValueError("UNQUALIFIED_NSE_ORIGINAL")
    if len(raw)>5_000_000 or b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
        raise ValueError("INVALID_ORIGINAL_XML")
    root=ET.fromstring(raw)
    if local(root.tag)!="xbrl":raise ValueError("NOT_ORIGINAL_XBRL")
    def unique(name):
        values={(n.text or "").strip() for n in root if local(n.tag)==name and (n.text or "").strip()}
        if len(values)>1:raise ValueError("AMBIGUOUS_ORIGINAL_ISSUER_FIELD:"+name)
        return next(iter(values),None)
    code=unique("ScripCode")
    if unique("Symbol")!=symbol or metadata.get("symbol")!=symbol or not re.fullmatch(r"\d{6}",code or ""):
        raise ValueError("HISTORICAL_XML_EXCHANGE_IDENTITY_UNPROVEN")
    if str(bse_meta.get("SecurityCode"))!=code or bse_meta.get("ISIN")!=isin:
        raise ValueError("BSE_HEADER_CANONICAL_IDENTITY_MISMATCH")
    if str(bse_listing.get("SCRIP_CD"))!=code or bse_listing.get("ISIN_NUMBER")!=isin:
        raise ValueError("BSE_LISTING_CANONICAL_IDENTITY_MISMATCH")
    legal=bse_listing.get("Issuer_Name")
    named=catalog_issuer_name(metadata)
    if not legal_key(legal) or legal_key(legal)!=legal_key(named):
        raise ValueError("EXACT_LEGAL_ISSUER_NAME_LINEAGE_UNPROVEN")
    return IssuerBridge(symbol,isin,code,legal,named,metadata.get("isin"),unique("ISIN"))

def verify_original_facts(raw,manifest,bridge):
    """Independent numeric/context replay, without collector or network dependencies."""
    root=ET.fromstring(raw)
    contexts=[n for n in root if local(n.tag)=="context" and n.attrib.get("id")=="OneD"]
    if len(contexts)!=1:raise ValueError("ORIGINAL_SINGLE_QUARTER_CONTEXT_UNPROVEN")
    ctx=contexts[0]
    if any(local(n.tag) in ("scenario","segment") for n in ctx.iter()):raise ValueError("DIMENSIONAL_CONTEXT_UNQUALIFIED")
    identifiers=[(n.text or "").strip() for n in ctx.iter() if local(n.tag)=="identifier"]
    starts=[(n.text or "").strip() for n in ctx.iter() if local(n.tag)=="startDate"]
    ends=[(n.text or "").strip() for n in ctx.iter() if local(n.tag)=="endDate"]
    if len(identifiers)!=1 or identifiers[0] not in (bridge.symbol,bridge.bse_scrip_code) or starts!=[manifest["period_start"]] or ends!=[manifest["period_end"]]:
        raise ValueError("ORIGINAL_ISSUER_OR_QUARTER_CONTEXT_MISMATCH")
    units={}
    for n in root:
        if local(n.tag)!="unit":continue
        identifier=n.attrib.get("id")
        if identifier in units:raise ValueError("DUPLICATE_UNIT_IDENTIFIER")
        units[identifier]=[(m.text or "").strip() for m in n.iter() if local(m.tag)=="measure"]
    def read(tags,eps=False):
        found=[]
        for n in root:
            if local(n.tag) not in tags or n.attrib.get("contextRef")!="OneD":continue
            unit=units.get(n.attrib.get("unitRef"))
            valid=unit in (["iso4217:INR","xbrli:shares"],["INR","shares"]) if eps else unit in (["iso4217:INR"],["INR"])
            text=(n.text or "").strip()
            if not valid or not re.fullmatch(r"-?\d+(?:\.\d+)?",text):raise ValueError("ORIGINAL_NUMERIC_UNIT_UNPROVEN")
            found.append((Decimal(text),text))
        if not found or len({v for v,_ in found})!=1:raise ValueError("ORIGINAL_FINANCIAL_FACT_AMBIGUOUS")
        return found[0]
    tags={"OPERATING_REVENUE_QUARTER":("RevenueFromOperations",),
          "NET_PROFIT_QUARTER":("ProfitLossForPeriod","ProfitLossForThePeriod","ProfitLossForPeriodBeforeMinorityInterest"),
          "EPS_DILUTED":("DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations","DilutedEarningsPerShareAfterExtraordinaryItems")}
    if bridge.symbol=="STARHEALTH":
        tags={"NET_PREMIUM_EARNED_QUARTER":("PremiumEarned",),
              "NET_PROFIT_QUARTER":("ProfitLossAfterTax",),
              "EPS_DILUTED":("BasicAndDilutedEPSAfterExtraordinaryItemsNetOfTaxExpenseForThePeriodNotToBeAnnualized",)}
    for code,fact in manifest["facts"].items():
        if code=="NET_INTEREST_INCOME_QUARTER":
            earned,_=read(("InterestEarned",));spent,_=read(("InterestExpended","InterestExpenses"))
            value=(earned-spent)/Decimal(10000000)
            if fact.get("component_context_ids")!=["OneD"] or fact.get("formula")!="InterestEarned - InterestExpended":
                raise ValueError("ORIGINAL_NII_COMPONENT_LINEAGE_UNPROVEN")
        else:
            if code not in tags:raise ValueError("UNAPPROVED_ORIGINAL_METRIC")
            value,text=read(tags[code],code=="EPS_DILUTED")
            if fact.get("context_ids")!=["OneD"] or fact.get("original_value")!=text:
                raise ValueError("ORIGINAL_NUMERIC_VALUE_OR_CONTEXT_MISMATCH")
            if code!="EPS_DILUTED":value/=Decimal(10000000)
        if value!=Decimal(fact["value"]) or fact.get("unit")!=("INR_PER_SHARE" if code=="EPS_DILUTED" else "INR_CRORE") or fact.get("original_unit")!=("INR_PER_SHARE" if code=="EPS_DILUTED" else "INR"):
            raise ValueError("ORIGINAL_FINANCIAL_UNIT_REPLAY_MISMATCH")
