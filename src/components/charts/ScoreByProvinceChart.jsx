import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

export default function ScoreByProvinceChart({
  data,
  title = 'Avg Score by Province/HUC',
  highlightedLocation = '',
}) {
  if (!data.length) {
    return <ChartEmptyState title={title} />
  }

  const toTransparentColor = (color) => {
    if (!color?.startsWith('#') || color.length !== 7) {
      return color
    }

    const red = Number.parseInt(color.slice(1, 3), 16)
    const green = Number.parseInt(color.slice(3, 5), 16)
    const blue = Number.parseInt(color.slice(5, 7), 16)

    return `rgba(${red}, ${green}, ${blue}, 0.2)`
  }

  const baseColor = '#d97706'
  const highlightColor = '#0f766e'
  const hasHighlight = Boolean(highlightedLocation)
  const labels = data.map((item) => item.label ?? item.city ?? item.province)
  const maxValue = Math.max(1, ...data.map((item) => item.averageScore ?? 0))
  const seriesData = data.map((item, index) => {
    const label = labels[index]
    const isHighlighted = hasHighlight && label === highlightedLocation

    return {
      x: label,
      y: item.averageScore,
      fillColor: !hasHighlight ? baseColor : isHighlighted ? highlightColor : toTransparentColor(baseColor),
    }
  })

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
    },
    colors: [baseColor],
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
        series={[{ name: 'Average Score', data: seriesData }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
