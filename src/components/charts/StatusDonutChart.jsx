import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

const fallbackPalette = ['#475569', '#7c3aed', '#dc2626']

const getStatusColor = (status = '', index = 0) => {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes('full')) {
    return '#069c56'
  }

  if (normalizedStatus.includes('partial')) {
    return '#ff980e'
  }

  if (normalizedStatus.includes('none') || normalizedStatus.includes('non')) {
    return '#2563eb'
  }

  return fallbackPalette[index % fallbackPalette.length]
}

export default function StatusDonutChart({ statusCounts }) {
  const labels = Object.keys(statusCounts)
  const series = Object.values(statusCounts)
  const colors = labels.map(getStatusColor)

  if (!labels.length) {
    return <ChartEmptyState title="Status Distribution" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
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
    <Card className="border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">Status Distribution</h3>
      <Chart options={options} series={series} type="donut" height={310} />
    </Card>
  )
}
