import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Shifts from './pages/Shifts'
import CalendarPage from './pages/CalendarPage'
import Companies from './pages/Companies'
import Todos from './pages/Todos'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="shifts" element={<Shifts />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="companies" element={<Companies />} />
          <Route path="todos" element={<Todos />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
