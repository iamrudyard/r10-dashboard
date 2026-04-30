import { useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import ChartEmptyState from '../components/charts/ChartEmptyState'
import LocationFilters from '../components/filters/LocationFilters'
import { useSGLGDashboard, useSGLGGeoOptions, useSGLGTable } from '../hooks/useSGLGQueries'
import { getSGLGRecordLabel } from '../services/sglgService'
import { SGLG_INDICATORS } from '../utils/sglgIndicators'

const defaultFilters = {
  provinceHuc: '',
  cityMunName: '',
  year: '',
}

const badgeClassName = 'border px-2 py-0.5 text-xs font-medium leading-4 shadow-none ring-1 ring-inset'

const badgeColorClasses = {
  green: '!border-[#069c56] !bg-[#069c56] !text-white !ring-[#069c56]/20',
  red: '!border-[#d3212c] !bg-[#d3212c] !text-white !ring-[#d3212c]/20',
  slate: '!border-slate-300 !bg-slate-50 !text-slate-700 !ring-slate-600/20',
}

function BinaryBadge({ value }) {
  if (value === 1) {
    return <Badge className={`${badgeClassName} ${badgeColorClasses.green}`}>Pass</Badge>
  }

  if (value === 0) {
    return <Badge className={`${badgeClassName} ${badgeColorClasses.red}`}>Fail</Badge>
  }

  return <Badge className={`${badgeClassName} ${badgeColorClasses.slate}`}>N/A</Badge>
}

function RatingBadge({ value }) {
  const normalized = value?.toLowerCase()
  const colorClass = normalized === 'passed' ? badgeColorClasses.green : normalized === 'failed' ? badgeColorClasses.red : badgeColorClasses.slate

  return <Badge className={`${badgeClassName} ${colorClass}`}>{formatRating(value)}</Badge>
}

function formatRating(value) {
  const normalized = value?.toLowerCase()

  if (normalized === 'passed') {
    return 'Passed'
  }

  if (normalized === 'failed') {
    return 'Failed'
  }

  return 'No Rating'
}

function LoadingState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-civic-700">Loading SGLG dashboard...</div>
      <p className="mt-2 text-sm text-slate-500">Fetching assessment records and indicators.</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="border border-red-200 bg-red-50 p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-red-800">Unable to load SGLG data</div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">No SGLG data found</div>
      <p className="mt-2 text-sm text-slate-500">
        Adjust the selected Province/HUC, City/Municipality, or year filters.
      </p>
    </Card>
  )
}

function SGLGRatingDonut({ statusCounts }) {
  const labels = Object.keys(statusCounts)
  const series = Object.values(statusCounts)

  if (!labels.length) {
    return <ChartEmptyState title="Overall Rating Distribution" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
    },
    labels,
    colors: labels.map((label) => {
      const normalized = label.toLowerCase()
      if (normalized === 'passed') return '#069c56'
      if (normalized === 'failed') return '#d3212c'
      return '#64748b'
    }),
    legend: {
      position: 'bottom',
      fontSize: '13px',
      markers: { width: 10, height: 10, radius: 10 },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(1)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'LGUs',
              color: '#475569',
            },
          },
        },
      },
    },
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">Overall Rating Distribution</h3>
      <Chart options={options} series={series} type="donut" height={310} />
    </Card>
  )
}

const getAxisLimit = (values) => Math.max(1, ...values.map((value) => Math.abs(value)))

function groupIndicatorsBySubIndicatorCount(indicators) {
  const groups = indicators.reduce((result, indicator) => {
    const count = indicator.subIndicators.length

    if (!result.has(count)) {
      result.set(count, [])
    }

    result.get(count).push(indicator)
    return result
  }, new Map())

  return [...groups.entries()]
    .sort(([leftCount], [rightCount]) => rightCount - leftCount)
    .map(([count, groupedIndicators]) => ({
      count,
      indicators: groupedIndicators,
    }))
}

