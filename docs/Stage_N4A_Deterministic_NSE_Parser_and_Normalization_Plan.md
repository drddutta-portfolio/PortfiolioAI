# Stage N4A — Deterministic NSE Parser and Normalization Plan

**Status:** Preparation only; no new production deployment in this stage
**Branch:** `news-intelligence`

## Objective

Promote the successfully observed NSE Corporate Announcements RSS contract into a deterministic parser and a tightly bounded normalization pilot. N4A must prove one held-security announcement can move from immutable raw exchange evidence into `news_items` and `news_source_appearances` without AI, scraping, scheduling, or inferred facts.

## Observed contract frozen from N3C

The live NSE RSS response contains repeated `<item>` elements with the following observed fields:

- `title` — company name
- `link` — official NSE archive document/XML URL
- `description` — exchange announcement description, often ending in `|SUBJECT: ...`
- `pubDate` — exchange publication timestamp in `dd-MMM-yyyy HH:mm:ss`

The feed itself includes a valid HDFC Bank item, proving direct relevance to an open PortfolioAI holding.

## Parser rules

The parser is deterministic and bounded:

1. parse RSS `<item>` blocks only;
2. require non-empty title, link and description;
3. require an `https://nsearchives.nseindia.com/` source URL;
4. parse publication timestamp exactly in Asia/Kolkata semantics; never substitute retrieval time;
5. split a trailing `|SUBJECT:` marker when present;
6. decode the small XML entity set required by observed RSS text;
7. reject malformed items rather than guessing;
8. do not fetch linked PDF/XML documents.

## Held-security matching

NSE RSS currently exposes company name rather than trading symbol. Matching therefore uses only deterministic stored identity evidence:

- active NSE listing for the security;
- canonical security name;
- `MATCHED` identity observations with confidence `1.0000`;
- normalized exact company-name equality after conservative legal-suffix normalization (`Limited`, `Ltd`, punctuation/spacing).

A feed item is accepted only when exactly one currently held equity matches. Zero matches are ignored. Multiple matches are quarantined/rejected. Fuzzy name matching is prohibited.

For HDFCBANK, PortfolioAI already stores the matched observed identity `HDFC Bank Ltd.`; conservative suffix normalization makes it exactly equivalent to the RSS title `HDFC Bank Limited`.

## Normalized field mapping

For each uniquely matched held item:

- `security_id` = matched PortfolioAI security
- `headline` = concise deterministic announcement headline derived from company + subject when subject exists; otherwise company + normalized announcement description prefix
- `summary` = exchange description with the trailing subject marker removed
- `category` = deterministic subject mapping only
- `importance_state` = initially `UNCLASSIFIED`
- `tone_state` = `UNCLASSIFIED`
- `tone_method` = `UNCLASSIFIED`
- `published_at` = exact parsed NSE publication time
- `publication_precision` = `DATETIME`
- `primary_source_name` = `NSE`
- `primary_source_url` = official NSE archive link

N4A intentionally performs no sentiment/tone inference.

## Initial deterministic category mapping

Only high-confidence subject mappings are promoted:

- Change in Directors/KMP/SMP/Auditor/RTA -> `MANAGEMENT`
- Record Date / Corporate Action / Dividend -> `CORPORATE_ACTION`
- Financial Results -> `RESULTS`
- Credit Rating -> `CREDIT_RATING`
- Order / Contract / Letter of Award -> `ORDER_CONTRACT`
- Fund Raise / Preferential Issue / QIP -> `FUND_RAISE`
- Acquisition / Merger / Investment -> `MA_INVESTMENT`
- Shareholding / Insider Trading -> `SHAREHOLDING_INSIDER`
- Litigation / Fine / Penalty / Governance -> `LITIGATION_GOVERNANCE`
- all other subjects -> `UNCLASSIFIED`

No category is inferred from stock-price direction.

## Deduplication

Source appearance dedupe key precedence:

1. normalized official NSE archive URL;
2. otherwise security + normalized headline + exact published timestamp.

Canonical news key is SHA-256 of the stable source identity, bounded to the existing `canonical_key` length.

Reprocessing the same raw capture must be idempotent. Existing `news_items` are updated only for `last_seen_at`; existing source appearances are not duplicated.

## N4A normalization pilot

The pilot Edge Function will:

1. authenticate the owner;
2. verify portfolio ownership;
3. require an N4A normalization policy with scheduling disabled;
4. load exactly one captured `NSE_NEWS_RSS_PILOT_RESPONSE` record by ID;
5. parse the captured XML only — zero external network requests;
6. build the owner portfolio's currently held equity identity set;
7. normalize only uniquely matched held items;
8. insert/upsert `news_items` and `news_source_appearances` transactionally as far as the current Supabase contract allows;
9. report parsed, matched, inserted, duplicate and rejected counts;
10. stop.

The initial production pilot should be restricted to the already-reviewed N3C capture until results are reconciled.

## Explicit exclusions

N4A does not:

- enable scheduled ingestion;
- fetch NSE linked PDFs/XML documents;
- call Trendlyne;
- call AI;
- assign positive/neutral/negative tone;
- generate investment recommendations;
- ingest media articles;
- perform fuzzy security matching.

## Acceptance gate

Before scheduling or Dashboard integration:

1. parser tests pass against the observed HDFCBANK-shaped item and malformed/duplicate cases;
2. exactly one HDFCBANK item from the captured feed normalizes correctly when present;
3. publication timestamp and NSE URL are preserved exactly;
4. duplicate rerun creates no duplicate source appearance;
5. unmatched/ambiguous companies create no normalized row;
6. tone remains `UNCLASSIFIED`;
7. zero external network requests occur during normalization;
8. scheduler remains disabled.
