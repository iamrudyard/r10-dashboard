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
import RoadSafetyTable from '../components/tables/RoadSafetyTable'
import {
  useRoadSafetyGeoOptions,
  useRoadSafetyLocationStats,
  useRoadSafetyProvinceFieldCounts,
  useRoadSafetyRoadCrashByProvince,
  useRoadSafetyTable,
} from '../hooks/useRoadSafetyQueries'

const moduleTitle = 'Classification of Roads, Setting of Speed Limits and Collection of Road Crash Data'

const defaultFilters = {
  provinceHuc: '',
  year: '',
  quarter: '',
}

function LoadingState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-civic-700">Loading {moduleTitle} dashboard...</div>
      <p className="mt-2 text-sm text-slate-500">Fetching road safety compliance records.</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="border border-red-200 bg-red-50 p-8 text-center shadow-panel">
      <div className="text-sm font-semibold text-red-800">Unable to load {moduleTitle} data</div>
      <p className="mt-2 text-sm text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">No {moduleTitle} data found</div>
      <p className="mt-2 text-sm text-slate-500">
        Adjust the selected Province/HUC, year, or quarter filters.
      </p>
    </Card>
  )
}

function PeriodPrompt() {
  return (
    <Card className="border border-slate-200 bg-white p-8 text-center shadow-panel">
      <div className="text-base font-semibold text-slate-950">Select a year and quarter</div>
      <p className="mt-2 text-sm text-slate-500">
        Road Class & Safety records are quarterly, so the dashboard loads only after both filters are selected.
      </p>
    </Card>
  )
}

function toTransparentColor(color) {
  if (!color?.startsWith('#') || color.length !== 7) {
    return color
  }

  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)

  return `rgba(${red}, ${green}, ${blue}, 0.22)`
}

function ProvinceMetricColumnChart({
  data,
  title,
  fieldKey,
  fieldLabel,
  selectedProvince = '',
  onFilterSelect,
  color = '#0f766e',
}) {
  if (!data.length) {
    return <ChartEmptyState title={title} />
  }

  const labels = data.map((item) => item.label ?? item.province)
  const hasHighlight = Boolean(selectedProvince)
  const seriesData = data.map((item, index) => {
    const label = labels[index]
    const isHighlighted = hasHighlight && label === selectedProvince

    return {
      x: label,
      y: Number(item.counts?.[fieldKey] ?? 0),
      fillColor: !hasHighlight ? color : isHighlighted ? color : toTransparentColor(color),
    }
  })
  const maxValue = Math.max(1, ...seriesData.map((item) => item.y))

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const item = data[config.dataPointIndex]

          if (item) {
            onFilterSelect?.({
              province: item.province,
              locationLabel: item.label ?? item.province,
              fieldKey,
              fieldLabel,
            })
          }
        },
      },
    },
    colors: [color],
    grid: { show: false },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '56%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value > 0 ? value.toLocaleString() : ''),
      offsetY: -18,
      style: { colors: ['#0f172a'], fontSize: '11px', fontWeight: 700 },
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#475569', fontSize: '12px' },
      },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(maxValue * 1.18),
      labels: { show: false },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value.toLocaleString()} LGU(s)`,
      },
    },
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <Chart options={options} series={[{ name: fieldLabel, data: seriesData }]} type="bar" height={340} />
    </Card>
  )
}

function SpeedSignsChart({ data, selectedProvince = '', selectedFieldKey = '', onFilterSelect }) {
  if (!data.length) {
    return <ChartEmptyState title="LGUs with Speed Limit Signs" />
  }

  const signFields = [
    { key: 'signs_cm_brgy_road', label: 'City/Municipality/Barangay Road', color: '#0f766e' },
    { key: 'signs_provincial_road', label: 'Provincial Road', color: '#b45309' },
    { key: 'signs_national_road', label: 'National Road', color: '#2563eb' },
  ]
  const labels = data.map((item) => item.label ?? item.province)
  const hasHighlight = Boolean(selectedProvince)
  const series = signFields.map((field) => ({
    name: field.label,
    data: data.map((item, index) => {
      const label = labels[index]
      const isHighlighted = hasHighlight && label === selectedProvince && (!selectedFieldKey || selectedFieldKey === field.key)

      return {
        x: label,
        y: Number(item.counts?.[field.key] ?? 0),
        fillColor: !hasHighlight ? field.color : isHighlighted ? field.color : toTransparentColor(field.color),
      }
    }),
  }))
  const maxValue = Math.max(1, ...series.flatMap((item) => item.data.map((point) => point.y)))

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const item = data[config.dataPointIndex]
          const field = signFields[config.seriesIndex]

          if (item && field) {
            onFilterSelect?.({
              province: item.province,
              locationLabel: item.label ?? item.province,
              fieldKey: field.key,
              fieldLabel: field.label,
            })
          }
        },
      },
    },
    colors: signFields.map((field) => field.color),
    legend: {
      position: 'bottom',
      fontSize: '12px',
      markers: { width: 10, height: 10, radius: 10 },
    },
    grid: { show: false },
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth: '68%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value > 0 ? value.toLocaleString() : ''),
      offsetY: -16,
      style: { colors: ['#0f172a'], fontSize: '10px', fontWeight: 700 },
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#475569', fontSize: '12px' },
      },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(maxValue * 1.18),
      labels: { show: false },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value.toLocaleString()} LGU(s)`,
      },
    },
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">LGUs with Speed Limit Signs</h3>
      <Chart options={options} series={series} type="bar" height={380} />
    </Card>
  )
}