function AreaStatusChart({ indicators, showPercentages }) {
  if (!indicators.length) {
    return <ChartEmptyState title={showPercentages ? '10 Governance Area Pass/Fail Rate' : '10 Governance Area Pass/Fail Value'} />
  }

  const failValues = indicators.map((item) =>
    showPercentages
      ? item.total
        ? -1 * Number(((item.fail / item.total) * 100).toFixed(1))
        : 0
      : -1 * item.fail,
  )
  const passValues = indicators.map((item) => (showPercentages ? item.percentage : item.pass))
  const axisLimit = showPercentages ? 100 : getAxisLimit([...failValues, ...passValues])

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      stacked: true,
    },
    colors: ['#d3212c', '#2f7d64'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        barHeight: '58%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      min: -axisLimit,
      max: axisLimit,
      labels: {
        formatter: (value) => showPercentages ? `${Math.abs(value)}%` : Math.abs(value).toFixed(0),
      },
    },
    yaxis: {
      labels: { style: { colors: '#475569', fontSize: '12px' } },
    },
    annotations: {
      xaxis: [
        {
          x: 0,
          borderColor: '#94a3b8',
          strokeDashArray: 0,
        },
      ],
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex }) => {
        const indicator = indicators[dataPointIndex]

        if (!indicator) {
          return ''
        }

        const isFail = seriesIndex === 0
        const count = isFail ? indicator.fail : indicator.pass
        const value = isFail ? Math.abs(failValues[dataPointIndex]) : passValues[dataPointIndex]
        const valueLabel = showPercentages ? `${value}%` : `${value} value`
        const totalLabel = showPercentages ? 'LGUs' : 'assessment value(s)'

        return `
          <div style="padding: 10px 12px; font-size: 13px; color: #0f172a;">
            <div style="font-weight: 700;">${indicator.title}</div>
            <div style="margin-top: 4px; color: #475569;">${isFail ? 'Fail' : 'Pass'}: ${valueLabel}</div>
            <div style="margin-top: 8px; font-weight: 700;">${count} of ${indicator.total} ${totalLabel}</div>
          </div>
        `
      },
    },
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h3 className="text-base font-semibold text-slate-950">
          {showPercentages ? '10 Governance Area Pass/Fail Rate' : '10 Governance Area Pass/Fail Value'}
        </h3>
      </div>
      <Chart
        options={{ ...options, xaxis: { ...options.xaxis, categories: indicators.map((item) => item.title) } }}
        series={[
          { name: showPercentages ? 'Fail Rate' : 'Fail Value', data: failValues },
          { name: showPercentages ? 'Pass Rate' : 'Pass Value', data: passValues },
        ]}
        type="bar"
        height={390}
      />
    </Card>
  )
}

function SubIndicatorCard({ indicator, showPercentages, overallRating }) {
  const hasData = indicator.subIndicators.some((field) => field.total > 0)

  if (!hasData) {
    return (
      <ChartEmptyState
        title={indicator.title}
        message="No assessed sub-indicator values are available for the selected filters."
      />
    )
  }

  const failValues = indicator.subIndicators.map((field) =>
    showPercentages
      ? field.total
        ? -1 * Number(((field.fail / field.total) * 100).toFixed(1))
        : 0
      : -1 * field.fail,
  )
  const passValues = indicator.subIndicators.map((field) =>
    showPercentages ? field.percentage : field.pass,
  )
  const axisLimit = showPercentages ? 100 : getAxisLimit([...failValues, ...passValues])
  const subIndicatorsPassed = indicator.subIndicators.reduce((sum, field) => sum + field.pass, 0)
  const subIndicatorsFailed = indicator.subIndicators.reduce((sum, field) => sum + field.fail, 0)

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      stacked: true,
    },
    colors: ['#d3212c', '#2f7d64'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '55%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      min: -axisLimit,
      max: axisLimit,
      labels: {
        formatter: (value) => showPercentages ? `${Math.abs(value)}%` : Math.abs(value).toFixed(0),
      },
    },
    yaxis: {
      labels: {
        minWidth: 122,
        maxWidth: 184,
        style: { colors: '#475569', fontSize: '11px' },
      },
    },
    annotations: {
      xaxis: [
        {
          x: 0,
          borderColor: '#94a3b8',
          strokeDashArray: 0,
        },
      ],
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex }) => {
        const field = indicator.subIndicators[dataPointIndex]

        if (!field) {
          return ''
        }

        const isFail = seriesIndex === 0
        const count = isFail ? field.fail : field.pass
        const value = isFail ? Math.abs(failValues[dataPointIndex]) : passValues[dataPointIndex]
        const valueLabel = showPercentages ? `${value}%` : `${value} value`
        const totalLabel = showPercentages ? 'LGUs' : 'assessment value(s)'

        return `
          <div style="padding: 10px 12px; font-size: 13px; color: #0f172a;">
            <div style="font-weight: 700;">${field.label}</div>
            <div style="margin-top: 4px; color: #475569;">${isFail ? 'Fail' : 'Pass'}: ${valueLabel}</div>
            <div style="margin-top: 8px; font-weight: 700;">${count} of ${field.total} ${totalLabel}</div>
          </div>
        `
      },
    },
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{indicator.title}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Sub-indicators: {subIndicatorsPassed} passed, {subIndicatorsFailed} failed
          </p>
        </div>
        <div className="rounded-lg border border-civic-100 bg-civic-50 px-3 py-1.5 text-right">
          {showPercentages ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-civic-700">
              Area
            </div>
          ) : null}
          <div className="text-sm font-semibold text-civic-900">
            {showPercentages ? `${indicator.percentage}%` : formatRating(overallRating)}
          </div>
        </div>
      </div>
      <Chart
        options={{ ...options, xaxis: { ...options.xaxis, categories: indicator.subIndicators.map((field) => field.label) } }}
        series={[
          { name: showPercentages ? 'Fail Rate' : 'Fail Value', data: failValues },
          { name: showPercentages ? 'Pass Rate' : 'Pass Value', data: passValues },
        ]}
        type="bar"
        height={Math.max(280, indicator.subIndicators.length * 31)}
      />
    </Card>
  )
}

