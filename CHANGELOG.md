# Changelog

Major feature changes for the Region 10 Report Analytics Dashboard.

## Unreleased

- Added full SGLG dashboard support with annual location filters, overall rating summaries, Province/HUC rating bars, governance area analytics, sub-indicator charts, and detailed records.
- Added LPTRPP dashboard support with score, compliance, document completion, remarks, trend, and detailed record views.
- Expanded the Overview page to include SGLG, BFDP, SKFPD, LPTRPP, and Other report cards in the required order.
- Updated Overview card layout to show four cards per row on wide screens and align report card stat/footer rows.
- Added clickable status/rating bar filtering for SGLG, BFDP, SKFPD, and LPTRPP detail tables.
- Updated SGLG and BFDP status/rating charts to preserve Province/HUC context while highlighting selected Province/HUC filters.
- Added city/municipality drilldown behavior for status/rating charts when a specific location is selected.
- Sorted BFDP, SKFPD, and LPTRPP average score by Province/HUC charts by score.
- Renamed score chart title to `Avg Score by Province/HUC`.
- Fixed searchable dropdown inputs so only one clear button is displayed.

## Initial Build

- Added React + Vite dashboard shell with responsive sidebar navigation.
- Added Supabase client integration and environment-based configuration.
- Added BFDP and SKFPD dashboards with location filters, summary cards, status analytics, document completion charts, score charts, quarterly trends, and detailed tables.
- Added shared chart, table, card, and filter components.
