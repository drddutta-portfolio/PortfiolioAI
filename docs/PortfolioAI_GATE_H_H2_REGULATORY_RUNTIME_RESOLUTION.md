# PortfolioAI — Gate H H2 TORNTPHARM Regulatory Runtime Resolution

**Date:** 20 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Status:** READ-ONLY OFFICIAL-EVIDENCE RESOLUTION / VALIDATION PENDING

## Purpose

Resolve the remaining TORNTPHARM governance/regulatory runtime blocker using current official issuer and FDA evidence, without altering the approved G7-P2 methodology.

## Evidence reviewed

### Historical Indrad chain

The historical Indrad event remains fully retained:

- 2019 FDA warning letter;
- 2024 FDA closeout letter;
- historical material US-market exposure established.

The closeout does not erase the event.

### Subsequent Indrad / Pithampur outcome

Torrent Pharmaceuticals' FY2024-25 annual report states that:

- Indrad received FDA clearance after a Form 483 with five observations;
- Pithampur received FDA clearance after a Form 483 with one observation;
- both were subsequently classified `VAI`.

This provides subsequent-outcome context after the historical Indrad warning/closeout chain.

### FY2025-26 company-wide US-facing manufacturing context

Torrent's FY2025-26 annual report states that:

- all four plants manufacturing finished products for the US market had been cleared by FDA;
- Dahej received a USFDA Establishment Inspection Report;
- the Vizag API plant also received an EIR;
- new US product approvals had resumed.

The same annual report records Dahej's FDA inspection with zero observations.

### Bileshwarpura

Torrent's 10 April 2026 stock-exchange disclosure states that the USFDA inspection of the Bileshwarpura oncology facility concluded with zero observations.

## Runtime mapping

The approved runtime input is now:

```text
event class: REGULATORY
severity: MODERATE
affected facility/product/geography established: true
regulatory materiality: KNOWN_MATERIAL
remediation: CLOSED_OUT
subsequent outcome established: true
company-wide current regulatory scope established: true
```

The owner-approved governance/regulatory evaluator therefore returns:

```text
gateState = CLEAR
blocksPreview = false
historicalEventRetained = true
additionalNumericPenalty = null
```

Under the approved H2 normalization contract:

```text
Regulatory Context score = 100
```

This does not mean the historical warning is forgotten or reclassified as immaterial.

It means the approved runtime no longer has an unresolved-scope/materiality/outcome blocker.

## Remaining Risk blockers

Risk still cannot be calculated because market-risk evidence remains absent:

- TORNTPHARM 1Y max drawdown;
- TORNTPHARM 1Y volatility;
- NIFTY Pharma 1Y volatility;
- relative-volatility ratio.

No missing market evidence is neutralized.

## Safety

- provider refresh: NO
- paid/licensed source call: NO
- production evidence write: NO
- score persistence: OFF
- recommendation: OFF
- sizing: OFF
- deployment: NO
- PR merge: NO
