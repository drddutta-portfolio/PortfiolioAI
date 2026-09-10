# Stage 8.6B — Bank Balance Sheet / Credit Readiness

## Scope

This stage makes reviewed external credit-rating evidence usable by the BANK_NBFC scoring preview without adding provider calls or activating the official score model.

## Reviewed external-rating contract

The `EXTERNAL_LONG_TERM_RATING` input is now REVIEWED for official instrument-level long-term senior/deposit evidence.

Eligible instrument types:

- FIXED_DEPOSIT
- INFRASTRUCTURE_BOND
- NON_CONVERTIBLE_DEBENTURE

Tier I and Tier II capital instruments are deliberately excluded from this signal because subordinated regulatory-capital instruments are not equivalent to senior/deposit credit strength.

When multiple eligible instruments have ratings on the latest rating date, the preview uses the worst eligible normalized score rather than cherry-picking the strongest instrument.

## Normalization

AAA=100, AA+=90, AA=80, AA-=70, A+=60, A=50, A-=40, BBB+=30, BBB=20, BBB-=10, below BBB-=0.

Outlook adjustments are bounded to the 0–100 scale: Positive +3, Stable 0, Negative -5, Watch Positive +3, Watch Negative -10.

## HDFCBANK effect

HDFCBANK currently has fresh CRISIL AAA/Stable evidence for eligible fixed-deposit, infrastructure-bond and non-convertible-debenture instruments. Together with already-reviewed Gross NPA and Net NPA signals, this supplies 65% score-ready coverage in the BANK_NBFC Balance Sheet / Credit dimension, crossing the 60% preview gate.

Capital Adequacy and CET1 remain pending until exact, independently safe metric contracts are established. Tier 1 capital is not treated as CET1.

## Safety

- Zero Trendlyne calls.
- No official score run.
- No model activation.
- No portfolio mutation.
- Raw instrument-level ratings remain preserved independently from the normalized credit-strength signal.
