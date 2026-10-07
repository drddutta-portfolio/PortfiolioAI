# PortfolioAI V1-4 Owner Review Package — Fixed 115 Stocks — V2

Package: `PAI-V1-4-115-OWNER-REVIEW-V2-2026-10-07`

## Verified scope
- Fixed remediation population: 115 stocks.
- Review-dependent items: 638 across 114 stocks.
- Family split: 112 ownership / 234 structured numeric / 292 qualitative-document.
- Frozen release cohort remains separate at 111 stocks.
- Frozen cohort SHA-256: `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`.
- V1 remains preserved unchanged.

## Independent remediation completed
Angel One history repair run `72524602-bf82-4f03-8e46-cb690604cfcc` succeeded for CHOLAFIN, GESHIP, HEXT and JIOFIN.
Transport: 1 authentication request + 4 history requests, all successful, 0 retries.
Each stock now has 276 distinct ONE_DAY sessions in canonical history, satisfying the >=252-session depth requirement and the latest-completed-session cutoff contract.

Development database size measured 214,412,435 bytes, below the approved 500,000,000-byte ceiling.

## Source-contract audit
### 292 document items
114 linked document identities were checked. Current review-binding records still have 0 canonical content hashes, 0 source content hashes, 0 Development-R2 content references and 0 authoritative source URLs. Retained excerpts/provider-rendered bodies are not silently promoted to verified original-document identity.

### 234 structured numeric items
82 unique structured source records preserve values/labels, but exact source-bound reporting period/date, unit/scale, currency where applicable and consolidation scope remain incomplete.

### 112 ownership items
The deployed parser exposes Promoter, Institutional, FII, MF, DII and Public quarter series. The approved requirement contract does not select one canonical ownership series and percentage basis. No overlapping series was silently combined.

## V2 proposed decisions
- ACCEPT: 0
- REJECT: 0
- DEFER: 638 across 114 stocks

There are no proposed ACCEPT items, so there is no legitimate ACCEPT-item validator invocation to run. No zero-insert dry run is represented as proof.


## Consolidated ownership-methodology decision required

The 112 ownership review items break down as:
- `OWNERSHIP_TREND_4Q`: 53 items
- `OWNERSHIP_GOVERNANCE`: 49 items
- `INSTITUTIONAL_OWNERSHIP_TREND_4Q`: 10 items

Retained Trendlyne ownership responses expose separate quarter series for **Promoter, Institutional, FII, MF, DII and Public**. The deployed validator requires one consistent `ownership_series` and one consistent `ownership_basis` across the required consecutive-quarter window and rejects mixed bases.

**Decision proposal (not approval):** amend the methodology contract only after the owner chooses, per requirement family, the authoritative series and percentage basis. The decision must explicitly state whether `Institutional` is used as the provider's own non-overlapping aggregate or whether a narrower component series is required. FII, MF, DII and Institutional must not be added together unless the approved methodology proves they are non-overlapping for that provider contract.

Until that methodology decision is made, these 112 items remain DEFER; the choice is not inferred from stock type or from whichever series happens to have four quarters.

## Owner boundary
No owner review rows were inserted. No reviewer identity or approval was fabricated.
V1-4 remains IN PROGRESS / NOT PROVEN.
V1-5 remains unauthorized.
