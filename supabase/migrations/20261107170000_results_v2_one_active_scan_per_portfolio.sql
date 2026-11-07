-- Results Scan V2: prevent two browser tabs creating simultaneous active
-- jobs against the same portfolio, while retaining all completed audit runs.
-- Development-only migration; applies no changes to old Results scan jobs.
CREATE UNIQUE INDEX IF NOT EXISTS results_v2_one_active_scan_per_portfolio_idx
ON public.data_ingestion_runs (portfolio_id, operation)
WHERE operation = 'RESULTS_QUARTERLY_SCAN_V2' AND status = 'RUNNING';
