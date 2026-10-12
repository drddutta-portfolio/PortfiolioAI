"""Archive fixed, hash-qualified NSE originals in Development R2; never overwrite.
Existing objects are read and checked before any download. No canonical admission.
"""
import concurrent.futures
import hashlib
import json
import os
import re
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

BUCKET = "portfolioai-history-dev"
PREFIX = "portfolioai-history/development/v1-4/banking/pit-originals/"

def qualified_source(source):
    url = source["exchange_url"]; digest = source["exchange_original_sha256"]
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname != "nsearchives.nseindia.com" or not parsed.path.startswith("/corporate/KARURVYSYA_") or not parsed.path.lower().endswith(".pdf") or parsed.query or parsed.fragment or parsed.username:
        raise ValueError("EXACT_OFFICIAL_KVB_ORIGINAL_REQUIRED")
    if not re.fullmatch(r"[a-f0-9]{64}", digest): raise ValueError("ORIGINAL_SHA256_REQUIRED")
    return url, digest, PREFIX + digest + ".pdf"

def main():
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError
    account = os.environ["CLOUDFLARE_R2_ACCOUNT_ID"]
    if os.environ["CLOUDFLARE_R2_BUCKET"] != BUCKET or account != "ced17d24f4b380721e58a08c9e9273e4":
        raise ValueError("DEVELOPMENT_R2_REQUIRED")
    sources = json.loads(Path("docs/private/v1-4-industry-batches/KVB_PIT_Exchange_Publication_Batch_2026-10-12.json").read_text())["documents"]
    if len(sources) != 22 or len({s["exchange_original_sha256"] for s in sources}) != 22:
        raise ValueError("EXACT_22_ORIGINALS_REQUIRED")
    s3 = boto3.client("s3", endpoint_url=f"https://{account}.r2.cloudflarestorage.com", region_name="auto", config=Config(retries={"total_max_attempts": 1}))
    def archive(source):
        url, digest, key = qualified_source(source)
        result = {"original_url": url, "original_sha256": digest, "bucket": BUCKET, "object_key": key, "canonical_admitted": False}
        try:
            try:
                raw = s3.get_object(Bucket=BUCKET, Key=key)["Body"].read()
                if hashlib.sha256(raw).hexdigest() != digest: raise ValueError("EXISTING_IMMUTABLE_OBJECT_HASH_CONFLICT")
                result.update(state="REUSED_HASH_VERIFIED_OBJECT", readback_sha256=digest, bytes=len(raw))
                return result
            except ClientError as error:
                if error.response["Error"]["Code"] not in ("NoSuchKey", "404", "NotFound"): raise
            request = urllib.request.Request(url, headers={"User-Agent": "PortfolioAI immutable original archival/1.0"})
            with urllib.request.urlopen(request, timeout=60) as response: raw = response.read()
            if not raw.startswith(b"%PDF-") or hashlib.sha256(raw).hexdigest() != digest:
                raise ValueError("ORIGINAL_CHANGED_DO_NOT_ARCHIVE")
            # Conditional creation is mandatory. Unsupported conditional writes fail
            # closed rather than falling back to an overwriting PUT.
            try:
                s3.put_object(Bucket=BUCKET, Key=key, Body=raw, ContentType="application/pdf", IfNoneMatch="*", Metadata={"sha256": digest})
                state = "CREATED_ONCE"
            except ClientError as error:
                if error.response["Error"]["Code"] not in ("PreconditionFailed", "412"): raise
                state = "CONCURRENT_IDENTICAL_OBJECT_REUSED"
            readback = s3.get_object(Bucket=BUCKET, Key=key)["Body"].read()
            if hashlib.sha256(readback).hexdigest() != digest: raise ValueError("ARCHIVE_READBACK_HASH_MISMATCH")
            result.update(state=state, readback_sha256=digest, bytes=len(readback))
        except Exception as error:
            result.update(state="FAILED_NO_OVERWRITE_OR_RETRY", error=type(error).__name__, safe_code=str(error) if isinstance(error, ValueError) else None)
        return result
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor: results = list(executor.map(archive, sources))
    report = {"expected_originals": 22, "hash_verified_originals": sum(r.get("readback_sha256") == r["original_sha256"] for r in results),
        "provider_calls": 0, "canonical_admissions": 0, "overwrites": 0, "results": results}
    out = Path("kvb-pit-r2-original-archive"); out.mkdir(exist_ok=True)
    (out / "archive-receipts.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "results"}))
    if report["hash_verified_originals"] != 22: raise SystemExit(1)

if __name__ == "__main__": main()
