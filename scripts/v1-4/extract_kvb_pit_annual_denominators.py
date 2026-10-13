"""Extract literal annual BVPS/EPS series from the acquired publication-bound PDFs.
Annual EPS is NOT automatically TTM EPS. Source scope/share basis remain explicit gaps.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

def annual_series(text):
    results = []
    for page_number, page in enumerate(text.split("\f"), start=1):
        if not re.search(r"Book\s+Value", page, re.I): continue
        headers = [line for line in page.splitlines() if re.match(r"^\s*Year\s+", line) and re.search(r"20\d{2}-\d{2}", line)]
        if len(headers) != 1: continue
        years = re.findall(r"20\d{2}-\d{2}", headers[0])
        for code, pattern in [("BVPS_REPORTED", r"Book\s+Value\s*\([^)]*\)"), ("EPS_ANNUAL_REPORTED", r"EPS\s*\([^)]*\)")]:
            matches = [line for line in page.splitlines() if re.search(pattern, line, re.I)]
            if len(matches) != 1: continue
            match = re.search(pattern, matches[0], re.I)
            values = matches[0][match.end():].split()
            if len(values) != len(years): continue
            for year, value in zip(years, values):
                numeric = re.fullmatch(r"(-?\d+(?:\.\d+)?)([*^@#]*)", value)
                if not numeric: continue
                start = int(year[:4]); end = int(year[:2] + year[-2:])
                if end != start + 1: continue
                results.append({"code": code, "literal_value": value, "numeric_value": numeric[1],
                    "footnote_markers": numeric[2], "period_start": f"{start}-04-01", "period_end": f"{end}-03-31",
                    "unit": "INR_PER_SHARE", "source_page": page_number, "literal_year_header": headers[0],
                    "literal_metric_row": matches[0], "scope": "REQUIRES_SOURCE_RECONCILIATION",
                    "share_basis": "REQUIRES_CORPORATE_ACTION_RECONCILIATION",
                    "eps_basis": "BASIC_OR_DILUTED_NOT_PROVEN" if code == "EPS_ANNUAL_REPORTED" else None,
                    "canonical_admitted": False})
    return results

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("originals_dir"); parser.add_argument("prior_samples_dir"); parser.add_argument("output")
    args = parser.parse_args(); root = Path(args.originals_dir); prior = Path(args.prior_samples_dir)
    binding = json.loads((root / "exchange-publication-binding.json").read_text())
    samples = {hashlib.sha256(p.read_bytes()).hexdigest(): p for p in prior.glob("nse-*-presentation.pdf")}
    documents = []
    for source in binding["documents"]:
        name = "exchange-" + Path(source["issuer_url"]).name
        pdf = root / name
        if not pdf.exists(): pdf = samples.get(source.get("exchange_original_sha256"))
        if not pdf or not pdf.exists(): continue
        sha = hashlib.sha256(pdf.read_bytes()).hexdigest()
        if sha != source["exchange_original_sha256"]: raise ValueError("EXCHANGE_ORIGINAL_HASH_CHANGED")
        text_path = pdf.with_suffix(".txt")
        observations = annual_series(text_path.read_text())
        published = source.get("exchange_published_at") or source.get("published_at")
        for observation in observations:
            observation["source_available_at"] = published
            observation["lookahead_prohibited_before"] = published
        documents.append({"exchange_original_url": source["exchange_url"], "exchange_original_sha256": sha,
            "source_available_at": published, "observations": observations})
    report = {"version": "SOURCE_LITERAL_ANNUAL_DENOMINATOR_CANDIDATES_V1", "documents": documents,
        "sources_read": len(documents), "literal_observations": sum(len(d["observations"]) for d in documents),
        "canonical_admissions": 0, "ttm_eps_admissions": 0, "source_acquisitions": 0}
    Path(args.output).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "documents"}))

if __name__ == "__main__": main()
