import { useMemo, useState } from 'react'
import { Badge, Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import LocationFilters from '../components/filters/LocationFilters'
import { useGeoOptions, useOverviewBFDPStats, useOverviewLocationStats } from '../hooks/useBFDPQueries'
import { useOverviewSKFPDStats } from '../hooks/useSKFPDQueries'
import { useSGLGDashboard } from '../hooks/useSGLGQueries'

const initialFilters = {
  provinceHuc: '',
  cityMunName: '',
  barangayName: '',
  year: '',
  quarter: '',
  month: '',
}

const reportModules = [
  {
    id: 'bfdp',
    title: 'BFDP',
    description: 'Barangay Full Disclosure Policy',
    frequency: 'Quarterly',
    status: 'Live',
    color: 'emerald',
    periods: ['quarter'],
  },
  {
    id: 'skfpd',
    title: 'SKFPD',
    description: 'SK Full Public Disclosure',
    frequency: 'Quarterly',
    status: 'Live',
    color: 'emerald',
    periods: ['quarter'],
  },
  {
    id: 'sglg',
    title: 'SGLG',
    description: 'Seal of Good Local Governance',
    frequency: 'Annual',
    status: 'Live',
    color: 'emerald',
    periods: ['annual'],
  },
  {
    id: 'future',
    title: 'Other future reports',
    description: 'Reserved for future schemas',
    frequency: 'To be configured',
    status: 'Reserved',
    color: 'slate',
    periods: [],
  },
]

function getReportState(report, filters) {
  const selectedPeriod = filters.month ? 'month' : filters.quarter ? 'quarter' : ''

  if (selectedPeriod && !report.periods.includes(selectedPeriod)) {
    return {
      label: 'Not applicable',
      color: 'slate',
      isApplicable: false,
    }
  }

  return {
    label: report.status,
    color: report.color,
    isApplicable: true,
  }
}

function SelectionState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">Select a location</div>
      <p className="mt-2 text-sm text-slate-500">Population and LGU profile cards will appear here.</p>
    </Card>
  )
}

function getQuarterlyFilterPayload(filters) {
  return {
    provinceHuc: filters.provinceHuc,
    cityMunName: filters.cityMunName,
    barangayName: filters.barangayName,
    year: filters.year,
    quarter: filters.quarter,
  }
}

function getAnnualFilterPayload(filters) {
  return {
    provinceHuc: filters.provinceHuc,
    cityMunName: filters.cityMunName,
    year: filters.year,
  }
}

function formatRating(value) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''

  if (normalized === 'passed') {
    return 'Passed'
  }

  if (normalized === 'failed') {
    return 'Failed'
  }

  return 'No Rating'
}

function QuarterlyComplianceCardStats({ stats, isLoading, isApplicable }) {
  if (!isApplicable) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
        Not applicable for Month filter.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {['Full Compliant', 'Partial Compliant', 'None Compliant'].map((title) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {title}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">Loading...</div>
          </div>
        ))}
      </div>
    )
  }

  if (stats?.mode === 'status') {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Status
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{stats.status}</div>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {(stats?.cards ?? []).map((card) => (
        <div key={card.title} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {card.title}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{card.value}</div>
        </div>
      ))}
    </div>
  )
}

function SGLGCardStats({ stats, isLoading, isApplicable, isSelectedLgu }) {
  if (!isApplicable) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
        Not applicable for Barangay, Quarter, or Month filter.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {['Passed', 'Failed', 'Rate'].map((title) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {title}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">Loading...</div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats?.totalRecords) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
        No SGLG data found for the selected filters.
      </div>
    )
  }

  const cards = isSelectedLgu
    ? [
        { title: 'Overall', value: formatRating(stats.latestOverallRating) },
        { title: 'Area Passed', value: stats.areaPassTotal },
        { title: 'Area Failed', value: stats.areaFailTotal },
      ]
    : [
        { title: 'PASSED', value: stats.passedCount },
        { title: 'FAILED', value: stats.failedCount },
      ]

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.title} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {card.title}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{card.value}</div>
        </div>
      ))}
    </div>
  )
}

