import { useState } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import Overview from './pages/Overview'
import BFDPDashboard from './pages/BFDPDashboard'
import LTRPPDashboard from './pages/LTRPPDashboard'
import SKFPDDashboard from './pages/SKFPDDashboard'
import SGLGDashboard from './pages/SGLGDashboard'
import SGLGPlaceholder from './pages/SGLGPlaceholder'

export default function App() {
  const [activePage, setActivePage] = useState('overview')
  const [bfdpInitialFilters, setBfdpInitialFilters] = useState(null)
  const [ltrppInitialFilters, setLtrppInitialFilters] = useState(null)
  const [skfpdInitialFilters, setSkfpdInitialFilters] = useState(null)
  const [sglgInitialFilters, setSglgInitialFilters] = useState(null)

  const handleNavigate = (page, options = {}) => {
    if (page === 'bfdp' && options.filters) {
      setBfdpInitialFilters(options.filters)
    }

    if (page === 'skfpd' && options.filters) {
      setSkfpdInitialFilters(options.filters)
    }

    if (page === 'ltrpp' && options.filters) {
      setLtrppInitialFilters(options.filters)
    }

    if (page === 'sglg' && options.filters) {
      setSglgInitialFilters(options.filters)
    }

    setActivePage(page)
  }

  const renderPage = () => {
    if (activePage === 'bfdp') {
      return <BFDPDashboard initialFilters={bfdpInitialFilters} />
    }

    if (activePage === 'skfpd') {
      return <SKFPDDashboard initialFilters={skfpdInitialFilters} />
    }

    if (activePage === 'ltrpp') {
      return <LTRPPDashboard initialFilters={ltrppInitialFilters} />
    }

    if (activePage === 'sglg') {
      return <SGLGDashboard initialFilters={sglgInitialFilters} />
    }

    if (activePage === 'future') {
      return (
        <SGLGPlaceholder
          title="Future Reports"
          message="Future report dashboards will be added when schemas are provided."
        />
      )
    }

    return <Overview onNavigate={handleNavigate} />
  }

  return (
    <DashboardLayout activePage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </DashboardLayout>
  )
}
