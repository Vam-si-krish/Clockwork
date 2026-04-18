import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Building2,
  ListTodo,
  BarChart2,
  LogOut,
} from 'lucide-react'
import useCompanyStore from '../store/useCompanyStore'
import useShiftStore from '../store/useShiftStore'
import useToDoStore from '../store/useTodoStore'
import useAuthStore from '../store/useAuthStore'
import Logo from './Logo'

const navItems = [
  { to: '/',          label: 'Home',     icon: LayoutDashboard, end: true },
  { to: '/shifts',    label: 'Shifts',   icon: Clock },
  { to: '/calendar',  label: 'Calendar', icon: CalendarDays },
  { to: '/companies', label: 'Clients',  icon: Building2 },
  { to: '/todos',     label: 'Todos',    icon: ListTodo },
  { to: '/reports',   label: 'Reports',  icon: BarChart2 },
]

export default function Layout() {
  const fetchCompanies = useCompanyStore((s) => s.fetchCompanies)
  const fetchShifts    = useShiftStore((s) => s.fetchShifts)
  const fetchTodos     = useToDoStore((s) => s.fetchTodos)
  const { user, signOut } = useAuthStore()

  useEffect(() => {
    fetchCompanies()
    fetchShifts()
    fetchTodos()
  }, [])

  const email = user?.email ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-ob-bg">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-ob-bg border-r border-ob-border flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-ob-border">
          <Logo
            size={26}
            showText
            textClassName="text-lg font-syne font-bold text-ob-amber tracking-tight"
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ob-amber/[0.08] text-ob-amber'
                    : 'text-ob-muted hover:bg-ob-raised hover:text-ob-text'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-ob-border space-y-1">
          <p className="px-3 text-[11px] font-mono text-ob-dim truncate">{email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-ob-dim hover:bg-ob-red/10 hover:text-ob-red transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
          <p className="px-3 pt-1 text-[10px] font-mono text-ob-dim/60">
            Built by{' '}
            <a
              href="https://vamsikrish.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ob-amber transition-colors"
            >
              Vamsi Krishna
            </a>
          </p>
        </div>
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden flex-shrink-0 bg-ob-bg border-b border-ob-border px-4 py-3 flex items-center justify-between">
          <Logo
            size={24}
            showText
            textClassName="text-base font-syne font-bold text-ob-amber tracking-tight"
          />
          <button
            onClick={signOut}
            className="p-2 text-ob-dim hover:text-ob-red rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 main-scroll">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav (mobile only) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex z-50"
        style={{
          backgroundColor: '#141620',
          boxShadow: '0 -1px 0 #252738, 0 -16px 40px rgba(0,0,0,0.7)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-ob-amber' : 'text-ob-dim'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
