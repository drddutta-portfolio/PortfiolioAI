# P8-B2 NSE historical-universe acquisition campaign

Date: 30 September 2026  
Status: **AUTHORIZED / ACTIVE — acquisition runner prepared**

## Authority

The frozen P8 contract uses official NSE listing/universe authority. NSE circular NSE/MSD/60315 states that the CM MII security master `NSE_CM_security_ddmmyyyy.csv.gz` is disseminated daily on the NSE All Reports page, effective 5 February 2024. The P8-B2 campaign therefore uses the official NSE CM MII Security File as the decision-date universe evidence for the first bounded experiment.

## Bounded acquisition window

The first campaign covers February 2024 through September 2026. This gives 32 monthly opportunities, above the frozen minimum of 24 proven monthly decision dates, while avoiding pre-February-2024 dates for which the website dissemination contract is not proven by this authority.

For each month, the acquisition runner probes the last seven weekdays backward and accepts only the first official NSE archive file that returns successfully. It never fabricates a trading date.

## Runner

`scripts/p8/p8-b2-acquire-nse-universe.mjs`

The runner:

- downloads only from `https://nsearchives.nseindia.com/content/cm/`;
- expects `NSE_CM_security_DDMMYYYY.csv.gz`;
- stores the raw gzip plus decompressed CSV;
- records SHA-256 for both;
- writes `tmp/p8-b2-nse/manifest.json`;
- exits non-zero if fewer than 24 monthly files are proven;
- performs **no database writes**.

## Next reconstruction step

After the manifest is complete, parsing/reconciliation must:

1. classify eligible equity records from each official security master;
2. map stable security identity using ISIN first, then reviewed symbol/history reconciliation;
3. create new canonical `securities` identities only for genuinely historical/delisted securities when exact identity is proven;
4. append immutable `p8_listing_observations`;
5. materialize each decision date's universe run;
6. represent unresolved identity/listing dates as BLOCKED, never by current-state fallback;
7. prove repeatability before Gate B2 closure.

No P8-B3 work is authorized by this campaign.
