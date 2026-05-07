import { useEffect, useMemo, useState } from 'react'
import { Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import LocationFilters from '../components/filters/LocationFilters'
import ProvinceStatusColumnChart from '../components/charts/ProvinceStatusColumnChart'
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
  useBFDPStatusByProvince,
  useBFDPTable,
  useGeoOptions,
} from '../hooks/useBFDPQueries'

const defaultFilters = {
  provinceHuc: '',
  cityMunName: '',
  barangayName: '',
  year: '',
  quarter: '',
}

const bfdpStatusSeries = [
  { label: 'Full Compliant', value: 'Full Compliant' },
  { label: 'Partial Compliant', value: 'Partial Compliant' },
  { label: 'None Compliant', value: 'None Compliant' },
]

const hucProvinceOptions = ['city of cagayan de oro', 'city of iligan']
const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const isHucProvinceOption = (value) => hucProvinceOptions.includes(normalizeText(value))

function LoadingState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-civic-700">Loading BFDP dashboard...</div>
      <p className="mt-2 text-sm text-slate-500">Fetching data...</p>
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

export default function BFDPDashboard({ initialFilters }) {
  const queryClient = useQueryClient()
  const normalizedInitialFilters = useMemo(
    () => ({
      ...defaultFilters,
      ...(initialFilters ?? {}),
    }),
    [initialFilters],
  )
  const [filters, setFilters] = useState(normalizedInitialFilters)
  const [selectedChartFilter, setSelectedChartFilter] = useState({
    province: '',
    city: '',
    locationLabel: '',
    status: '',
    statusLabel: '',
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    setFilters(normalizedInitialFilters)
    setSelectedChartFilter({ province: '', city: '', locationLabel: '', status: '', statusLabel: '' })
    setPage(0)
  }, [normalizedInitialFilters])

  const queryFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: selectedChartFilter.province || filters.provinceHuc,
      city: selectedChartFilter.city || filters.cityMunName,
      barangay: selectedChartFilter.city ? '' : filters.barangayName,
      status: selectedChartFilter.status,
      page,
      pageSize,
    }),
    [
      filters.year,
      filters.quarter,
      filters.provinceHuc,
      filters.cityMunName,
      filters.barangayName,
      selectedChartFilter.province,
      selectedChartFilter.city,
      selectedChartFilter.status,
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
  const statusChartFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.cityMunName ? filters.provinceHuc : '',
      city: filters.cityMunName,
      barangay: '',
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName],
  )

  const geoOptionsQuery = useGeoOptions()
  const selectedLguPath = [filters.provinceHuc, filters.cityMunName, filters.barangayName]
    .filter(Boolean)
    .join(' > ') || 'All LGU'
  const scoreChartUsesCityLevel = Boolean(
    filters.provinceHuc && !isHucProvinceOption(filters.provinceHuc),
  )
  const statusChartTitle = filters.provinceHuc && filters.cityMunName
    ? 'BFDP Status by City/Municipality'
    : 'BFDP Status by Province/HUC'
  const scoreChartTitle = scoreChartUsesCityLevel
    ? 'Avg Score by City/Municipality'
    : 'Avg Score by Province/HUC'
  const highlightedStatusLocation = selectedChartFilter.locationLabel || filters.cityMunName || filters.provinceHuc
  const highlightedScoreLocation = useMemo(() => {
    if (!scoreChartUsesCityLevel) {
      return ''
    }

    if (filters.cityMunName) {
      return filters.cityMunName
    }

    if (!filters.barangayName) {
      return ''
    }

    const locations = geoOptionsQuery.data?.locations ?? []
    const matchedLocation = locations.find(
      (location) =>
        location.barangay_name === filters.barangayName &&
        (!filters.provinceHuc || location.province_huc === filters.provinceHuc),
    )

    return matchedLocation?.city_mun_name ?? ''
  }, [
    filters.barangayName,
    filters.cityMunName,
    filters.provinceHuc,
    geoOptionsQuery.data?.locations,
    scoreChartUsesCityLevel,
  ])

  const summaryQuery = useBFDPSummary(chartFilters, { requireLocation: false })
  const locationStatsQuery = useBFDPLocationStats(chartFilters, { requireLocation: false })
  const documentsQuery = useBFDPDocumentCompletion(chartFilters, { requireLocation: false })
  const scoreByProvinceQuery = useBFDPScoreByProvince(chartFilters, { requireLocation: false })
  const statusByProvinceQuery = useBFDPStatusByProvince(statusChartFilters, { requireLocation: false })
  const quarterlyTrendQuery = useBFDPQuarterlyTrend(chartFilters, { requireLocation: false })
  const tableQuery = useBFDPTable(queryFilters, { requireLocation: false })

  const isInitialDashboardLoading =
    (summaryQuery.isLoading ||
      documentsQuery.isLoading ||
      locationStatsQuery.isLoading ||
      scoreByProvinceQuery.isLoading ||
      statusByProvinceQuery.isLoading ||
      quarterlyTrendQuery.isLoading ||
      tableQuery.isLoading)

  const dashboardError =
    summaryQuery.error ||
    locationStatsQuery.error ||
    documentsQuery.error ||
    scoreByProvinceQuery.error ||
    statusByProvinceQuery.error ||
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
    statusByProvinceQuery.isFetching ||
    quarterlyTrendQuery.isFetching ||
    tableQuery.isFetching

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setSelectedChartFilter({ province: '', city: '', locationLabel: '', status: '', statusLabel: '' })
    setFilters(nextFilters)
  }

  const handleChartFilterChange = (selection) => {
    setPage(0)
    setSelectedChartFilter((current) =>
      current.province === selection.province &&
      current.city === selection.city &&
      current.status === selection.status
        ? { province: '', city: '', locationLabel: '', status: '', statusLabel: '' }
        : selection,
    )
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bfdp-summary'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-document-completion'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-score-by-province'] })
    queryClient.invalidateQueries({ queryKey: ['bfdp-status-by-province'] })
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
            <ScoreByProvinceChart
              data={scoreByProvinceQuery.data ?? []}
              title={scoreChartTitle}
              highlightedLocation={highlightedScoreLocation}
            />
            <QuarterlyTrendChart
              data={quarterlyTrendQuery.data ?? []}
              selectedYear={filters.year}
              selectedLguPath={selectedLguPath}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ProvinceStatusColumnChart
              data={statusByProvinceQuery.data ?? []}
              statuses={bfdpStatusSeries}
              title={statusChartTitle}
              selectedFilter={selectedChartFilter}
              highlightedLocation={highlightedStatusLocation}
              onFilterSelect={handleChartFilterChange}
            />
            <DocumentCompletionChart documents={documentCompletion} />
          </section>

          <BFDPTable
            records={tableData.rows}
            totalRecords={tableData.count}
            page={page}
            pageSize={pageSize}
            activeStatusFilter={selectedChartFilter.statusLabel}
            onClearStatusFilter={() =>
              handleChartFilterChange({ province: '', city: '', locationLabel: '', status: '', statusLabel: '' })
            }
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
