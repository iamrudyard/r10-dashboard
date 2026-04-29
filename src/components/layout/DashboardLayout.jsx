import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const titles = {
  overview: 'Overview',
  bfdp: 'BFDP Monitoring',
  sglg: 'SGLG Monitoring',
  future: 'Future Reports',
}

export default function DashboardLayout({ activePage, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        activePage={activePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
      />
      <div className="min-w-0 flex-1">
        <Header
          title={titles[activePage] ?? 'Overview'}
          eyebrow="Monitoring workspace"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
