"""Acquire original KVB balance-sheet filings once, retaining exchange timestamps.

This does not calculate or admit financial observations. Dates are taken from
the exchange dissemination field, never a filename or a current retrieval date.
"""
import argparse
import calendar
import concurrent.futures
import hashlib
import json
import re
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TARGETS = [(year, month) for year in range(2021, 2027) for month in (3, 9)
           if (year, month) <= (2026, 3)]


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "PortfolioAI official filing qualification/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        raw = response.read(32 * 1024 * 1024 + 1)
    if len(raw) > 32 * 1024 * 1024: raise ValueError("ORIGINAL_SIZE_LIMIT")
    return raw


def source_for_period(rows, year, month, verified_equivalences=None):
    name = calendar.month_name[month]
    period = re.compile(rf"(?:{name}\s+(?:31|30),?\s+{year}|{name}[- ]{year}|{name}[- ]?20{str(year)[-2:]})", re.I)
    candidates = [r for r in rows if r.get("symbol") == "KARURVYSYA"
                  and r.get("desc") in ("Financial Result Updates", "Outcome of Board Meeting")
                  and period.search(str(r.get("attchmntText", "")))]
    # Multiple exchange categories may point to the same original. Different
    # originals are not resolved by choosing a newer capture.
    by_url = {}
    for row in candidates:
        url = row.get("attchmntFile", "")
        if not url.startswith("https://nsearchives.nseindia.com/corporate/") or not url.lower().endswith(".pdf"):
            raise ValueError("OFFICIAL_ORIGINAL_URL_REQUIRED")
        dt = datetime.strptime(row["exchdisstime"], "%d-%b-%Y %H:%M:%S")
        if url not in by_url or dt < datetime.strptime(by_url[url]["exchdisstime"], "%d-%b-%Y %H:%M:%S"):
            by_url[url] = row
    if len(by_url) > 1 and verified_equivalences:
        hashes = [verified_equivalences.get(url) for url in by_url]
        if all(hashes) and len(set(hashes)) == 1:
            return min(by_url.values(), key=lambda row: datetime.strptime(row["exchdisstime"], "%d-%b-%Y %H:%M:%S"))
    if len(by_url) != 1: raise ValueError(f"EXACT_PERIOD_ORIGINAL_UNRESOLVED:{year}-{month:02d}:{len(by_url)}")
    return next(iter(by_url.values()))


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("source_root"); args = parser.parse_args()
    root = Path(args.source_root); out = root / "financial-pit-batch"; out.mkdir(exist_ok=True)
    origin_file = out / "discovery-origin.json"
    origins = json.loads(origin_file.read_text()) if origin_file.exists() else {}
    # Only locally hash-verified byte-equivalent originals resolve URL aliases.
    variants_file = out / "2022-submission-variants.json"
    equivalences = {}
    original_candidates = {}
    if variants_file.exists():
        for item in json.loads(variants_file.read_text()):
            original = Path(item["local_original"])
            if hashlib.sha256(original.read_bytes()).hexdigest() != item["original_sha256"]:
                raise ValueError("ORIGINAL_EQUIVALENCE_BYTES_CHANGED")
            equivalences[item["source_url"]] = item["original_sha256"]
            original_candidates[item["source_url"]] = original
    results = []
    def acquire(target):
        year, month = target
        discovery_month = 5 if month == 3 else 10
        api_file = root / "pit-quarter-batch" / f"nse-announcements-{year}-{discovery_month:02d}.json"
        # October-November covers the older late-reporting September quarter.
        end_month = 5 if month == 3 else 11
        api_url = (f"https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=KARURVYSYA"
                   f"&from_date=01-{discovery_month:02d}-{year}&to_date={calendar.monthrange(year, end_month)[1]:02d}-{end_month:02d}-{year}")
        downloads = 0; discovery_requests = 0
        try:
            if api_file.exists():
                raw_api = api_file.read_bytes()
                api_url = api_url.replace(f"to_date={calendar.monthrange(year, end_month)[1]:02d}-{end_month:02d}-{year}",
                                          f"to_date={calendar.monthrange(year, discovery_month)[1]:02d}-{discovery_month:02d}-{year}")
                origin = origins.get(str(api_file))
                if origin:
                    if hashlib.sha256(raw_api).hexdigest() != origin["sha256"]: raise ValueError("DISCOVERY_ORIGIN_HASH_CHANGED")
                    api_url = origin["url"]
            else:
                raw_api = fetch(api_url); json.loads(raw_api); api_file.write_bytes(raw_api); discovery_requests = 1
                origins[str(api_file)] = {"sha256": hashlib.sha256(raw_api).hexdigest(), "url": api_url}
            rows = json.loads(raw_api)
            if not isinstance(rows, list): raise ValueError("EXCHANGE_RESPONSE_CONTRACT_INVALID")
            try: row = source_for_period(rows, year, month, equivalences)
            except ValueError:
                # An existing October-only cache does not establish absence of
                # November disclosures. One distinct November request is allowed.
                if month != 9 or not api_file.exists(): raise
                november = out / f"nse-announcements-{year}-11.json"
                nov_url = api_url.replace(f"01-10-{year}", f"01-11-{year}")
                if november.exists(): raw_nov = november.read_bytes()
                else: raw_nov = fetch(nov_url); json.loads(raw_nov); november.write_bytes(raw_nov); discovery_requests += 1
                row = source_for_period(json.loads(raw_nov), year, month, equivalences)
                raw_api = raw_nov; api_url = nov_url
            url = row["attchmntFile"]; pdf = out / f"nse-financial-{year}-{month:02d}.pdf"
            if pdf.exists(): raw = pdf.read_bytes()
            elif url in original_candidates:
                raw = original_candidates[url].read_bytes()
            else: raw = fetch(url); downloads = 1
            if not raw.startswith(b"%PDF-"): raise ValueError("ORIGINAL_PDF_REQUIRED")
            if not pdf.exists(): pdf.write_bytes(raw)
            text = pdf.with_suffix(".txt")
            if not text.exists(): subprocess.run(["pdftotext", "-layout", str(pdf), str(text)], check=True)
            statement = text.read_text()
            extraction = "PDF_EMBEDDED_TEXT"
            ocr = out / ("ocr-nse-financial-" + f"{year}-{month:02d}") / "complete-ocr.txt"
            if not ocr.exists() and url in original_candidates:
                ocr = out / ("ocr-" + original_candidates[url].stem) / "complete-ocr.txt"
            if not re.search(r"Karur\s+Vysya\s+Bank", statement, re.I) and ocr.exists():
                statement = ocr.read_text(); extraction = "OCR_NUMERIC_CELLS_REQUIRE_VISUAL_VERIFICATION"
            if not re.search(r"Karur\s+Vysya\s+Bank", statement, re.I): raise ValueError("ORIGINAL_ISSUER_IDENTITY_UNPROVEN")
            at = datetime.strptime(row["exchdisstime"], "%d-%b-%Y %H:%M:%S").replace(tzinfo=ZoneInfo("Asia/Kolkata"))
            return {"period_end": f"{year}-{month:02d}-{calendar.monthrange(year, month)[1]}",
                    "original_url": url, "original_sha256": hashlib.sha256(raw).hexdigest(), "original_bytes": len(raw),
                    "published_at": at.isoformat(), "publication_entry": row, "publication_proof_sha256": hashlib.sha256(raw_api).hexdigest(),
                    "publication_proof_url": api_url, "local_original": str(pdf), "text_characters": len(statement),
                    "text_extraction": extraction,
                    "source_downloads": downloads, "discovery_requests": discovery_requests, "state": "ORIGINAL_CAPTURED_NOT_ADMITTED"}
        except Exception as error:
            return {"period_end": f"{year}-{month:02d}", "state": "FAILED_NO_RETRY_OR_ADMISSION", "error": str(error),
                    "source_downloads": downloads, "discovery_requests": discovery_requests}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(acquire, TARGETS))
    report = {"documents": results, "provider_calls": 0, "canonical_admissions": 0,
              "source_downloads": sum(r["source_downloads"] for r in results), "discovery_requests": sum(r["discovery_requests"] for r in results)}
    (out / "statutory-batch.json").write_text(json.dumps(report, indent=2) + "\n")
    origin_file.write_text(json.dumps(origins, indent=2) + "\n")
    print(json.dumps({**{k: v for k, v in report.items() if k != "documents"}, "periods": [{k: v for k, v in r.items() if k in ("period_end", "state", "error", "text_characters")} for r in results]}))


if __name__ == "__main__": main()
