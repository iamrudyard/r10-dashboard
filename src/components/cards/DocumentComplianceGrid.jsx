import { Badge, Card } from '@tremor/react'

export default function DocumentComplianceGrid({ documents }) {
  return (
    <Card className="border border-slate-200 bg-white shadow-panel">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">Document Compliance Counts</h2>
        <p className="text-sm text-slate-500">
          Yes and No counts are computed from BFDP boolean fields.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((item) => (
          <div key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
              <Badge color={item.percentage >= 80 ? 'emerald' : 'amber'}>{item.percentage}%</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Yes</div>
                <div className="mt-1 text-xl font-semibold text-civic-700">{item.complete}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">No</div>
                <div className="mt-1 text-xl font-semibold text-red-700">{item.missing}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
