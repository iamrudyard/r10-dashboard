import { useMemo } from 'react'
import { Badge, Card } from '@tremor/react'
import SummaryCard from '../components/cards/SummaryCard'
import { useBFDPSummary } from '../hooks/useBFDPQueries'

export default function Overview({ onNavigate }) {
  const overviewFilters = useMemo(
    () => ({
      year: '',
      quarter: '',
      province: '',
      city: '',
      barangay: '',
    }),
    [],
  )

  const summaryQuery = useBFDPSummary(overviewFilters, { requireLocation: false })
  const analytics = summaryQuery.data
  const statusEntries = Object.entries(analytics?.statusCounts ?? {})

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-civic-900/10 bg-white p-6 shadow-panel">
        <div className="max-w-3xl">
          <Badge color="emerald">BFDP active module</Badge>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">Overview Dashboard</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A read-only analytics workspace for government report monitoring. BFDP is implemented
            first; SGLG and future report modules are reserved until schemas are provided.
          </p>
        </div>
      </section>

      {summaryQuery.error ? (
        <Card className="border border-red-200 bg-red-50 text-red-700 shadow-panel">
          {summaryQuery.error.message}
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="BFDP Records"
          value={summaryQuery.isLoading ? 'Loading...' : analytics?.totalRecords ?? 0}
        />
        <SummaryCard
          title="LGUs with BFDP records"
          value={summaryQuery.isLoading ? 'Loading...' : analytics?.uniqueLguCount ?? 'N/A'}
        />
        <SummaryCard
          title="Average BFDP Score"
          value={summaryQuery.isLoading ? 'Loading...' : analytics?.averageScore ?? 'N/A'}
        />
        <SummaryCard
          title="Status Values"
          value={summaryQuery.isLoading ? 'Loading...' : statusEntries.length}
          note="Dynamically grouped from BFDP status"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border border-slate-200 bg-white shadow-panel xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">BFDP</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Barangay Full Disclosure Policy analytics from cached SQL views.
              </p>
            </div>
            <Badge color="emerald">Live</Badge>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {statusEntries.length ? (
              statusEntries.map(([status, count]) => (
                <Badge key={status} color="blue">
                  {status}: {count}
                </Badge>
              ))
            ) : (
              <Badge color="slate">No status data</Badge>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('bfdp')}
            className="mt-6 rounded-lg bg-civic-700 px-4 py-2 text-sm font-semibold text-white hover:bg-civic-600"
          >
            Open BFDP Dashboard
          </button>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">SGLG</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                SGLG dashboard will be added soon.
              </p>
            </div>
            <Badge color="amber">Placeholder</Badge>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Other future reports</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Future report dashboards can be added when table schemas and requirements are
                available.
              </p>
            </div>
            <Badge color="slate">Reserved</Badge>
          </div>
        </Card>
      </section>
    </div>
  )
}
