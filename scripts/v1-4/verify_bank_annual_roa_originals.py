"""Verify retained annual ROA candidates against original issuer iXBRL bytes.
Read-only research: never writes sources, reviews, grants or readiness.
"""
import argparse, hashlib, json, re, time, urllib.request
from decimal import Decimal
from pathlib import Path
from html.parser import HTMLParser

class Tables(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=[]; self.cell=None
    def handle_starttag(self, tag, attrs):
        if tag=="tr": self.row=[]
        if tag in ("td","th"): self.cell=[]
    def handle_data(self, text):
        if self.cell is not None: self.cell.append(text)
    def handle_endtag(self, tag):
        if tag in ("td","th") and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split())); self.cell=None
        if tag=="tr" and self.row: self.rows.append(self.row)

def unique_row(rows, label):
    # Scalar document metadata repeats the date label. Select the actual
    # multi-period financial table, never its single-value metadata section.
    found=list({tuple(r):r for r in rows if len(r)>=4 and r[1]==label}.values())
    if len(found)!=1: raise ValueError("MISSING_OR_AMBIGUOUS_ROW:"+label)
    return found[0]

def annual_cell(rows, symbol):
    def scalar(label):
        found={r[1] for r in rows if len(r)>1 and r[0]==label}
        if len(found)!=1: raise ValueError("MISSING_OR_AMBIGUOUS_IDENTITY:"+label)
        return found.pop()
    if scalar("NSE Symbol")!=symbol or scalar("Nature of report standalone or consolidated")!="Standalone":
        raise ValueError("IDENTITY_OR_SCOPE_MISMATCH")
    start=unique_row(rows,"Date of start of reporting period")
    end=unique_row(rows,"Date of end of reporting period")
    roa=unique_row(rows,"Return on assets")
    columns=[i for i in range(2,min(len(start),len(end),len(roa))) if start[i]=="01-04-2025" and end[i]=="31-03-2026"]
    if len(columns)!=1: raise ValueError("FULL_YEAR_COLUMN_NOT_UNIQUE")
    column=columns[0]; value=roa[column]
    if not re.fullmatch(r"\d+(?:\.\d+)?",value) or not Decimal(0)<Decimal(value)<Decimal(100):
        raise ValueError("ROA_CELL_INVALID")
    return {"numeric_value":value,"column_index":column,"literal_roa_row":roa,
            "literal_period_start_row":start,"literal_period_end_row":end,"isin":scalar("ISIN"),
            "period_start":"2025-04-01","period_end":"2026-03-31","scope":"STANDALONE",
            "qualification":"ORIGINAL_YEAR_CELL_VERIFIED_NOT_ADMITTED",
            "regulatory_binding":"SEPARATE_APPLICABILITY_AND_SOURCE_BINDING_REQUIRED"}

def main():
    parser=argparse.ArgumentParser();parser.add_argument("manifest");parser.add_argument("output_dir");parser.add_argument("--retained-dir")
    args=parser.parse_args();out=Path(args.output_dir);out.mkdir(parents=True,exist_ok=True)
    report=[]
    for bank in json.loads(Path(args.manifest).read_text()):
        for filing in bank["filings"]:
            result={"symbol":bank["symbol"],"security_id":bank["security_id"],"manifest_source_id":bank["source_record_id"],
                    "filing_id":filing["filingId"],"original_url":filing["originalUrl"],
                    "expected_sha256":filing["originalSha256"],"broadcast_literal":filing["broadcastDateLiteral"]}
            try:
                name=bank["symbol"]+"-"+filing["filingId"]+".html"
                path=Path(args.retained_dir)/name if args.retained_dir else out/name
                if args.retained_dir and not path.exists(): raise ValueError("RETAINED_ORIGINAL_MISSING")
                if not path.exists():
                    req=urllib.request.Request(filing["originalUrl"],headers={"User-Agent":"PortfolioAI source verification/1.0"})
                    with urllib.request.urlopen(req,timeout=30) as response: original=response.read()
                    path.write_bytes(original);time.sleep(1)
                original=path.read_bytes();actual=hashlib.sha256(original).hexdigest()
                result.update({"actual_sha256":actual,"original_bytes":len(original)})
                if actual!=filing["originalSha256"] or len(original)!=filing["originalBytes"]:
                    raise ValueError("ORIGINAL_BYTES_CHANGED")
                p=Tables();p.feed(original.decode("utf-8"));result.update(annual_cell(p.rows,bank["symbol"]))
                result["verification_mode"]="RETAINED_HASH_PINNED_ORIGINAL" if args.retained_dir else "FETCHED_ORIGINAL"
                if bank["symbol"]=="KARURVYSYA": result["admission_action"]="PRESERVE_EXISTING_OWNER_REVIEW; DO_NOT_REAPPROVE"
                elif bank["symbol"]=="AUBANK": result["admission_action"]="SFB_REGULATORY_APPLICABILITY_REQUIRED"
                else: result["admission_action"]="SCOPED_DELEGATED_REVIEW_ELIGIBILITY_PENDING"
            except Exception as error:
                result["qualification"]="BLOCKED";result["error"]=str(error)
            report.append(result)
    (out/"annual-roa-original-verification.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps([{"symbol":r["symbol"],"filing_id":r["filing_id"],"qualification":r["qualification"],"value":r.get("numeric_value"),"error":r.get("error")} for r in report]))
if __name__=="__main__":main()
