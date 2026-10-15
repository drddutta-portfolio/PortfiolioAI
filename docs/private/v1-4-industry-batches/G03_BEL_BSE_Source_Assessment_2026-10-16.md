# BEL BSE source assessment — 16 October 2026 IST

The pinned vendored BseIndiaApi v3.3.3 and PortfolioAI shared Python adapter successfully retrieved all eight primary BEL quarterly-result originals from September 2024 to June 2026. This is verified source acquisition, not financial admission or a READY declaration.

## Executed evidence

- Initial read-only discovery: [run 38796801988](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38796801988), all eight bounded company-filtered windows succeeded, 170 announcement records scanned, no pagination truncation.
- Artifact-only inspection: [run 38797237697](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38797237697), no repeated upstream discovery.
- Primary-original recovery: [run 38797815242](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38797815242), eight originals verified, five reused and only three missing originals downloaded. All eight have issuer name/CIN and readable financial tables. Each original was independently downloaded and SHA-256 checked locally.
- Fifteen shared-adapter tests passed in the recovery run. The vendored upstream library itself is unchanged.

The initial run's eight successful PDF downloads did not represent eight distinct primary quarter filings. Generic board outcomes were omitted and two March-2025 files exceeded the 12 MB default. The recovery resolves those limits without concealing the initial classification error. The shared adapter now preserves headline/category metadata and supports a caller-selected PDF size up to a bounded 32 MB; the default remains 12 MB.

## Useful data and integration boundaries

Recent BSE dashboard data includes June-2026 standalone revenue ₹5,533.06 crore, PAT ₹1,048.33 crore and EPS ₹1.43. The original filings contain separate standalone/consolidated financial tables, comparative periods, finance costs, depreciation and other income. They can corroborate existing exact NSE XBRL cells and supply source documents for missing periods.

The dashboard supplies only three period columns. Its OPM 28.13% differs from the approved consolidated raw operating-profit/revenue measure (approximately 25.03% for June 2026). It must not replace the canonical margin definition. A BSE current quote must not replace distinct dated NSE closes in the approved valuation joins. Rounded paid-up capital is not the exact issued-share count. Raw BSE filing timestamps are retained without inventing a timezone/publication precision; availability qualification is separate.

The local executor received HTTP 403 on both live probes. The ordinary GitHub Actions executor succeeded. This establishes an environment-dependent source-access route, not missing documents. No bypass identity or credentials were used.

## Remaining work and effect

Use the eight originals through source-cell, scope, period, publication-availability and corporate-action checks in the established canonical pipeline. Preserve already accepted margin reviews; do not admit duplicate evidence merely because another exchange holds the same facts. Historical valuation components still need exact original availability, prices, shares, cash/debt and financial joins. Original source acquisition alone changes no readiness status.

This probe made zero Supabase/R2 writes, accepted reviews, canonical selections, provider-budget operations, deployments, migrations, scheduler changes, Production/main changes or merges. See the adjacent JSON manifest for exact URLs, byte lengths and hashes.
