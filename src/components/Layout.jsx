import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Building2,
  ListTodo,
  BarChart2,
} from 'lucide-react'
import useCompanyStore from '../store/useCompanyStore'
import useShiftStore from '../store/useShiftStore'
import useToDoStore from '../store/useTodoStore'

const navItems = [
  { to: '/',          label: 'Home',      icon: LayoutDashboard, end: true },
  { to: '/shifts',    label: 'Shifts',    icon: Clock },
  { to: '/calendar',  label: 'Calendar',  icon: CalendarDays },
  { to: '/companies', label: 'Clients',   icon: Building2 },
  { to: '/todos',     label: 'Todos',     icon: ListTodo },
  { to: '/reports',   label: 'Reports',   icon: BarChart2 },
]

export default function Layout() {
  const fetchCompanies = useCompanyStore((s) => s.fetchCompanies)
  const fetchShifts    = useShiftStore((s) => s.fetchShifts)
  const fetchTodos     = useToDoStore((s) => s.fetchTodos)

  useEffect(() => {
    fetchCompanies()
    fetchShifts()
    fetchTodos()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-white border-r border-gray-200 flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-brand-600 tracking-tight">Clockwork</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3.5">
          <h1 className="text-lg font-bold text-brand-600 tracking-tight">Clockwork</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 safe-area-pb">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`
            }
          >
            <Icon size={21} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
