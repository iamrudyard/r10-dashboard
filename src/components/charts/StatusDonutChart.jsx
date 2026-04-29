import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

const palette = ['#2f7d64', '#d97706', '#2563eb', '#dc2626', '#7c3aed', '#475569']

export default function StatusDonutChart({ statusCounts }) {
  const labels = Object.keys(statusCounts)
  const series = Object.values(statusCounts)

  if (!labels.length) {
    return <ChartEmptyState title="Status Distribution" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
    },
    labels,
    colors: palette,
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
