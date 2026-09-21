# PortfolioAI — Gate K · K1 Exchange-Primary Classification Build

**Date:** 22 September 2026  
**Branch:** `r4n-pharma-subprofile-architecture`  
**PR:** #101 — OPEN / DRAFT / UNMERGED  
**Scope:** K1 classification architecture only; no sector methodology build.

---

## 1. Decision

PortfolioAI will use official stock-exchange classification as the Tier-1 authority for the **one canonical primary sector** of an operating-company equity.

For the current portfolio, all open holdings are NSE instruments:

```text
Current open holdings = 247
NSE EQUITY             = 238
NSE ETF                = 9
BSE-only current       = 0
```

Therefore the current K1 reconciliation uses NSE official classification as primary evidence.

BSE remains part of the permanent contract for:

- future BSE-only holdings;
- exchange cross-check when a security is available on both exchanges and classification evidence is disputed;
- reviewed fallback when NSE evidence is unavailable.

---

## 2. Official classification hierarchy

The exchange classification hierarchy is:

```text
Macro-Economic Sector
        ↓
Sector
        ↓
Industry
        ↓
Basic Industry
```

PortfolioAI canonical application fields remain:

```text
SECTOR
INDUSTRY
```

The complete four-tier official payload is preserved as immutable raw evidence. K1 does not require a production schema migration for Macro-Economic Sector / Basic Industry because those values can remain in `data_source_records.raw_payload` until a later approved schema version needs to expose them canonically.

---

## 3. Primary-sector rule

### Operating-company equity

```text
official NSE classification
        ↓
canonical primary sector
        ↓
canonical industry
        ↓
optional research subprofile
        ↓
sector methodology
```

A company with multiple businesses still has one primary application sector.

Secondary business exposure may later affect:

- a reviewed research subprofile;
- a secondary-exposure overlay;
- business durability;
- risk;
- valuation treatment.

It does not create a second canonical sector.

### ETF / pooled instrument

```text
ETF / fund
→ operating-company sector = NOT_APPLICABLE
→ no company-sector methodology fallback
→ future FUND_ETF architecture
```

---

## 4. Current unclassified bucket corrected

The current ten `UNAVAILABLE` enrichment holdings are:

```text
CHOLAFIN   EQUITY / STOCK
GOLDBEES   ETF
ITBEES     ETF
LOWVOL     ETF
MAFANG     ETF
MIDCAPETF  ETF
MON100     ETF
MONQ50     ETF
NIFTYBEES  ETF
SILVERBEES ETF
```

Therefore:

```text
Unclassified operating-company equities = 1
Unclassified pooled instruments          = 9
```

Official NSE evidence identifies CHOLAFIN basic industry as:

```text
Non Banking Financial Company (NBFC)
```

The NSE classification structure maps that basic industry to:

```text
Macro-Economic Sector = Financial Services
Sector                = Financial Services
Industry              = Finance
Basic Industry        = Non Banking Financial Company (NBFC)
```

K1 records this as official classification evidence for reconciliation. It does not mutate production by this document.

---

## 5. Current canonical-source audit

Current selected SECTOR decisions across the 247 holdings:

```text
STOCK_MASTER                    208
OWNER_REVIEWED_CLASSIFICATION   28
TRENDLYNE_MCP                    1
NONE                            10
```

Current canonical INDUSTRY decisions exist for only 48 holdings.

This proves why the K1 exchange reconciliation is required: the current labels are useful application history but are not yet uniformly backed by official exchange-primary evidence.

---

## 6. Build implemented in K1

### Domain contract

Added:

`src/features/portfolio/exchangePrimaryClassification.ts`

Responsibilities:

- accepts immutable official NSE/BSE classification observations;
- resolves exactly one primary sector;
- accepts one official exchange when only one is available;
- treats NSE/BSE primary-sector disagreement as `REVIEW_REQUIRED`;
- treats deeper industry/basic-industry disagreement as detail review;
- excludes ETF/fund/non-company instruments from company-sector routing;
- provides a deterministic intake state for newly added securities;
- performs no network calls and no writes.

