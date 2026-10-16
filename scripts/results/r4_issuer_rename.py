"""Source-pinned issuer renames, independent of share/EPS adjustments."""
from dataclasses import dataclass,asdict
from datetime import date
import hashlib,re
import fitz

RULES={
 "ALIVUS":{"old_symbol":"GLS","old_name":"Glenmark Life Sciences",
   "new_name":"Alivus Life Sciences","effective_date":"2025-01-20","scrip":"543322",
   "url":"https://nsearchives.nseindia.com/corporate/GLS_18012025135211_BSE_NSE_Press_Release_180125_Signed.pdf"},
 "HBLENGINE":{"old_symbol":"HBLPOWER","old_name":"HBL Power Systems",
   "new_name":"HBL Engineering","effective_date":"2024-12-23","scrip":"517271",
   "url":"https://nsearchives.nseindia.com/corporate/HBLPOWER_18122024095548_CommunicationtoStakeholders1812.pdf"},
 "ETERNAL":{"old_symbol":"ZOMATO","old_name":"Zomato",
   "new_name":"Eternal","effective_date":"2025-04-09","scrip":"543320",
   "url":"https://nsearchives.nseindia.com/content/circulars/CML67420.pdf"},
}

@dataclass(frozen=True)
class RenameProof:
    symbol:str
    old_symbol:str
    old_name:str
    new_name:str
    effective_date:str
    scrip:str
    source_url:str
    sha256:str
    contract:str="RESULTS_R4_OFFICIAL_ISSUER_RENAME_LINK_V1"
    def payload(self):return asdict(self)

def compact(text):return re.sub(r"[^A-Z0-9]","",text.upper())

def verify_rename_pdf(raw,symbol,source_url):
    rule=RULES.get(symbol)
    if not rule or source_url!=rule["url"] or not raw.startswith(b"%PDF") or len(raw)>5_000_000:
        raise ValueError("QUALIFIED_OFFICIAL_RENAME_DOCUMENT_REQUIRED")
    with fitz.open(stream=raw,filetype="pdf") as pdf:
        if len(pdf)>12:raise ValueError("RENAME_AUTHORITY_PAGE_BOUND_EXCEEDED")
        text=" ".join(p.get_text("text") for p in pdf)
    normalized=compact(text)
    for token in (symbol,rule["old_symbol"],rule["old_name"],rule["new_name"]):
        if compact(token) not in normalized:raise ValueError("OFFICIAL_RENAME_IDENTITY_NOT_PROVEN")
    effective=date.fromisoformat(rule["effective_date"])
    dates=(effective.strftime("%B%d%Y"),effective.strftime("%d%B%Y"),
           effective.strftime("%d%m%Y"),effective.strftime("%d%b%Y"),
           effective.strftime("%B")+str(effective.day)+str(effective.year))
    if not any(compact(d) in normalized for d in dates):raise ValueError("OFFICIAL_RENAME_EFFECTIVE_DATE_NOT_PROVEN")
    # The NSE circular proves the name/symbol pair. The issuer notices also
    # explicitly prove the unchanged BSE code; the financial XML and two BSE
    # endpoints must independently prove that code in every case.
    if symbol!="ETERNAL" and rule["scrip"] not in normalized:
        raise ValueError("OFFICIAL_RENAME_SCRIP_NOT_PROVEN")
    return RenameProof(symbol,rule["old_symbol"],rule["old_name"],rule["new_name"],
        rule["effective_date"],rule["scrip"],source_url,hashlib.sha256(raw).hexdigest())