export default function Overview({ onNavigate }) {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)

  const locationStatsFilters = useMemo(
    () => ({
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
    }),
    [filters.provinceHuc, filters.cityMunName, filters.barangayName],
  )
  const bfdpStatsFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName, filters.barangayName],
  )
  const skfpdStatsFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName, filters.barangayName],
  )
  const sglgStatsFilters = useMemo(
    () => ({
      year: filters.year,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.year, filters.provinceHuc, filters.cityMunName],
  )
  const hasSelectedLocation = Boolean(
    locationStatsFilters.province || locationStatsFilters.city || locationStatsFilters.barangay,
  )
  const isBFDPApplicable = !filters.month
  const isSKFPDApplicable = !filters.month
  const isSGLGApplicable = !filters.month && !filters.quarter && !filters.barangayName

  const geoOptionsQuery = useGeoOptions()
  const locationStatsQuery = useOverviewLocationStats(locationStatsFilters)
  const bfdpStatsQuery = useOverviewBFDPStats(bfdpStatsFilters, {
    enabled: isBFDPApplicable,
    requireLocation: false,
  })
  const skfpdStatsQuery = useOverviewSKFPDStats(skfpdStatsFilters, {
    enabled: isSKFPDApplicable,
    requireLocation: false,
  })
  const sglgStatsQuery = useSGLGDashboard(sglgStatsFilters, {
    enabled: isSGLGApplicable,
  })
  const locationCards = locationStatsQuery.data?.cards ?? []
  const overviewGeoOptions = useMemo(() => {
    if (!geoOptionsQuery.data) {
      return geoOptionsQuery.data
    }

    return {
      ...geoOptionsQuery.data,
      years: [...new Set([2024, ...(geoOptionsQuery.data.years ?? [])])].sort((a, b) => b - a),
    }
  }, [geoOptionsQuery.data])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['overview-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['overview-bfdp-stats'] })
    queryClient.invalidateQueries({ queryKey: ['overview-skfpd-stats'] })
    queryClient.invalidateQueries({ queryKey: ['sglg-dashboard'] })
  }

  return (
    <div className="space-y-6">
      <LocationFilters
        filters={filters}
        onChange={setFilters}
        geoOptions={overviewGeoOptions}
        optionsLoading={geoOptionsQuery.isLoading}
        optionError={geoOptionsQuery.error?.message}
        onRefresh={handleRefresh}
        isRefreshing={
          geoOptionsQuery.isFetching ||
          locationStatsQuery.isFetching ||
          bfdpStatsQuery.isFetching ||
          skfpdStatsQuery.isFetching ||
          sglgStatsQuery.isFetching
        }
        includeMonth
      />

      {locationStatsQuery.error ? (
        <Card className="border border-red-200 bg-red-50 text-red-700 shadow-panel">
          {locationStatsQuery.error.message}
        </Card>
      ) : null}

      {!hasSelectedLocation ? <SelectionState /> : null}

      {hasSelectedLocation ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {locationStatsQuery.isLoading
            ? ['Population', 'Income Class', 'LGU Count', 'PSGC Code'].map((title) => (
                <SummaryCard key={title} title={title} value="Loading..." />
              ))
            : locationCards.map((card) => (
                <SummaryCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  info={card.info}
                />
              ))}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportModules.map((report) => {
          const reportState = getReportState(report, filters)

          return (
            <Card key={report.id} className="border border-slate-200 bg-white shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{report.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{report.description}</p>
                </div>
                <Badge color={reportState.color}>{reportState.label}</Badge>
              </div>
              {report.id === 'bfdp' || report.id === 'skfpd' ? (
                <QuarterlyComplianceCardStats
                  stats={report.id === 'bfdp' ? bfdpStatsQuery.data : skfpdStatsQuery.data}
                  isLoading={report.id === 'bfdp' ? bfdpStatsQuery.isLoading : skfpdStatsQuery.isLoading}
                  isApplicable={reportState.isApplicable}
                />
              ) : null}
              {report.id === 'sglg' ? (
                <SGLGCardStats
                  stats={sglgStatsQuery.data}
                  isLoading={sglgStatsQuery.isLoading}
                  isApplicable={reportState.isApplicable && isSGLGApplicable}
                  isSelectedLgu={Boolean(sglgStatsFilters.province || sglgStatsFilters.city)}
                />
              ) : null}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Frequency
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{report.frequency}</div>
                </div>
                {report.id === 'bfdp' || report.id === 'skfpd' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(report.id, { filters: getQuarterlyFilterPayload(filters) })}
                    disabled={!reportState.isApplicable}
                    className="rounded-lg bg-civic-700 px-4 py-2 text-sm font-semibold text-white hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Open
                  </button>
                ) : null}
                {report.id === 'sglg' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('sglg', { filters: getAnnualFilterPayload(filters) })}
                    disabled={!reportState.isApplicable || !isSGLGApplicable}
                    className="rounded-lg bg-civic-700 px-4 py-2 text-sm font-semibold text-white hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Open
                  </button>
                ) : null}
              </div>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
