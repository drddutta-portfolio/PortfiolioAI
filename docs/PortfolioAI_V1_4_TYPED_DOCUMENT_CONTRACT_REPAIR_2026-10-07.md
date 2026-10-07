# V1-4 typed documentary contract repair — 7 October 2026

Status: repair implemented and deployed; V1-4 remains IN PROGRESS / NOT PROVEN.

## Owner decision and contract

The owner explicitly approved separating the mixed risk signal's 252-session lookback from documentary evidence count. The shared evidence planner now uses an explicit requirement-code mapping for the affected documentary risk requirements. A comprehensive source-anchored risk review requires one distinct document identity; RATING_TREND requires three distinct dated documentary identities. The original 252-session signal lookback remains recorded separately. Unknown documentary requirements retain their existing minimum and fail closed. Market history remains 252 sessions, operating-margin history eight periods, ROCE three periods and governance-event review four documents. No methodology assignment, frozen membership, value, evidence freshness or owner-review authority was changed.

The private correction manifest records 45 affected requirement items across 44 stocks. This repairs a unit mismatch; it does not prove substantive risk coverage or promote any stock to READY.

## Proven document-source status defect

The live research_document_sources constraint permits OBSERVED, VERIFIED, REVIEW_REQUIRED, FAILED and REJECTED. The materializer reads source_status directly, but its review adapter required AVAILABLE, which cannot exist in that table. The adapter now requires VERIFIED. Regression tests explicitly reject all non-verified and unsupported statuses. Canonical observation evidence_status remains AVAILABLE where appropriate; that separate contract was not changed.

## Deployment and validation

Development project lrgpjimipfkyoqbpsqzz materializer v36 is ACTIVE; bundle SHA-256 ed4955f4275ac5ce4559cf789aeb771e2e96cc98b68144ee9c73f1e21a5809b5. verify_jwt=false remains unchanged; existing application/session/grant checks remain intact.

86 focused V1-4 tests pass. Two existing V1-4 test fixtures were updated to respect the already-implemented four-hour post-close retrieval window and provide an evaluation-consistent cutoff when checking stale facts. The broader Edge suite also contains two unrelated legacy Program A source-text assertion failures; those are not reported as passing.

## Genuine acquisition

The original AKUMS FY2024–25 and FY2025–26 annual PDFs were acquired from the official company website and retained in private portfolioai-history-dev R2, under the Development-only official-document prefix, with successful byte-for-byte SHA-256 readback. The authenticated gateway permits only append-only content-addressed PDF objects and rejects other namespaces and deletion. No public bucket access was enabled.

The FY2025–26 PDF is 12,635,788 bytes, SHA-256 444cf28dfffc8e8bb719d25b8aa27fa646ed43276adad4ff656d4c9849345711. It has a new canonical document identity and source appearance. About 20 KB of source-linked excerpts and metadata were appended to Supabase; the full body remains in R2. Publication and normalized reporting metadata remain unclaimed until source proof is established. Document identity VERIFIED does not mean requirement review ACCEPTED.

No owner signature was fabricated. No readiness materialization has been run from these repairs alone. No Production/main changes, migrations, Auth/RLS changes, scheduler actions or P8 execution occurred.