function SGLGTable({ records, totalRecords, page, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const currentPage = Math.min(page + 1, totalPages)

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-base font-semibold text-slate-950">SGLG Detailed Records</h2>
          <p className="text-sm text-slate-500">Annual LGU ratings with the 10 governance area statuses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge color="slate">
            {records.length} of {totalRecords} records
          </Badge>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Rows
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[1180px] text-sm leading-snug">
          <TableHead>
            <TableRow>
              <TableHeaderCell>LGU</TableHeaderCell>
              <TableHeaderCell>Year</TableHeaderCell>
              <TableHeaderCell>Overall</TableHeaderCell>
              {SGLG_INDICATORS.map((indicator) => (
                <TableHeaderCell key={indicator.key} className="text-center">
                  {indicator.shortTitle}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium text-slate-800">{getSGLGRecordLabel(record)}</TableCell>
                <TableCell>{record.assessment_year ?? 'N/A'}</TableCell>
                <TableCell>
                  <RatingBadge value={record.overall_rating} />
                </TableCell>
                {SGLG_INDICATORS.map((indicator) => (
                  <TableCell key={indicator.key} className="text-center">
                    <BinaryBadge value={record[indicator.statusKey]} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center">
        <p className="text-sm text-slate-500">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}

export default function SGLGDashboard() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  const queryFilters = useMemo(
    () => ({
      year: filters.year,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.year, filters.provinceHuc, filters.cityMunName],
  )
  const tableFilters = useMemo(
    () => ({
      ...queryFilters,
      page,
      pageSize,
    }),
    [page, pageSize, queryFilters],
  )

  const geoOptionsQuery = useSGLGGeoOptions()
  const dashboardQuery = useSGLGDashboard(queryFilters)
  const tableQuery = useSGLGTable(tableFilters)
  const dashboard = dashboardQuery.data
  const tableData = tableQuery.data ?? { rows: [], count: 0 }
  const isLoading = dashboardQuery.isLoading || tableQuery.isLoading
  const isRefreshing = geoOptionsQuery.isFetching || dashboardQuery.isFetching || tableQuery.isFetching
  const dashboardError = dashboardQuery.error || tableQuery.error
  const showPercentages = !queryFilters.province && !queryFilters.city
  const indicatorGroups = useMemo(
    () => groupIndicatorsBySubIndicatorCount(dashboard?.indicators ?? []),
    [dashboard?.indicators],
  )

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setFilters({
      provinceHuc: nextFilters.provinceHuc ?? '',
      cityMunName: nextFilters.cityMunName ?? '',
      year: nextFilters.year ?? '',
    })
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sglg-geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['sglg-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['sglg-table'] })
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
        includeQuarter={false}
      />

      {dashboardError ? <ErrorState message={dashboardError.message} /> : null}
      {isLoading ? <LoadingState /> : null}
      {!isLoading && !dashboardError && !dashboard?.totalRecords ? <EmptyState /> : null}

      {!isLoading && !dashboardError && dashboard?.totalRecords ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <SummaryCard title="Assessment Records" value={dashboard.totalRecords} />
            <SummaryCard title="LGUs Covered" value={dashboard.uniqueLguCount} />
            {showPercentages ? (
              <>
                <SummaryCard title="Passed" value={dashboard.passedCount} />
                <SummaryCard title="Failed" value={dashboard.failedCount} />
                <SummaryCard title="Overall Pass Rate" value={`${dashboard.overallPassRate}%`} />
                <SummaryCard title="Area Pass Rate" value={`${dashboard.areaPassRate}%`} />
              </>
            ) : (
              <>
                <SummaryCard title="Overall Rating" value={formatRating(dashboard.latestOverallRating)} />
                <SummaryCard title="Passed" value={dashboard.passedCount} />
                <SummaryCard title="Failed" value={dashboard.failedCount} />
                <SummaryCard title="Areas Passed" value={`${dashboard.areaPassTotal}/${dashboard.areaPassTotal + dashboard.areaFailTotal}`} />
              </>
            )}
          </section>

          <section className={showPercentages ? 'grid gap-6 xl:grid-cols-2' : ''}>
            {showPercentages ? <SGLGRatingDonut statusCounts={dashboard.statusCounts} /> : null}
            <AreaStatusChart indicators={dashboard.indicators} showPercentages={showPercentages} />
          </section>

          <section className="space-y-6">
            {indicatorGroups.map((group) => (
              <div
                key={group.count}
                className={group.indicators.length > 1 ? 'grid gap-6 xl:grid-cols-2' : 'grid gap-6'}
              >
                {group.indicators.map((indicator) => (
                  <SubIndicatorCard
                    key={indicator.key}
                    indicator={indicator}
                    showPercentages={showPercentages}
                    overallRating={dashboard.latestOverallRating}
                  />
                ))}
              </div>
            ))}
          </section>

          <SGLGTable
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
