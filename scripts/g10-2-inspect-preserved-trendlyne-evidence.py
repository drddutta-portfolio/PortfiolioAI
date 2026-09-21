#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

SOURCE = Path("/tmp/portfolioai-g10-2-auropharma-evidence.json")
OUTPUT = Path("/tmp/portfolioai-g10-2-trendlyne-coverage.json")

REQUIRED_QUERIES = (
    "ANNUAL_FUNDAMENTALS",
    "QUARTERLY_MARGIN_HISTORY",
    "VALUATION_OWNERSHIP",
)

FAMILIES = {
    "QUALITY": (
        "operating profit margin", "opm", "operating profit", "operating revenue",
    ),
    "GROWTH": (
        "revenue growth", "sales growth", "cagr", "operating revenue",
    ),
    "CAPITAL_EFFICIENCY": (
        "roce", "return on capital employed",
    ),
    "CASH_FLOW": (
        "cash from operating", "cash flow from operating", "cfo",
        "capital expenditure", "capex", "free cash flow", "fcf",
    ),
    "BALANCE_SHEET_CREDIT": (
        "total debt", "net debt", "cash and bank", "interest coverage", "ebitda",
    ),
    "VALUATION": (
        "pe ttm", "p/e", "ev/ebitda", "ev per ebitda", "free-cash-flow yield",
        "free cash flow yield", "fcf yield",
    ),
    "OWNERSHIP_GOVERNANCE": (
        "promoter holding", "promoter pledge", "pledge",
    ),
    "MOMENTUM": (
        "price return", "return 1y", "return 6m", "12m return", "6m return",
        "rsi", "macd", "moving average", "relative strength",
    ),
    "RISK": (
        "beta", "volatility", "drawdown", "standard deviation",
    ),
    "BUSINESS_DURABILITY": (
        "pipeline", "r&d", "research and development", "complex generics",
        "specialty generics", "anda", "filing",
    ),
}

SYMBOLS = ("AUROPHARMA", "DRREDDY", "LUPIN", "ZYDUSLIFE")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def unwrap(value: Any) -> str:
    current: Any = value
    for _ in range(8):
        if isinstance(current, str):
            text = current.strip()
            try:
                current = json.loads(text)
                continue
            except Exception:
                return text.replace("\\n", "\n").replace("\\r", "")
        if isinstance(current, dict):
            for key in ("markdown_data", "result", "text", "content"):
                candidate = current.get(key)
                if isinstance(candidate, str):
                    current = candidate
                    break
            else:
                return json.dumps(current, ensure_ascii=False)
            continue
        return json.dumps(current, ensure_ascii=False)
    return str(current)


def normalize_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip())


def main() -> None:
    if not SOURCE.exists():
        fail(f"Missing preserved evidence file: {SOURCE}")

    try:
        payload = json.loads(SOURCE.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Could not parse preserved evidence JSON: {type(exc).__name__}")

    results = payload.get("partialTrendlyneResults")
    if payload.get("completedTrendlyneCalls") != 3 or not isinstance(results, dict):
        fail("Expected exactly three preserved Trendlyne results.")

    missing_queries = [code for code in REQUIRED_QUERIES if code not in results]
    if missing_queries:
        fail("Missing preserved query result(s): " + ", ".join(missing_queries))

    query_text: dict[str, str] = {
        code: unwrap(results[code])
        for code in REQUIRED_QUERIES
    }
    combined = "\n".join(query_text.values())
    combined_lower = combined.lower()

    coverage: dict[str, dict[str, Any]] = {}
    for family, terms in FAMILIES.items():
        observed_terms = [term for term in terms if term in combined_lower]
        coverage[family] = {
            "state": "OBSERVED_IN_PRESERVED_PAYLOAD" if observed_terms else "NOT_OBSERVED_IN_PRESERVED_PAYLOAD",
            "matchedTerms": observed_terms,
        }

    symbol_coverage = {
        symbol: symbol.lower() in combined_lower
        for symbol in SYMBOLS
    }

    samples: dict[str, list[str]] = {}
    for code, text in query_text.items():
        lines = [normalize_line(line) for line in text.splitlines() if normalize_line(line)]
        interesting = []
        for line in lines:
            lower = line.lower()
            if any(term in lower for terms in FAMILIES.values() for term in terms):
                interesting.append(line)
            if len(interesting) >= 25:
                break
        samples[code] = interesting

    output = {
        "source": str(SOURCE),
        "providerCallsThisInspection": 0,
        "preservedTrendlyneCalls": payload.get("completedTrendlyneCalls"),
        "queries": {
            code: {
                "characters": len(query_text[code]),
                "lineCount": len(query_text[code].splitlines()),
            }
            for code in REQUIRED_QUERIES
        },
        "symbolCoverage": symbol_coverage,
        "dimensionFamilyCoverage": coverage,
        "samples": samples,
    }

    OUTPUT.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")

    print("G10.2 PRESERVED TRENDLYNE COVERAGE INSPECTION")
    print("Provider calls made: 0")
    print("Preserved Trendlyne calls reused: 3")
    print()

    print("Symbol presence:")
    for symbol, present in symbol_coverage.items():
        print(f"  {symbol}: {'YES' if present else 'NO'}")

    print()
    print("Dimension-family coverage:")
    for family, item in coverage.items():
        terms = ", ".join(item["matchedTerms"][:6]) if item["matchedTerms"] else "-"
        print(f"  {family}: {item['state']} | {terms}")

    print()
    print("Saved detailed coverage:")
    print(f"  {OUTPUT}")
    print()
    print("Next step: build one narrow Trendlyne-only missing-data query from this matrix.")
    print("Do not rerun the old market-history fallback scripts.")


if __name__ == "__main__":
    main()
