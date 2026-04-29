import { Card, Metric, Text } from '@tremor/react'
import { useState } from 'react'

export default function SummaryCard({ title, value, note, info }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <Card className="relative border border-slate-200 bg-white shadow-panel">
      <div className="flex items-center gap-2">
        <Text className="text-sm font-medium text-slate-500">{title}</Text>
        {info ? (
          <button
            type="button"
            onClick={() => setShowInfo((current) => !current)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-500 hover:border-civic-600 hover:text-civic-700"
            aria-label={`${title} information`}
          >
            i
          </button>
        ) : null}
      </div>
      <Metric className="mt-2 text-2xl font-semibold text-slate-900">{value}</Metric>
      {showInfo && info ? (
        <div className="absolute left-5 top-10 z-20 max-w-56 rounded-lg border border-civic-100 bg-white px-3 py-2 text-xs font-medium text-civic-800 shadow-xl">
          {info}
        </div>
      ) : null}
      {note ? <Text className="mt-2 text-xs text-slate-500">{note}</Text> : null}
    </Card>
  )
}
