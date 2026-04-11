import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Pencil } from 'lucide-react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { formatCurrency, calcHours, calcPay } from '../utils/calculations'

/* ── react-big-calendar (desktop only) ── */
const localizer = dateFnsLocalizer({
  format, parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
})

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const BLANK    = { companyId: '', startTime: '', endTime: '' }

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildGrid(year, month) {
  const lead        = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells       = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/* ── Editable shift card (used inside DaySheet) ── */
function ShiftCard({ shift: s, company, companies, getCompanyById, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ companyId: s.companyId, startTime: s.startTime, endTime: s.endTime })

  const previewHours = form.startTime && form.endTime ? calcHours(form.startTime, form.endTime) : null
  const previewPay   = previewHours !== null && form.companyId
    ? calcPay(previewHours, getCompanyById(form.companyId)?.hourlyRate ?? 0) : null

  const handleSave = () => {
    const c = getCompanyById(form.companyId)
    if (!c) return
    const hours = calcHours(form.startTime, form.endTime)
    const pay   = calcPay(hours, c.hourlyRate)
    onSave({ ...form, hours, pay, hourlyRate: c.hourlyRate })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
        <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="time" value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <input type="time" value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {previewHours !== null && (
          <div className="text-xs text-center text-brand-600 font-medium">
            {previewHours.toFixed(2)} hrs {previewPay !== null && `= ${formatCurrency(previewPay)}`}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleSave}
            className="flex-1 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl">Save</button>
          <button onClick={() => setEditing(false)}
            className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3"
      style={{ borderLeftWidth: 4, borderLeftColor: company?.color ?? '#9ca3af' }}>
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
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => setEditing(true)}
          className="p-2 text-gray-300 hover:text-brand-500 rounded-lg transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete}
          className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

/* ── Bottom sheet ── */
function DaySheet({ date, shifts, companies, getCompanyById, addShift, deleteShift, updateShift, onClose }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...BLANK, companyId: companies[0]?.id ?? '' })

  // Lock body scroll on iOS while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Reset form when sheet opens for a new date
  useEffect(() => {
    setShowForm(false)
    setForm({ ...BLANK, companyId: companies[0]?.id ?? '' })
  }, [date])

  const previewHours = form.startTime && form.endTime ? calcHours(form.startTime, form.endTime) : null
  const previewPay   = previewHours !== null && form.companyId
    ? calcPay(previewHours, getCompanyById(form.companyId)?.hourlyRate ?? 0) : null

  const handleSubmit = (e) => {
    e.preventDefault()
    const company = getCompanyById(form.companyId)
    if (!company) return
    const hours = calcHours(form.startTime, form.endTime)
    const pay   = calcPay(hours, company.hourlyRate)
    addShift({ companyId: form.companyId, date, startTime: form.startTime, endTime: form.endTime, hours, pay, hourlyRate: company.hourlyRate })
    setShowForm(false)
    setForm({ ...BLANK, companyId: companies[0]?.id ?? '' })
  }

  const label = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <p className="font-semibold text-gray-900 text-sm">{label}</p>
          <div className="flex items-center gap-2">
            {companies.length > 0 && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg"
              >
                <Plus size={13} />
                Log work
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >

          {/* Log form */}
          {showForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Client</label>
                  <select
                    value={form.companyId}
                    onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="" disabled>Select…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Start</label>
                    <input type="time" value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">End</label>
                    <input type="time" value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required />
                  </div>
                </div>

                {previewHours !== null && (
                  <div className="px-3 py-2 bg-brand-50 border border-brand-100 rounded-xl text-sm text-center">
                    <span className="text-brand-700 font-semibold">{previewHours.toFixed(2)} hrs</span>
                    {previewPay !== null && <span className="text-brand-500 ml-2">= {formatCurrency(previewPay)}</span>}
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="submit"
                    className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl">
                    Save
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 text-gray-600 text-sm font-medium rounded-xl border border-gray-200">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shift list */}
          {shifts.length === 0 && !showForm && (
            <div className="py-8 text-center text-gray-400 text-sm">
              No shifts — tap <span className="font-medium text-brand-500">Log work</span> to add one
            </div>
          )}

          {shifts.map(s => (
            <ShiftCard
              key={s.id}
              shift={s}
              company={getCompanyById(s.companyId)}
              companies={companies}
              getCompanyById={getCompanyById}
              onDelete={() => deleteShift(s.id)}
              onSave={(updates) => updateShift(s.id, updates)}
            />
          ))}

          {/* Bottom padding so content clears the nav bar + safe area */}
          <div className="h-20" />
        </div>
      </div>
    </>
  )
}

/* ── Mobile calendar grid ── */
function MobileCalendar() {
  const { shifts, addShift, deleteShift, updateShift } = useShiftStore()
  const { companies, getCompanyById }     = useCompanyStore()

  const today = new Date()
  const [year,     setYear]     = useState(today.getFullYear())
  const [month,    setMonth]    = useState(today.getMonth())
  const [selected, setSelected] = useState(null)

  const cells = useMemo(() => buildGrid(year, month), [year, month])

  const shiftsByDate = useMemo(() => {
    const map = {}
    shifts.forEach(s => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [shifts])

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const prevMonth = () => {
    setSelected(null)
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelected(null)
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-base font-semibold text-gray-900">{monthLabel}</h3>
        <button onClick={nextMonth} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Day cells — fixed height h-12 so tap targets are always rendered */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="h-12" />

            const dateStr   = toDateStr(year, month, day)
            const dayShifts = shiftsByDate[dateStr] ?? []
            const isToday   = dateStr === todayStr
            const isSel     = dateStr === selected
            const dotColors = dayShifts.slice(0, 3).map(s => getCompanyById(s.companyId)?.color ?? '#9ca3af')

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                className={[
                  'h-12 w-full flex flex-col items-center justify-center gap-0.5',
                  isSel               ? 'bg-brand-600'  : '',
                  isToday && !isSel   ? 'bg-brand-50'   : '',
                  !isSel && !isToday  ? 'active:bg-gray-100' : '',
                ].join(' ')}
              >
                <span className={[
                  'text-sm font-medium leading-none',
                  isSel             ? 'text-white'            : '',
                  isToday && !isSel ? 'text-brand-600 font-bold' : '',
                  !isSel && !isToday ? 'text-gray-800'        : '',
                ].join(' ')}>
                  {day}
                </span>
                {dotColors.length > 0 && (
                  <div className="flex gap-0.5">
                    {dotColors.map((color, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isSel ? 'rgba(255,255,255,0.75)' : color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom sheet */}
      {selected && (
        <DaySheet
          date={selected}
          shifts={shiftsByDate[selected] ?? []}
          companies={companies}
          getCompanyById={getCompanyById}
          addShift={addShift}
          deleteShift={deleteShift}
          updateShift={updateShift}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

/* ── Desktop log/edit modal ── */
// shift = existing shift object when editing, null when logging new
function DesktopLogModal({ date, shift, onClose }) {
  const { addShift, updateShift }     = useShiftStore()
  const { companies, getCompanyById } = useCompanyStore()

  const pad    = n => String(n).padStart(2, '0')
  const toHHmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`

  const [form, setForm] = useState(shift ? {
    companyId: shift.companyId,
    startTime: shift.startTime,
    endTime:   shift.endTime,
  } : {
    companyId: companies[0]?.id ?? '',
    startTime: toHHmm(date),
    endTime:   toHHmm(new Date(date.getTime() + 60 * 60 * 1000)),
  })

  const dateStr = shift
    ? shift.date
    : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  const previewHours = form.startTime && form.endTime ? calcHours(form.startTime, form.endTime) : null
  const previewPay   = previewHours !== null && form.companyId
    ? calcPay(previewHours, getCompanyById(form.companyId)?.hourlyRate ?? 0) : null

  const handleSubmit = (e) => {
    e.preventDefault()
    const company = getCompanyById(form.companyId)
    if (!company) return
    const hours = calcHours(form.startTime, form.endTime)
    const pay   = calcPay(hours, company.hourlyRate)
    if (shift) {
      updateShift(shift.id, { ...form, hours, pay, hourlyRate: company.hourlyRate })
    } else {
      addShift({ companyId: form.companyId, date: dateStr, startTime: form.startTime, endTime: form.endTime, hours, pay, hourlyRate: company.hourlyRate })
    }
    onClose()
  }

  const label = (shift
    ? new Date(shift.date + 'T00:00:00')
    : date
  ).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{shift ? 'Edit shift' : 'Log work'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {companies.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Add a client first before logging shifts.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Client</label>
              <select
                value={form.companyId}
                onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              >
                <option value="" disabled>Select…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Start</label>
                <input type="time" value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">End</label>
                <input type="time" value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required />
              </div>
            </div>

            {previewHours !== null && (
              <div className="px-4 py-2.5 bg-brand-50 border border-brand-100 rounded-xl text-sm text-center">
                <span className="text-brand-700 font-semibold">{previewHours.toFixed(2)} hrs</span>
                {previewPay !== null && <span className="text-brand-500 ml-2">= {formatCurrency(previewPay)}</span>}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
                {shift ? 'Save changes' : 'Save shift'}
              </button>
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ── Page ── */
export default function CalendarPage() {
  const { shifts }         = useShiftStore()
  const { getCompanyById } = useCompanyStore()
  const [modalDate, setModalDate]   = useState(null)
  const [editShift, setEditShift]   = useState(null)  // shift object being edited

  const events = shifts.flatMap(s => {
    const company  = getCompanyById(s.companyId)
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    const base     = new Date(s.date + 'T00:00:00')
    const start    = new Date(base); start.setHours(sh, sm, 0, 0)
    const end      = new Date(base); end.setHours(eh, em, 0, 0)

    const meta = { color: company?.color ?? '#6b7280', paid: s.paid }
    const title = `${company?.name ?? '?'} · ${formatCurrency(s.pay)}`

    // Overnight shift — split into two timed events so they stay in the time grid
    if (end <= start) {
      const midnight    = new Date(base); midnight.setHours(23, 59, 59, 999)
      const nextMorning = new Date(base); nextMorning.setDate(nextMorning.getDate() + 1); nextMorning.setHours(0, 0, 0, 0)
      const nextEnd     = new Date(base); nextEnd.setDate(nextEnd.getDate() + 1);         nextEnd.setHours(eh, em, 0, 0)
      return [
        { id: s.id + '-a', title,                                  start, end: midnight,         resource: meta },
        { id: s.id + '-b', title: `${company?.name ?? '?'} (cont.)`, start: nextMorning, end: nextEnd, resource: meta },
      ]
    }

    return [{ id: s.id, title, start, end, resource: meta }]
  })

  const eventPropGetter = (event) => ({
    style: {
      backgroundColor: event.resource.color,
      border: 'none', borderRadius: '5px',
      color: '#fff', fontSize: '12px', padding: '2px 6px',
      opacity: event.resource.paid ? 1 : 0.75,
    },
  })

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your shifts at a glance</p>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileCalendar />
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl p-5 shadow-sm" style={{ height: 620 }}>
        <Calendar
          localizer={localizer} events={events}
          startAccessor="start" endAccessor="end"
          eventPropGetter={eventPropGetter}
          views={['month', 'week']} defaultView="month"
          style={{ height: '100%' }}
          selectable
          onSelectSlot={({ start }) => { setEditShift(null); setModalDate(start) }}
          onSelectEvent={event => {
            const s = shifts.find(sh => sh.id === event.id || event.id === sh.id + '-a')
            if (s) { setModalDate(null); setEditShift(s) }
          }}
        />
      </div>

      {/* Desktop log modal (new shift) */}
      {modalDate && !editShift && (
        <DesktopLogModal date={modalDate} shift={null} onClose={() => setModalDate(null)} />
      )}

      {/* Desktop edit modal (existing shift) */}
      {editShift && (
        <DesktopLogModal date={null} shift={editShift} onClose={() => setEditShift(null)} />
      )}
    </div>
  )
}
