import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

export default function ScoreByProvinceChart({ data }) {
  if (!data.length) {
    return <ChartEmptyState title="Score by Province/HUC" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: '"Outfit", system-ui, sans-serif',
    },
    colors: ['#E05E46'],
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: '46%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value === null ? '' : value.toFixed(1)),
      style: { fontSize: '11px' },
    },
    xaxis: {
      categories: data.map((item) => item.province),
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#475569', fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => value.toFixed(0),
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
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">Score by Province/HUC</h3>
      <Chart
        options={options}
        series={[{ name: 'Average Score', data: data.map((item) => item.averageScore) }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
