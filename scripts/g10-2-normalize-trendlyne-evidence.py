#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

BASE = Path("/tmp/portfolioai-g10-2-auropharma-evidence.json")
GAP = Path("/tmp/portfolioai-g10-2-trendlyne-gap-fill.json")
OUT = Path("/tmp/portfolioai-g10-2-normalized-evidence.json")

STOCK_SYMBOLS = ("AUROPHARMA", "DRREDDY", "LUPIN", "ZYDUSLIFE")
INDEX_SYMBOL = "NIFTYPHARMA"
ALL_SYMBOLS = STOCK_SYMBOLS + (INDEX_SYMBOL,)

ALIASES = {
    "NIFTY PHARMA": INDEX_SYMBOL,
    "NIFTYPHARMA": INDEX_SYMBOL,
    "AUROPHARMA": "AUROPHARMA",
    "DRREDDY": "DRREDDY",
    "LUPIN": "LUPIN",
    "ZYDUSLIFE": "ZYDUSLIFE",
}

# Strong semantic matchers only. Generic tokens such as "return", "1Y",
# "momentum" or "EBITDA" alone are intentionally forbidden because the
# Trendlyne response can contain hundreds of unrelated index/profile fields.
CANONICAL_PATTERNS = [
    ("OPERATING_MARGIN", re.compile(r"\b(OPM|OPERATING\s+PROFIT\s+MARGIN)\b", re.I)),
    ("OPERATING_PROFIT", re.compile(r"\bOPERATING\s+PROFIT\b(?!\s+MARGIN)", re.I)),
    ("OPERATING_REVENUE", re.compile(r"\bOPERATING\s+REVENUE\b", re.I)),
    ("REVENUE_GROWTH_1Y", re.compile(r"\b(OPERATING\s+REVENUE|SALES|TOTAL\s+REVENUE).*\b(1\s*Y(?:R|EAR)?|1Y).*\b(CHG|GROWTH)\b|\b(1\s*Y(?:R|EAR)?|1Y).*\b(OPERATING\s+REVENUE|SALES|TOTAL\s+REVENUE).*\b(CHG|GROWTH)\b", re.I)),
    ("REVENUE_CAGR_3Y", re.compile(r"\b(OPERATING\s+REVENUE|SALES|TOTAL\s+REVENUE).*\b3\s*Y(?:R|EAR)?.*\bCAGR\b|\b3\s*Y(?:R|EAR)?.*\b(OPERATING\s+REVENUE|SALES|TOTAL\s+REVENUE).*\bCAGR\b", re.I)),
    ("ROCE", re.compile(r"\bROCE\b|\bRETURN\s+ON\s+CAPITAL\s+EMPLOYED\b", re.I)),
    ("CFO", re.compile(r"\b(CASH\s+FROM\s+OPERATING|CASH\s+FLOW\s+FROM\s+OPERATING|CFO)\b", re.I)),
    ("CAPEX", re.compile(r"\b(CAPITAL\s+EXPENDITURE|CAPEX)\b", re.I)),
    ("FREE_CASH_FLOW", re.compile(r"\b(FREE\s+CASH\s+FLOW|FCF)\b(?!\s+YIELD)", re.I)),
    ("TOTAL_DEBT", re.compile(r"\bTOTAL\s+DEBT\b", re.I)),
    ("NET_DEBT", re.compile(r"\bNET\s+DEBT\b", re.I)),
    ("CASH_BANK", re.compile(r"\bCASH\s+(?:AND|&)\s+BANK\b", re.I)),
    ("INTEREST_COVERAGE", re.compile(r"\bINTEREST\s+COVERAGE\b", re.I)),
    ("EBITDA", re.compile(r"^EBITDA(?:\s+ANN\.?|\s+TTM|\s+1Y\s+AGO|\s+2Y\s+AGO|\s+3Y\s+AGO)?$", re.I)),
    ("PE_TTM", re.compile(r"^P/?E\s+TTM$|^PE\s+TTM$", re.I)),
    ("EV_EBITDA", re.compile(r"^EV\s*(?:/|PER)\s*EBITDA(?:\s+ANN\.?)?$", re.I)),
    ("FCF_YIELD", re.compile(r"\b(FREE\s+CASH\s+FLOW|FCF)\s+YIELD\b", re.I)),
    ("PROMOTER_HOLDING", re.compile(r"^PROMOTER\s+HOLDING(?:\s+(?:QOQ|1Y)\s+CHANGE)?\s*%?$", re.I)),
    ("PROMOTER_PLEDGE", re.compile(r"\bPROMOTER\s+PLEDGE\b|\bPLEDGED\s+PROMOTER\b", re.I)),
    ("RETURN_6M", re.compile(r"^(?:6\s*M|6\s*MONTH|6\s*MONTHS).*\b(?:RETURN|CHG)\b|^(?:RETURN|CHG).*\b(?:6\s*M|6\s*MONTH|6\s*MONTHS)\b", re.I)),
    ("RETURN_1Y", re.compile(r"^(?:1\s*Y|1\s*YR|1\s*YEAR).*\b(?:RETURN|CHG)\b|^(?:RETURN|CHG).*\b(?:1\s*Y|1\s*YR|1\s*YEAR)\b", re.I)),
    ("BETA_1Y", re.compile(r"\bBETA\b.*\b(?:1\s*Y|1\s*YR|1\s*YEAR)\b|\b(?:1\s*Y|1\s*YR|1\s*YEAR)\b.*\bBETA\b", re.I)),
    ("VOLATILITY_1Y", re.compile(r"\bVOLATIL(?:ITY|ITY\s*%)\b.*\b(?:1\s*Y|1\s*YR|1\s*YEAR)\b|\b(?:1\s*Y|1\s*YR|1\s*YEAR)\b.*\bVOLATIL", re.I)),
    ("MAX_DRAWDOWN_1Y", re.compile(r"\bMAX(?:IMUM)?\s+DRAWDOWN\b.*\b(?:1\s*Y|1\s*YR|1\s*YEAR)\b|\b(?:1\s*Y|1\s*YR|1\s*YEAR)\b.*\bMAX(?:IMUM)?\s+DRAWDOWN\b", re.I)),
    ("RSI", re.compile(r"^RSI(?:\s+\d+)?$", re.I)),
    ("MACD", re.compile(r"^MACD(?:\s+.*)?$", re.I)),
    ("TRENDLYNE_MOMENTUM_SCORE", re.compile(r"\b(?:TL|TRENDLYNE)\s+MOMENTUM\s+SCORE\b", re.I)),
]

