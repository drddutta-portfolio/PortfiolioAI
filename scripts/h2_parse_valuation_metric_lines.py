#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("usage: h2_parse_valuation_metric_lines.py <metric_result_file>")

raw = Path(sys.argv[1]).read_text(encoding="utf-8").strip()
if not raw:
    raise SystemExit("ERROR: metric_result payload is empty")

def unwrap(value):
    for _ in range(6):
        if isinstance(value, str):
            text = value.strip()
            try:
                value = json.loads(text)
                continue
            except Exception:
                return text
        if isinstance(value, dict):
            if isinstance(value.get("markdown_data"), str):
                value = value["markdown_data"]
                continue
            if isinstance(value.get("result"), str):
                value = value["result"]
                continue
        break
    return value

value = unwrap(raw)
if isinstance(value, dict):
    text = json.dumps(value, ensure_ascii=False, indent=2)
else:
    text = str(value)

text = text.replace("\\n", "\n").replace("\\r", "")
text = text.replace("\\\\", "\\")
lines = [line.strip().rstrip("\\").strip() for line in text.splitlines() if line.strip()]

label_patterns = [
    re.compile(r"\bP\s*/\s*E\b", re.I),
    re.compile(r"\bPE\s*TTM\b", re.I),
    re.compile(r"\bP/E\s*TTM\b", re.I),
    re.compile(r"\bEV\s*/\s*EBITDA\b", re.I),
    re.compile(r"\bEV\s+EBITDA\b", re.I),
    re.compile(r"enterprise\s+value.*EBITDA", re.I),
]
stock_re = re.compile(r"^(TORNTPHARM|MANKIND|ERIS|EMCURE)\s*:\s*(.+)$", re.I)

def is_label(line):
    return any(pattern.search(line) for pattern in label_patterns)

blocks = []
for i, line in enumerate(lines):
    if not is_label(line):
        continue
    values = []
    for nxt in lines[i + 1:i + 20]:
        match = stock_re.match(nxt)
        if match:
            values.append((match.group(1).upper(), match.group(2).strip()))
            if len(values) == 4:
                break
        elif values:
            break
    if values:
        blocks.append((line, values))

if not blocks:
    print("NO_MATCHING_VALUATION_BLOCKS_FOUND")
    print()
    print("Keyword context:")
    for idx, line in enumerate(lines, start=1):
        lower = line.lower()
        if "ebitda" in lower or "p/e" in lower or "pe ttm" in lower or "valuation" in lower:
            print(f"{idx}: {line}")
    raise SystemExit(0)

for idx, (label, values) in enumerate(blocks, start=1):
    print(f"BLOCK {idx}")
    print(f"LABEL: {label}")
    for symbol, val in values:
        print(f"  {symbol}: {val}")
    print()
