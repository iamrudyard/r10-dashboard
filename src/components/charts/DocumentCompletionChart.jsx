import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

export default function DocumentCompletionChart({
  documents,
  title = 'BFDP Document Completion',
  positiveLabel = 'Yes',
  negativeLabel = 'No',
}) {
  if (!documents.length) {
    return <ChartEmptyState title={title} />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
    },
    colors: ['#2f7d64'],
    grid: {
      show: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: '48%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value}%`,
      offsetY: -18,
      style: { colors: ['#0f172a'], fontSize: '11px', fontWeight: 700 },
    },
    xaxis: {
      categories: documents.map((item) => item.label),
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#475569', fontSize: '12px' },
      },
    },
    yaxis: {
      min: 0,
      max: 110,
      labels: {
        show: false,
      },
    },
    tooltip: {
      custom: ({ dataPointIndex }) => {
        const document = documents[dataPointIndex]

        if (!document) {
          return ''
        }

        return `
          <div style="padding: 10px 12px; font-size: 13px; color: #0f172a;">
            <div style="font-weight: 700;">${document.fullLabel ?? document.label}</div>
            <div style="margin-top: 4px; color: #475569;">${document.percentage}% completion</div>
            <div style="margin-top: 8px; display: grid; gap: 4px;">
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #047857; font-weight: 700;">
                <span>${positiveLabel}</span>
                <span>${document.complete}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #dc2626; font-weight: 700;">
                <span>${negativeLabel}</span>
                <span>${document.missing}</span>
              </div>
            </div>
          </div>
        `
      },
    },
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <Chart
        options={options}
        series={[{ name: 'Completion', data: documents.map((item) => item.percentage) }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