INDEX_ALLOWED = {"RETURN_6M", "RETURN_1Y"}
STOCK_ALLOWED = {name for name, _ in CANONICAL_PATTERNS}


def fail(message: str) -> None:
    print("ERROR:", message, file=sys.stderr)
    raise SystemExit(1)


def unwrap(value: Any) -> str:
    current = value
    for _ in range(10):
        if isinstance(current, str):
            text = current.strip()
            try:
                current = json.loads(text)
                continue
            except Exception:
                return text.replace("\\n", "\n").replace("\\r", "").replace("\\\\", "\\")
        if isinstance(current, dict):
            for key in ("markdown_data", "result", "text", "content"):
                if isinstance(current.get(key), str):
                    current = current[key]
                    break
            else:
                return json.dumps(current, ensure_ascii=False)
            continue
        return json.dumps(current, ensure_ascii=False)
    return str(current)


def clean(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip().strip("\\").strip())


def canonical_label(label: str) -> str | None:
    normalized = clean(label).strip(":")
    for canonical, pattern in CANONICAL_PATTERNS:
        if pattern.search(normalized):
            return canonical
    return None


def parse_blocks(text: str, allowed_symbols: tuple[str, ...], allowed_canonical: set[str]):
    lines = [clean(x) for x in text.splitlines()]
    symbol_pattern = "|".join(re.escape(x) for x in ("AUROPHARMA", "DRREDDY", "LUPIN", "ZYDUSLIFE", "NIFTY ?PHARMA"))
    symbol_re = re.compile(rf"^({symbol_pattern})\s*:\s*(.+)$", re.I)

    blocks = []
    current_label = None
    current_canonical = None
    current_values = {}

    def flush():
        nonlocal current_label, current_canonical, current_values
        if current_canonical and current_values:
            filtered = {
                symbol: value
                for symbol, value in current_values.items()
                if symbol in allowed_symbols
            }
            if filtered:
                blocks.append({
                    "canonical": current_canonical,
                    "label": current_label,
                    "values": filtered,
                })
        current_label = None
        current_canonical = None
        current_values = {}

    for line in lines:
        if not line:
            continue

        match = symbol_re.match(line)
        if match and current_canonical:
            raw_symbol = re.sub(r"\s+", " ", match.group(1).upper())
            symbol = ALIASES.get(raw_symbol, raw_symbol.replace(" ", ""))
            if symbol in allowed_symbols:
                current_values[symbol] = match.group(2).strip()
            continue

        candidate = canonical_label(line)
        if candidate and candidate in allowed_canonical:
            flush()
            current_label = line
            current_canonical = candidate
            continue

        if re.fullmatch(r"-{3,}", line):
            flush()

    flush()
    return blocks


