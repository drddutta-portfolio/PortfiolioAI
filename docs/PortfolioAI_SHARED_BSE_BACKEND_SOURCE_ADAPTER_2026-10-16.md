# PortfolioAI Shared BSE Backend Source Adapter — Development Installation

Date: 2026-10-16  
Branch: **PortfolioAI-Development only**  
Status: **Vendored source and R3 discovery adapter installed; qualification/persistence integrations gated**.

## Purpose and source

- Upstream repository: https://github.com/BennyThadikaran/BseIndiaApi
- Pinned source SHA: \`488566621ac189f6bde03b227abb70f18faa1ebe\`.
- Upstream release identifier: **bse 3.3.3**.
- Location: \`vendor/bseindiaapi/src/bse\` (copied source), \`vendor/bseindiaapi/LICENSE\`, upstream \`README.md\`, attribution \`UPSTREAM.md\` and \`requirements.txt\`.
- Single upstream patch: use BSE \`strScrip\` corporate announcements parameter instead of \`strscrip\`, as demonstrated by the public upstream PR https://github.com/BennyThadikaran/BseIndiaApi/pull/18.
- Shared, fail-closed service wrapper: \`scripts/portfolio_bse.py\` (\`PortfolioBSE\`).
- Python dependencies: \`mthrottle==0.0.2\`, \`requests==2.34.2\`. Do **not** \`pip install bse\` in the runtime, as this project now uses vendored source.
- Source code remains on server-side Python jobs; no BSE requests directly from the React UI and no secrets exposed.
- The vendored copy preserves upstream license and attribution in-tree.

## Shared adapter API

\`\`\`python
from portfolio_bse import PortfolioBSE
from datetime import date

with PortfolioBSE() as bse:
    candidate = bse.get_scrip_candidate("HDFCBANK")  # Not an ISIN-verified identity
    snapshot = bse.results_snapshot("500180")       # Recent quarters, discovery only
    source_index = bse.financial_announcements(
        "500180", date(2024, 10, 1), date(2024, 11, 30),
        max_pages=3,
    )
    if source_index["results"]:
        attachment = source_index["results"][0]["attachment_name"]
        if attachment:
            original_bytes, source_meta = bse.retrieve_original_pdf(attachment)
            # Pass original bytes, source metadata and identity to
            # the separate strict R3 issuer/PDF field qualification stage.
\`\`\`

Other consumer-facing method: \`result_calendar()\` (announcement date metadata only). All outputs are explicitly \`DISCOVERY_ONLY\` or \`ORIGINAL_BYTES_UNQUALIFIED_FINANCIAL_FACTS\`, never canonical investments scores or admissible observations automatically.

## Immediate R3 consumer

- \`scripts/results/r3-bse-source-discovery.py\` is an actual R3 caller of the shared vendored adapter.
- It supports 1–12 \`SYMBOL:BSE_CODE\` targets per bounded run and date windows not exceeding 100 days.
- The optional \`--pdf-hash-limit\` downloads and validates a maximum of three official issuer PDF attachments per company, computes immutable SHA-256, then releases the bytes without writing the original third-party PDF to the repo or Cloudflare.
- It produces JSON-only discovery metadata. It does **not** update Supabase observations, select any financial facts, invoke V1-4 scoring or alter production.
- CI workflow \`.github/workflows/results-r3-bse-vendored-integration.yml\` tests vendored import and exact library version, runs the no-network adapter regression tests, and performs live bounded issuer-original discovery for ASTRAL, BEL and HDFCBANK in the September/December 2024 filing windows.
- The deployed workflow on Development demonstrates read-only integration. **It is not a claim that every missing 2024 slot has been filled**.

To run from repository root (after installing dependencies):

\`\`\`sh
python -m pip install -r vendor/bseindiaapi/requirements.txt
python scripts/results/test_portfolio_bse.py -v
python scripts/results/r3-bse-source-discovery.py \
  --targets 'ASTRAL:532830,BEL:500049,HDFCBANK:500180' \
  --from-date 2024-10-01 --to-date 2024-11-30 --max-pages 3 \
  --pdf-hash-limit 1 --out tmp/results-r3-bse/sep2024.json
\`\`\`

## Reuse in V1-4 and future stages

Future consumers should **import the same \`PortfolioBSE\` adapter**, not vendor the library repeatedly. Useful candidate datasets:
- R3 and R5: original issuer financial statements, publication timestamps and latest-quarter discovery.
- V1-4 bank/nonbank source remediation: institution-specific original publication statements, subject to bank contract metric exactness (NIM TTM is *not* inferred from annual NIM; never relabel); source/version and period proof.
- Corporate actions: BSE issuer announcements and security-identity evidence, always reconcile against canonical ISIN and corporate action ledger.
- News/earnings updates: publication discovery and deduplication.
- Other research: financial reports sourced from original filings and independent as-first-reported selection where required.

No automatic V1-4 research authority changes arise from installing the package; each consumer needs explicit evidence selectors and its own tests. No source is downloaded for a fact already qualified and cached. The existing R3 data readback and 262-equity reconciliation remain acceptance gates.

## Safety and operational limits

1. Exchange requests are bounded by scrip and a maximum 100-day date window, maximum five pages; no bypass of endpoint access controls or huge bulk requests.
2. The BSE library returns names, codes, articles, document attachments and snapshots. A ticker or scrip-code match alone never reconciles historical ISIN.
3. Original PDFs are restricted to BSE \`AttachHis\` or \`AttachLive\`, UUID attachment filename, actual \`%PDF-\` header and <=12 MB, with source SHA-256.
4. Validate source issuer, as-originally-published quarter, original publication time, reporting scope, historical share basis, units, filing version and accounting identity before canonical fact admission.
5. A BSE snapshot mixes recent quarterly and FY data, so it is not an eight-quarter source. Never use reported current figures as historical point-in-time evidence.
6. Keep compact manifest and fact evidence in Development Supabase/R2 under retention and quota rules; do not store repeated downloaded PDFs without a separate approved retention policy.
7. Keep \`main\`, deployed Production frontend and V1-4 readiness unchanged until independently verified and explicitly promoted.

## Installation verification and evidence

- Prior original live source package test: https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38790942383
- Prior corrected historical announcements test: https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38791198521
- Prior BSE original September/December 2024 PDFs and SHA: https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38791409640
- Shared vendored installation regression and R3 live discovery: see GitHub Actions workflow \`Results R3 BSE Vendored Integration and Live Proof\` on Development. Check job logs before claiming passed.
