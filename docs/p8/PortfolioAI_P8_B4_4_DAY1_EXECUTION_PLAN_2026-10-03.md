# P8-B4-4 bounded full acquisition campaign — Day 1 execution plan

Date: 2026-10-03
Environment: PortfolioAI Dev only
Branch: PortfolioAI-Development

Frozen limits:
- exact Trendlyne identity + matching historical ISIN only
- 239 exact-provider identities total
- two domains: fundamentals history + document history
- maximum planned Trendlyne attempts/day: 320
- retry/diagnostic reserve: 80, not usable for planned expansion
- provider per-run limit: 40
- no canonical promotion
- no B4 historical schema writes
- no Production/main changes

B4-3 already completed 3 identities / 6 calls today.
Therefore B4-4 Day 1 may add at most 157 identities / 314 calls.

Expected state after a clean Day 1:
- complete identities: 160 / 239
- provider attempts today: 320 / 320 planned ceiling
- remaining identities: 79
- remaining minimum planned attempts: 158
- B4-4 remains ACTIVE / PARTIAL until a later calendar day permits the remaining slice.

The campaign is resumable and cache-first. Existing B4-3/B4-4 raw captures are reused. Any missing identity, provider mismatch, quota failure, capture persistence failure, provider tool/schema failure, or accounting failure stops the current slice fail-closed.
