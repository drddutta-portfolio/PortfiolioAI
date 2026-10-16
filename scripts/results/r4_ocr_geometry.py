"""Fail-closed OCR for retained originals: two renders plus accounting equality."""
import hashlib,json,re
from decimal import Decimal
import fitz
from r4_pdf_geometry import extract_page

class OCRPage:
    def __init__(self,page,dpi):
        self.page=page
        self.textpage=page.get_textpage_ocr(language="eng",dpi=dpi,full=True)
    def get_text(self,kind="text",**kwargs):
        return self.page.get_text(kind,textpage=self.textpage,**kwargs)

def fingerprint(parsed):
    values={k:{f:fact[f] for f in ("value","unit","original_unit","original_value","column_period","page","column_index")}
            for k,fact in parsed["facts"].items()}
    # Decimal-equivalent values may retain different original typography; both
    # extractions must agree on the exact original numeric cell too.
    return hashlib.sha256(json.dumps(values,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def agree(first,second):
    if first["scope"]!=second["scope"] or first["unit"]!=second["unit"] or fingerprint(first)!=fingerprint(second):
        raise ValueError("INDEPENDENT_OCR_FINANCIAL_CELLS_DISAGREE")
    if not first.get("arithmetic_validation") or not second.get("arithmetic_validation"):
        raise ValueError("OCR_REQUIRES_INDEPENDENT_PROFIT_TAX_RECONCILIATION")
    if not re.search(r"\b(?:INR|RS\.?|RUPEES)\b|₹",first["header_evidence"],re.I):
        raise ValueError("OCR_REPORTING_CURRENCY_NOT_EXPLICIT")
    return fingerprint(first)

def extract_ocr(raw,period,bank=False,insurer=False):
    pdf=fitz.open(stream=raw,filetype="pdf");outcomes=[];rejects={}
    for index in range(min(len(pdf),40)):
        page=pdf[index];native=page.get_text("text")
        # Text-rich nonfinancial reports/notes are not OCR candidates.
        if len(native.strip())>200 and not re.search(r"financial results|revenue from operations|interest earned",native,re.I):
            continue
        try:
            first=extract_page(OCRPage(page,300),index+1,period,bank,insurer)
            second=extract_page(OCRPage(page,450),index+1,period,bank,insurer)
            digest=agree(first,second)
            first["ocr_independent_checks"]={
                "contract":"DOUBLE_RENDER_AND_PBT_MINUS_TAX_OCR_V1","render_dpi":[300,450],
                "facts_sha256":digest,"original_sha256":hashlib.sha256(raw).hexdigest(),
                "page":index+1,"arithmetic_validation":first["arithmetic_validation"]}
            first["parser_revision"]="PDF_OCR_DOUBLE_RENDER_V1"
            for fact in first["facts"].values():
                fact["extraction_method"]="OCR_DOUBLE_RENDER_WORD_COORDINATES_V1"
                fact["ocr_proof_fingerprint"]=digest
            first["ocr_issuer_text"]=native+" "+OCRPage(page,300).get_text("text")
            outcomes.append(first)
        except ValueError as error:
            key=str(error)[:160];rejects[key]=rejects.get(key,0)+1
    if not outcomes:raise ValueError("NO_DOUBLE_VALIDATED_OCR_TRIO:"+json.dumps(rejects,sort_keys=True))
    preferred="CONSOLIDATED" if any(x["scope"]=="CONSOLIDATED" for x in outcomes) else "STANDALONE"
    eligible=[x for x in outcomes if x["scope"]==preferred]
    if len({fingerprint(x) for x in eligible})!=1:raise ValueError("COMPETING_OCR_STATEMENTS_REQUIRE_REVIEW")
    return eligible[0]
