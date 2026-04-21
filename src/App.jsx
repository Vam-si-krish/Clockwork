import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Shifts from './pages/Shifts'
import CalendarPage from './pages/CalendarPage'
import Companies from './pages/Companies'
import Todos from './pages/Todos'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ob-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-syne font-bold text-ob-amber mb-3">Clockwork</h1>
        <div className="w-5 h-5 rounded-full animate-spin mx-auto"
          style={{ border: '2px solid rgba(232,160,32,0.2)', borderTopColor: '#E8A020' }} />
      </div>
    </div>
  )
}

// Force a reload exactly once when a new service worker takes control.
// This is the key iOS fix: without this the new SW activates silently but
// the app shell (cached HTML) stays stale until the user manually refreshes.
function useSwUpdateReload() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let reloading = false

    // When a new SW claims this client, reload to get the fresh bundle
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })

    // iOS PWA doesn't background-check for SW updates — trigger a check
    // every time the app comes back to the foreground instead
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then(reg => reg?.update())
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])
}

export default function App() {
  const { user, loading, init } = useAuthStore()

  useSwUpdateReload()
  useEffect(() => { init() }, [])

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*"      element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index           element={<Dashboard />} />
            <Route path="shifts"   element={<Shifts />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="companies" element={<Companies />} />
            <Route path="todos"    element={<Todos />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports"  element={<Reports />} />
            <Route path="*"        element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}
