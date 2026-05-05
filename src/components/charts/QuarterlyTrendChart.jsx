import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

function ChartTitle({ selectedLguPath }) {
  return (
    <h3 className="text-base font-semibold text-slate-950">
      Quarterly Trend
      {selectedLguPath ? (
        <span className="font-normal text-slate-500"> ({selectedLguPath})</span>
      ) : null}
    </h3>
  )
}

export default function QuarterlyTrendChart({ data, selectedYear, selectedLguPath, maxScore = 9 }) {
  const seriesData = data.map((item) => item.averageScore)
  const hasData = seriesData.some((value) => value !== null)

  if (!hasData) {
    return (
      <ChartEmptyState
        title={<ChartTitle selectedLguPath={selectedLguPath} />}
        message="No score values are available for the selected year or current filters."
      />
    )
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: '"Outfit", system-ui, sans-serif',
    },
    colors: ['#E05E46'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    markers: {
      size: 5,
      colors: ['#ffffff'],
      strokeColors: '#E05E46',
      strokeWidth: 3,
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value === null ? '' : value.toFixed(1)),
    },
    xaxis: {
      categories: data.map((item) => `Q${item.quarter}`),
      labels: { style: { colors: '#475569' } },
    },
    yaxis: {
      min: 0,
      max: maxScore,
      tickAmount: 3,
      forceNiceScale: false,
      labels: {
        formatter: (value) => value.toFixed(0),
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value.toFixed(1)} average score`,
      },
    },
  }

  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-panel">
      <div className="flex flex-col justify-between gap-1 md:flex-row md:items-center">
        <ChartTitle selectedLguPath={selectedLguPath} />
        <p className="text-sm text-slate-500">{selectedYear || 'All available years'}</p>
      </div>
      <Chart
        options={options}
        series={[{ name: 'Average Score', data: seriesData }]}
        type="line"
        height={315}
      />
    </Card>
  )
}
