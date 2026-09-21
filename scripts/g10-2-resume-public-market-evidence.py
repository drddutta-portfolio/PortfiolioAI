#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

SOURCE = Path("/tmp/portfolioai-g10-2-auropharma-evidence.json")
OUTPUT = Path("/tmp/portfolioai-g10-2-auropharma-evidence-complete.json")

TICKERS = {
    "AUROPHARMA": "AUROPHARMA.NS",
    "DRREDDY": "DRREDDY.NS",
    "LUPIN": "LUPIN.NS",
    "ZYDUSLIFE": "ZYDUSLIFE.NS",
    "NIFTY_PHARMA": "^CNXPHARMA",
}

REQUIRED_TRENDLYNE = {
    "ANNUAL_FUNDAMENTALS",
    "QUARTERLY_MARGIN_HISTORY",
    "VALUATION_OWNERSHIP",
}

DAY = 86400


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_partial() -> dict:
    if not SOURCE.exists():
        fail(f"Missing saved partial evidence: {SOURCE}")
    try:
        payload = json.loads(SOURCE.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Could not parse saved partial evidence: {type(exc).__name__}")

    results = payload.get("partialTrendlyneResults")
    completed = payload.get("completedTrendlyneCalls")
    if completed != 3 or not isinstance(results, dict):
        fail("Saved response does not contain the three completed Trendlyne results.")
    missing = REQUIRED_TRENDLYNE.difference(results)
    if missing:
        fail("Saved Trendlyne evidence is incomplete: " + ", ".join(sorted(missing)))
    return results


def fetch_chart(ticker: str) -> list[tuple[int, float]]:
    encoded = urllib.parse.quote(ticker, safe="")
    last_error = "UNKNOWN"
    for host in ("query1.finance.yahoo.com", "query2.finance.yahoo.com"):
        url = (
            f"https://{host}/v8/finance/chart/{encoded}"
            "?range=2y&interval=1d&events=history&includeAdjustedClose=false"
        )
        for attempt in range(1, 4):
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                                  "AppleWebKit/537.36 Chrome/152 Safari/537.36",
                    "Accept": "application/json,text/plain,*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    body = json.loads(response.read().decode("utf-8"))
                chart = body.get("chart") or {}
                if chart.get("error"):
                    last_error = "YAHOO_PROVIDER_ERROR"
                    break
                result = (chart.get("result") or [None])[0]
                if not isinstance(result, dict):
                    last_error = "YAHOO_RESULT_MISSING"
                    break
                timestamps = result.get("timestamp") or []
                quote = (((result.get("indicators") or {}).get("quote") or [{}])[0])
                closes = quote.get("close") or []
                rows = []
                for ts, close in zip(timestamps, closes):
                    if isinstance(ts, (int, float)) and isinstance(close, (int, float)) and close > 0:
                        rows.append((int(ts), float(close)))
                rows.sort()
                if len(rows) < 120:
                    last_error = f"YAHOO_HISTORY_INSUFFICIENT_{len(rows)}"
                    break
                return rows
            except urllib.error.HTTPError as exc:
                last_error = f"YAHOO_HTTP_{exc.code}"
            except Exception as exc:
                last_error = f"YAHOO_{type(exc).__name__.upper()}"
            time.sleep(attempt * 2)
    fail(f"Public market history failed for {ticker}: {last_error}")


def nearest_before(rows: list[tuple[int, float]], target_ts: int) -> tuple[int, float]:
    eligible = [row for row in rows if row[0] <= target_ts]
    if not eligible:
        fail("Market lookback anchor missing.")
    selected = eligible[-1]
    if target_ts - selected[0] > 14 * DAY:
        fail("Market lookback anchor is older than 14 days.")
    return selected


def metrics(rows: list[tuple[int, float]]) -> dict:
    end_ts, end_close = rows[-1]
    start12_ts, start12 = nearest_before(rows, end_ts - 365 * DAY)
    start6_ts, start6 = nearest_before(rows, end_ts - 182 * DAY)

    one_year = [row for row in rows if row[0] >= end_ts - 365 * DAY]
    peak = one_year[0][1]
    worst = 0.0
    for _, close in one_year:
        peak = max(peak, close)
        worst = min(worst, ((close / peak) - 1.0) * 100.0)

    log_returns = [
        math.log(one_year[i][1] / one_year[i - 1][1])
        for i in range(1, len(one_year))
    ]
    volatility = statistics.stdev(log_returns) * math.sqrt(252) * 100.0

    return {
        "asOfDate": datetime.fromtimestamp(end_ts, tz=timezone.utc).date().isoformat(),
        "return12mPercent": ((end_close / start12) - 1.0) * 100.0,
        "return6mPercent": ((end_close / start6) - 1.0) * 100.0,
        "maxDrawdown1YPercent": worst,
        "volatility1YPercent": volatility,
        "candleCount": len(rows),
        "lookback12mStart": datetime.fromtimestamp(start12_ts, tz=timezone.utc).date().isoformat(),
        "lookback6mStart": datetime.fromtimestamp(start6_ts, tz=timezone.utc).date().isoformat(),
    }


def main() -> None:
    trendlyne = load_partial()
    market = {}

    print("Reusing 3 preserved Trendlyne results — no new Trendlyne call.")
    for index, (symbol, ticker) in enumerate(TICKERS.items(), start=1):
        print(f"[{index}/5] Fetching public daily market history: {symbol}")
        market[symbol] = metrics(fetch_chart(ticker))
        if index < len(TICKERS):
            time.sleep(1)

    auro = market["AUROPHARMA"]
    benchmark = market["NIFTY_PHARMA"]

    output = {
        "mode": "G10_2_GLOBAL_GENERICS_EVIDENCE_CAPTURE_RESUMED",
        "reference": "AUROPHARMA",
        "peers": ["DRREDDY", "LUPIN", "ZYDUSLIFE"],
        "benchmark": "NIFTY_PHARMA",
        "trendlyneCallsThisRun": 0,
        "reusedTrendlyneResults": 3,
        "publicMarketHistoryCalls": 5,
        "marketHistorySource": "YAHOO_FINANCE_PUBLIC_CHART_LOCAL_HOST",
        "trendlyneResults": trendlyne,
        "market": {key: value for key, value in market.items() if key != "NIFTY_PHARMA"},
        "benchmarkMarket": benchmark,
        "auropharmaRelativeStrength12mPercent":
            auro["return12mPercent"] - benchmark["return12mPercent"],
        "auropharmaRelativeVolatilityRatio":
            auro["volatility1YPercent"] / benchmark["volatility1YPercent"],
        "productionWrites": 0,
        "scoreRuns": 0,
        "note": "Resumed from preserved Trendlyne payload; market history fetched read-only from local host. No canonical promotion or persistence.",
    }

    OUTPUT.write_text(json.dumps(output, indent=2), encoding="utf-8")

    print()
    print("G10.2 MARKET RESUME PASS")
    print(f"Evidence file: {OUTPUT}")
    print(f"AUROPHARMA 12M: {auro['return12mPercent']:.4f}%")
    print(f"AUROPHARMA 6M: {auro['return6mPercent']:.4f}%")
    print(f"AUROPHARMA drawdown: {auro['maxDrawdown1YPercent']:.4f}%")
    print(f"AUROPHARMA volatility: {auro['volatility1YPercent']:.4f}%")
    print(
        "Relative strength vs NIFTY Pharma: "
        f"{output['auropharmaRelativeStrength12mPercent']:.4f}pp"
    )
    print(
        "Relative volatility vs NIFTY Pharma: "
        f"{output['auropharmaRelativeVolatilityRatio']:.4f}x"
    )
    print("New Trendlyne calls: 0")
    print("Production writes: 0")


if __name__ == "__main__":
    main()