### Tests

Added:

`src/features/portfolio/exchangePrimaryClassification.test.ts`

Covers:

- ETF / pooled-instrument exclusion;
- new equity with missing official classification;
- NSE-only resolution;
- NSE/BSE agreement;
- NSE/BSE sector conflict;
- deeper classification conflict;
- conflicting official evidence;
- latest-observation selection;
- new-stock fail-closed routing.

### Coverage-routing safety fix

Updated:

`src/features/research/portfolioCoverageProjection.ts`

A cached sector string can no longer make classification `FRESH` when the official exchange-classification state is missing, conflicting or review-required.

Result:

```text
classification unresolved
→ RESEARCH_PROFILE blocked
→ SCORING blocked
→ RECOMMENDATION blocked
```

The displayed canonical sector is not silently rewritten.

### Canonical authority registry

Updated:

`src/contracts/canonicalDataAuthorities.ts`

SECTOR and INDUSTRY now explicitly identify reviewed official exchange-primary evidence as Tier-1 classification authority.

### Current-cohort snapshot

Added:

`scripts/k1-current-nse-equities-2026-09-22.txt`

It contains the exact 238 NSE operating-equity symbols in the current portfolio at the K1 checkpoint.

### Read-only official NSE snapshot fetcher

Added:

`scripts/k1-fetch-nse-primary-classification.mjs`

The script:

- reads a bounded symbol cohort;
- establishes an NSE web session;
- calls the official NSE quote-equity endpoint;
- extracts:
  - ISIN;
  - company name;
  - ETF flag;
  - Macro-Economic Sector;
  - Sector;
  - Industry;
  - Basic Industry;
- writes a JSON review artifact;
- performs **zero database writes**;
- does not schedule itself;
- does not persist a canonical classification automatically.

This is deliberately review-first.

---

## 7. New-stock lifecycle

Every newly added security will follow this contract.

### A. Non-equity / pooled instrument

```text
new security
→ ETF / fund / non-operating-company instrument
→ COMPANY_SECTOR_NOT_APPLICABLE
→ no company research engine
```

### B. New NSE-listed operating equity

```text
new security added
        ↓
official classification absent
        ↓
AWAITING_OFFICIAL_EXCHANGE_CLASSIFICATION
        ↓
Research profile = BLOCKED
Score = NOT COMPUTABLE
Recommendation = NOT READY
        ↓
official NSE evidence captured
        ↓
primary sector / industry reviewed
        ↓
canonical classification decision
        ↓
existing sector engine if supported
or METHODOLOGY_NOT_AVAILABLE
```

### C. New BSE-only operating equity

Same process, using official BSE classification evidence.

### D. Dual-listed conflict

```text
NSE sector != BSE sector
→ CLASSIFICATION_REVIEW_REQUIRED
→ no methodology routing
→ compare current official evidence
→ use audited segment-revenue / official exchange classification basis
→ reviewed canonical decision
```

No ticker-name inference, peer inference, theme inference or nearest-engine fallback is allowed.

---

## 8. No scheduler required

K1 does not add or change any scheduler.

For new stocks, the initial implementation is **intake-driven / review-driven**:

- adding a security exposes a missing classification state;
- the classification fetch/review can be invoked explicitly;
- until evidence resolves, research remains blocked.

A later gate may decide whether an existing safe enrichment queue should invoke official classification acquisition automatically. That would require separate authorization and is not part of K1.

---

## 9. Current reconciliation workflow

The current 238 NSE equities will be reconciled in one consolidated pass:

```text
238 current NSE equity symbols
        ↓
read-only official NSE classification snapshot
        ↓
compare against current canonical SECTOR / INDUSTRY
        ↓
AGREE
CHANGE_REQUIRED
DETAIL_MISSING
REVIEW_REQUIRED
        ↓
owner-reviewed reconciliation manifest
        ↓
NO production mutation in K1
        ↓
post-reconciliation sector inventory
        ↓
freeze exact K4 package count
```

The 9 ETFs are excluded from the company-sector denominator.

---

## 10. K1 completion condition

