# PortfolioAI R5 — 21 October 2026 verified historical source remediation

**Environment:** `PortfolioAI-Development`, Dev Supabase `lrgpjimipfkyoqbpsqzz`, Dev R2 `portfolioai-history-dev`. Production and main excluded.

**Status: PARTIAL (NOT R5-G FINAL ACCEPTANCE).**

## Actual qualified historical census

The current actual 262-equity Results R5-G TypeScript grading census [Actions 39556229875](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39556229875), commit `9bddb64f982888fc5cce70d7aef5010f84e5bc33`, **PASS**, confirms:

- Historic March, June and September 2025: **718 graded** source-qualified company-quarters, **36 Not Rated**.
- Exact remaining actions: **26** missing qualified preceding-quarter source selections; **6** insufficient coherent histories / no eligible exact-industry peer; **4** incompatible accounting-source comparisons; **0** unsupported model methods.
- From 20 October baseline **714 graded / 40 Not Rated**, net **four** historical cases resolved by this Development continuation (counts are not promises or proxy estimates).
- The 2026-09-30/Q2FY27 future-results column currently has no qualified financial observations. Do not equate empty future results to historic Not Rated failures.

## Individually source-locked issuer originals

All three additions are **R5 comparison-only**; the pre-existing canonical R4 selections and all financial reporting decisions are unchanged.

| Issuer | Prior quarter / scope | Original URL | SHA-256 | Financial source evidence (revenue; PAT; diluted EPS) | R2 workflow |
| --- | --- | --- | --- | --- | --- |
| NATIONALUM / NALCO | 2024-09-30 consolidated | https://nsearchives.nseindia.com/corporate/LetterOutcomeSept2024Results_13112024163859.pdf | `7790c4058aaa501783a620204126115e2b4d54a617c9d40c1d76f9edfd9935a9` | ₹4,001.48 crore; ₹1,045.97 crore; ₹5.70 | [39554331361](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39554331361) PASS |
| CHOLAFIN | 2024-12-31 standalone | https://files.cholamandalam.com/Financials_Dec2024_be5d6dd603.pdf | `6882e169027075032ece7ca0323025c2a873e4d29389e422cfe02989ff3e8476` | ₹6,709.21 crore; ₹1,086.53 crore; ₹12.89 | [39554971861](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39554971861) PASS |
| ICEMAKE | 2025-06-30 consolidated | https://www.icemakeindia.com/wp-content/uploads/2025/08/Financial-Results-the-quarter-ended-June-30-2025.pdf | `496fa0108c00af4551d1e5d85944a1cb19e0627e930361a029176a3b3b790975` | ₹111.5014 crore; **loss of ₹1.4690 crore**; **-₹0.90** (original financial report in ₹ lakh, converted precisely) | [39556118533](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39556118533) PASS |

Manifest paths:
- `src/features/results/resultsR5NATIONALUMOriginalComparisonProof.json`
- `src/features/results/resultsR5CHOLAFINOriginalComparisonProof.json`
- `src/features/results/resultsR5ICEMAKEOriginalComparisonProof.json`

Each compares selected issuer original SHA with stored source record and checks period, issuer identity, date, accounting scope and all three metric identity IDs. The verifier's documented output is R5-only: **zero R4 changes**, independently original-SHA-retained Cloudflare R2 bytes, no duplicate provider calls for previously registered original sources.

## Remaining requirements

1. Reconcile each of the **36 exact exception ledger** company-quarters, rather than assigning synthetic grades, backfilling later information or weakening the two-history sequential comparison standard.
2. For 26 preceding-quarter source gaps, reuse original-signed Dev R2 sources before calling official BSE/NSE issuer websites; Trendlyne is fallback, subject to entitlement/provider quotas.
3. For six insufficient own-history comparisons, apply only the approved calibration with 4 independent issuer peers and 12 source-qualified pairs, or two chronological issuer-original own-company pairs, including target quarter. Prove genuine nonexistent history individually instead of calling it a technical bug.
4. For four scope conflicts, review independent accounting originals and same reporting basis; never overwrite R4 canonical selected scope, and never silently prefer later source corrections.
5. **R5-G final acceptance requires full repository CI, authenticated reference UI 100%-zoom fidelity, confirmed automatic data refresh and Development preview READY at the actual final SHA**. Engine-grading PASS is not this final acceptance.

**Do not use this progress checkpoint to announce R5 COMPLETE.**
