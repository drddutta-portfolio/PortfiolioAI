# Stage 7.2D.2B.2 — Non-financial scoring contract discovery V2

## Why V2 exists
The first three-stock semantic query succeeded operationally but the provider response did not preserve the requested cohort: INFY was present, M&M was substituted by M&MFIN, and TORNTPHARM was absent. No canonical mapping is therefore approved from that response for M&M or TORNTPHARM.

## Corrective design
V2 makes three separate provider-tool attempts, one per reviewed cohort member, using the exact canonical company name, NSE symbol, and already matched Trendlyne instrument id. It requests only exact parameter labels already observed in Trendlyne vocabulary where possible.

Cohort:
- INFY / Infosys / instrument 630 / IT_TECH
- M&M / Mahindra & Mahindra / instrument 807 / AUTO_COMPONENTS
- TORNTPHARM / Torrent Pharmaceuticals / instrument 1409 / PHARMA_HEALTHCARE

The function reserves exactly 3 internal units before provider access and records one provider usage event per physical tool attempt. Each security receives its own immutable raw capture.

## Safety
- owner-authenticated;
- owned current portfolio required;
- every security must be an open EQUITY holding;
- reviewed scoring-profile assignment required;
- exact matched Trendlyne instrument id required;
- provider entitlement, retention and kill switch respected;
- no retry;
- no canonical promotion;
- no score run;
- no scoring-model activation;
- no Core/Satellite or portfolio-role mutation;
- Angel One remains current-price authority.

## Interpretation rule
A successful HTTP/provider call is not sufficient evidence for canonical mapping. The captured result must contain the exact requested security identity and an unambiguous provider label/value before any parser or scoring rule can be approved.
