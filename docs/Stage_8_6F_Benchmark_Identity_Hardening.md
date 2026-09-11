# Stage 8.6F — Benchmark Identity Hardening

Angel One's instrument master can contain multiple NSE rows associated with BANKNIFTY/Nifty Bank. SmartAPI guidance identifies the current NIFTY Bank cash-index instrument as instrument type `AMXIDX`; legacy or non-index rows must not be accepted simply because their name/symbol matches.

PortfolioAI now resolves the benchmark only when all of the following are true:

- exchange is `NSE`;
- instrument type is `AMXIDX`;
- name/symbol matches the accepted NIFTY Bank aliases (`BANKNIFTY` / `NIFTY BANK`);
- exactly one distinct token remains after those filters.

This preserves exact-identity validation without hard-coding a provider token. If Angel One changes the index token in future, the current instrument master remains the authority as long as the row is uniquely classified as the NIFTY Bank `AMXIDX` instrument.
