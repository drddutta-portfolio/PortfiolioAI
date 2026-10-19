#!/usr/bin/env python3
"""Read-only original issuer PDF audit for IGL 2024 quarters; no database writes."""
import hashlib
import json
from pathlib import Path
import requests
import fitz

URL = "https://nsearchives.nseindia.com/corporate/IGL1_27012025192310_IntegratedUFR31122024.pdf"
def main():
    response = requests.get(URL, timeout=60, headers={"User-Agent":"Mozilla/5.0"})
    response.raise_for_status()
    if response.url != URL or not response.content.startswith(b"%PDF"):
        raise RuntimeError("NOT_EXACT_NSE_ORIGINAL")
    pdf = fitz.open(stream=response.content, filetype="pdf")
    text = "\n".join(page.get_text() for page in pdf)
    if "INDRAPRASTHA" not in text.upper() or "DECEMBER" not in text.upper():
        raise RuntimeError("ISSUER_OR_PERIOD_NOT_VERIFIED")
    dest = Path("tmp/results-r5/igl-original")
    dest.mkdir(parents=True, exist_ok=True)
    for i in range(min(4, len(pdf))):
        pdf[i].get_pixmap(matrix=fitz.Matrix(2,2)).save(str(dest / f"page-{i+1}.png"))
    (dest/"original-text.txt").write_text(text)
    (dest/"summary.json").write_text(json.dumps({
        "symbol":"IGL", "url":URL, "sha256":hashlib.sha256(response.content).hexdigest(),
        "pages":len(pdf), "admitted":0, "r4Changed":0, "status":"REVIEW_REQUIRED"},indent=2))
if __name__ == "__main__":
    main()
