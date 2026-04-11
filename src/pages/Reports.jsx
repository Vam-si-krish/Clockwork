import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import {
  groupByCompany, totalEarnings, formatCurrency,
  getPeriodBounds, shiftsInPeriod,
} from '../utils/calculations'
import { CheckCircle2, Circle, CheckCheck } from 'lucide-react'

/* ── helpers ── */
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

  const periodShifts  = shiftsInPeriod(shifts, bounds.periodStart, bounds.periodEnd)
  const earned        = totalEarnings(periodShifts)
  const unpaidShifts  = periodShifts.filter(s => !s.paid)
  const paidShifts    = periodShifts.filter(s =>  s.paid)
  const allPaid       = periodShifts.length > 0 && unpaidShifts.length === 0
  const somePaid      = paidShifts.length > 0 && unpaidShifts.length > 0
  const hours         = periodShifts.reduce((a, s) => a + s.hours, 0)

  const now = new Date(); now.setHours(0, 0, 0, 0)
  const isFuture = bounds.periodStart > now

  return (
    <div className={`px-4 py-3.5 ${!isFirst ? 'border-t border-gray-100' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Period label + dates */}
          <p className="text-xs font-semibold text-gray-500 mb-0.5">{label}</p>
          <p className="text-sm font-medium text-gray-900">
            {fmtShort(bounds.periodStart)} – {fmtShort(bounds.periodEnd)}
          </p>
          {periodShifts.length > 0 ? (
            <p className="text-xs text-gray-400 mt-0.5">
              {periodShifts.length} shift{periodShifts.length !== 1 ? 's' : ''} · {hours.toFixed(1)}h
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">No shifts</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* Earnings */}
          <p className={`text-base font-bold ${earned > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
            {formatCurrency(earned)}
          </p>

          {/* Status badge */}
          {periodShifts.length > 0 && (
            allPaid ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Paid
              </span>
            ) : somePaid ? (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Partial
              </span>
            ) : isFirst ? (
              <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                Due {fmtPayday(bounds.payday)}
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                Unpaid
              </span>
            )
          )}

          {/* Mark all paid */}
          {!allPaid && unpaidShifts.length > 0 && (
            <button
              onClick={() => onMarkAllPaid(unpaidShifts.map(s => s.id))}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              <CheckCheck size={12} />
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

  if (companies.length === 0 || shifts.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Earnings by period &amp; client</p>
        </div>
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No shifts to report yet.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Earnings by period &amp; client</p>
      </div>

      <div className="flex flex-col gap-4">
        {companies.map(company => {
          const companyShifts = grouped[company.id] ?? []
          if (companyShifts.length === 0) return null

          const totalHours  = companyShifts.reduce((s, sh) => s + sh.hours, 0)
          const totalPaid   = totalEarnings(companyShifts.filter(s =>  s.paid))
          const totalUnpaid = totalEarnings(companyShifts.filter(s => !s.paid))
          const hasCycle    = company.payCycle && company.payCycle.type !== 'none'

          // Build 3 periods: current + 2 previous
          const periods = hasCycle
            ? [0, -1, -2].map(offset => ({
                label:  PERIOD_LABELS[-offset],
                bounds: getPeriodBounds(company.payCycle, new Date(), offset),
              })).filter(p => p.bounds)
            : []

          return (
            <div
              key={company.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              style={{ borderTopWidth: 3, borderTopColor: company.color }}
            >
              {/* Company header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: company.color }} />
                  <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
                  <span className="text-xs text-gray-400">${company.hourlyRate}/hr</span>
                </div>
                <div className="flex gap-3 text-xs flex-wrap">
                  <span className="text-gray-500">{totalHours.toFixed(1)} hrs total</span>
                  {totalPaid > 0   && <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)} paid</span>}
                  {totalUnpaid > 0 && <span className="font-semibold text-amber-600">{formatCurrency(totalUnpaid)} unpaid</span>}
                </div>
              </div>

              {/* ── Period history ── */}
              {periods.length > 0 && (
                <div className="border-b border-gray-100 bg-gray-50/50">
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

              {/* ── Shift list — mobile ── */}
              <div className="md:hidden divide-y divide-gray-100">
                {companyShifts
                  .slice()
                  .sort((a, b) => {
                    if (a.date !== b.date) return a.date < b.date ? 1 : -1
                    return a.startTime < b.startTime ? 1 : -1
                  })
                  .map(s => (
                    <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{fmtDate(s.date)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.startTime}–{s.endTime} · {s.hours.toFixed(2)}h</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(s.pay)}</p>
                      <button
                        onClick={() => togglePaid(s)}
                        title={s.paid ? 'Mark unpaid' : 'Mark paid'}
                        style={{ color: s.paid ? '#10b981' : '#d1d5db' }}
                        className="flex-shrink-0 p-1"
                      >
                        {s.paid ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>
                    </div>
                  ))}
              </div>

              {/* ── Shift list — desktop ── */}
              <table className="hidden md:table w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Time</th>
                    <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Hours</th>
                    <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Pay</th>
                    <th className="px-5 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Paid?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companyShifts
                    .slice()
                    .sort((a, b) => {
                      if (a.date !== b.date) return a.date < b.date ? 1 : -1
                      return a.startTime < b.startTime ? 1 : -1
                    })
                    .map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-700">
                          {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{s.startTime}–{s.endTime}</td>
                        <td className="px-5 py-3 text-right text-gray-700">{s.hours.toFixed(2)}h</td>
                        <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(s.pay)}</td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => togglePaid(s)}
                            style={{ color: s.paid ? '#10b981' : '#9ca3af' }}
                            title={s.paid ? 'Mark unpaid' : 'Mark paid'}
                          >
                            {s.paid ? <CheckCircle2 size={17} /> : <Circle size={17} />}
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
