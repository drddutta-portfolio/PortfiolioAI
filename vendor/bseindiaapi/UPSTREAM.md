# Vendored BseIndiaApi — PortfolioAI
Source: https://github.com/BennyThadikaran/BseIndiaApi
Pinned upstream commit: 488566621ac189f6bde03b227abb70f18faa1ebe
Upstream package version: 3.3.3
License: GPL-3.0 (copy in LICENSE in this directory)
Installed as: local Python source at vendor/bseindiaapi/src/bse/

**Intentional local patch:** The single BSE.announcements() request key `strscrip` is changed to `strScrip` exactly as proposed in https://github.com/BennyThadikaran/BseIndiaApi/pull/18 .
That patch was live-verified against historical BSE issuer announcements in https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38791198521 .
No other upstream code changes were made.

Treat this package as a backend source dependency; never import Python into React, publish user- or source-authentication tokens, or replace original issuer filing qualification with aggregate snapshots.
Use `scripts/portfolio_bse.py` as the *only* integration point for R3 and other workstreams. No automatic changes to production/main, bank V1-4 scoring or financial selection happen merely by installing it.

Update instructions:
1. Review and pin a new upstream commit and its version/license.
2. Review upstream changes and re-apply or remove the exact `strScrip` patch.
3. Run the hermetic adapter tests and the live BSE smoke workflow in Development.
4. Perform independent issuer/ISIN/period/source evidence audits before promoting any observations.
