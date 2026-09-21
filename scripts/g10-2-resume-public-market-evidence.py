#!/usr/bin/env python3
from __future__ import annotations

import http.cookiejar
import json
import math
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

SOURCE = Path("/tmp/portfolioai-g10-2-auropharma-evidence.json")
OUTPUT = Path("/tmp/portfolioai-g10-2-auropharma-evidence-complete.json")

STOCKS = ("AUROPHARMA", "DRREDDY", "LUPIN", "ZYDUSLIFE")
REQUIRED_TRENDLYNE = {
    "ANNUAL_FUNDAMENTALS",
    "QUARTERLY_MARGIN_HISTORY",
    "VALUATION_OWNERSHIP",
}

DAY = 86400
NSE_HOME = "https://www.nseindia.com"
NSE_EQUITY_API = NSE_HOME + "/api/NextApi/apiClient/GetQuoteApi"
NSE_INDEX_API = NSE_HOME + "/api/historicalOR/indicesHistory"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/152.0.0.0 Safari/537.36",
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com/get-quotes/equity?symbol=AUROPHARMA",
}


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


class NseSession:
    def __init__(self) -> None:
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookies)
        )
        self._prime()

    def _request(self, url: str, params: dict[str, str] | None = None) -> object:
        target = url
        if params:
            target += "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(target, headers=HEADERS)
        try:
            with self.opener.open(req, timeout=30) as response:
                body = response.read().decode("utf-8")
                return json.loads(body)
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 403):
                self.cookies.clear()
                self._prime()
                req = urllib.request.Request(target, headers=HEADERS)
                with self.opener.open(req, timeout=30) as response:
                    return json.loads(response.read().decode("utf-8"))
            raise

    def _prime(self) -> None:
        req = urllib.request.Request(NSE_HOME + "/option-chain", headers=HEADERS)
        try:
            with self.opener.open(req, timeout=30) as response:
                response.read(256)
        except urllib.error.HTTPError as exc:
            fail(f"NSE cookie bootstrap failed: HTTP {exc.code}")
        except Exception as exc:
            fail(f"NSE cookie bootstrap failed: {type(exc).__name__}")

    def equity_history(
        self, symbol: str, from_date: date, to_date: date
    ) -> list[tuple[int, float]]:
        rows: list[tuple[int, float]] = []
        current = from_date
        while current <= to_date:
            chunk_end = min(current + timedelta(days=99), to_date)
            payload = self._request(
                NSE_EQUITY_API,
                {
                    "functionName": "getHistoricalTradeData",
                    "symbol": symbol,
                    "series": "EQ",
                    "fromDate": current.strftime("%d-%m-%Y"),
                    "toDate": chunk_end.strftime("%d-%m-%Y"),
                },
            )
            data = payload.get("data", payload) if isinstance(payload, dict) else payload
            if not isinstance(data, list):
                fail(f"NSE equity response shape invalid for {symbol}.")
            for item in data:
                if not isinstance(item, dict):
                    continue
                raw_date = item.get("CH_TIMESTAMP") or item.get("mTIMESTAMP")
                raw_close = item.get("CH_CLOSING_PRICE")
                if raw_date is None or raw_close is None:
                    continue
                parsed = None
                for fmt in ("%Y-%m-%d", "%d-%b-%Y"):
                    try:
                        parsed = datetime.strptime(str(raw_date), fmt).date()
                        break
                    except ValueError:
                        pass
                if parsed is None:
                    continue
                try:
                    close = float(raw_close)
                except (TypeError, ValueError):
                    continue
                if close <= 0:
                    continue
                ts = int(datetime(parsed.year, parsed.month, parsed.day, tzinfo=timezone.utc).timestamp())
                rows.append((ts, close))
            current = chunk_end + timedelta(days=1)
            time.sleep(0.4)
        return sorted(set(rows))

    def index_history(
        self, index_name: str, from_date: date, to_date: date
    ) -> list[tuple[int, float]]:
        rows: list[tuple[int, float]] = []
        current = from_date
        while current <= to_date:
            chunk_end = min(current + timedelta(days=364), to_date)
            payload = self._request(
                NSE_INDEX_API,
                {
                    "indexType": index_name.upper(),
                    "from": current.strftime("%d-%m-%Y"),
                    "to": chunk_end.strftime("%d-%m-%Y"),
                },
            )
            data = payload.get("data") if isinstance(payload, dict) else None
            if not isinstance(data, list):
                fail(f"NSE index response shape invalid for {index_name}.")
            for item in data:
                if not isinstance(item, dict):
                    continue
                raw_date = item.get("EOD_TIMESTAMP")
                raw_close = item.get("EOD_CLOSE_INDEX_VAL")
                if raw_date is None or raw_close is None:
                    continue
                try:
                    parsed = datetime.strptime(str(raw_date), "%d-%b-%Y").date()
                    close = float(raw_close)
                except (TypeError, ValueError):
                    continue
                if close <= 0:
                    continue
                ts = int(datetime(parsed.year, parsed.month, parsed.day, tzinfo=timezone.utc).timestamp())
                rows.append((ts, close))
            current = chunk_end + timedelta(days=1)
            time.sleep(0.4)
        return sorted(set(rows))


def nearest_before(rows: list[tuple[int, float]], target_ts: int) -> tuple[int, float]:
    eligible = [row for row in rows if row[0] <= target_ts]
    if not eligible:
        fail("Market lookback anchor missing.")
    selected = eligible[-1]
    if target_ts - selected[0] > 14 * DAY:
        fail("Market lookback anchor is older than 14 days.")
    return selected


def metrics(rows: list[tuple[int, float]]) -> dict:
    if len(rows) < 120:
        fail(f"Market history insufficient: only {len(rows)} rows.")
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
    print("Reusing 3 preserved Trendlyne results — no new Trendlyne call.")
    print("Yahoo returned HTTP 429, so market history will use NSE public historical APIs.")

    end = date.today()
    start = end - timedelta(days=400)
    nse = NseSession()

    market = {}
    for index, symbol in enumerate(STOCKS, start=1):
        print(f"[{index}/5] Fetching NSE daily history: {symbol}")
        market[symbol] = metrics(nse.equity_history(symbol, start, end))

    print("[5/5] Fetching NSE index history: NIFTY PHARMA")
    benchmark = metrics(nse.index_history("NIFTY PHARMA", start, end))

    auro = market["AUROPHARMA"]

    output = {
        "mode": "G10_2_GLOBAL_GENERICS_EVIDENCE_CAPTURE_RESUMED",
        "reference": "AUROPHARMA",
        "peers": ["DRREDDY", "LUPIN", "ZYDUSLIFE"],
        "benchmark": "NIFTY_PHARMA",
        "trendlyneCallsThisRun": 0,
        "reusedTrendlyneResults": 3,
        "publicMarketHistoryReads": 5,
        "marketHistorySource": "NSE_PUBLIC_HISTORICAL_APIS",
        "trendlyneResults": trendlyne,
        "market": market,
        "benchmarkMarket": benchmark,
        "auropharmaRelativeStrength12mPercent":
            auro["return12mPercent"] - benchmark["return12mPercent"],
        "auropharmaRelativeVolatilityRatio":
            auro["volatility1YPercent"] / benchmark["volatility1YPercent"],
        "productionWrites": 0,
        "scoreRuns": 0,
        "note": "Resumed from preserved Trendlyne payload; market history fetched read-only from NSE public historical APIs. No canonical promotion or persistence.",
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