K1 is not complete merely because the resolver exists.

K1 closes only after:

1. the current NSE equity cohort has an official exchange classification snapshot;
2. differences against current canonical sector/industry are enumerated;
3. classification conflicts are explicitly reviewed;
4. the one unclassified operating-company equity is resolved;
5. ETFs remain explicitly not applicable;
6. the post-reconciliation sector inventory is recalculated;
7. exact K4 package count and order are frozen;
8. future-stock intake behavior is validated;
9. owner accepts the final K1 scope.

K2 remains blocked until then.

---

## 11. Safety boundary

```text
Production database writes = NO
Production migrations       = NO
Provider persistence        = NO
Score persistence           = OFF
Recommendation persistence  = OFF
Scheduler changes           = NO
Deployment                  = NO
PR merge                    = NO
Automatic trading           = NO
```


---

## 12. Reconciliation tooling completed

K1 now includes a reusable canonical-vs-official comparison path.

### Canonical snapshot

Added:

`scripts/k1-current-canonical-classification.sql`

The query is SELECT-only and exports the current active portfolio's NSE equity classification state with:

- symbol;
- security id;
- ISIN;
- canonical sector / industry;
- enrichment state;
- selected sector / industry evidence source;
- selected evidence state.

Example:

```bash
mkdir -p artifacts
psql "$DATABASE_URL" -Atf scripts/k1-current-canonical-classification.sql \
  > artifacts/k1-current-canonical-classification.json
```

This command is intentionally not embedded in an automatic workflow because K1 does not authorize unattended production access.

### Deterministic comparator

Added:

`scripts/k1-compare-nse-classification.mjs`

Inputs:

```text
artifacts/k1-current-canonical-classification.json
artifacts/k1-nse-primary-classification.json
```

Outputs:

`artifacts/k1-nse-classification-reconciliation.json`

Per-security states:

```text
AGREE
DETAIL_MISSING
CHANGE_REQUIRED
REVIEW_REQUIRED
OFFICIAL_MISSING
```

Rules:

- canonical sector == NSE sector → sector agrees;
- canonical industry missing while NSE industry exists → `DETAIL_MISSING`;
- canonical sector / industry differs from NSE → `CHANGE_REQUIRED`;
- ISIN mismatch → `REVIEW_REQUIRED`;
- official NSE classification unavailable → `OFFICIAL_MISSING`;
- an official symbol outside the current canonical cohort → `REVIEW_REQUIRED`.

The comparator never writes the database.

Run:

```bash
node scripts/k1-compare-nse-classification.mjs \
  --canonical artifacts/k1-current-canonical-classification.json \
  --official artifacts/k1-nse-primary-classification.json \
  --output artifacts/k1-nse-classification-reconciliation.json
```

### Comparator tests

Added:

`scripts/k1-compare-nse-classification.test.mjs`

The consolidated K1 validator now includes these tests plus syntax checks for both classification scripts.

### Future holdings

The same reconciliation contract applies to newly added securities:

```text
new NSE equity
→ no official snapshot row yet
→ AWAITING_OFFICIAL_EXCHANGE_CLASSIFICATION
→ research blocked
→ official NSE evidence acquired/reviewed
→ canonical primary sector decision
→ supported engine OR METHODOLOGY_NOT_AVAILABLE

new BSE-only equity
→ same contract using BSE official evidence

new ETF/fund
→ company-sector NOT_APPLICABLE
→ no nearest equity-sector fallback
```

No new stock can silently inherit a methodology from its ticker, theme, company name or nearest existing sector.

---

## 13. Exact reconciliation policy after 10-stock pilot

K1 now uses a review-first reconciliation policy rather than treating every difference as equivalent.

### Primary-sector changes

For an operating-company equity:

```text
official NSE sector exists
+ canonical sector differs
→ CHANGE_REQUIRED
→ change scope includes SECTOR
→ proposed canonical user-facing sector = official NSE sector
→ no automatic database write
```

A sector difference is not a methodology decision. Research routing is recalculated only after the reviewed canonical classification is available.

### Industry/detail changes

