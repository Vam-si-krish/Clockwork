import { Clock, DollarSign, TrendingUp, Briefcase } from 'lucide-react'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import {
  shiftsThisWeek,
  shiftsThisMonth,
  totalEarnings,
  formatCurrency,
} from '../utils/calculations'
import TimerWidget from '../components/TimerWidget'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { shifts }                    = useShiftStore()
  const { companies, getCompanyById } = useCompanyStore()

  const weekShifts  = shiftsThisWeek(shifts)
  const monthShifts = shiftsThisMonth(shifts)

  const weekEarnings  = totalEarnings(weekShifts)
  const monthEarnings = totalEarnings(monthShifts)
  const weekHours     = weekShifts.reduce((s, sh) => s + sh.hours, 0)
  const monthHours    = monthShifts.reduce((s, sh) => s + sh.hours, 0)
  const unpaidTotal   = totalEarnings(shifts.filter(s => !s.paid))

  const recent = shifts.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your earnings at a glance</p>
      </div>

      {/* ── Timer ── */}
      <TimerWidget />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={DollarSign}
          label="This week"
          value={formatCurrency(weekEarnings)}
          sub={`${weekHours.toFixed(1)} hrs`}
          color="#0ea5e9"
        />
        <StatCard
          icon={TrendingUp}
          label="This month"
          value={formatCurrency(monthEarnings)}
          sub={`${monthHours.toFixed(1)} hrs`}
          color="#8b5cf6"
        />
        <StatCard
          icon={Clock}
          label="Unpaid"
          value={formatCurrency(unpaidTotal)}
          sub={`${shifts.filter(s => !s.paid).length} shifts`}
          color="#f59e0b"
        />
        <StatCard
          icon={Briefcase}
          label="Clients"
          value={companies.length}
          sub={`${shifts.length} total shifts`}
          color="#10b981"
        />
      </div>

      {/* ── Recent shifts ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Shifts</h3>
        </div>

        {recent.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">
            No shifts yet — tap Shifts to get started.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map(s => {
              const company = getCompanyById(s.companyId)
              return (
                <li key={s.id} className="px-4 py-3.5 flex items-center gap-3">
                  {company && (
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: company.color }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{company?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}{s.startTime}–{s.endTime}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(s.pay)}</p>
                    <p className="text-xs text-gray-400">{s.hours.toFixed(2)}h</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
