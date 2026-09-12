# Stage N4C.2 — Stored Linked-Document Text Extraction Pilot

## Goal

Prove deterministic text extraction from an already captured official NSE linked document without making any further request to NSE and without mutating normalized news.

## Scope

- Input is one existing `NSE_NEWS_LINKED_DOCUMENT_PILOT_RESPONSE` capture produced by N4C.1.
- The source document must already exist in the private `news-source-documents` bucket.
- No external source fetch is allowed.
- Only PDF documents are supported in this pilot.
- The function validates the stored bytes against the SHA-256 recorded by N4C.1 before parsing.
- Parsing uses the pinned serverless `unpdf@1.8.1` package, which is designed for Deno/serverless runtimes.
- Maximum stored document size remains 5 MiB.
- Maximum PDF page count is 12.
- Maximum persisted extracted text is 20,000 characters.
- A short text preview is returned to the authenticated caller for review.

## Security and ownership

The pilot must verify:

1. authenticated PortfolioAI user;
2. portfolio ownership;
3. active normalized news item;
4. the news item security is a current open holding;
5. held security is an equity;
6. reviewed N4C.2 policy is active;
7. parent capture belongs to `COMPANY_EXCHANGE_FILING` and is a N4C.1 linked-document capture;
8. capture metadata points to the requested news item;
9. storage bucket is exactly `news-source-documents`;
10. the stored PDF bytes hash to the previously recorded N4C.1 document SHA-256.

## Resource controls

- External NSE/network source fetches: **0**.
- Storage download: one private object read only.
- PDF page limit: **12**.
- Maximum image size passed to PDF.js: 16,777,216 pixels.
- Text extraction timeout: **10 seconds**.
- Persisted text limit: **20,000 characters**.
- No OCR.
- No image extraction.
- No document rendering.

## Output

Create one derived `data_source_records` row with record kind:

`NSE_NEWS_LINKED_DOCUMENT_TEXT_EXTRACTION_PILOT`

The derived record stores:

- parent capture record id;
- news item id;
- security id / symbol;
- storage path;
- verified document SHA-256;
- PDF page count;
- extracted character count;
- truncation flag;
- bounded extracted text;
- extraction method and package version.

The derived payload hash is the SHA-256 of the persisted extracted text.

## Accounting

Create a normal ingestion run and run item so the work is auditable, but record:

- `estimated_call_count = 0`
- `reserved_call_count = 0`
- `attempted_call_count = 0`
- `external_fetches = 0`
- `linked_document_fetches = 0`

This is internal processing of already captured evidence, not a provider call.

## Explicit non-goals

N4C.2 does **not**:

- fetch NSE again;
- update `news_items`;
- change headline, summary, category, tone, or importance;
- call AI;
- enable a scheduler;
- parse XML linked documents;
- OCR scanned PDFs.

## Promotion gate

After one successful HDFCBANK pilot, manually review the extracted text. Only if the extraction is faithful and sufficiently informative should a later stage propose deterministic fact extraction and any normalized-news mutation.