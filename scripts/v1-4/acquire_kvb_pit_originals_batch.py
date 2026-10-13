"""Acquire only missing issuer originals from the retained official archive index.
Never infer publication from filename, board date or current retrieval.
"""
import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("retained_index"); parser.add_argument("output_dir")
    parser.add_argument("--reuse-dir", action="append", default=[])
    args = parser.parse_args(); out = Path(args.output_dir); out.mkdir(parents=True, exist_ok=True)
    index = Path(args.retained_index).read_bytes()
    paths = sorted(set(re.findall(r"href=[\"'](/docs/investor-presentation-[^\"']+\.pdf)", index.decode())))
    paths = [p for p in paths if re.search(r"presentation-202[1-6]", p)]
    started = time.perf_counter()
    def acquire(path):
        name = Path(path).name; dest = out / name
        url = "https://www.kvb.bank.in" + path
        result = {"original_url": url, "published_at": None, "publication_state": "EXCHANGE_DISSEMINATION_PROOF_REQUIRED",
            "retrieved_at": datetime.now(timezone.utc).isoformat(), "canonical_admitted": False}
        reuse = next((Path(d) / name for d in args.reuse_dir if (Path(d) / name).exists()), None)
        if dest.exists(): reuse = dest
        try:
            if reuse:
                raw = reuse.read_bytes(); result["acquisition"] = "REUSED_RETAINED_BYTES"
            else:
                request = urllib.request.Request(url, headers={"User-Agent": "PortfolioAI original filing research/1.0"})
                with urllib.request.urlopen(request, timeout=45) as response:
                    raw = response.read(); result["http_status"] = response.status
                result["acquisition"] = "ACQUIRED_ONCE_NO_RETRY"
            if not raw.startswith(b"%PDF-"):
                raise ValueError("ORIGINAL_PDF_REQUIRED")
            result.update(sha256=hashlib.sha256(raw).hexdigest(), original_bytes=len(raw), local_original=str(dest))
            if not dest.exists(): dest.write_bytes(raw)
            subprocess.run(["pdftotext", "-layout", str(dest), str(dest.with_suffix(".txt"))], check=True, capture_output=True)
            result["extracted_text_sha256"] = hashlib.sha256(dest.with_suffix(".txt").read_bytes()).hexdigest()
        except Exception as error:
            result["error"] = type(error).__name__
            result["acquisition"] = "FAILED_NO_RETRY"
        return result
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        documents = list(executor.map(acquire, paths))
    report = {"official_archive_index_sha256": hashlib.sha256(index).hexdigest(),
        "documents": documents, "maximum_parallel": 3, "retries": 0, "provider_calls": 0,
        "reused_originals": sum(d["acquisition"] == "REUSED_RETAINED_BYTES" for d in documents),
        "new_originals": sum(d["acquisition"] == "ACQUIRED_ONCE_NO_RETRY" for d in documents),
        "failed_originals": sum("error" in d for d in documents), "canonical_admissions": 0,
        "elapsed_seconds": round(time.perf_counter() - started, 3)}
    (out / "original-acquisition-manifest.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "documents"}))

if __name__ == "__main__": main()
