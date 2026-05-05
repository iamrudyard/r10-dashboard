import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

const fallbackPalette = ['#475569', '#7c3aed', '#dc2626']

const getStatusColor = (status = '', index = 0) => {
  const normalizedStatus = status.toLowerCase()

  if (
    normalizedStatus.includes('non compliance') ||
    normalizedStatus.includes('non-compliance') ||
    normalizedStatus.includes('notice of non')
  ) {
    return '#d3212c'
  }

  if (normalizedStatus.includes('full')) {
    return '#069c56'
  }

  if (normalizedStatus.includes('partial')) {
    return '#ff980e'
  }

  if (normalizedStatus.includes('none')) {
    return '#2563eb'
  }

  if (normalizedStatus.includes('compliance') || normalizedStatus.includes('compliant')) {
    return '#069c56'
  }

  return fallbackPalette[index % fallbackPalette.length]
}

export default function StatusDonutChart({ statusCounts, selectedStatus, onStatusSelect }) {
  const labels = Object.keys(statusCounts)
  const series = Object.values(statusCounts)
  const colors = labels.map(getStatusColor)

  if (!labels.length) {
    return <ChartEmptyState title="Status Distribution" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: '"Outfit", system-ui, sans-serif',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const status = labels[config.dataPointIndex]

          if (status) {
            onStatusSelect?.(status)
          }
        },
      },
    },
    labels,
    colors,
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
              label: 'Records',
              color: '#475569',
            },
          },
        },
      },
    },
  }

  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Status Distribution</h3>
          {selectedStatus ? (
            <p className="mt-1 text-xs font-medium text-brand-coral">
              Filtering table by {selectedStatus}
            </p>
          ) : null}
        </div>
        {selectedStatus ? (
          <button
            type="button"
            onClick={() => onStatusSelect?.('')}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        ) : null}
      </div>
      <Chart options={options} series={series} type="donut" height={310} />
    </Card>
  )
}
