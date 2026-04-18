import { Download } from 'lucide-react'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import {
  groupByCompany, totalEarnings, formatCurrency,
  getPeriodBounds, shiftsInPeriod,
} from '../utils/calculations'
import { CheckCircle2, Circle, CheckCheck } from 'lucide-react'

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtPayday(d) {
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const t        = new Date(d);    t.setHours(0, 0, 0, 0)
  if (t.getTime() === today.getTime())    return 'Today'
  if (t.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const PERIOD_LABELS = ['Current period', 'Last period', '2 periods ago']

/* ── Period row ── */
function PeriodRow({ label, bounds, shifts, onMarkAllPaid, isFirst }) {
  if (!bounds) return null

  const periodShifts = shiftsInPeriod(shifts, bounds.periodStart, bounds.periodEnd)
  const earned       = totalEarnings(periodShifts)
  const unpaidShifts = periodShifts.filter(s => !s.paid)
  const paidShifts   = periodShifts.filter(s =>  s.paid)
  const allPaid      = periodShifts.length > 0 && unpaidShifts.length === 0
  const somePaid     = paidShifts.length > 0   && unpaidShifts.length > 0
  const hours        = periodShifts.reduce((a, s) => a + s.hours, 0)

  return (
    <div className={`px-4 py-3.5 ${!isFirst ? 'border-t border-ob-border/40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-0.5">{label}</p>
          <p className="text-sm font-medium text-ob-text">
            {fmtShort(bounds.periodStart)} – {fmtShort(bounds.periodEnd)}
          </p>
          <p className="text-[11px] font-mono text-ob-dim mt-0.5">
            {periodShifts.length > 0
              ? `${periodShifts.length} shift${periodShifts.length !== 1 ? 's' : ''} · ${hours.toFixed(1)}h`
              : 'No shifts'
            }
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <p className={`text-base font-mono font-bold tabular-nums ${earned > 0 ? 'text-ob-text' : 'text-ob-dim'}`}>
            {formatCurrency(earned)}
          </p>

          {periodShifts.length > 0 && (
            allPaid ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-ob-green bg-ob-green/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={9} /> PAID
              </span>
            ) : somePaid ? (
              <span className="text-[10px] font-mono font-medium text-ob-amber bg-ob-amber/10 px-2 py-0.5 rounded-full">
                PARTIAL
              </span>
            ) : isFirst ? (
              <span className="text-[10px] font-mono font-medium text-ob-muted bg-ob-raised px-2 py-0.5 rounded-full border border-ob-border">
                Due {fmtPayday(bounds.payday)}
              </span>
            ) : (
              <span className="text-[10px] font-mono font-medium text-ob-amber bg-ob-amber/10 px-2 py-0.5 rounded-full">
                UNPAID
              </span>
            )
          )}

          {!allPaid && unpaidShifts.length > 0 && (
            <button
              onClick={() => onMarkAllPaid(unpaidShifts.map(s => s.id))}
              className="flex items-center gap-1 text-[10px] font-mono text-ob-amber hover:text-ob-amber/70 transition-colors"
            >
              <CheckCheck size={11} />
              Mark all paid
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */
export default function Reports() {
  const { shifts, markPaid, markManyPaid } = useShiftStore()
  const { companies, getCompanyById }      = useCompanyStore()

  const grouped    = groupByCompany(shifts)
  const togglePaid = (shift) => markPaid(shift.id, !shift.paid)

  const exportCSV = () => {
    const rows = [['Client', 'Date', 'Start', 'End', 'Hours', 'Pay', 'Paid']]
    const sorted = [...shifts].sort((a, b) => a.date < b.date ? 1 : -1)
    sorted.forEach(s => {
      const c = getCompanyById(s.companyId)
      rows.push([
        c?.name ?? 'Unknown',
        s.date,
        s.startTime,
        s.endTime,
        s.hours.toFixed(2),
        s.pay.toFixed(2),
        s.paid ? 'Yes' : 'No',
      ])
    })
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `clockwork-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (companies.length === 0 || shifts.length === 0) {
    return (
      <div>
        <div className="mb-5">
          <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.18em] mb-1">Analytics</p>
          <h1 className="text-2xl font-syne font-bold text-ob-text">Reports</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 bg-ob-surface border border-ob-border rounded-2xl">
          <p className="text-ob-muted font-medium text-sm">No shifts to report yet</p>
          <p className="text-ob-dim text-xs mt-1 font-mono">Log some shifts first</p>
        </div>
      </div>
    )
  }

  const allEarned  = totalEarnings(shifts)
  const allPaid    = totalEarnings(shifts.filter(s => s.paid))
  const allUnpaid  = totalEarnings(shifts.filter(s => !s.paid))
  const paidPct    = allEarned > 0 ? (allPaid / allEarned) * 100 : 0

  return (
    <div className="max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.18em] mb-1">Analytics</p>
          <h1 className="text-2xl font-syne font-bold text-ob-text">Reports</h1>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-ob-surface border border-ob-border hover:border-ob-dim text-ob-muted hover:text-ob-text text-sm font-medium rounded-xl transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* ── Overall summary ── */}
      <div className="bg-ob-surface border border-ob-border rounded-2xl p-5 mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em] mb-1">All time</p>
            <p className="text-3xl font-syne font-bold text-ob-text tabular-nums">{formatCurrency(allEarned)}</p>
          </div>
          <div className="text-right">
            {allPaid > 0   && <p className="text-xs font-mono text-ob-green tabular-nums">{formatCurrency(allPaid)} paid</p>}
            {allUnpaid > 0 && <p className="text-xs font-mono text-ob-amber tabular-nums">{formatCurrency(allUnpaid)} due</p>}
          </div>
        </div>
        {/* Global paid/unpaid bar */}
        <div className="h-1.5 bg-ob-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-ob-green rounded-full transition-all duration-700"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-[9px] font-mono text-ob-dim">0%</p>
          <p className="text-[9px] font-mono text-ob-dim">{paidPct.toFixed(0)}% paid</p>
          <p className="text-[9px] font-mono text-ob-dim">100%</p>
        </div>
      </div>

      {/* ── Per-client cards ── */}
      <div className="flex flex-col gap-4">
        {companies.map(company => {
          const companyShifts = grouped[company.id] ?? []
          if (companyShifts.length === 0) return null

          const totalHours  = companyShifts.reduce((s, sh) => s + sh.hours, 0)
          const totalPaidAmt   = totalEarnings(companyShifts.filter(s =>  s.paid))
          const totalUnpaidAmt = totalEarnings(companyShifts.filter(s => !s.paid))
          const totalAmt    = totalEarnings(companyShifts)
          const coEarnedPct = totalAmt > 0 ? (totalPaidAmt / totalAmt) * 100 : 0
          const hasCycle    = company.payCycle && company.payCycle.type !== 'none'

          const periods = hasCycle
            ? [0, -1, -2].map(offset => ({
                label:  PERIOD_LABELS[-offset],
                bounds: getPeriodBounds(company.payCycle, new Date(), offset),
              })).filter(p => p.bounds)
            : []

          const sortedShifts = companyShifts
            .slice()
            .sort((a, b) => a.date !== b.date ? (a.date < b.date ? 1 : -1) : (a.startTime < b.startTime ? 1 : -1))

          return (
            <div
              key={company.id}
              className="bg-ob-surface border border-ob-border rounded-2xl overflow-hidden"
              style={{ borderTopWidth: 2, borderTopColor: company.color }}
            >
              {/* Client header */}
              <div className="px-5 py-4 border-b border-ob-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: company.color }} />
                    <div>
                      <p className="font-syne font-bold text-ob-text text-sm">{company.name}</p>
                      <p className="text-[11px] font-mono text-ob-dim mt-0.5">${company.hourlyRate}/hr · {totalHours.toFixed(1)}h total</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-mono font-bold text-ob-text tabular-nums">{formatCurrency(totalAmt)}</p>
                    <div className="flex items-center gap-2 justify-end mt-0.5">
                      {totalPaidAmt > 0   && <span className="text-[10px] font-mono text-ob-green">{formatCurrency(totalPaidAmt)} paid</span>}
                      {totalUnpaidAmt > 0 && <span className="text-[10px] font-mono text-ob-amber">{formatCurrency(totalUnpaidAmt)} due</span>}
                    </div>
                  </div>
                </div>

                {/* Paid bar */}
                <div className="h-1 bg-ob-raised rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-ob-green rounded-full transition-all duration-500"
                    style={{ width: `${coEarnedPct}%` }}
                  />
                </div>
              </div>

              {/* Periods */}
              {periods.length > 0 && (
                <div className="border-b border-ob-border bg-ob-bg/30">
                  {periods.map((p, i) => (
                    <PeriodRow
                      key={i}
                      label={p.label}
                      bounds={p.bounds}
                      shifts={companyShifts}
                      isFirst={i === 0}
                      onMarkAllPaid={(ids) => markManyPaid(ids)}
                    />
                  ))}
                </div>
              )}

              {/* Shift list — mobile */}
              <div className="md:hidden divide-y divide-ob-border/40">
                {sortedShifts.map(s => (
                  <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ob-text">{fmtDate(s.date)}</p>
                      <p className="text-[11px] font-mono text-ob-dim mt-0.5">{s.startTime}–{s.endTime} · {s.hours.toFixed(2)}h</p>
                    </div>
                    <p className="text-sm font-mono font-semibold text-ob-text tabular-nums">{formatCurrency(s.pay)}</p>
                    <button
                      onClick={() => togglePaid(s)}
                      title={s.paid ? 'Mark unpaid' : 'Mark paid'}
                      className="flex-shrink-0 p-1 transition-colors"
                      style={{ color: s.paid ? 'var(--ob-green)' : 'var(--ob-border)' }}
                    >
                      {s.paid ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Shift list — desktop */}
              <table className="hidden md:table w-full text-sm">
                <thead className="border-b border-ob-border">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Date</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Time</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Hours</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Pay</th>
                    <th className="px-5 py-2.5 text-center text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedShifts.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`hover:bg-ob-raised/40 transition-colors ${
                        i < sortedShifts.length - 1 ? 'border-b border-ob-border/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-ob-muted text-xs">
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 font-mono text-ob-dim text-xs">{s.startTime}–{s.endTime}</td>
                      <td className="px-5 py-3 text-right font-mono text-ob-muted text-xs tabular-nums">{s.hours.toFixed(2)}h</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-ob-text tabular-nums">{formatCurrency(s.pay)}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => togglePaid(s)}
                          title={s.paid ? 'Mark unpaid' : 'Mark paid'}
                          className="transition-colors"
                          style={{ color: s.paid ? 'var(--ob-green)' : 'var(--ob-border)' }}
                        >
                          {s.paid ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
