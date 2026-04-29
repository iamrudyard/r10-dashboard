import { useState } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './pages/Overview'
import BFDPDashboard from './pages/BFDPDashboard'
import SGLGPlaceholder from './pages/SGLGPlaceholder'

export default function App() {
  const [activePage, setActivePage] = useState('overview')

  const renderPage = () => {
    if (activePage === 'bfdp') {
      return <BFDPDashboard />
    }

    if (activePage === 'sglg') {
      return <SGLGPlaceholder />
    }

    if (activePage === 'future') {
      return (
        <SGLGPlaceholder
          title="Future Reports"
          message="Future report dashboards will be added when schemas are provided."
        />
      )
    }

    return <Overview onNavigate={setActivePage} />
  }

  return (
    <DashboardLayout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </DashboardLayout>
  )
}
