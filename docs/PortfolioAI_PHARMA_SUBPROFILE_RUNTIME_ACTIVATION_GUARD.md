# PortfolioAI — Pharma Subprofile Runtime Activation Guard

**Status:** CANONICAL / REQUIRED  
**Purpose:** Prevent the completed Pharma subprofile methodology architecture from being bypassed or collapsed into generic PHARMA_V1 scoring during later Program A/B work.

---

## 1. Core rule

A Pharma security must never be scored from broad `PHARMA_V1` identity alone.

Required runtime chain:

```text
Security
  ↓
Canonical Sector / Industry
  ↓
Reviewed Pharma subprofile assignment
  ↓
Matching Gate-J Pharma methodology authority
  ↓
Subprofile-specific mandatory evidence
  ↓
Deterministic score
```

If the reviewed Pharma subprofile is missing, provisional, disputed, or conflicting:

```text
NO NUMERIC SCORE
→ fail closed
```

---

## 2. Canonical Pharma subprofiles

The following methodology authorities remain distinct and must not borrow scoring bands, mandatory metrics, valuation rules, or evidence contracts from one another:

- `API_BULK_DRUGS`
- `DOMESTIC_FORMULATIONS`
- `GLOBAL_GENERICS`
- `BIOPHARMA_BIOSIMILARS`
- `CDMO_CRAMS`

No generic `Pharma / Pharmaceuticals` scorer may replace these authorities.

---

## 3. Current reviewed / unresolved examples

Current held-Pharma state noted during Program A review:

- ALIVUS → reviewed `API_BULK_DRUGS`
- AUROPHARMA → reviewed `GLOBAL_GENERICS`
- TORNTPHARM → reviewed `DOMESTIC_FORMULATIONS`
- BIOCON → provisional candidate `BIOPHARMA_BIOSIMILARS`; NOT canonical until reviewed/persisted
- SYNGENE → provisional candidate `CDMO_CRAMS`; NOT canonical until reviewed/persisted

Provisional candidate registry values must never be silently promoted into canonical runtime assignments.

---

## 4. Program A implication

Program A may acquire evidence for a Pharma security only against an already-reviewed subprofile contract when subprofile-specific evidence scope matters.

A2A broad classification closure does not prove Pharma subprofile readiness.

For example:

```text
ALIVUS
A2A broad normalization: Pharma / Pharmaceuticals
Reviewed Pharma subprofile: API_BULK_DRUGS
```

The second line is the methodology authority.

---

## 5. Program B / R6 activation prerequisite

Before enabling live Pharma score execution, R6 must implement a focused Pharma runtime adapter that:

1. resolves the active reviewed Pharma subprofile;
2. fails closed for missing/provisional/disputed/conflicting assignment;
3. selects the corresponding Gate-J methodology authority;
4. evaluates that subprofile's mandatory evidence;
5. returns no numeric score if any mandatory component is unavailable;
6. keeps overlays inside affected dimensions rather than generating a second stock score;
7. starts with read-only score preview;
8. keeps score persistence OFF until separately approved;
9. includes golden/isolation tests for all five Pharma subprofiles and missing-assignment cases.

---

## 6. Existing runtime gap to remember

During the Program A review, the live Pharma scoring path was found to route broadly through `PHARMA_V1` without yet supplying the reviewed subprofile to the scorer.

Therefore:

```text
PHARMA_V1 live runtime scoring = NOT YET SAFE FOR GENERAL ACTIVATION
```

until the R6 adapter above is implemented.

---

## 7. Non-negotiable fail-closed rules

- no reviewed subprofile → no score;
- provisional subprofile → no score;
- conflicting subprofile → no score;
- cross-subprofile band borrowing → prohibited;
- generic Pharma fallback scorer → prohibited;
- ticker-specific runtime override → prohibited;
- missing mandatory evidence → no score;
- score persistence remains separately approval-gated.

---

## 8. Governance

This file is a canonical Program B/R6 prerequisite.

Any future plan, code change, scoring adapter, migration, or UI that activates Pharma scoring must explicitly reference or satisfy this guard.

Do not remove or weaken this guard merely because broad sector/industry classification is available.
