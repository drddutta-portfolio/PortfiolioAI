#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
from typing import Any

BASE = Path("/tmp/portfolioai-g10-2-auropharma-evidence.json")
GAP = Path("/tmp/portfolioai-g10-2-trendlyne-gap-fill.json")
OUT = Path("/tmp/portfolioai-g10-2-normalized-evidence.json")

SYMBOLS = ("AUROPHARMA","DRREDDY","LUPIN","ZYDUSLIFE","NIFTYPHARMA")
ALIASES = {
    "NIFTY PHARMA":"NIFTYPHARMA",
    "NIFTYPHARMA":"NIFTYPHARMA",
    "AUROPHARMA":"AUROPHARMA",
    "DRREDDY":"DRREDDY",
    "LUPIN":"LUPIN",
    "ZYDUSLIFE":"ZYDUSLIFE",
}
TARGET_KEYWORDS = (
    "operating profit margin","opm","operating profit","operating revenue",
    "revenue growth","sales growth","cagr","roce","return on capital",
    "cash from operating","cfo","capital expenditure","capex","free cash flow","fcf",
    "total debt","net debt","cash and bank","interest coverage","ebitda",
    "pe ttm","p/e","ev/ebitda","ev per ebitda","free cash flow yield","fcf yield",
    "promoter holding","promoter pledge","pledge",
    "6 month","6m","1 year","1y","return","beta","volatility","drawdown",
    "rsi","macd","momentum",
)

def fail(msg: str):
    print("ERROR:", msg, file=sys.stderr)
    raise SystemExit(1)

def unwrap(v: Any) -> str:
    cur = v
    for _ in range(10):
        if isinstance(cur, str):
            t = cur.strip()
            try:
                cur = json.loads(t)
                continue
            except Exception:
                return t.replace("\\n","\n").replace("\\r","").replace("\\\\","\\")
        if isinstance(cur, dict):
            for key in ("markdown_data","result","text","content"):
                if isinstance(cur.get(key), str):
                    cur = cur[key]
                    break
            else:
                return json.dumps(cur, ensure_ascii=False)
            continue
        return json.dumps(cur, ensure_ascii=False)
    return str(cur)

def clean(line: str) -> str:
    return re.sub(r"\s+"," ",line.strip().strip("\\").strip())

def parse_blocks(text: str):
    lines = [clean(x) for x in text.splitlines()]
    blocks = []
    current = None
    values = {}
    for line in lines:
        if not line:
            continue
        m = re.match(r"^(AUROPHARMA|DRREDDY|LUPIN|ZYDUSLIFE|NIFTY ?PHARMA)\s*:\s*(.+)$", line, re.I)
        if m and current:
            sym = ALIASES.get(m.group(1).upper().replace("  "," "), m.group(1).upper().replace(" ",""))
            values[sym] = m.group(2).strip()
            continue
        lower = line.lower()
        if any(k in lower for k in TARGET_KEYWORDS):
            if current and values:
                blocks.append((current, values))
            current = line
            values = {}
            continue
        if re.fullmatch(r"-{3,}", line) and current:
            if values:
                blocks.append((current, values))
            current, values = None, {}
    if current and values:
        blocks.append((current, values))
    return blocks

def load():
    if not BASE.exists(): fail(f"Missing {BASE}")
    if not GAP.exists(): fail(f"Missing {GAP}")
    base = json.loads(BASE.read_text())
    gap = json.loads(GAP.read_text())
    if base.get("completedTrendlyneCalls") != 3: fail("Base file does not contain 3 preserved Trendlyne calls")
    if gap.get("providerCalls") != 2: fail("Gap file does not contain exactly 2 Trendlyne calls")
    return base, gap

def main():
    base, gap = load()
    sources = {}
    for code, raw in (base.get("partialTrendlyneResults") or {}).items():
        sources[f"BASE_{code}"] = unwrap(raw)
    sources["GAP_STOCK"] = unwrap(gap.get("stockResult"))
    sources["GAP_INDEX"] = unwrap(gap.get("indexResult"))

    all_blocks = []
    for source, text in sources.items():
        for label, values in parse_blocks(text):
            all_blocks.append({"source": source, "label": label, "values": values})

    dedup = {}
    for b in all_blocks:
        key = (b["label"].lower(), tuple(sorted(b["values"].items())))
        dedup[key] = b
    blocks = list(dedup.values())

    target = [b for b in blocks if "AUROPHARMA" in b["values"] or "NIFTYPHARMA" in b["values"]]
    result = {
        "providerCallsThisStep": 0,
        "reusedTrendlyneCalls": 5,
        "blockCount": len(blocks),
        "targetBlockCount": len(target),
        "blocks": target,
    }
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False))

    print("G10.2 NORMALIZED TRENDLYNE EVIDENCE")
    print("Provider calls made: 0")
    print("Trendlyne results reused: 5")
    print("Target blocks found:", len(target))
    print()
    for i,b in enumerate(target,1):
        print(f"BLOCK {i}: {b['label']}")
        for sym in SYMBOLS:
            if sym in b["values"]:
                print(f"  {sym}: {b['values'][sym]}")
        print()
    print("Saved:", OUT)
    print("No provider call and no database write was performed.")

if __name__ == "__main__":
    main()
