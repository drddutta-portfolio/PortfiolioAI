# Stage N6 — News Intelligence Production Completion

Status: **COMPLETE for the current production scope**

## Production outcome

PortfolioAI News Intelligence now runs end-to-end from official NSE announcements to the owner dashboard:

1. The official NSE corporate-announcements RSS feed is fetched on a 30-minute schedule.
2. Announcements are matched only to eligible held NSE equities using canonical identity evidence.
3. Canonical news rows and source appearances are deduplicated and idempotent.
4. Linked official documents are captured with strict host, redirect, byte and content-type controls.
5. Stored PDFs are text-extracted with `unpdf@1.8.1` under page/character/time limits.
6. Deterministic category, importance and tone are assigned from the feed when evidence is sufficient.
7. Items still unresolved are reclassified from already-stored official document text; this step performs no new external fetch and uses no AI/OCR.
8. The dashboard displays the portfolio news feed with Positive/Neutral/Negative tone colors and a bounded scrollable history.

## Scheduler

- NSE ingestion: `portfolioai-n5-nse-news-30min` — `*/30 * * * *`
- Stored-evidence classification: `portfolioai-news-evidence-classification-30min` — `5,35 * * * *`
- Manual live ingestion remains disabled.
- Scheduler authentication uses a dedicated token stored in Supabase Vault; repository migrations contain secret names only, never secret values.
- The scheduler wrapper suppresses closely repeated successful scheduled calls using the NEWS freshness window.

## Safety and accounting invariants

- Production Edge Function keeps `verify_jwt=true`.
- Official NSE remains unmetered: provider budget reservations are zero.
- Ingestion run/run-item accounting remains mandatory.
- Lease/cooldown concurrency protection remains active.
- Stable canonical/source/document/extraction identities preserve retry idempotency.
- Browser roles do not receive direct write access to protected news evidence/audit tables.
- AI and OCR remain disabled in this production scope.
- Unknown evidence may remain `UNCLASSIFIED`; the system must not invent sentiment when evidence is insufficient.

## Classification-quality completion

Stored official filing text is used to resolve generic NSE subjects such as `Others` or `General Updates` when the document itself provides enough evidence. The classifier covers existing canonical categories including Regulatory, Management, Results, Corporate Action, Order/Contract, Fund Raise, M&A/Investment, Credit Rating, Shareholding/Insider, Litigation/Governance and General.

A false-positive validation case was caught during rollout: the words `Fraud & Vigilance functions` appeared inside an executive biography and initially triggered a negative tone. The v2.1 rule now requires adverse-event context for fraud-related negative classification rather than matching an isolated background word.

At completion validation, all currently captured active news rows with stored classification evidence were resolved; no evidence-backed item remained unclassified.

## Dashboard integration

The main dashboard reads the live portfolio feed through the existing authenticated news RPC. The compact panel supports:

- company/ticker
- official headline and NSE source link
- publication time and category
- importance badge
- tone badge and row accent: green Positive, blue Neutral, red Negative, gray Unclassified
- bounded scrolling with up to 50 recent captured announcements

## Repository reconciliation

This completion stage deliberately reconciles only the production News Intelligence assets into canonical `main`. Historical pilot UI pages, pilot public HTML controls and pilot-only Edge Functions are not promoted into the production app.

## Future enhancements — optional, not blockers

Possible later enhancements include AI-assisted narrative interpretation, concise `why this matters` summaries, richer filters/history, materiality estimates and broader official-source coverage. These are enhancements over a functioning production News Intelligence system and are not required to mark the present scope complete.
