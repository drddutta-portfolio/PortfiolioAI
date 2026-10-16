"""Explicit exchange-code lineage; never claim a current ISIN existed historically.

A historical issuer-original XML must name the exact NSE symbol and BSE scrip.
The dated NSE catalog legal name must equal the independently fetched BSE legal
issuer name. Two BSE endpoints must tie that same scrip to the canonical ISIN.
The original catalog ISIN is retained, not rewritten or called a share adjustment.
"""
from dataclasses import dataclass,asdict
import re,xml.etree.ElementTree as ET
from urllib.parse import urlparse

CONTRACT="RESULTS_R4_NSE_XML_EXCHANGE_CODE_ISSUER_LINEAGE_V1"

def local(tag):return tag.rsplit("}",1)[-1]
def legal_key(name):
    text=str(name or "").upper().replace("&"," AND ")
    text=re.sub(r"\b(?:LTD|LIMITED)\b","",text)
    return "".join(re.findall(r"[A-Z0-9]+",text))

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
    named=metadata.get("companyName")
    if not legal_key(legal) or legal_key(legal)!=legal_key(named):
        raise ValueError("EXACT_LEGAL_ISSUER_NAME_LINEAGE_UNPROVEN")
    return IssuerBridge(symbol,isin,code,legal,named,metadata.get("isin"),unique("ISIN"))
