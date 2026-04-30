import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

export default function DocumentCompletionChart({ documents }) {
  if (!documents.length) {
    return <ChartEmptyState title="BFDP Document Completion" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
    },
    colors: ['#2f7d64'],
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: '48%',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value}%`,
      style: { fontSize: '11px' },
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
      max: 100,
      labels: {
        formatter: (value) => `${value}%`,
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
            <div style="font-weight: 700;">${document.label}</div>
            <div style="margin-top: 4px; color: #475569;">${document.percentage}% completion</div>
            <div style="margin-top: 8px; display: grid; gap: 4px;">
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #047857; font-weight: 700;">
                <span>Yes</span>
                <span>${document.complete}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #dc2626; font-weight: 700;">
                <span>No</span>
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
      <h3 className="text-base font-semibold text-slate-950">BFDP Document Completion</h3>
      <Chart
        options={options}
        series={[{ name: 'Completion', data: documents.map((item) => item.percentage) }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
