#!/usr/bin/env python3
"""Create the full owner-readable R5 historic exceptions ledger from ACTUAL engine output.

Only symbol, quarter, selected-source coherence and nonnumeric limitation
metadata are included. No ingestion, downloads, R4 mutation or estimates.
"""
import json
from collections import Counter
from pathlib import Path

SOURCE=Path("tmp/results-r5-g/historical-grade-census.json")
TARGET=Path("tmp/results-r5-g/historical-remaining-case-register.md")
CONTRACT="R5_ROLLING_HISTORICAL_GRADE_CENSUS_V1"
ACTION={
  "RECOVER_QUALIFIED_PRIOR_SOURCE_SELECTION":"Missing qualifying earlier issuer-quarter selections",
  "RECONCILE_ADJACENT_QUARTER_AND_SOURCE_COMPATIBILITY":"Incompatible source/coherent accounting scope",
  "INSUFFICIENT_PEER_OR_HISTORICAL_COMPARISON_CONTRACT":"Insufficient coherent sequential comparisons",
  "MODEL_NOT_SUPPORTED":"Unreviewed or unsupported grading methodology",
}
def derive(report):
    if report.get("contract")!=CONTRACT or report.get("cohort")!=262:
        raise ValueError("INVALID_LIVE_262_EQUITY_GRADE_INPUT")
    exceptions=report["historicalExceptions"]
    rows=exceptions["rows"]
    if len(rows)!=exceptions["count"] or len({(r["symbol"],r["quarter"]) for r in rows})!=len(rows):
        raise ValueError("CASE_LIST_DUPLICATE_OR_COUNT_DRIFT")
    counts=Counter(r["action"] for r in rows)
    if sum(counts.values())!=exceptions["count"] or any(x not in ACTION for x in counts):
        raise ValueError("INVALID_REMEDIATION_CONTRACT")
    if exceptions["unmodeledCount"] != counts.get("MODEL_NOT_SUPPORTED",0):
        raise ValueError("UNSUPPORTED_MODEL_COHORT_DRIFT")
    supported=len(rows)-exceptions["unmodeledCount"]
    if supported!=exceptions["supportedModelUnratedCount"]:
        raise ValueError("SUPPORTED_COHORT_DRIFT")
    quarters=("2025-03-31","2025-06-30","2025-09-30")
    qs=report["byQuarter"]
    rated=sum(qs[q]["qualified"]["rated"] for q in quarters)
    not_rated=sum(qs[q]["qualified"]["unrated"] for q in quarters)
    if not_rated!=len(rows): raise ValueError("R5_AUDIT_TOTAL_MISMATCH")
    lines=[
      "# PortfolioAI Results R5 — exact remaining historical exception ledger",
      "",
      "**Environment:** PortfolioAI-Development only. Source: 262-equity R5-G actual grading engine; no source/provider requests or database changes made by this report.",
      "",
      "**Assessment:** Retrospective quarter operating performance only; not an investment recommendation or a point-in-time backtest.",
      "",
      f"**Source-qualified historical results graded:** {rated}; **Still Not Rated:** {not_rated}; **Full cohort:** 262 equities.",
      "",
      "## Remaining case classes",
      "",
      "| Evidence or methodology requirement | Cases |",
      "| --- | ---: |",
    ]
    for code,label in ACTION.items():
        lines.append(f"| {label} | {counts.get(code,0)} |")
    lines+=["","## Every individual outstanding company-quarter","",
    "| Symbol | Quarter | Blocker | Selected preceding quarter | Independently coherent current filing |",
    "| --- | --- | --- | --- | --- |"]
    for r in sorted(rows,key=lambda a:(a["quarter"],a["symbol"])):
        checks=r["historicalChecks"]
        if not checks or checks[0]["quarter"]!=r["quarter"]:
            raise ValueError("HISTORICAL_LEDGER_QUARTER_CHECK_MISMATCH")
        before=checks[1] if len(checks)>1 else None
        prior=(before["quarter"]+": "+("Revenue/NII and PAT available" if before["topSelected"] and before["profitSelected"] else "missing selected top-line or PAT")) if before else "not assessed"
        current="YES" if checks[0]["sameFilingAndScope"] else "NO — source reconciliation needed"
        label=ACTION[r["action"]]
        lines.append(f'| {r["symbol"]} | {r["quarter"]} | {label} | {prior} | {current} |')
    lines+=["","## Fail-closed release determination","",
        "No entry is marked permanently ungradable solely due to apparent IPO/demerger status. Prove the legal issuer's original reporting and required historic periods independently before making that finding.",
        "",
        "Source recovery must preserve R2 content hashes, exact company identity, quarter dates, same original-filing scope, reporting units, canonical R4 choices, and financial publication limitations. Grading a company from fewer than two coherent own-history comparisons is not permitted unless the pre-approved exact-industry calibration contract applies.",
        "",
        "**R5-G full PASS is not established by the grade audit alone.** Authenticated UI/design parity, source-to-frontend refresh, fixed-HEAD repository verification and deployment evidence remain independent release gates.",
        "",
    ]
    return "\n".join(lines)
def main():
    report=json.loads(SOURCE.read_text())
    body=derive(report)
    TARGET.parent.mkdir(exist_ok=True,parents=True)
    TARGET.write_text(body)
    counts=Counter(r["action"] for r in report["historicalExceptions"]["rows"])
    print("R5_EXACT_REMAINING_CASE_REGISTER",json.dumps({
        "cohort":report["cohort"],"cases":sum(counts.values()),"counts":dict(counts),
        "factualPermanentExceptionsClaimed":0,"noProviderCalls":True,"noDatabaseWrites":True},sort_keys=True))
if __name__=="__main__": main()
