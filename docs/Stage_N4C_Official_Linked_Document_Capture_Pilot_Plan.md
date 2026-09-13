# Stage N4C — Official Linked-Document Capture Pilot Plan

## Purpose

Stage N4C introduces the first controlled fetch of an official NSE announcement document referenced by an already-normalized PortfolioAI news item.

N4C is deliberately **capture-only**. It does not parse PDFs, does not rewrite normalized news, does not classify tone/importance from document contents, does not call AI, and does not enable scheduling.

The first production pilot target is the existing HDFCBANK item whose RSS headline is `Disclosure of material issue` and whose official source URL is an NSE archive PDF.

## Safety boundary

The flow is:

`Authenticated owner -> selected current holding -> existing news item -> reviewed NSE archive URL -> exactly one GET -> private object capture -> data_source_records lineage -> stop`

The pilot must refuse execution unless all of the following are true:

- the caller has a valid PortfolioAI session;
- the portfolio is owned by the caller;
- the news item belongs to a current open equity holding in that portfolio;
- the active COMPANY_EXCHANGE_FILING / NEWS policy is the reviewed N4C capture-only policy;
- the news item source URL is HTTPS and the exact hostname is `nsearchives.nseindia.com`;
- no redirect is followed;
- the returned content type is an allow-listed official-document type;
- the response is non-empty and within the configured byte limit.

## External-fetch accounting

NSE is an official unmetered source rather than a metered commercial provider, so N4C does **not** reserve a Stage 7.2 provider-call budget. It still records the external request through the canonical ingestion accounting tables:

- `data_ingestion_runs`
- `data_ingestion_run_items`
- `record_refresh_item_result_v1`
- `data_source_records`

Each pilot run has:

- requested count: 1
- estimated call count: 1
- attempted call count: exactly 1
- reserved call count: 0
- linked-document fetches: exactly 1

A failed HTTP/network/storage/capture operation must be recorded as a failed run and must not mutate `news_items`.

## Storage design

Create a private Supabase Storage bucket:

`news-source-documents`

Properties:

- private (`public=false`)
- service-role writes only
- no browser policy is introduced
- 5 MiB object size ceiling
- initial MIME allow-list:
  - `application/pdf`
  - `application/xml`
  - `text/xml`

The object path is generated server-side from the immutable news item ID and ingestion run ID. The client cannot choose a URL or object path.

`data_source_records` stores lineage metadata, not document bytes in JSON:

- news item ID
- security ID / symbol
- official source URL
- storage bucket
- storage object path
- HTTP status
- content type
- byte length
- SHA-256 document hash
- run ID

Record kind:

`NSE_NEWS_LINKED_DOCUMENT_PILOT_RESPONSE`

## Redirect / SSRF protection

`fetch` uses `redirect: "manual"`. Any 3xx response fails safely rather than following a redirect to another host.

The URL is loaded from the existing normalized news row and validated using `new URL(...)`. Only:

- protocol `https:`
- hostname exactly `nsearchives.nseindia.com`

is accepted.

No URL supplied directly by the request body is fetched.

## N4C.1 scope

The first pilot performs **capture only**:

- one selected HDFCBANK news item;
- one official linked-document GET;
- private object persistence;
- hash + lineage persistence;
- no PDF parsing;
- no OCR;
- no summary generation;
- no tone/importance update;
- no linked-document-derived category update;
- no scheduler;
- no AI.

## Why parsing is deferred

The current HDFCBANK target is a PDF. PDF extraction inside an Edge Function introduces a separate parser/runtime and document-safety boundary. N4C first proves URL validation, fetch accounting, content-type handling, byte limits, hashing, storage, and lineage.

After one successful capture is reviewed, a separate N4D parser/extraction stage can be designed against the observed document contract instead of guessing.

## Production gate

Repository preparation alone must not apply the migration or deploy/run the pilot.

Required before production:

1. targeted Edge lint passes;
2. app typecheck/build remains healthy;
3. migration is reviewed;
4. Edge function is reviewed for one-fetch maximum and redirect/host restrictions;
5. explicit user approval is obtained to deploy N4C preparation;
6. a separate explicit approval is obtained before running the live linked-document pilot.
