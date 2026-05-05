export default function Header({ title, eyebrow, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">
              {eyebrow}
            </p>
          ) : null}
          <h1 className={eyebrow ? 'mt-1 text-2xl font-semibold text-slate-950 md:text-3xl' : 'text-2xl font-semibold text-slate-950 md:text-3xl'}>
            {title}
          </h1>
        </div>
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
          aria-label="Open navigation"
        >
          Menu
        </button>
      </div>
    </header>
  )
}
