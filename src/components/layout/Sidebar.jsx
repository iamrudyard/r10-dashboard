const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'bfdp', label: 'BFDP' },
  { id: 'sglg', label: 'SGLG' },
  { id: 'future', label: 'Other future reports' },
]

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-civic-900/10 bg-civic-900 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-civic-100">
            LCMS
          </div>
          <div className="mt-2 text-xl font-semibold">LGU Compliance Monitoring System</div>
          <div className="mt-1 text-sm text-civic-100">Read-only compliance dashboard</div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          {navItems.map((item) => {
            const isActive = activePage === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-civic-900 shadow-lg shadow-civic-950/20'
                    : 'text-civic-50 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-6 py-5 text-xs leading-5 text-civic-100">
          Supabase RLS policies should be configured for production access control.
        </div>
      </aside>
    </>
  )
}
