

---

## K4 Package 2 · INDUSTRIALS_CAPITAL_GOODS · Checkpoint B implementation — 22 September 2026

Checkpoint A is frozen COMPLETE / PASS.

Implemented:
- `industrialsK4bScoringMethodology.ts`;
- `industrialsK4bScoringMethodology.test.ts`;
- `industrialsK4bIsolationRegression.test.ts`;
- `docs/PortfolioAI_GATE_K_K4_2_INDUSTRIALS_CAPITAL_GOODS_CHECKPOINT_B.md`;
- canonical router extended for PROJECT_EPC / CAPITAL_EQUIPMENT_ELECTRICAL / DEFENCE_AEROSPACE;
- registry maps all three profiles to INDUSTRIALS_CAPITAL_GOODS in validation-pending state.

Deterministic scoring:
- ten dimensions totaling 100;
- mandatory evidence/history gates;
- no missing-input renormalization;
- distinct growth and cash-flow contracts for EPC, capital equipment and defence;
- symbol-independent methodology;
- unknown Industry → METHOD_NOT_AVAILABLE.

Incremental isolation/regression:
- PHARMA_V1 isolated;
- BANK_NBFC isolated;
- completed IT_TECH preserved;
- TORNTPHARM golden 75.1575 preserved;
- AUROPHARMA fail-closed golden preserved;
- universal Research workspace preserved.

Normal runtime scoring remains blocked while lifecycle = K4_FROZEN_PENDING. Promotion occurs only after owner-local Checkpoint B validation passes.

No provider calls, production mutation/migration, score/recommendation persistence, scheduler change, deployment, PR merge or trading action occurred.
