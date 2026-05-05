import { useEffect, useMemo, useState } from 'react'
import { Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import DocumentCompletionChart from '../components/charts/DocumentCompletionChart'
import QuarterlyTrendChart from '../components/charts/QuarterlyTrendChart'
import ScoreByProvinceChart from '../components/charts/ScoreByProvinceChart'
import StatusDonutChart from '../components/charts/StatusDonutChart'
import LocationFilters from '../components/filters/LocationFilters'
import LTRPPTable from '../components/tables/LTRPPTable'
import {
  useLTRPPDocumentCompletion,
  useLTRPPGeoOptions,
  useLTRPPLocationStats,
  useLTRPPQuarterlyTrend,
  useLTRPPRemarks,
  useLTRPPScoreByProvince,
  useLTRPPSummary,
  useLTRPPTable,
} from '../hooks/useLTRPPQueries'
import { LTRPP_MAX_SCORE } from '../utils/ltrppAnalytics'

const defaultFilters = {
  provinceHuc: '',
  cityMunName: '',
  year: '2026',
  quarter: '',
}

function LoadingState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-civic-700">Loading LPTRPP dashboard...</div>
      <p className="mt-2 text-sm text-slate-500">Fetching route plan preparation records.</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="border border-red-200 bg-red-50 p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-red-800">Unable to load LPTRPP data</div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">No LPTRPP data found</div>
      <p className="mt-2 text-sm text-slate-500">
        Adjust the selected Province/HUC, City/Municipality, year, or quarter filters.
      </p>
    </Card>
  )
}

function RemarksPanel({ remarks, selectedLguPath }) {
  if (!remarks.length) {
    return null
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-950">Remarks</h3>
        <p className="text-sm text-slate-500">{selectedLguPath}</p>
      </div>
      <div className="space-y-3">
        {remarks.map((record) => (
          <div
            key={record.id}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {record.year ?? 'N/A'} {record.quarter ? `Q${record.quarter}` : ''}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-800">{record.remarks}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function LTRPPDashboard({ initialFilters }) {
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
      status: selectedStatusFilter,
      page,
      pageSize,
    }),
    [
      filters.year,
      filters.quarter,
      filters.provinceHuc,
      filters.cityMunName,
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
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName],
  )

  const selectedLguPath = [filters.provinceHuc, filters.cityMunName]
    .filter(Boolean)
    .join(' > ') || 'All LGU'

  const geoOptionsQuery = useLTRPPGeoOptions()
  const summaryQuery = useLTRPPSummary(chartFilters, { requireLocation: false })
  const locationStatsQuery = useLTRPPLocationStats(chartFilters, { requireLocation: false })
  const documentsQuery = useLTRPPDocumentCompletion(chartFilters, { requireLocation: false })
  const scoreByProvinceQuery = useLTRPPScoreByProvince(chartFilters, { requireLocation: false })
  const quarterlyTrendQuery = useLTRPPQuarterlyTrend(chartFilters, { requireLocation: false })
  const remarksQuery = useLTRPPRemarks(chartFilters, { requireLocation: false })
  const tableQuery = useLTRPPTable(queryFilters, { requireLocation: false })

  const isInitialDashboardLoading =
    summaryQuery.isLoading ||
    documentsQuery.isLoading ||
    locationStatsQuery.isLoading ||
    scoreByProvinceQuery.isLoading ||
    quarterlyTrendQuery.isLoading ||
    tableQuery.isLoading

  const dashboardError =
    summaryQuery.error ||
    locationStatsQuery.error ||
    documentsQuery.error ||
    scoreByProvinceQuery.error ||
    quarterlyTrendQuery.error ||
    remarksQuery.error ||
    tableQuery.error

  const summary = summaryQuery.data
  const locationStats = locationStatsQuery.data
  const documentCompletion = documentsQuery.data ?? []
  const tableData = tableQuery.data ?? { rows: [], count: 0 }
  const hasDashboardRecords =
    Number(summary?.totalRecords ?? 0) > 0 ||
    tableData.count > 0 ||
    documentCompletion.some((document) => document.complete > 0 || document.missing > 0)
  const isRefreshing =
    summaryQuery.isFetching ||
    locationStatsQuery.isFetching ||
    documentsQuery.isFetching ||
    scoreByProvinceQuery.isFetching ||
    quarterlyTrendQuery.isFetching ||
    remarksQuery.isFetching ||
    tableQuery.isFetching

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setSelectedStatusFilter('')
    setFilters({
      provinceHuc: nextFilters.provinceHuc ?? '',
      cityMunName: nextFilters.cityMunName ?? '',
      year: nextFilters.year || '2026',
      quarter: nextFilters.quarter ?? '',
    })
  }

  const handleStatusFilterChange = (status) => {
    setPage(0)
    setSelectedStatusFilter((current) => (current === status ? '' : status))
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ltrpp-geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['ltrpp-summary'] })
    queryClient.invalidateQueries({ queryKey: ['ltrpp-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['ltrpp-document-completion'] })
    queryClient.invalidateQueries({ queryKey: ['ltrpp-score-by-province'] })
    queryClient.invalidateQueries({ queryKey: ['ltrpp-quarterly-trend'] })
    queryClient.invalidateQueries({ queryKey: ['ltrpp-remarks'] })
    queryClient.invalidateQueries({ queryKey: ['ltrpp-table'] })
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
        includeBarangay={false}
      />

      {dashboardError ? <ErrorState message={dashboardError.message} /> : null}
      {isInitialDashboardLoading ? <LoadingState /> : null}

      {!isInitialDashboardLoading && !dashboardError && !hasDashboardRecords ? <EmptyState /> : null}

      {!isInitialDashboardLoading && !dashboardError && hasDashboardRecords ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              maxScore={LTRPP_MAX_SCORE}
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
              title="LPTRPP Compliance by Preparation Step"
              positiveLabel="Compliant"
              negativeLabel="Non compliant"
            />
          </section>

          <RemarksPanel remarks={remarksQuery.data ?? []} selectedLguPath={selectedLguPath} />

          <LTRPPTable
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
