#!/usr/bin/env python3
"""
P8-B3 S3 Parquet preservation canary.

Purpose:
- take a deterministic read-only fixture extracted from PortfolioAI Dev;
- write it to Parquet using DuckDB;
- read it back;
- prove exact lexical preservation of UUIDs, dates/timestamps, decimal strings,
  hashes, and canonical JSON metadata;
- emit a machine-readable manifest with fingerprints and file SHA-256.

This script does not connect to Supabase and does not mutate any remote system.
R2 upload/download verification is handled separately by CI when credentials exist.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any

import duckdb


COLUMNS = [
    "id",
    "portfolio_id",
    "experiment_id",
    "historical_identity_id",
    "source_archive_id",
    "trade_date",
    "exchange",
    "trading_symbol",
    "series",
    "source_format",
    "previous_close",
    "open",
    "high",
    "low",
    "close",
    "last_price",
    "volume",
    "traded_value",
    "trade_count",
    "row_hash",
    "raw_metadata",
    "created_at",
]

CANARY_SCHEMA_VERSION = "P8_B3_RAW_PRICE_PARQUET_CANARY_V1"
EXPECTED_SOURCE_ARCHIVE_ID = "183e942c-a54d-5889-8043-436eebeb635d"
EXPECTED_TRADE_DATE = "2023-10-03"
EXPECTED_EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def normalize_row(row: dict[str, Any]) -> dict[str, str | None]:
    normalized: dict[str, str | None] = {}
    for column in COLUMNS:
        if column not in row:
            raise ValueError(f"missing required column: {column}")

        value = row[column]
        if column == "raw_metadata":
            if value is None:
                normalized[column] = None
            elif isinstance(value, str):
                normalized[column] = canonical_json(json.loads(value))
            else:
                normalized[column] = canonical_json(value)
            continue

        normalized[column] = None if value is None else str(value)

    return normalized


def canonical_rows(rows: list[dict[str, str | None]]) -> str:
    ordered = sorted(rows, key=lambda row: row["id"] or "")
    return "\n".join(canonical_json(row) for row in ordered)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_fixture(rows: list[dict[str, str | None]]) -> None:
    if not rows:
        raise ValueError("fixture is empty")

    ids: set[str] = set()
    for row in rows:
        row_id = row["id"]
        if not row_id:
            raise ValueError("row id is empty")
        if row_id in ids:
            raise ValueError(f"duplicate row id: {row_id}")
        ids.add(row_id)

        if row["source_archive_id"] != EXPECTED_SOURCE_ARCHIVE_ID:
            raise ValueError(f"unexpected source_archive_id for {row_id}")
        if row["trade_date"] != EXPECTED_TRADE_DATE:
            raise ValueError(f"unexpected trade_date for {row_id}")
        if row["experiment_id"] != EXPECTED_EXPERIMENT_ID:
            raise ValueError(f"unexpected experiment_id for {row_id}")

        row_hash = row["row_hash"] or ""
        if len(row_hash) != 64 or any(char not in "0123456789abcdef" for char in row_hash):
            raise ValueError(f"invalid row_hash for {row_id}")


def write_and_read_parquet(
    rows: list[dict[str, str | None]],
    parquet_path: Path,
) -> list[dict[str, str | None]]:
    connection = duckdb.connect(database=":memory:")
    try:
        columns_sql = ",\n".join(f'"{column}" VARCHAR' for column in COLUMNS)
        connection.execute(f"CREATE TABLE canary (\n{columns_sql}\n)")

        placeholders = ",".join("?" for _ in COLUMNS)
        values = [[row[column] for column in COLUMNS] for row in rows]
        connection.executemany(
            f"INSERT INTO canary VALUES ({placeholders})",
            values,
        )

        parquet_literal = str(parquet_path).replace("'", "''")
        connection.execute(
            f"""
            COPY (
              SELECT {", ".join(f'"{column}"' for column in COLUMNS)}
              FROM canary
              ORDER BY id
            )
            TO '{parquet_literal}'
            (FORMAT PARQUET, COMPRESSION ZSTD, PARQUET_VERSION 'V2')
            """
        )

        result = connection.execute(
            f"""
            SELECT {", ".join(f'"{column}"' for column in COLUMNS)}
            FROM read_parquet('{parquet_literal}')
            ORDER BY id
            """
        ).fetchall()

        return [
            {column: value for column, value in zip(COLUMNS, row)}
            for row in result
        ]
    finally:
        connection.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", required=True)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    fixture_path = Path(args.fixture)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    raw_rows = json.loads(fixture_path.read_text(encoding="utf-8"))
    if not isinstance(raw_rows, list):
        raise ValueError("fixture must contain a JSON array")

    source_rows = [normalize_row(row) for row in raw_rows]
    validate_fixture(source_rows)

    source_canonical = canonical_rows(source_rows)
    source_fingerprint = sha256_text(source_canonical)

    parquet_path = out_dir / "p8-b3-storage-s3-canary-2023-10-03.parquet"
    readback_rows = write_and_read_parquet(source_rows, parquet_path)
    readback_canonical = canonical_rows(readback_rows)
    readback_fingerprint = sha256_text(readback_canonical)

    if source_rows != readback_rows:
        raise RuntimeError("P8_B3_S3_PARQUET_ROW_MISMATCH")
    if source_fingerprint != readback_fingerprint:
        raise RuntimeError("P8_B3_S3_PARQUET_FINGERPRINT_MISMATCH")

    parquet_sha256 = sha256_file(parquet_path)
    manifest = {
        "status": "PASS",
        "schema_version": CANARY_SCHEMA_VERSION,
        "duckdb_version": duckdb.__version__,
        "source_fixture": str(fixture_path),
        "source_archive_id": EXPECTED_SOURCE_ARCHIVE_ID,
        "trade_date": EXPECTED_TRADE_DATE,
        "experiment_id": EXPECTED_EXPERIMENT_ID,
        "row_count": len(source_rows),
        "columns": COLUMNS,
        "storage_types": {column: "VARCHAR" for column in COLUMNS},
        "precision_policy": (
            "All source values are lexically preserved in the canary. "
            "PostgreSQL NUMERIC values remain decimal strings, avoiding binary "
            "floating-point conversion. raw_metadata is canonical JSON text."
        ),
        "source_fingerprint_sha256": source_fingerprint,
        "readback_fingerprint_sha256": readback_fingerprint,
        "parquet_file": parquet_path.name,
        "parquet_bytes": parquet_path.stat().st_size,
        "parquet_sha256": parquet_sha256,
        "r2_object_key": (
            "portfolioai-history/development/p8/b3/canary/v1/"
            "trade_date=2023-10-03/p8-b3-storage-s3-canary.parquet"
        ),
        "remote_storage": {
            "provider": "CLOUDFLARE_R2",
            "upload_verified": False,
            "note": (
                "Set R2 secrets in the CI environment to activate upload + "
                "download SHA-256 verification."
            ),
        },
    }

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
