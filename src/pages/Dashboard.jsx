import { Clock, DollarSign, TrendingUp, Briefcase } from 'lucide-react'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { shiftsThisWeek, shiftsThisMonth, totalEarnings, formatCurrency } from '../utils/calculations'
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
  const { companies } = useCompanyStore()

  const weekShifts  = shiftsThisWeek(shifts)
  const monthShifts = shiftsThisMonth(shifts)

  const weekEarnings  = totalEarnings(weekShifts)
  const monthEarnings = totalEarnings(monthShifts)
  const weekHours     = weekShifts.reduce((s, sh) => s + sh.hours, 0)
  const monthHours    = monthShifts.reduce((s, sh) => s + sh.hours, 0)
  const unpaidTotal   = totalEarnings(shifts.filter(s => !s.paid))

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your earnings at a glance</p>
      </div>

      {/* ── Timer (desktop only — mobile uses the FAB) ── */}
      <div className="hidden md:block">
        <TimerWidget />
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3">
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
    </div>
  )
}
