import { useMemo, useState } from 'react'
import { Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import DocumentComplianceGrid from '../components/cards/DocumentComplianceGrid'
import LocationFilters from '../components/filters/LocationFilters'
import StatusDonutChart from '../components/charts/StatusDonutChart'
import DocumentCompletionChart from '../components/charts/DocumentCompletionChart'
import ScoreByProvinceChart from '../components/charts/ScoreByProvinceChart'
import QuarterlyTrendChart from '../components/charts/QuarterlyTrendChart'
import BFDPTable from '../components/tables/BFDPTable'
import {
  useBFDPDocumentCompletion,
  useBFDPLocationStats,
  useBFDPQuarterlyTrend,
  useBFDPSummary,
  useBFDPScoreByProvince,
  useBFDPTable,
  useGeoOptions,
} from '../hooks/useBFDPQueries'

const initialFilters = {
  provinceHuc: '',
  cityMunName: '',
  barangayName: '',
  year: '',
  quarter: '',
}

function LoadingState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-civic-700">Loading BFDP dashboard...</div>
      <p className="mt-2 text-sm text-slate-500">Fetching cached view data from Supabase.</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="border border-red-200 bg-red-50 p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-red-800">Unable to load BFDP data</div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">No BFDP data found</div>
      <p className="mt-2 text-sm text-slate-500">
        Adjust the selected location, year, or quarter filters to find matching BFDP records.
      </p>
    </Card>
  )
}

function SelectionRequiredState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">Select a location to load data</div>
      <p className="mt-2 text-sm text-slate-500">
        Choose a Province/HUC, City/Municipality, or Barangay before BFDP analytics are fetched.
      </p>
    </Card>
  )
}

export default function BFDPDashboard() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  const queryFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
      page,
      pageSize,
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName, filters.barangayName, page, pageSize],
  )

  const chartFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName, filters.barangayName],
  )

  const hasSelectedLocation = Boolean(
    chartFilters.province || chartFilters.city || chartFilters.barangay,
  )
  const selectedLguPath = [filters.provinceHuc, filters.cityMunName, filters.barangayName]
    .filter(Boolean)
    .join(' > ')

  const geoOptionsQuery = useGeoOptions()
  const summaryQuery = useBFDPSummary(chartFilters)
  const locationStatsQuery = useBFDPLocationStats(chartFilters)
  const documentsQuery = useBFDPDocumentCompletion(chartFilters)
  const scoreByProvinceQuery = useBFDPScoreByProvince(chartFilters)
  const quarterlyTrendQuery = useBFDPQuarterlyTrend(chartFilters)
  const tableQuery = useBFDPTable(queryFilters)

  const isInitialDashboardLoading =
    hasSelectedLocation &&
    (summaryQuery.isLoading ||
      documentsQuery.isLoading ||
      locationStatsQuery.isLoading ||
      scoreByProvinceQuery.isLoading ||
      quarterlyTrendQuery.isLoading ||
      tableQuery.isLoading)

  const dashboardError =
    summaryQuery.error ||
    locationStatsQuery.error ||
    documentsQuery.error ||
    scoreByProvinceQuery.error ||
    quarterlyTrendQuery.error ||
    tableQuery.error

  const summary = summaryQuery.data
  const locationStats = locationStatsQuery.data
  const documentCompletion = documentsQuery.data ?? []
  const tableData = tableQuery.data ?? { rows: [], count: 0 }
  const isRefreshing =
    summaryQuery.isFetching ||
    locationStatsQuery.isFetching ||
    documentsQuery.isFetching ||
    scoreByProvinceQuery.isFetching ||
    quarterlyTrendQuery.isFetching ||
    tableQuery.isFetching

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setFilters(nextFilters)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bfdp-summary'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-document-completion'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-score-by-province'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-quarterly-trend'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-table'] })
  }

  return (
    <div className="space-y-6">
      <LocationFilters
        filters={filters}
        onChange={handleFilterChange}
        geoOptions={geoOptionsQuery.data}
        optionsLoading={geoOptionsQuery.isLoading}
        optionError={geoOptionsQuery.error?.message}
        onRefresh={handleRefresh}
        refreshDisabled={!hasSelectedLocation}
        isRefreshing={isRefreshing}
      />

      {dashboardError ? <ErrorState message={dashboardError.message} /> : null}
      {isInitialDashboardLoading ? <LoadingState /> : null}

      {!isInitialDashboardLoading && !dashboardError && !hasSelectedLocation ? (
        <SelectionRequiredState />
      ) : null}

      {!isInitialDashboardLoading &&
      !dashboardError &&
      hasSelectedLocation &&
      tableData.count === 0 ? (
        <EmptyState />
      ) : null}

      {!isInitialDashboardLoading &&
      !dashboardError &&
      hasSelectedLocation &&
      tableData.count > 0 ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {(locationStats?.cards ?? []).map((card) => (
              <SummaryCard
                key={card.title}
                title={card.title}
                value={card.value}
                note={card.note}
                info={card.info}
              />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <StatusDonutChart statusCounts={summary?.statusCounts ?? {}} />
            <DocumentCompletionChart documents={documentCompletion} />
          </section>

          <DocumentComplianceGrid documents={documentCompletion} />

          <section className="grid gap-6 xl:grid-cols-2">
            <ScoreByProvinceChart data={scoreByProvinceQuery.data ?? []} />
            <QuarterlyTrendChart
              data={quarterlyTrendQuery.data ?? []}
              selectedYear={filters.year}
              selectedLguPath={selectedLguPath}
            />
          </section>

          <BFDPTable
            records={tableData.rows}
            totalRecords={tableData.count}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPage(0)
              setPageSize(nextPageSize)
            }}
          />
        </>
      ) : null}
    </div>
  )
}
