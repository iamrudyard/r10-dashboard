import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

export default function ScoreByProvinceChart({ data, title = 'Avg Score by Province/HUC' }) {
  if (!data.length) {
    return <ChartEmptyState title={title} />
  }

  const maxValue = Math.max(1, ...data.map((item) => item.averageScore ?? 0))

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
    },
    colors: ['#d97706'],
    grid: {
      show: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: '46%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value === null ? '' : value.toFixed(1)),
      offsetY: -18,
      style: { colors: ['#0f172a'], fontSize: '11px', fontWeight: 700 },
    },
    xaxis: {
      categories: data.map((item) => item.label ?? item.city ?? item.province),
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#475569', fontSize: '12px' },
      },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(maxValue * 1.18),
      labels: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: (value) =>
          value === null ? 'No score data' : `${value.toFixed(1)} average score`,
      },
    },
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <Chart
        options={options}
        series={[{ name: 'Average Score', data: data.map((item) => item.averageScore) }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
