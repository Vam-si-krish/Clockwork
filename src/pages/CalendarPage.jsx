import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { formatCurrency } from '../utils/calculations'

/* ── react-big-calendar (desktop only) ── */
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
})

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay()       // 0=Sun
  const lead     = (firstDow + 6) % 7                       // shift to Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/* ── Mobile calendar ── */
function MobileCalendar({ shifts, getCompanyById }) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(null)   // 'YYYY-MM-DD'

  const cells = useMemo(() => buildGrid(year, month), [year, month])

  // Map date string → shifts[]
  const shiftsByDate = useMemo(() => {
    const map = {}
    shifts.forEach(s => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [shifts])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  const selectedShifts = selected ? (shiftsByDate[selected] ?? []) : []

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-base font-semibold text-gray-900">{monthLabel}</h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }
            const dateStr  = toDateStr(year, month, day)
            const dayShifts = shiftsByDate[dateStr] ?? []
            const hasShifts = dayShifts.length > 0
            const isToday   = dateStr === todayStr
            const isSel     = dateStr === selected

            // Collect dot colors for this day (up to 3)
            const dotColors = dayShifts
              .slice(0, 3)
              .map(s => getCompanyById(s.companyId)?.color ?? '#9ca3af')

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(isSel ? null : dateStr)}
                className={`aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors relative
                  ${isSel     ? 'bg-brand-600'           : ''}
                  ${isToday && !isSel ? 'bg-brand-50'   : ''}
                  ${!isSel && !isToday ? 'hover:bg-gray-50' : ''}
                `}
              >
                <span className={`text-sm font-medium leading-none
                  ${isSel     ? 'text-white'        : ''}
                  ${isToday && !isSel ? 'text-brand-600 font-bold' : ''}
                  ${!isSel && !isToday ? 'text-gray-800' : ''}
                `}>
                  {day}
                </span>
                {/* Dots for shifts */}
                {hasShifts && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dotColors.map((color, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isSel ? 'rgba(255,255,255,0.8)' : color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day shifts */}
      {selected && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </p>
          {selectedShifts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center text-gray-400 text-sm">
              No shifts on this day
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedShifts.map(s => {
                const company = getCompanyById(s.companyId)
                return (
                  <div
                    key={s.id}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm"
                    style={{ borderLeftWidth: 4, borderLeftColor: company?.color ?? '#9ca3af' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">{company?.name ?? '—'}</p>
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(s.pay)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-400">{s.startTime}–{s.endTime}</p>
                        <p className="text-xs text-gray-400">{s.hours.toFixed(2)}h</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function CalendarPage() {
  const { shifts }         = useShiftStore()
  const { getCompanyById } = useCompanyStore()

  const events = shifts.map(s => {
    const company  = getCompanyById(s.companyId)
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    const base     = new Date(s.date + 'T00:00:00')
    const start    = new Date(base); start.setHours(sh, sm)
    const end      = new Date(base); end.setHours(eh, em)
    if (end <= start) end.setDate(end.getDate() + 1)
    return {
      id: s.id,
      title: `${company?.name ?? '?'} · ${formatCurrency(s.pay)}`,
      start, end,
      resource: { color: company?.color ?? '#6b7280', paid: s.paid },
    }
  })

  const eventPropGetter = (event) => ({
    style: {
      backgroundColor: event.resource.color,
      border: 'none',
      borderRadius: '5px',
      color: '#fff',
      fontSize: '12px',
      padding: '2px 6px',
      opacity: event.resource.paid ? 1 : 0.75,
    },
  })

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your shifts at a glance</p>
      </div>

      {/* Mobile calendar */}
      <div className="md:hidden">
        <MobileCalendar shifts={shifts} getCompanyById={getCompanyById} />
      </div>

      {/* Desktop calendar */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl p-5 shadow-sm" style={{ height: 620 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventPropGetter}
          views={['month', 'week']}
          defaultView="month"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  )
}
