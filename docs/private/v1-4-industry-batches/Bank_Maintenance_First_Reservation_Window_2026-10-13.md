# BANK scheduled first-reservation rolling-window guard

The 13 October dispatch preceded the final 12 October paid attempt by approximately 24 seconds. The unchanged 14-unit rolling 24-hour control therefore correctly rejected its first reservation.

The runner now reads authoritative controls, attempted-at usage and unexpired reservations before its first reservation. A bounded advisory planner waits once for sufficient usage to leave the inclusive rolling window, adds 100ms boundary tolerance, and rereads the same authoritative state. It fails closed for a delay exceeding 60 seconds, unknown data, concurrent reservations, fresh usage or daily/per-run limits. The existing atomic reservation RPC remains the final budget authority and is invoked at most once. No provider calls or reservation retries occur during the wait.

The change does not relax the daily/rolling limit, change the schedule, reset a failed session or retry today's already-attempted run. Gradual daily timing drift can eventually exceed the 60-second ceiling; that produces an explicit blocked run requiring a separately reviewed schedule/window decision. This implementation is not proof of a successful live scheduled run and does not repair source-history qualification freshness.
