#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
from typing import Any

BASE = Path("/tmp/portfolioai-g10-2-auropharma-evidence.json")
GAP = Path("/tmp/portfolioai-g10-2-trendlyne-gap-fill.json")

TARGETS = {
    "FREE_CASH_FLOW": [r"free\s+cash\s+flow", r"\bfcf\b"],
    "NET_DEBT": [r"net\s+debt", r"debt\s+net"],
    "INTEREST_COVERAGE": [r"interest\s+coverage", r"interest\s+cover"],
    "PE_TTM": [r"\bpe\s+ttm\b", r"\bp/e\s+ttm\b", r"price\s+earnings.*ttm"],
    "EV_EBITDA": [r"ev\s*(?:/|per)\s*ebitda", r"enterprise\s+value.*ebitda"],
    "PROMOTER_HOLDING": [r"promoter\s+holding", r"promoter\s+stake"],
    "RETURN_6M": [r"6\s*m(?:onth)?s?.*(?:chg|return)", r"(?:chg|return).*6\s*m(?:onth)?s?"],
}

def unwrap(value: Any) -> str:
    current = value
    for _ in range(10):
        if isinstance(current, str):
            text = current.strip()
            try:
                current = json.loads(text)
                continue
            except Exception:
                return text.replace("\\n","\n").replace("\\r","").replace("\\\\","\\")
        if isinstance(current, dict):
            for key in ("markdown_data","result","text","content"):
                if isinstance(current.get(key), str):
                    current = current[key]
                    break
            else:
                return json.dumps(current, ensure_ascii=False)
            continue
        return json.dumps(current, ensure_ascii=False)
    return str(current)

def clean(line: str) -> str:
    return re.sub(r"\s+"," ",line.strip().strip("\\").strip())

def load_sources():
    if not BASE.exists() or not GAP.exists():
        print("ERROR: missing saved evidence files", file=sys.stderr)
        raise SystemExit(1)
    base=json.loads(BASE.read_text())
    gap=json.loads(GAP.read_text())
    src={}
    for code, raw in (base.get("partialTrendlyneResults") or {}).items():
        src["BASE_"+code]=unwrap(raw)
    src["GAP_STOCK"]=unwrap(gap.get("stockResult"))
    src["GAP_INDEX"]=unwrap(gap.get("indexResult"))
    return src

def main():
    sources=load_sources()
    print("G10.2 MISSING-FIELD SUMMARY")
    print("Provider calls made: 0")
    print()

    for target, patterns in TARGETS.items():
        compiled=[re.compile(p,re.I) for p in patterns]
        matches=[]
        for source,text in sources.items():
            for line in text.splitlines():
                cleaned=clean(line)
                if cleaned and any(p.search(cleaned) for p in compiled):
                    matches.append((source, cleaned))
        if matches:
            unique=[]
            seen=set()
            for item in matches:
                if item not in seen:
                    seen.add(item)
                    unique.append(item)
            labels=" | ".join(f"{src}: {label}" for src,label in unique[:3])
            print(f"{target}: FOUND | {labels}")
        else:
            print(f"{target}: NOT FOUND")

if __name__=="__main__":
    main()
