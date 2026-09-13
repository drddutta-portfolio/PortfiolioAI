# Stage N3C — Official Exchange News Source Plan

**Status:** Design/preparation only; no new production deployment in this stage  
**Branch:** `news-intelligence`

## 1. Why N3C exists

Stage N3A and N3B proved that the Trendlyne MCP `get_overview_news_corp_events(..., type='news')` contract is callable and fully accounted, but both HDFCBANK and WAAREEENER returned an empty `newsList`.

Trendlyne therefore remains an approved optional source, but PortfolioAI should not spend quota repeatedly probing the same endpoint without evidence that it will yield useful portfolio news.

The next primary source should be exchange/regulatory evidence that is public, attributable, deterministic, and suitable for scheduled ingestion.

## 2. Source hierarchy

### Tier 1 — official exchange/company evidence

1. **NSE official Corporate Information RSS feeds**
   - NSE publicly documents RSS feeds for Corporate Announcements, Financial Results, Board Meetings, Corporate Actions, Insider Trading, Related Party Transactions, Regulation 29, Regulation 31, Voting Results and other corporate information.
   - Initial pilot: Corporate Announcements only.
   - The RSS feed is intended for automated subscription and is therefore preferable to browser-page scraping.

2. **Company / exchange primary filing documents**
   - Reuse existing PortfolioAI source `COMPANY_EXCHANGE_FILING`.
   - The normalized feed should link back to the exchange/company filing rather than reproduce full documents.

3. **SEBI filings / orders / official disclosures**
   - Secondary regulatory source for events affecting a held company where directly relevant.
   - Not the primary everyday company-news feed.

### Tier 2 — approved structured provider

4. **Trendlyne MCP**
   - Keep enabled only as a controlled optional source until evidence shows non-empty coverage.
   - Do not schedule broad Trendlyne NEWS polling yet.

### Tier 3 — supplemental media

5. Reputable business-media feeds or controlled web search may later supply context that exchange filings do not contain.
   - Never scrape full articles.
   - Store headline/short permitted excerpt, source, timestamp and canonical link only.
   - Media should never outrank an official filing for factual authority.

## 3. BSE decision

BSE remains important for completeness, but N3C will **not** build production ingestion on an undocumented reverse-engineered BSE endpoint.

The first production-capable path will use NSE RSS because NSE explicitly documents RSS delivery for corporate information. BSE can be added when an approved documented/public feed or licensed contract is verified.

## 4. Canonical source identity

Do not create another competing source record for every exchange transport.

N3C reuses:

```text
source_code = COMPANY_EXCHANGE_FILING
source_kind = PUBLIC_WEB
```

The transport and exchange are recorded in raw evidence metadata:

```text
transport = NSE_RSS
exchange = NSE
feed = CORPORATE_ANNOUNCEMENTS
```

This keeps source authority separate from transport implementation.

## 5. N3C pilot contract

The first NSE pilot must be capture-only, similar to N3A/N3B:

```text
authenticated owner request
→ verify portfolio ownership
→ verify selected security is an open holding
→ verify COMPANY_EXCHANGE_FILING source is active and approved
→ verify NEWS pilot policy
→ create ingestion run + one run item
→ perform exactly one HTTP GET to the approved NSE RSS URL
→ enforce response status/content-type/size limits
→ store bounded raw XML evidence in data_source_records
→ record run result
→ stop
```

The pilot must not:

- normalize news items;
- generate summaries;
- assign positive/neutral/negative tone;
- enable scheduling;
- scrape linked article or PDF bodies;
- fall back to another web source in the same run.

## 6. Raw capture contract

Recommended record:

```text
source_code       = COMPANY_EXCHANGE_FILING
record_kind       = NSE_NEWS_RSS_PILOT_RESPONSE
external_record_id = NSE:CORPORATE_ANNOUNCEMENTS:<run-id>
payload_hash      = SHA-256(raw XML)
raw_payload       = { transport metadata + bounded XML string }
```

Browser clients never receive this raw payload.

## 7. Normalization after successful non-empty capture

Only after the real XML shape is observed should the parser be promoted.

Likely fields to extract, only when present:

- exchange-native identifier / GUID;
- company name;
- NSE symbol;
- headline/title;
- description/short text;
- source URL;
- publication timestamp;
- category/feed type.

The parser must never infer a publication timestamp from retrieval time.

## 8. Security matching

For NSE RSS, matching must be deterministic.

Preferred order:

1. exact NSE symbol returned by the feed;
2. verified NSE listing identifier if supplied;
3. exact canonical company/listing mapping already held by PortfolioAI.

Ambiguous company-name-only matching must be rejected or quarantined instead of guessed.

## 9. Deduplication

For one source appearance:

```text
provider/native GUID
→ canonical source URL
→ NSE symbol + normalized headline + published timestamp
→ NSE symbol + normalized headline + publication date
```

The existing `news_items` / `news_source_appearances` model remains valid.

## 10. Tone / card-colour design

The user-facing feed will support four internal tone states:

- `POSITIVE`
- `NEUTRAL`
- `NEGATIVE`
- `UNCLASSIFIED`

Display mapping:

- POSITIVE → soft green
- NEUTRAL → soft blue
- NEGATIVE → soft red
- UNCLASSIFIED → neutral blue/grey, never forced into positive/negative

**Tone is not a Buy/Sell recommendation.** It describes the apparent direction of the reported event only.

The feed must visibly retain company symbol, source and date so that colour never replaces evidence.

## 11. Initial tone policy

N3C will not classify tone during raw ingestion.

After normalization is reliable, tone may be assigned through a separate deterministic/AI-assisted interpretation layer with provenance:

```text
tone_state
tone_method = DETERMINISTIC | AI_ASSISTED | SOURCE_PROVIDED | UNCLASSIFIED
tone_confidence
tone_reason
```

High-confidence deterministic examples can later include clearly bounded events such as:

- declared dividend / confirmed large order / regulatory approval → potentially POSITIVE;
- routine board-meeting notice / voting result / compliance filing → usually NEUTRAL;
- fraud finding / default / material adverse order / rating downgrade → potentially NEGATIVE.

Ambiguous leadership, litigation, fund-raising, acquisitions and analyst commentary should not be auto-coloured without adequate context.

## 12. Dashboard design contract

Desktop:

- 3–4 compact cards per row depending on width;
- source/date/symbol header;
- short headline;
- 1–3 line factual summary;
- category/importance badge;
- click-through to source;
- filters for All / Positive / Neutral / Negative / Important.

Mobile:

- horizontal swipe carousel;
- one dominant card plus a visible edge of the next card;
- no dense tables;
- alerts shown separately only for genuinely important events.

## 13. Scheduling target after validation

Only after a successful non-empty NSE capture and parser validation:

- scheduled poll target: every 30–60 minutes during normal operation;
- ingest one global NSE announcement feed, then filter to held securities;
- do **not** make one network request per stock;
- deduplicate before normalized writes;
- Dashboard reads cache only.

A global feed is materially more efficient than per-security provider polling.

## 14. N3C acceptance gate

Before normalization or scheduling:

1. one authenticated NSE RSS pilot succeeds;
2. raw response is non-empty and bounded;
3. XML structure is captured and reviewed;
4. at least one held-stock item can be matched deterministically;
5. no linked-page scraping was performed;
6. scheduler remains off;
7. zero normalized news writes were made during the pilot.

If the RSS endpoint is unavailable or contract shape is unsuitable, stop and reassess rather than silently fall back to scraping NSE HTML.
