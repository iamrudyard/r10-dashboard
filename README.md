# Region 10 Report Analytics Dashboard

React + Vite dashboard for government report analytics. BFDP is implemented first using only the provided `bfdp` and `lib_geographic_units` schemas. SGLG and future report modules are placeholders until schemas are available.

## Database fields used

`public.bfdp`: `id`, `lgu_id`, `bfr`, `brgy_budget`, `summary_income`, `ira_nta_utilization`, `annual_procurement_plan`, `notice_of_award`, `month_1st`, `month_2nd`, `month_3rd`, `score`, `quarter`, `year`, `status`, `created_at`, `updated_at`

`public.lib_geographic_units`: `id`, `psgc_code`, `region_name`, `province_huc`, `city_mun_name`, `barangay_name`, `income_class`, `lgu_type`, `urban_rural_type`, `population_2024`, `created_at`

## Installation

```bash
npm install
npm install @supabase/supabase-js @tremor/react apexcharts react-apexcharts
npm install -D tailwindcss postcss autoprefixer
```

## Environment

Create `.env`:

```bash
VITE_SUPABASE_URL=https://zkfmatusybvqxhrtvycx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_4ku3Q8-D6Rc32okj7ss51Q_0ojQORU2
```

Do not use Supabase service role keys in the frontend. Configure proper Supabase RLS policies for production use.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Folder structure

```text
src/
  components/
    layout/
      Sidebar.jsx
      Header.jsx
      DashboardLayout.jsx
    filters/
      LocationFilters.jsx
    cards/
      SummaryCard.jsx
      DocumentComplianceGrid.jsx
    charts/
      StatusDonutChart.jsx
      DocumentCompletionChart.jsx
      ScoreByProvinceChart.jsx
      QuarterlyTrendChart.jsx
      ChartEmptyState.jsx
    tables/
      BFDPTable.jsx
  pages/
    Overview.jsx
    BFDPDashboard.jsx
    SGLGPlaceholder.jsx
  services/
    bfdpService.js
  lib/
    supabaseClient.js
  utils/
    bfdpAnalytics.js
  App.jsx
  main.jsx
  index.css
```

## Implemented

- Responsive sidebar dashboard layout
- Overview page with actual BFDP summary
- BFDP dashboard with Province/HUC, City/Municipality, Barangay, Year, and Quarter filters
- Supabase BFDP query joined with `lib_geographic_units`
- Status grouping based on actual `status` values
- BFDP document true/false counts and completion percentages
- ApexCharts donut, bar, column, and line charts
- Detailed BFDP table with submitted/missing badges
- SGLG placeholder: “SGLG dashboard will be added soon.”
