# KVB FY2025–26 ROA — independently retrieved RBI provenance and eligibility boundary
**Date:** 2026-10-11. **Scope:** PR #124, Development only. No factual ACCEPT, grant, score or selection is implied.

## Original regulator bytes obtained in GitHub Actions
Run: https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38135888488
Artifact ID: 11700079787 (`kvb-rbi-original-source-provenance`).

| Original URL | Captured bytes | SHA256 |
| --- | ---: | --- |
| https://www.rbi.org.in/commonman/English/Scripts/Notification.aspx?Id=734 | 228116 | `5d81f213a249e1473476ee31a6e1f280e7de4ebc4047e22b45743e5ec4882d66` |
| https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12158 | 205621 | `d232e5ef4fbb21c556288d0756c3480e8997eb7068397135f73d3602c6195222` |

Source 1 is RBI/2010-11/41, 1 July 2010, section 3.5, *Business Ratios*. It defines Return on Assets by reference to average working funds and working funds as the average of Form X total assets during the financial year (excluding accumulated losses, if any). The regulatory source is original RBI content, not the unrelated `ltnr.ca` short link. Reject `ltnr.ca` as authoritative provenance.

Source 2 is the RBI Financial Statements - Presentation and Disclosures Directions, 2021, updated 3 July 2025. It expressly applies to commercial banks; its repeal/saving clause 24 incorporates earlier circular instructions into the Directions. **Important:** it is not yet independently proven, from retained original Annex III text, that the same precise ROA business-ratio footnote remained unchanged for FY2025–26; do not infer this merely from the repeal clause.

Issuer proof: original KVB FY2025–26 schedules at `https://www.kvb.bank.in/ar-26/assets/pdfs/Karur_Vysya_Bank_IAR_Schedules.pdf`, 484578 bytes, SHA256 `8ae3d6a707135fc47c0df3fada986ecf9fdff62ebd2830da1b1eae9d8537f2b9`. Annual business-ratio ROA 1.93%, standalone FY April 2025–March 2026, with adjacent Working Funds/Form X average-assets note. The retained standalone exchange/XBRL source contains exact 1.93% period and scope.

## Admission boundary
- The two prior `ACCEPTED` numeric ROA reviews remain intact; neither supporting literal contains the denominator note. They are **not** currently FRESH.
- Original RBI hash and issuer hash are now independently captured, but the regulator applicability proof has **not** yet been appended to the canonical Development source ledger in a validated form.
- An owner-authenticated reviewer is committed under `supabase/functions/v14-bank-kvb-roa-numeric-review`, but it deliberately rejects sources lacking an immutable regulator proof with verified 2025–26 applicability.
- The recorder must never conflate fact `ACCEPTED`, validator `FRESH`, and snapshot `READY`.

## PIT
The 32 R2 adjusted-decision ledger partitions cover 2024-02 through 2026-09. Four earlier months (2023-10 to 2024-01) have independently listed source files in `adjusted-series/v1`, ending 2023-10-31, 2023-11-30, 2023-12-29, 2024-01-31. Combined target archive months = 36. Actual KVB extracted/qualified rows remain unproven until credentialed reader executes and the EPS/BVPS/share-basis join passes.
