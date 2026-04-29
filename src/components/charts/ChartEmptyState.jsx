import { Card } from '@tremor/react'

export default function ChartEmptyState({ title, message = 'No chart data available.' }) {
  return (
    <Card className="flex min-h-80 flex-col justify-center border border-slate-200 bg-white text-center shadow-panel">
      {typeof title === 'string' ? (
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      ) : (
        <div className="flex justify-center">{title}</div>
      )}
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </Card>
  )
}