function RoadCrashDataTableChart({ data, selectedProvince = '', onFilterSelect }) {
  if (!data.length) {
    return <ChartEmptyState title="Road Crash Data Collected" />
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-950">Road Crash Data Collected</h3>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[520px]">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Province/HUC</TableHeaderCell>
              <TableHeaderCell className="text-right">LGUs</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => {
              const isSelected = selectedProvince === item.province

              return (
                <TableRow
                  key={item.province}
                  className={`${isSelected ? 'bg-civic-50' : ''} cursor-pointer hover:bg-civic-50`}
                  onClick={() =>
                    onFilterSelect?.({
                      province: item.province,
                      locationLabel: item.label ?? item.province,
                      fieldKey: 'data_collected_road_crash',
                      fieldLabel: 'Road Crash Data Collected',
                    })
                  }
                >
                  <TableCell className="font-medium text-slate-800">{item.label ?? item.province}</TableCell>
                  <TableCell className="text-right">
                    <Badge color={item.collected ? 'emerald' : 'slate'}>{item.collected}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

export default function RoadSafetyDashboard({ initialFilters }) {
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
    locationLabel: '',
    fieldKey: '',
    fieldLabel: '',
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    setFilters(normalizedInitialFilters)
    setSelectedChartFilter({ province: '', locationLabel: '', fieldKey: '', fieldLabel: '' })
    setPage(0)
  }, [normalizedInitialFilters])

  const queryFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: selectedChartFilter.province || filters.provinceHuc,
      fieldKey: selectedChartFilter.fieldKey,
      page,
      pageSize,
    }),
    [
      filters.year,
      filters.quarter,
      filters.provinceHuc,
      selectedChartFilter.province,
      selectedChartFilter.fieldKey,
      page,
      pageSize,
    ],
  )

  const chartFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
    }),
    [filters.year, filters.quarter, filters.provinceHuc],
  )

  const geoOptionsQuery = useRoadSafetyGeoOptions()
  const hasRequiredPeriod = Boolean(filters.year && filters.quarter)
  const highlightedProvince = selectedChartFilter.province || filters.provinceHuc

  const locationStatsQuery = useRoadSafetyLocationStats(chartFilters, { requireLocation: false })
  const provinceFieldCountsQuery = useRoadSafetyProvinceFieldCounts(chartFilters, { requireLocation: false })
  const roadCrashQuery = useRoadSafetyRoadCrashByProvince(chartFilters, { requireLocation: false })
  const tableQuery = useRoadSafetyTable(queryFilters, { requireLocation: false })

  const isInitialDashboardLoading =
    locationStatsQuery.isLoading ||
    provinceFieldCountsQuery.isLoading ||
    roadCrashQuery.isLoading ||
    tableQuery.isLoading

  const dashboardError =
    locationStatsQuery.error ||
    provinceFieldCountsQuery.error ||
    roadCrashQuery.error ||
    tableQuery.error

  const locationStats = locationStatsQuery.data
  const provinceFieldCounts = provinceFieldCountsQuery.data ?? []
  const roadCrashRows = roadCrashQuery.data ?? []
  const tableData = tableQuery.data ?? { rows: [], count: 0 }
  const hasDashboardRecords =
    tableData.count > 0 ||
    provinceFieldCounts.some((item) => Object.values(item.counts ?? {}).some((count) => count > 0))
  const isRefreshing =
    geoOptionsQuery.isFetching ||
    locationStatsQuery.isFetching ||
    provinceFieldCountsQuery.isFetching ||
    roadCrashQuery.isFetching ||
    tableQuery.isFetching

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setSelectedChartFilter({ province: '', locationLabel: '', fieldKey: '', fieldLabel: '' })
    setFilters({
      provinceHuc: nextFilters.provinceHuc ?? '',
      year: nextFilters.year ?? '',
      quarter: nextFilters.quarter ?? '',
    })
  }

  const handleChartFilterChange = (selection) => {
    setPage(0)
    setSelectedChartFilter((current) =>
      current.province === selection.province &&
      current.fieldKey === selection.fieldKey
        ? { province: '', locationLabel: '', fieldKey: '', fieldLabel: '' }
        : selection,
    )
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['road-safety-geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['road-safety-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['road-safety-province-field-counts'] })
    queryClient.invalidateQueries({ queryKey: ['road-safety-road-crash-by-province'] })
    queryClient.invalidateQueries({ queryKey: ['road-safety-table'] })
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
        includeCity={false}
      />

      {dashboardError ? <ErrorState message={dashboardError.message} /> : null}
      {!hasRequiredPeriod ? <PeriodPrompt /> : null}
      {hasRequiredPeriod && isInitialDashboardLoading ? <LoadingState /> : null}
      {hasRequiredPeriod && !isInitialDashboardLoading && !dashboardError && !hasDashboardRecords ? <EmptyState /> : null}

      {hasRequiredPeriod && !isInitialDashboardLoading && !dashboardError && hasDashboardRecords ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <ProvinceMetricColumnChart
              data={provinceFieldCounts}
              title="Count for LGUs with Speed Limit Ordinance"
              fieldKey="speed_limit_ordinance"
              fieldLabel="Speed Limit Ordinance"
              selectedProvince={highlightedProvince}
              onFilterSelect={handleChartFilterChange}
              color="#0f766e"
            />
            <ProvinceMetricColumnChart
              data={provinceFieldCounts}
              title="LGUs Submitted Ordinance to DOTr"
              fieldKey="submitted_to_dotr"
              fieldLabel="Submitted Ordinance to DOTr"
              selectedProvince={highlightedProvince}
              onFilterSelect={handleChartFilterChange}
              color="#2563eb"
            />
            <ProvinceMetricColumnChart
              data={provinceFieldCounts}
              title="LGUs with Crowded Streets"
              fieldKey="crowded_streets"
              fieldLabel="Crowded Streets"
              selectedProvince={highlightedProvince}
              onFilterSelect={handleChartFilterChange}
              color="#b45309"
            />
            <ProvinceMetricColumnChart
              data={provinceFieldCounts}
              title="LGUs with Road Inventory"
              fieldKey="inventory_of_roads"
              fieldLabel="Road Inventory"
              selectedProvince={highlightedProvince}
              onFilterSelect={handleChartFilterChange}
              color="#4f46e5"
            />
            <SpeedSignsChart
              data={provinceFieldCounts}
              selectedProvince={highlightedProvince}
              selectedFieldKey={selectedChartFilter.fieldKey}
              onFilterSelect={handleChartFilterChange}
            />
            <RoadCrashDataTableChart
              data={roadCrashRows}
              selectedProvince={highlightedProvince}
              onFilterSelect={handleChartFilterChange}
            />
          </section>

          <RoadSafetyTable
            records={tableData.rows}
            totalRecords={tableData.count}
            page={page}
            pageSize={pageSize}
            activeStatusFilter={
              selectedChartFilter.locationLabel
                ? `Province/HUC: ${selectedChartFilter.locationLabel}`
                : ''
            }
            onClearStatusFilter={() =>
              handleChartFilterChange({ province: '', locationLabel: '', fieldKey: '', fieldLabel: '' })
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
