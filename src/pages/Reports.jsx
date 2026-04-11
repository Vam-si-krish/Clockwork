import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { groupByCompany, totalEarnings, formatCurrency, getPeriodBounds, shiftsInPeriod } from '../utils/calculations'
import { CheckCircle2, Circle, CalendarClock } from 'lucide-react'

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function fmtDay(d) {
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const target   = new Date(d);   target.setHours(0, 0, 0, 0)
  if (target.getTime() === today.getTime())    return 'Today'
  if (target.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtPeriod(start, end) {
  const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = end.toLocaleDateString('en-US',   { month: 'short', day: 'numeric' })
  return `${s} – ${e}`
}

export default function Reports() {
  const { shifts, markPaid }          = useShiftStore()
  const { companies, getCompanyById } = useCompanyStore()

  const grouped    = groupByCompany(shifts)
  const togglePaid = (shift) => markPaid(shift.id, !shift.paid)

  if (companies.length === 0 || shifts.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Earnings by client &amp; pay period</p>
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
        <p className="text-sm text-gray-500 mt-0.5">Earnings by client &amp; pay period</p>
      </div>

      <div className="flex flex-col gap-4">
        {companies.map(company => {
          const companyShifts = grouped[company.id] ?? []
          if (companyShifts.length === 0) return null

          const paidShifts   = companyShifts.filter(s => s.paid)
          const unpaidShifts = companyShifts.filter(s => !s.paid)
          const totalPaid    = totalEarnings(paidShifts)
          const totalUnpaid  = totalEarnings(unpaidShifts)
          const totalHours   = companyShifts.reduce((s, sh) => s + sh.hours, 0)

          // Pay period
          const bounds = getPeriodBounds(company.payCycle)
          const periodShifts   = bounds ? shiftsInPeriod(companyShifts, bounds.periodStart, bounds.periodEnd) : []
          const periodEarnings = totalEarnings(periodShifts)
          const periodUnpaid   = totalEarnings(periodShifts.filter(s => !s.paid))

          return (
            <div
              key={company.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              style={{ borderTopWidth: 3, borderTopColor: company.color }}
            >
              {/* Company header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: company.color }} />
                  <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
                </div>
                <div className="flex gap-3 text-xs flex-wrap">
                  <span className="text-gray-500">{totalHours.toFixed(1)} hrs total</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)} paid</span>
                  {totalUnpaid > 0 && (
                    <span className="font-semibold text-amber-600">{formatCurrency(totalUnpaid)} unpaid</span>
                  )}
                </div>
              </div>

              {/* ── Pay period banner ── */}
              {bounds && (
                <div className="px-4 py-3 bg-brand-50 border-b border-brand-100 flex items-center gap-3">
                  <CalendarClock size={18} className="text-brand-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-700">
                      Current period · {fmtPeriod(bounds.periodStart, bounds.periodEnd)}
                    </p>
                    <p className="text-xs text-brand-500 mt-0.5">
                      {periodShifts.length} shift{periodShifts.length !== 1 ? 's' : ''} · {periodShifts.reduce((s, sh) => s + sh.hours, 0).toFixed(1)}h
                      {periodUnpaid > 0 && ` · ${formatCurrency(periodUnpaid)} unpaid`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-brand-700">{formatCurrency(periodEarnings)}</p>
                    <p className="text-xs text-brand-500">paid {fmtDay(bounds.payday)}</p>
                  </div>
                </div>
              )}

              {/* Shift rows — mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {companyShifts
                  .slice()
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map(s => {
                    const inPeriod = bounds && periodShifts.some(ps => ps.id === s.id)
                    return (
                      <div key={s.id} className={`px-4 py-3 flex items-center gap-3 ${inPeriod ? 'bg-brand-50/40' : ''}`}>
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
                    )
                  })}
              </div>

              {/* Desktop table */}
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
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map(s => {
                      const inPeriod = bounds && periodShifts.some(ps => ps.id === s.id)
                      return (
                        <tr key={s.id} className={`transition-colors ${inPeriod ? 'bg-brand-50/40' : 'hover:bg-gray-50'}`}>
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
                      )
                    })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
