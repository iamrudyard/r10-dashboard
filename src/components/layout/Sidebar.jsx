const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'sglg', label: 'SGLG' },
  { id: 'bfdp', label: 'BFDP' },
  { id: 'skfpd', label: 'SKFPD' },
  { id: 'ltrpp', label: 'LPTRPP' },
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
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-slate-200 bg-white text-brand-dark transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-200 px-6 py-6">
          <div className="text-xl font-semibold">LGU Compliance Monitoring System (LCMS)</div>
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
                className={`w-full rounded-full px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/20'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

      </aside>
    </>
  )
}
