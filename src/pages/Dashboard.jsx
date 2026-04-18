import { useMemo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { shiftsThisWeek, shiftsThisMonth, totalEarnings, formatCurrency } from '../utils/calculations'

function StatCard({ label, value, sub, highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        highlight
          ? 'bg-ob-amber/[0.06] border-ob-amber/20'
          : 'bg-ob-surface border-ob-border'
      }`}
    >
      <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em] mb-2.5">
        {label}
      </p>
      <p
        className={`text-xl font-mono font-semibold tabular-nums leading-none ${
          highlight ? 'text-ob-amber' : 'text-ob-text'
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-ob-dim mt-1.5">{sub}</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { shifts }               = useShiftStore()
  const { companies, getCompanyById } = useCompanyStore()

  const weekShifts   = shiftsThisWeek(shifts)
  const monthShifts  = shiftsThisMonth(shifts)
  const weekEarnings  = totalEarnings(weekShifts)
  const monthEarnings = totalEarnings(monthShifts)
  const weekHours     = weekShifts.reduce((s, sh) => s + sh.hours, 0)
  const monthHours    = monthShifts.reduce((s, sh) => s + sh.hours, 0)
  const unpaidShifts  = shifts.filter(s => !s.paid)
  const unpaidTotal   = totalEarnings(unpaidShifts)

  const recentShifts = useMemo(() =>
    [...shifts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6),
    [shifts]
  )

  const today    = new Date()
  const monthStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  const dayStr   = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-4 max-w-2xl">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.18em] mb-1">
            {monthStr}
          </p>
          <h1 className="text-2xl font-syne font-bold text-ob-text leading-tight">
            Dashboard
          </h1>
        </div>
        <p className="text-[11px] font-mono text-ob-dim pt-1">{dayStr}</p>
      </div>

      {/* ── Hero: this month ── */}
      <div className="bg-ob-surface border border-ob-border rounded-2xl p-5">
        <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em] mb-3">
          This month
        </p>
        <p className="text-4xl md:text-5xl font-syne font-bold text-ob-text tabular-nums leading-none">
          {formatCurrency(monthEarnings)}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm font-mono text-ob-muted tabular-nums">
            {monthHours.toFixed(1)} hrs
          </span>
          {companies.length > 0 && (
            <>
              <span className="text-ob-border">·</span>
              <div className="flex items-center gap-1.5">
                {companies.slice(0, 4).map(c => (
                  <span
                    key={c.id}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <span className="text-sm text-ob-muted ml-0.5">
                  {companies.length} {companies.length === 1 ? 'client' : 'clients'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="This week"
          value={formatCurrency(weekEarnings)}
          sub={`${weekHours.toFixed(1)} hrs`}
        />
        <StatCard
          label="Unpaid"
          value={formatCurrency(unpaidTotal)}
          sub={`${unpaidShifts.length} ${unpaidShifts.length === 1 ? 'shift' : 'shifts'}`}
          highlight={unpaidTotal > 0}
        />
        <StatCard
          label="Clients"
          value={companies.length}
          sub={`${shifts.length} total shifts`}
        />
        <StatCard
          label="Week sessions"
          value={weekShifts.length}
          sub={weekShifts.length === 1 ? '1 session logged' : `${weekShifts.length} sessions`}
        />
      </div>

      {/* ── Recent shifts ── */}
      {recentShifts.length > 0 ? (
        <div className="bg-ob-surface border border-ob-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ob-border">
            <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em]">
              Recent shifts
            </p>
            <Link
              to="/shifts"
              className="flex items-center gap-1 text-[10px] font-mono text-ob-amber hover:text-ob-amber/70 transition-colors"
            >
              View all <ArrowUpRight size={10} />
            </Link>
          </div>

          {recentShifts.map((shift, i) => {
            const company = getCompanyById(shift.companyId)
            return (
              <div
                key={shift.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-ob-raised/50 transition-colors ${
                  i < recentShifts.length - 1 ? 'border-b border-ob-border/40' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: company?.color ?? '#4E4E60' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-ob-text font-medium truncate">
                      {company?.name ?? 'Unknown client'}
                    </p>
                    <p className="text-[11px] font-mono text-ob-dim mt-0.5">
                      {shift.date} · {shift.startTime}–{shift.endTime}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-mono text-ob-text tabular-nums">
                    {formatCurrency(shift.pay)}
                  </p>
                  <p className={`text-[10px] font-mono mt-0.5 ${
                    shift.paid ? 'text-ob-green' : 'text-ob-amber'
                  }`}>
                    {shift.paid ? 'PAID' : 'UNPAID'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="bg-ob-surface border border-ob-border rounded-2xl p-10 text-center">
          <p className="text-ob-dim font-mono text-sm">No shifts logged yet</p>
          <Link
            to="/shifts"
            className="mt-3 inline-flex items-center gap-1 text-xs font-mono text-ob-amber hover:text-ob-amber/70 transition-colors"
          >
            Log your first shift <ArrowUpRight size={11} />
          </Link>
        </div>
      )}
    </div>
  )
}
