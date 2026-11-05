# R4 IGL original XML issuer identity

The 2024 NSE catalog supplies exact-quarter IGL financial XMLs under current canonical ISIN INE203G01027 and BSE scrip 532514. Their original symbol is IGL. The retained BSE listing spells Issuer_Name as Indraprashtha Gas Ltd., whereas NSE uses Indraprastha Gas Limited. The independent XML bridge rejected all four originals solely with EXACT_LEGAL_ISSUER_NAME_LINEAGE_UNPROVEN.

The already approved PDF identity path had an exact, security-bound display-spelling exception. This change places that one exception in the shared issuer-name module and reuses it for XML. It permits only symbol IGL, exact ISIN INE203G01027, exact scrip 532514, exact BSE display spelling and exact canonical NSE legal-name tokens. Both BSE endpoints and the original XML code/symbol remain mandatory. No fuzzy matching, numeric coercion, financial reconstruction or broader name exceptions are introduced. Original issuer and catalog names are both preserved.

All four downloaded originals (September/December 2024, consolidated/standalone) replay the complete quarter trio against the actual retained BSE identity. This is local verification, not database selection. Recovery must retain the original and independently qualify/select it before the backlog count changes. Existing EPS comparability guards remain.

No UI, schema, RLS, holdings, transactions, main or Production changes. R4 remains partial pending full backlog readback.
