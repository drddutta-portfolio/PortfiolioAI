# R4 Tata Capital accessible exchange originals

The issuer-hosted financial-result URLs currently return HTTP 406 in local source retrieval. Two actual NSE-hosted originals were downloaded and their covers inspected: the 19 January 2026 submission (20 pages) and 23 April 2026 Board outcome (63 pages), both explicitly Tata Capital Limited / TATACAP / scrip 544574. Their statutory financial tables contain December 2024 and March 2025 quarter columns respectively. No dates or financial values are inferred from annual totals.

Closed pinned sources:
- https://nsearchives.nseindia.com/corporate/TATACAPITAL_19012026163254_TCLFinancialsLODRsigned.pdf
- https://nsearchives.nseindia.com/corporate/TATACAPITAL_23042026165109_FinancialsMarch2026signed.pdf

Only these exact NSE URLs are added to the issuer adapter. Arbitrary NSE URLs remain rejected. The existing whole-original audit, issuer/scope/date/unit/math checks, adjacent statutory-table replay and protected selection remain unchanged. A local 300/450 DPI continuation attempt on the December comparative rejected an unreadable numeric cell; no facts were normalized or admitted from that attempt. Alternate supported render pairs may be tried by recovery. No claim of closed gaps is made by adding source URLs.

A search hit for a September 2024 debt financial statement was rejected: it belongs to Tata Motors Finance Limited, a different issuer. No predecessor figures are copied.

The targeted seed workflow now covers TATACAP; the ordinary recovery still covers the full unresolved cohort. No UI, schema, RLS, transactions, holdings, main or Production changes. R4 remains partial.
