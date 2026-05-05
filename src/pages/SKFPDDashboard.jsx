import { useEffect, useMemo, useState } from 'react'
import { Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import LocationFilters from '../components/filters/LocationFilters'
import StatusDonutChart from '../components/charts/StatusDonutChart'
import DocumentCompletionChart from '../components/charts/DocumentCompletionChart'
import ScoreByProvinceChart from '../components/charts/ScoreByProvinceChart'
import QuarterlyTrendChart from '../components/charts/QuarterlyTrendChart'
import SKFPDTable from '../components/tables/SKFPDTable'
import {
  useSKFPDDocumentCompletion,
  useSKFPDGeoOptions,
  useSKFPDLocationStats,
  useSKFPDQuarterlyTrend,
  useSKFPDScoreByProvince,
  useSKFPDSummary,
  useSKFPDTable,
} from '../hooks/useSKFPDQueries'
import { SKFPD_MAX_SCORE } from '../utils/skfpdAnalytics'

const defaultFilters = {
  provinceHuc: '',
  cityMunName: '',
  barangayName: '',
  year: '',
  quarter: '',
}

function LoadingState() {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-civic-700">Loading SKFPD dashboard...</div>
      <p className="mt-2 text-sm text-slate-500">Fetching data...</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="rounded-[30px] border border-red-200 bg-red-50 p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-red-800">Unable to load SKFPD data</div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">No SKFPD data found</div>
      <p className="mt-2 text-sm text-slate-500">
        Adjust the selected location, year, or quarter filters to find matching SKFPD records.
      </p>
    </Card>
  )
}

export default function SKFPDDashboard({ initialFilters }) {
  const queryClient = useQueryClient()
  const normalizedInitialFilters = useMemo(
    () => ({
      ...defaultFilters,
      ...(initialFilters ?? {}),
    }),
    [initialFilters],
  )
  const [filters, setFilters] = useState(normalizedInitialFilters)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    setFilters(normalizedInitialFilters)
    setSelectedStatusFilter('')
    setPage(0)
  }, [normalizedInitialFilters])

  const queryFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
      status: selectedStatusFilter,
      page,
      pageSize,
    }),
    [
      filters.year,
      filters.quarter,
      filters.provinceHuc,
      filters.cityMunName,
      filters.barangayName,
      selectedStatusFilter,
      page,
      pageSize,
    ],
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

  const selectedLguPath = [filters.provinceHuc, filters.cityMunName, filters.barangayName]
    .filter(Boolean)
    .join(' > ') || 'All LGU'

  const geoOptionsQuery = useSKFPDGeoOptions()
  const summaryQuery = useSKFPDSummary(chartFilters, { requireLocation: false })
  const locationStatsQuery = useSKFPDLocationStats(chartFilters, { requireLocation: false })
  const documentsQuery = useSKFPDDocumentCompletion(chartFilters, { requireLocation: false })
  const scoreByProvinceQuery = useSKFPDScoreByProvince(chartFilters, { requireLocation: false })
  const quarterlyTrendQuery = useSKFPDQuarterlyTrend(chartFilters, { requireLocation: false })
  const tableQuery = useSKFPDTable(queryFilters, { requireLocation: false })

  const isInitialDashboardLoading =
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
  const hasDashboardRecords =
    Number(summary?.totalRecords ?? 0) > 0 || tableData.count > 0 || documentCompletion.some(
      (document) => document.complete > 0 || document.missing > 0,
    )
  const isRefreshing =
    summaryQuery.isFetching ||
    locationStatsQuery.isFetching ||
    documentsQuery.isFetching ||
    scoreByProvinceQuery.isFetching ||
    quarterlyTrendQuery.isFetching ||
    tableQuery.isFetching

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setSelectedStatusFilter('')
    setFilters(nextFilters)
  }

  const handleStatusFilterChange = (status) => {
    setPage(0)
    setSelectedStatusFilter((current) => (current === status ? '' : status))
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['skfpd-summary'] })
    queryClient.invalidateQueries({ queryKey: ['skfpd-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['skfpd-document-completion'] })
    queryClient.invalidateQueries({ queryKey: ['skfpd-score-by-province'] })
    queryClient.invalidateQueries({ queryKey: ['skfpd-quarterly-trend'] })
    queryClient.invalidateQueries({ queryKey: ['skfpd-table'] })
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
        isRefreshing={isRefreshing}
      />

      {dashboardError ? <ErrorState message={dashboardError.message} /> : null}
      {isInitialDashboardLoading ? <LoadingState /> : null}

      {!isInitialDashboardLoading &&
      !dashboardError &&
      !hasDashboardRecords ? (
        <EmptyState />
      ) : null}

      {!isInitialDashboardLoading &&
      !dashboardError &&
      hasDashboardRecords ? (
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
            <ScoreByProvinceChart data={scoreByProvinceQuery.data ?? []} />
            <QuarterlyTrendChart
              data={quarterlyTrendQuery.data ?? []}
              selectedYear={filters.year}
              selectedLguPath={selectedLguPath}
              maxScore={SKFPD_MAX_SCORE}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <StatusDonutChart
              statusCounts={summary?.statusCounts ?? {}}
              selectedStatus={selectedStatusFilter}
              onStatusSelect={handleStatusFilterChange}
            />
            <DocumentCompletionChart
              documents={documentCompletion}
              title="SKFPD Document Completion"
            />
          </section>

          <SKFPDTable
            records={tableData.rows}
            totalRecords={tableData.count}
            page={page}
            pageSize={pageSize}
            activeStatusFilter={selectedStatusFilter}
            onClearStatusFilter={() => handleStatusFilterChange(selectedStatusFilter)}
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
