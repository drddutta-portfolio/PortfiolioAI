# Stage D20 — Dashboard Section Navigation

**Status:** Review build  
**Scope:** UI-only Dashboard usability refinement

## Objective

Make the increasingly information-dense PortfolioAI Dashboard easier to navigate without adding another analytical panel or changing any investment logic.

## Included

- compact sticky Dashboard command index;
- anchor navigation to:
  - Overview;
  - Structure;
  - Risk;
  - Monitoring;
  - Research;
  - Intelligence;
  - News;
- horizontal overflow support on smaller screens;
- explicit Back to Top control;
- anchor scroll offset so section headings remain visible below the sticky navigator.

## Safety boundaries

This stage introduces no:

- Supabase schema changes;
- Edge Function changes;
- provider/API calls;
- AI calls;
- recommendation or scoring execution;
- portfolio mutation;
- transaction mutation;
- trade execution.

The stage changes Dashboard navigation/presentation only.

## Review criterion

Owner should confirm that the navigator remains compact, does not obstruct the Dashboard, and materially improves movement between the now-expanded Dashboard sections before merge.
