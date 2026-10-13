# Results R3 — Acquisition and qualification preflight
**Date:** 2026-10-14
**Repository:** PortfolioAI-Development
**Decision:** R3 financial-data acceptance BLOCKED; read-only preflight completed

## Verified Development database observations
- 499 transactions; 491 unsuperseded; 284 securities; 262 historically transacted equity identities. These are not the calculated open/closed population.
- 2,507 fundamental_observations; zero canonical fundamental_observation_decisions and zero current_fundamental_observations_v1 rows.
- For the four currently supported Results metrics (OPERATING_REVENUE_QUARTER, OPERATING_PROFIT_QUARTER, ADVANCES_GROWTH_YOY, DEPOSITS_GROWTH_YOY), exactly 16 directly quarter-dated numeric observation rows were observed across **two securities** and **10 distinct stock–quarter combinations**.
- Only two of those 16 have published_at. Fourteen have UNKNOWN/null consolidation scope.
- The 236 Trendlyne structured captures and 236 P8 fundamentals captures are *source containers*, not proven quarter observations. They require bounded source-shape inspection, metric/period mapping and qualification before any selection.
- Original NSE Financial Results and Integrated Filing pages are available as public discovery interfaces, with period, basis and broadcast metadata. A compliant authenticated data transport, revision-aware parser and original-source acquisition still need verification. Public pages are not a license to bypass technical restrictions.

## Workable acquisition sequence
1. Recover existing raw captures **read-only** in bounded batches. Preserve source_record_id, original raw hashes and capture date. Do not infer a reporting period from an API retrieval date.
2. Map NSE/BSE/issuer exchange filings by canonical ISIN + exchange symbol, report-period end, document identity, original/revised status, standalone/consolidated basis and verified publication availability. Qualify actual original bytes, not snippets.
3. Use Trendlyne only through its supported, currently authorized application connector after current entitlement, quota and terms are independently proven; no direct Trendlyne MCP tool was available to this chat.
4. Define a scoped authorized canonical selection transaction with publication/source validation and an independent readback; do not insert decisions with synthetic approvals or blindly approve evidence_status='AVAILABLE'.
5. Keep missing/unknown/conflicting quarters explicitly unqualified. Only then enable qualified numeric quarter cells.
6. Daily discovery at 07:00 Asia/Kolkata is a *future operation* until provider transport, result deduplication, run observability, failure/recovery, R2 storage and scheduling tests pass. No daily scan is deployed in this preflight.

## Scope and prohibitions
No remote schema changes; no database writes; no external provider requests; no cloud object writes; no cron; no change to V1-4 selection, banking methodology, main/Production. The accompanying SQL is an inspectable read-only audit artifact.

**Next acceptance condition:** independently persisted canonical decisions for defensible period- and source-qualified quarterly financial observations, followed by readbacks matching source, reporting basis, identity and displayed security/quarter figures. R3 cannot be marked PASS on empty decisions.
