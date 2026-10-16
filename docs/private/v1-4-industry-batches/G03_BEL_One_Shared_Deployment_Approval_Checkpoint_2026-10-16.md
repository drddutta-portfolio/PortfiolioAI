# BEL — one shared Development deployment checkpoint

**Execution disposition — 16 October 2026:** the owner approved this shared-service checkpoint. The authorized deployments, actual three-date valuation admission and BEL-only guarded save completed. BEL is independently persisted READY at the recorded evaluation, 11/11 mandatory requirements FRESH. [Executed result and freshness limits](G03_BEL_READY_Activation_Execution_2026-10-16.md). The proposal and earlier automatic-review restriction below are retained as historical context, not a current request for repeated approval.


## Actual independently verified state

The current selected BEL snapshot is `47664389-ea9c-4bce-aef2-a1f8183380b5`, selection `2cea310c-095e-4070-a721-4d5dc2fc59cf`, saved at 02:04:48 IST on 16 October 2026 by run 38803021687. Operating-margin history is now persisted FRESH. Nine other qualified mandatory items, including market history, cash/debt, ROCE, orders and documentary reviews, remain preserved: ten FRESH of eleven required items in total. **Mandatory blockers decreased 2 → 1.** The sole remaining blocker is VALUATION; BEL remains REVIEW_REQUIRED with ₹0 READY frozen value. Frozen BEL value is ₹26,789.00, unchanged. Other six G03 selections are independently unchanged.

All nine required original valuation-source documents/catalogues are registered with original hash/document/link bindings. The old FY2026 XBRL registration is reused without replacing its earlier title, identity fragment or verification timestamp. Source qualification verifies actual official availability, exact issued shares and the three October 13–15 price joins. The BSE route obtained eight primary quarterly originals and corroborated fifteen standalone input cells; its dashboard OPM and current quote are not substituted into the approved contract.

No actual valuation review has been admitted. The active reviewer v23 fails on a producer-hash format mismatch. The source writer hashed insertion-ordered JSON; PostgreSQL JSONB reorders its keys. The tested fix reconstructs the original writer's exact schema/order and verifies both real retained hashes, preserving every stored source/hash/value. It rejects altered values, unexpected fields and changed types.

A local memory-only integration run uses actual read-only Development source, document, price, calendar and accepted cash/debt records. The corrected admission path simulates three complete dated valuation reviews, six memory-only inserts and idempotent repetition; the tested canonical adapter returns FRESH through the independently verified session boundary, 09:00 IST on 16 October. **Real database writes/admissions from this simulation are zero. This is not a live canonical FRESH or READY result.** The actual runtime must revalidate at its current clock; no date or expiry may be backdated or simply extended.

## One explicit authorization needed

Approve the tested BEL update to these **shared Development services**, acknowledging that they also serve other holdings and have existing write capabilities:

1. `v14-g02-document-admission`: deploy the prepared successor to v23. Preserve 56/57 existing runtime files; correct only the fixed BEL retained-price hash reader and add its pure integrity helper. Authentication, workflow identity, owner isolation, source scope, review scope, other G02/G03 paths and provider controls remain unchanged.
2. `p7-ic2-materialize-readiness`: deploy the prepared successor to v76. Preserve 64/66 existing files; change only one trusted argument in the existing validation call and the exact approved BEL valuation adapter, adding five source-bound modules. Authentication, grant issuance/consumption, write action branches, BANK modules and other profiles remain byte-identical. The existing shared all-held write capability is not expanded. Deployment risk is shared-service availability/regression, addressed by preserved-live assembly, tests and exact rollback baselines.

The importer remains at v9. Its rejected optional metadata redeploy is unnecessary because the pre-existing registered original is independently reused. No schema migration, new service-role exposure, owner impersonation, Production/main, scheduler activation, paid acquisition or PR merge is included.

After the two authorized deployments: verify actual deployed files/hashes; execute the existing signed fixed-BEL valuation admission; verify all three review/source hashes and duplicate idempotence; run current canonical prospective validation; issue the existing one-use BEL-only zero-provider grant only if all mandatory requirements are FRESH/READY; materialize BEL only; reject replay; independently read back its selected snapshot, blockers and frozen value. Confirm the other six G03 selections and all pre-existing financial observations remain unchanged. If the clock/source prerequisites do not pass, preserve current valid evidence and report the exact blocker; approval does not waive any evidence or freshness condition.

Rollback means restoring the exact saved v23 admission and v76 canonical function bundles if runtime/auth/isolation regresses. Do not delete or rewrite retained source evidence, reviews, snapshots or selections.

## Automatic review restriction

Automatic approval review rejected the shared canonical deployment twice because its existing broad all-portfolio write capability exceeded what it treated as BEL-only authorization, despite exact preservation proof. It also rejected the narrow admission-handler hash-fix deployment because the shared service contains wider G02/G03 write/provider-research paths. These rejections have not been bypassed. The requested authorization explicitly acknowledges that shared-service deployment boundary while retaining BEL-only subsequent actions.

## Reviewable implementation and checks

Code and source decisions are in PR #136. The independent BSE adapter/original-source assessment is in PR #149. Exact candidate file hashes and baseline deployment hashes are in the adjacent deployment manifest; the local simulation is explicitly labelled candidate-only in its own JSON record.

Full Repository Verification and Architecture Guard passed on `b558c11e` (38801389083 / 38801393339) and the immutable-pin successor `4c22bc7f` (38803221054 / 38803224398). The corrected producer-hash reader passes both actual retained-capture comparisons, the complete 470-test Edge suite, lint, Deno checking of its preserved-live candidate and five Python source-binding tests. Final corrected implementation head `24c49bf48e44d72c1854ec022cccc65f0bfe78eb` passed Full Repository Verification **38804276313** and Architecture Guard **38804280427**. Both conclusions are SUCCESS. Subsequent changes are execution documentation and the append-only ledger, with whitespace/secret checks; no later executable change is claimed.
