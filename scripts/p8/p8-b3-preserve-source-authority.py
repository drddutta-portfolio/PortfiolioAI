#!/usr/bin/env python3
import hashlib
import io
import json
import os
import sys
import time
import urllib.parse
import zipfile
from datetime import datetime, timezone

import boto3
import psycopg
import requests

PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
CAMPAIGN_ID = "P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
EXPECTED_DATES = 241
PREFIX = "portfolioai-history/development/p8/b3/source-authority/v1"
MANIFEST_KEY = f"{PREFIX}/COMPLETE.json"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
)

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value

def r2_endpoint(account_id: str) -> str:
    raw = account_id.strip().rstrip("/")
    if raw.startswith("https://") or raw.startswith("http://"):
        parsed = urllib.parse.urlparse(raw)
        host = parsed.hostname or ""
        account = host.split(".")[0]
    else:
        account = raw
    if not account:
        raise RuntimeError("Unable to resolve Cloudflare account id")
    return f"https://{account}.r2.cloudflarestorage.com"

def fetch_official(session: requests.Session, url: str) -> bytes:
    last = None
    for attempt in range(1, 6):
        try:
            response = session.get(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/zip,application/octet-stream,*/*",
                    "Referer": "https://www.nseindia.com/all-reports",
                },
                timeout=60,
                allow_redirects=True,
            )
            response.raise_for_status()
            host = (urllib.parse.urlparse(response.url).hostname or "").lower()
            if host != "nsearchives.nseindia.com":
                raise RuntimeError(f"Official archive redirected to unexpected host: {host}")
            data = response.content
            if len(data) < 2 or data[:2] != b"PK":
                raise RuntimeError("Downloaded bhavcopy is not a ZIP")
            return data
        except Exception as exc:
            last = exc
            if attempt < 5:
                time.sleep(min(15, 2 ** (attempt - 1)))
    raise RuntimeError(f"Official source fetch failed for {url}: {last}")

def extract_csv(zip_bytes: bytes, preferred_member: str | None) -> tuple[str, bytes]:
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        members = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not members:
            raise RuntimeError("ZIP contains no CSV")
        member = None
        if preferred_member:
            for name in members:
                if name == preferred_member or os.path.basename(name) == os.path.basename(preferred_member):
                    member = name
                    break
        if member is None:
            member = next((n for n in members if "bhav" in os.path.basename(n).lower()), members[0])
        return member, zf.read(member)

def load_archives(db_url: str):
    sql = """
      select
        id::text as archive_id,
        source_kind,
        source_period_start::text as source_date,
        source_url,
        source_file_name,
        compressed_sha256,
        content_sha256,
        source_contract_version,
        archive_hash,
        raw_metadata
      from public.p8_b3_source_archives
      where source_kind like 'NSE_CM_BHAVCOPY%'
        and raw_metadata->>'campaign_id' = %s
      order by source_period_start, source_file_name
    """
    with psycopg.connect(db_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("select current_database(), pg_is_in_recovery(), current_setting('transaction_read_only')")
            db_name, in_recovery, tx_ro = cur.fetchone()
            cur.execute("select current_setting('app.settings.project_ref', true)")
            project_ref = cur.fetchone()[0]
            cur.execute(sql, (CAMPAIGN_ID,))
            columns = [d.name for d in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    return {
        "db_name": db_name,
        "in_recovery": in_recovery,
        "transaction_read_only": tx_ro,
        "project_ref_setting": project_ref,
        "rows": rows,
    }

def validate_rows(rows):
    if not rows:
        raise RuntimeError("No frozen-campaign bhavcopy metadata rows found")
    by_date = {}
    for row in rows:
        date = row["source_date"]
        if date in by_date:
            prev = by_date[date]
            if (
                prev["compressed_sha256"] != row["compressed_sha256"]
                or prev["content_sha256"] != row["content_sha256"]
                or prev["source_url"] != row["source_url"]
            ):
                raise RuntimeError(f"Conflicting frozen-campaign source metadata for {date}")
            continue
        if not row["source_url"] or not row["source_file_name"]:
            raise RuntimeError(f"Missing source URL/file for {date}")
        if not row["compressed_sha256"] or not row["content_sha256"]:
            raise RuntimeError(f"Missing source hashes for {date}")
        host = (urllib.parse.urlparse(row["source_url"]).hostname or "").lower()
        if host != "nsearchives.nseindia.com":
            raise RuntimeError(f"Non-official source host for {date}: {host}")
        by_date[date] = row
    if len(by_date) != EXPECTED_DATES:
        raise RuntimeError(f"Expected {EXPECTED_DATES} frozen bhavcopy dates, found {len(by_date)}")
    return [by_date[d] for d in sorted(by_date)]

def main():
    db_url = require_env("SUPABASE_DB_URL")
    account_id = require_env("CLOUDFLARE_R2_ACCOUNT_ID")
    access_key = require_env("CLOUDFLARE_R2_ACCESS_KEY_ID")
    secret_key = require_env("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    bucket = require_env("CLOUDFLARE_R2_BUCKET")
    if bucket != "portfolioai-history-dev":
        raise RuntimeError(f"Refusing unexpected R2 bucket: {bucket}")
    if PROJECT_REF not in db_url:
        raise RuntimeError("SUPABASE_DB_URL is not bound to PortfolioAI Dev")

    state = load_archives(db_url)
    rows = validate_rows(state["rows"])

    s3 = boto3.client(
        "s3",
        endpoint_url=r2_endpoint(account_id),
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
    session = requests.Session()

    preserved = []
    total_bytes = 0
    skipped_existing = 0
    uploaded = 0

    for index, row in enumerate(rows, 1):
        date = row["source_date"]
        file_name = row["source_file_name"]
        expected_zip = row["compressed_sha256"].lower()
        expected_csv = row["content_sha256"].lower()
        key = f"{PREFIX}/trade_date={date}/{file_name}"

        existing_ok = False
        try:
            head = s3.head_object(Bucket=bucket, Key=key)
            meta = {k.lower(): v for k, v in (head.get("Metadata") or {}).items()}
            if meta.get("sha256", "").lower() != expected_zip:
                raise RuntimeError(f"Existing R2 object hash metadata mismatch for {date}")
            obj = s3.get_object(Bucket=bucket, Key=key)
            existing_bytes = obj["Body"].read()
            if sha256_bytes(existing_bytes) != expected_zip:
                raise RuntimeError(f"Existing R2 object read-back mismatch for {date}")
            existing_ok = True
            zip_bytes = existing_bytes
            skipped_existing += 1
        except s3.exceptions.ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code not in {"404", "NoSuchKey", "NotFound"}:
                raise
        if not existing_ok:
            zip_bytes = fetch_official(session, row["source_url"])
            actual_zip = sha256_bytes(zip_bytes)
            if actual_zip != expected_zip:
                raise RuntimeError(
                    f"Compressed SHA-256 mismatch {date}: expected {expected_zip}, got {actual_zip}"
                )

        preferred = None
        raw_meta = row.get("raw_metadata") or {}
        if isinstance(raw_meta, dict):
            preferred = raw_meta.get("csv_member")
        member, csv_bytes = extract_csv(zip_bytes, preferred)
        actual_csv = sha256_bytes(csv_bytes)
        if actual_csv != expected_csv:
            raise RuntimeError(
                f"CSV/content SHA-256 mismatch {date}: expected {expected_csv}, got {actual_csv}"
            )

        if not existing_ok:
            s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=zip_bytes,
                ContentType="application/zip",
                Metadata={
                    "sha256": expected_zip,
                    "content_sha256": expected_csv,
                    "source_kind": row["source_kind"],
                    "campaign_id": CAMPAIGN_ID,
                    "source_date": date,
                    "archive_id": row["archive_id"],
                },
            )
            obj = s3.get_object(Bucket=bucket, Key=key)
            downloaded = obj["Body"].read()
            if sha256_bytes(downloaded) != expected_zip:
                raise RuntimeError(f"R2 upload/read-back mismatch for {date}")
            uploaded += 1

        total_bytes += len(zip_bytes)
        preserved.append({
            "source_date": date,
            "source_kind": row["source_kind"],
            "source_url": row["source_url"],
            "source_file_name": file_name,
            "archive_id": row["archive_id"],
            "archive_hash": row["archive_hash"],
            "compressed_sha256": expected_zip,
            "content_sha256": expected_csv,
            "csv_member": member,
            "object_key": key,
            "bytes": len(zip_bytes),
        })
        print(f"[{index}/{len(rows)}] PASS {date} {file_name}")

    fingerprint_input = [
        {
            "source_date": item["source_date"],
            "compressed_sha256": item["compressed_sha256"],
            "content_sha256": item["content_sha256"],
            "object_key": item["object_key"],
        }
        for item in preserved
    ]
    dataset_fingerprint = sha256_bytes(
        json.dumps(fingerprint_input, sort_keys=True, separators=(",", ":")).encode()
    )

    manifest = {
        "version": "PORTFOLIOAI_P8_B3_SOURCE_AUTHORITY_V1",
        "status": "PASS",
        "environment": "DEVELOPMENT",
        "project_ref": PROJECT_REF,
        "campaign_id": CAMPAIGN_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_dates": len(preserved),
        "expected_source_dates": EXPECTED_DATES,
        "first_source_date": preserved[0]["source_date"],
        "last_source_date": preserved[-1]["source_date"],
        "uploaded_objects": uploaded,
        "preexisting_verified_objects": skipped_existing,
        "total_compressed_bytes": total_bytes,
        "dataset_fingerprint_sha256": dataset_fingerprint,
        "database_observation": {
            "database_name": state["db_name"],
            "transaction_read_only": state["transaction_read_only"],
            "pg_is_in_recovery": state["in_recovery"],
        },
        "objects": preserved,
    }
    manifest_bytes = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
    manifest_sha = sha256_bytes(manifest_bytes)
    s3.put_object(
        Bucket=bucket,
        Key=MANIFEST_KEY,
        Body=manifest_bytes,
        ContentType="application/json",
        Metadata={"sha256": manifest_sha},
    )
    check = s3.get_object(Bucket=bucket, Key=MANIFEST_KEY)["Body"].read()
    if sha256_bytes(check) != manifest_sha:
        raise RuntimeError("Completion manifest R2 read-back mismatch")

    os.makedirs("tmp/p8-b3-source-authority", exist_ok=True)
    with open("tmp/p8-b3-source-authority/COMPLETE.json", "wb") as fh:
        fh.write(manifest_bytes)
    print(json.dumps({
        "status": "PASS",
        "source_dates": len(preserved),
        "uploaded_objects": uploaded,
        "preexisting_verified_objects": skipped_existing,
        "total_compressed_bytes": total_bytes,
        "dataset_fingerprint_sha256": dataset_fingerprint,
        "manifest_key": MANIFEST_KEY,
        "manifest_sha256": manifest_sha,
    }, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise
