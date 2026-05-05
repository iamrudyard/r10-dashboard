import { useEffect, useMemo, useState } from 'react'
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

const badgeClassName =
  'border px-1.5 py-0.5 text-[11px] font-medium leading-4 shadow-none ring-1 ring-inset xl:px-2 xl:text-xs'

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

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString() : 'N/A'
}

function getOverallRatingClassName(value) {
  const normalized = value?.toLowerCase()

  if (normalized === 'passed') {
    return 'text-[#069c56]'
  }

  if (normalized === 'failed') {
    return 'text-[#d3212c]'
  }

  return 'text-slate-900'
}

function LoadingState() {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-civic-700">Loading SGLG dashboard...</div>
      <p className="mt-2 text-sm text-slate-500">Fetching assessment records and indicators.</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="rounded-[30px] border border-red-200 bg-red-50 p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-red-800">Unable to load SGLG data</div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-panel">
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
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">Overall Rating Distribution</h3>
      <Chart options={options} series={series} type="donut" height={310} />
    </Card>
  )
}

const getAxisLimit = (values) => Math.max(1, ...values.map((value) => Math.abs(value)))

function getRequirementMarker(requirement) {
  if (!requirement) {
    return ''
  }

  const label = requirement.label === 'Required' ? 'Req' : requirement.label

  if (requirement.isUniversal) {
    return label
  }

  return `${label} ${requirement.count}/${requirement.total}`
}

function getRequirementLabels(fields) {
  return [
    ...new Set(
      fields
        .map((field) => getRequirementMarker(field.requirement))
        .filter(Boolean),
    ),
  ]
}

function getRequirementMarkerColor(field) {
  if (!field.requirement) {
    return null
  }

  return field.requirement.kind === 'pool' ? '#069c56' : '#d3212c'
}

function getRequirementNote(indicator, fields) {
  if (!fields.some((field) => field.requirement)) {
    return ''
  }

  if (['fin', 'drrm', 'soc'].includes(indicator.key)) {
    return 'Need to PASS all with *, to PASS in this Area.'
  }

  if (indicator.key === 'health') {
    return '* in red is required to pass. * in green counts toward the Any 4/Any 6 items to pass.'
  }

  return '* Required to pass.'
}

function applyRequiredAxisMarkers(chartElement, fields) {
  const labelNodes = chartElement?.querySelectorAll('.apexcharts-yaxis-label')

  if (!labelNodes?.length) {
    return
  }

  labelNodes.forEach((labelNode, index) => {
    const field = fields[index]
    const markerColor = getRequirementMarkerColor(field)

    while (labelNode.firstChild) {
      labelNode.removeChild(labelNode.firstChild)
    }

    labelNode.appendChild(document.createTextNode(field?.label ?? ''))

    if (!markerColor) {
      return
    }

    const markerNode = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    markerNode.textContent = ' *'
    markerNode.setAttribute('fill', markerColor)
    markerNode.setAttribute('font-weight', '800')
    labelNode.appendChild(markerNode)
  })
}

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
    return <ChartEmptyState title={showPercentages ? '10 Governance LGU Passing Rate' : '10 Governance Area Pass/Fail Value'} />
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
        show: showPercentages,
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
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h3 className="text-base font-semibold text-slate-950">
          {showPercentages ? '10 Governance LGU Passing Rate' : '10 Governance Area Pass/Fail Value'}
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
  const requirementLabels = getRequirementLabels(indicator.subIndicators)
  const requirementNote = getRequirementNote(indicator, indicator.subIndicators)

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      stacked: true,
      events: {
        mounted: (chartContext) => applyRequiredAxisMarkers(chartContext.el, indicator.subIndicators),
        updated: (chartContext) => applyRequiredAxisMarkers(chartContext.el, indicator.subIndicators),
      },
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
        show: showPercentages,
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
        const requirement = field.requirement
        const requirementLine = requirement
          ? `<div style="margin-top: 8px; color: #0369a1; font-weight: 700;">${getRequirementMarker(requirement)}: ${requirement.description}</div>`
          : ''

        return `
          <div style="padding: 10px 12px; font-size: 13px; color: #0f172a;">
            <div style="font-weight: 700;">${field.label}</div>
            <div style="margin-top: 4px; color: #475569;">${isFail ? 'Fail' : 'Pass'}: ${valueLabel}</div>
            <div style="margin-top: 8px; font-weight: 700;">${count} of ${field.total} ${totalLabel}</div>
            ${requirementLine}
          </div>
        `
      },
    },
  }

  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{indicator.title}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Sub-indicators: {subIndicatorsPassed} passed, {subIndicatorsFailed} failed
          </p>
          {requirementLabels.length ? (
            <p className="mt-2 text-xs font-semibold text-sky-800">
              {requirementNote}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-right">
          {showPercentages ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-civic-700">
              LGU Passing Rate
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
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-panel">
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
              className="rounded-full border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto lg:overflow-hidden">
        <Table className="min-w-[900px] table-fixed text-xs leading-snug lg:min-w-0 lg:w-full xl:text-sm">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[5%]" />
            <col className="w-[8%]" />
            {SGLG_INDICATORS.map((indicator) => (
              <col key={indicator.key} className="w-[6.2%]" />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="whitespace-normal break-words px-1.5 py-2 leading-snug xl:px-2">
                LGU
              </TableHeaderCell>
              <TableHeaderCell className="whitespace-normal px-1 py-2 text-center leading-snug">
                Year
              </TableHeaderCell>
              <TableHeaderCell className="whitespace-normal px-1 py-2 text-center leading-snug">
                Overall
              </TableHeaderCell>
              {SGLG_INDICATORS.map((indicator) => (
                <TableHeaderCell
                  key={indicator.key}
                  className="whitespace-normal break-words px-0.5 py-2 text-center text-[11px] leading-tight xl:px-1 xl:text-xs"
                >
                  {indicator.shortTitle}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="whitespace-normal break-words px-1.5 py-2 font-medium text-slate-800 xl:px-2">
                  {getSGLGRecordLabel(record)}
                </TableCell>
                <TableCell className="px-1 py-2 text-center">{record.assessment_year ?? 'N/A'}</TableCell>
                <TableCell className="px-1 py-2 text-center">
                  <RatingBadge value={record.overall_rating} />
                </TableCell>
                {SGLG_INDICATORS.map((indicator) => (
                  <TableCell key={indicator.key} className="px-0.5 py-2 text-center xl:px-1">
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
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}

export default function SGLGDashboard({ initialFilters }) {
  const queryClient = useQueryClient()
  const normalizedInitialFilters = useMemo(
    () => ({
      ...defaultFilters,
      ...(initialFilters ?? {}),
    }),
    [initialFilters],
  )
  const [filters, setFilters] = useState(normalizedInitialFilters)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    setFilters(normalizedInitialFilters)
    setPage(0)
  }, [normalizedInitialFilters])

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
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {showPercentages ? (
              <>
                <SummaryCard title="Population" value={formatNumber(dashboard.totalPopulation)} />
                <SummaryCard title="No of LGUs" value={dashboard.uniqueLguCount} />
                <SummaryCard title="LGU Passed" value={dashboard.passedCount} />
                <SummaryCard title="LGU Failed" value={dashboard.failedCount} />
                <SummaryCard title="LGU Passing Rate" value={`${dashboard.overallPassRate}%`} />
              </>
            ) : (
              <>
                <SummaryCard title="Population" value={formatNumber(dashboard.latestPopulation)} />
                <SummaryCard title="Income Class" value={dashboard.latestIncomeClass} />
                <SummaryCard title="Area Passed" value={dashboard.areaPassTotal} />
                <SummaryCard title="Area Failed" value={dashboard.areaFailTotal} />
                <SummaryCard
                  title="Overall Rating"
                  value={formatRating(dashboard.latestOverallRating)}
                  valueClassName={getOverallRatingClassName(dashboard.latestOverallRating)}
                />
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