```text
sector agrees + canonical industry missing
→ DETAIL_MISSING

sector agrees + canonical industry differs
→ CHANGE_REQUIRED
→ change scope includes INDUSTRY
```

Missing deeper detail does not authorize invention from company name, peers, theme or research profile.

### ISIN mismatches

Default:

```text
canonical ISIN != official NSE ISIN
→ REVIEW_REQUIRED
→ classification freeze blocked
```

Exception: an ISIN mismatch may proceed only when an exact symbol + old ISIN + new ISIN transition is backed by reviewed official corporate-action evidence. The comparator then records:

```text
state       = CHANGE_REQUIRED
changeScope = IDENTITY
reason      = CANONICAL_ISIN_SUPERSEDED_BY_OFFICIAL_CORPORATE_ACTION
```

This does not mutate production. It means the identity discrepancy is explained and the canonical ISIN requires a reviewed refresh.

The reviewed transition registry is:

`scripts/k1-reviewed-identity-transitions-2026-09-22.json`

### ANGELONE resolution

ANGELONE is the first reviewed identity-transition case.

Official NSE circular evidence states:

```text
old ISIN      = INE732I01013
new ISIN      = INE732I01021
effective     = 2026-02-26
reason        = subdivision from Rs. 10 face value to Re. 1
```

Therefore the 10-stock pilot's ANGELONE `ISIN_MISMATCH` is a stale canonical-identity problem, not an exchange-sector dispute.

### Exchange sector vs research profile

The two layers remain separate:

```text
official exchange sector
→ canonical user-facing sector
→ canonical industry
→ research profile
→ reviewed research subprofile
→ methodology
```

For pharmaceutical companies classified by NSE under `Healthcare`:

```text
canonical sector = Healthcare
industry         = Pharmaceuticals
research profile = PHARMA
subprofile       = reviewed PHARMA_V1 subtype
```

Thus AKUMS and ALIVUS must not be relabelled to `Pharma` merely to preserve PHARMA_V1. Their exchange-primary sector can be `Healthcare` while the downstream Pharma methodology remains valid when pharmaceutical industry/subprofile evidence supports it.

Regression coverage now explicitly locks `Healthcare + Pharmaceuticals → PHARMA` without changing the displayed `Healthcare` sector.

### Next bounded step

Do not run all 238 yet.

First rerun the **same 10-stock cohort** with reconciliation V2. Expected behavior:

- ACMESOLAR: sector change remains explicit;
- AKUMS: Healthcare primary sector, Pharma methodology downstream;
- ALIVUS: Healthcare primary sector, Pharma methodology downstream;
- ASTRAMICRO: Capital Goods primary sector, defence/aerospace methodology may remain downstream;
- ANGELONE: reviewed corporate-action identity refresh instead of unexplained `REVIEW_REQUIRED`.

Only after this policy re-run passes should K1 proceed to the 238-stock read-only reconciliation.

---

## 14. 10-stock reconciliation V2 validation — PASS

The same bounded 10-stock cohort that exposed the original reconciliation exceptions was rerun after the V2 policy implementation.

Observed result:

```text
AGREE: 5
DETAIL_MISSING: 0
CHANGE_REQUIRED: 5
REVIEW_REQUIRED: 0
OFFICIAL_MISSING: 0
Change scopes: IDENTITY=1 SECTOR=4 INDUSTRY=0
Freeze eligible: YES
```

Resolved exception set:

```text
ACMESOLAR   CHANGE_REQUIRED / SECTOR
AKUMS       CHANGE_REQUIRED / SECTOR
ALIVUS      CHANGE_REQUIRED / SECTOR
ASTRAMICRO  CHANGE_REQUIRED / SECTOR
ANGELONE    CHANGE_REQUIRED / IDENTITY
```

ANGELONE no longer appears as unexplained `REVIEW_REQUIRED / ISIN_MISMATCH`; it resolves through the reviewed official corporate-action identity transition.

This validates the exact policy intended before widening to the full cohort.

No database mutation was performed.

**Next safe K1 action:** full read-only reconciliation of the frozen 238 NSE operating-equity cohort.