def load():
    if not BASE.exists():
        fail(f"Missing {BASE}")
    if not GAP.exists():
        fail(f"Missing {GAP}")

    base = json.loads(BASE.read_text(encoding="utf-8"))
    gap = json.loads(GAP.read_text(encoding="utf-8"))

    if base.get("completedTrendlyneCalls") != 3:
        fail("Base file does not contain 3 preserved Trendlyne calls")
    if gap.get("providerCalls") != 2:
        fail("Gap file does not contain exactly 2 Trendlyne calls")
    return base, gap


def main():
    base, gap = load()

    stock_blocks = []
    for code, raw in (base.get("partialTrendlyneResults") or {}).items():
        text = unwrap(raw)
        for block in parse_blocks(text, STOCK_SYMBOLS, STOCK_ALLOWED):
            block["source"] = f"BASE_{code}"
            stock_blocks.append(block)

    for block in parse_blocks(unwrap(gap.get("stockResult")), STOCK_SYMBOLS, STOCK_ALLOWED):
        block["source"] = "GAP_STOCK"
        stock_blocks.append(block)

    index_blocks = []
    for block in parse_blocks(unwrap(gap.get("indexResult")), (INDEX_SYMBOL,), INDEX_ALLOWED):
        block["source"] = "GAP_INDEX"
        index_blocks.append(block)

    # Keep the latest observed block per canonical metric/source/value combination.
    dedup = {}
    for block in stock_blocks + index_blocks:
        key = (
            block["canonical"],
            tuple(sorted(block["values"].items())),
        )
        dedup[key] = block
    blocks = list(dedup.values())

    by_metric = {}
    for block in blocks:
        by_metric.setdefault(block["canonical"], []).append(block)

    result = {
        "providerCallsThisStep": 0,
        "reusedTrendlyneCalls": 5,
        "metrics": by_metric,
    }
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print("G10.2 STRICT NORMALIZED TRENDLYNE EVIDENCE")
    print("Provider calls made: 0")
    print("Trendlyne results reused: 5")
    print()

    ordered = [name for name, _ in CANONICAL_PATTERNS]
    for metric in ordered:
        candidates = by_metric.get(metric, [])
        if not candidates:
            continue
        print(metric)
        for block in candidates:
            print(f"  Source: {block['source']} | Label: {block['label']}")
            for symbol in ALL_SYMBOLS:
                if symbol in block["values"]:
                    print(f"    {symbol}: {block['values'][symbol]}")
        print()

    missing_core = [
        metric
        for metric in (
            "OPERATING_MARGIN","ROCE","CFO","FREE_CASH_FLOW",
            "NET_DEBT","INTEREST_COVERAGE","PE_TTM","EV_EBITDA",
            "PROMOTER_HOLDING","PROMOTER_PLEDGE",
            "RETURN_6M","RETURN_1Y","TRENDLYNE_MOMENTUM_SCORE"
        )
        if metric not in by_metric
    ]

    print("Missing core metric families after strict normalization:")
    if missing_core:
        for metric in missing_core:
            print("  " + metric)
    else:
        print("  NONE")

    print()
    print("Saved:", OUT)
    print("No provider call and no database write was performed.")


if __name__ == "__main__":
    main()
