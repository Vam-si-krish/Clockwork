import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Pencil } from 'lucide-react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { formatCurrency, calcHours, calcPay } from '../utils/calculations'

/* ── react-big-calendar localizer ── */
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

/* ── Shared dark input style ── */
const inputCls = 'w-full bg-ob-bg border border-ob-border rounded-xl px-3 py-2.5 text-sm text-ob-text font-mono focus:outline-none focus:border-ob-amber/50 transition-colors'
const labelCls = 'block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1.5'

/* ── Editable shift card inside DaySheet ── */
function ShiftCard({ shift: s, company, companies, getCompanyById, onDelete, onSave }) {
  const [editing, setEditing]     = useState(false)
  const [confirming, setConfirming] = useState(false)
  const confirmTimer                = useRef(null)
  const [form, setForm]           = useState({ companyId: s.companyId, startTime: s.startTime, endTime: s.endTime })

  const handleDelete = () => {
    if (confirming) {
      clearTimeout(confirmTimer.current)
      onDelete()
    } else {
      setConfirming(true)
      confirmTimer.current = setTimeout(() => setConfirming(false), 2500)
    }
  }

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
      <div className="bg-ob-bg border border-ob-border rounded-xl p-3 space-y-2.5">
        <select
          value={form.companyId}
          onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
          className={inputCls}
        >
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="time" value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            className={inputCls} />
          <input type="time" value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            className={inputCls} />
        </div>
        {previewHours !== null && (
          <div className="px-3 py-2 bg-ob-amber/[0.06] border border-ob-amber/20 rounded-xl text-xs text-center font-mono text-ob-amber">
            {previewHours.toFixed(2)} hrs{previewPay !== null && ` · ${formatCurrency(previewPay)}`}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-xs font-semibold rounded-xl transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 bg-ob-raised border border-ob-border text-ob-muted text-xs font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-ob-raised border border-ob-border rounded-xl px-4 py-3.5 flex items-center gap-3"
      style={{ borderLeftWidth: 3, borderLeftColor: company?.color ?? '#4E4E60' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-ob-text text-sm">{company?.name ?? '—'}</p>
          <p className="font-mono font-semibold text-ob-text text-sm tabular-nums">{formatCurrency(s.pay)}</p>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[11px] font-mono text-ob-dim">{s.startTime}–{s.endTime}</p>
          <p className="text-[11px] font-mono text-ob-dim">{s.hours.toFixed(2)}h</p>
        </div>
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 text-ob-dim hover:text-ob-amber rounded-lg transition-colors">
          <Pencil size={13} />
        </button>
        <button
          onClick={handleDelete}
          className={`transition-all rounded-lg ${
            confirming
              ? 'px-2 py-1 text-[10px] font-mono font-bold text-ob-red bg-ob-red/10 border border-ob-red/30'
              : 'p-1.5 text-ob-dim hover:text-ob-red'
          }`}
        >
          {confirming ? 'Sure?' : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  )
}

/* ── Mobile bottom sheet ── */
function DaySheet({ date, shifts, companies, getCompanyById, addShift, deleteShift, updateShift, onClose }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...BLANK, companyId: companies[0]?.id ?? '' })

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

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

  const totalPay = shifts.reduce((s, sh) => s + sh.pay, 0)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-ob-bg/70 backdrop-blur-sm z-[60]" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-ob-surface border-t border-ob-border rounded-t-2xl shadow-2xl max-h-[82vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-8 h-[3px] bg-ob-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ob-border flex-shrink-0">
          <div>
            <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Selected</p>
            <p className="font-syne font-bold text-ob-text text-sm mt-0.5">{label}</p>
          </div>
          <div className="flex items-center gap-2">
            {shifts.length > 0 && (
              <p className="text-sm font-mono font-semibold text-ob-amber tabular-nums">
                {formatCurrency(totalPay)}
              </p>
            )}
            {companies.length > 0 && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus size={12} />
                Log work
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-ob-dim hover:text-ob-text rounded-lg transition-colors">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          {/* Add form */}
          {showForm && (
            <div className="bg-ob-bg border border-ob-border rounded-xl p-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className={labelCls}>Client</label>
                  <select
                    value={form.companyId}
                    onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                    className={inputCls}
                    required
                  >
                    <option value="" disabled>Select…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelCls}>Start</label>
                    <input type="time" value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>End</label>
                    <input type="time" value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className={inputCls} required />
                  </div>
                </div>
                {previewHours !== null && (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-ob-amber/[0.06] border border-ob-amber/20 rounded-xl">
                    <p className="text-sm font-syne font-bold text-ob-text tabular-nums">{previewHours.toFixed(2)} hrs</p>
                    {previewPay !== null && (
                      <p className="text-sm font-syne font-bold text-ob-amber tabular-nums">{formatCurrency(previewPay)}</p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="submit"
                    className="flex-1 py-2.5 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-sm font-semibold rounded-xl transition-colors">
                    Save
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 bg-ob-raised border border-ob-border text-ob-muted text-sm font-medium rounded-xl transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Empty state */}
          {shifts.length === 0 && !showForm && (
            <div className="py-10 text-center">
              <p className="text-ob-dim text-sm font-mono">No shifts on this day</p>
              <p className="text-ob-dim/50 text-xs font-mono mt-1">Tap Log work to add one</p>
            </div>
          )}

          {/* Shift cards */}
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

          <div className="h-20" />
        </div>
      </div>
    </>
  )
}

/* ── Mobile calendar grid ── */
function MobileCalendar() {
  const { shifts, addShift, deleteShift, updateShift } = useShiftStore()
  const { companies, getCompanyById }                  = useCompanyStore()

  const now   = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [selected, setSelected] = useState(null)

  const cells = useMemo(() => buildGrid(year, month), [year, month])

  const { shiftsByDate, earningsByDate, maxMonthEarnings } = useMemo(() => {
    const byDate    = {}
    const earnings  = {}
    shifts.forEach(s => {
      if (!byDate[s.date])   byDate[s.date] = []
      byDate[s.date].push(s)
      earnings[s.date] = (earnings[s.date] ?? 0) + s.pay
    })
    const max = Math.max(...Object.values(earnings), 1)
    return { shiftsByDate: byDate, earningsByDate: earnings, maxMonthEarnings: max }
  }, [shifts])

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())

  const prevMonth = () => {
    setSelected(null)
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setSelected(null)
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }
  const goToday = () => {
    setSelected(null)
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const monthLabel = new Date(year, month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-2 rounded-xl text-ob-dim hover:text-ob-text hover:bg-ob-raised transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <p className="text-sm font-mono font-semibold text-ob-text tracking-wide">{monthLabel}</p>
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="text-[10px] font-mono text-ob-amber hover:text-ob-amber/70 border border-ob-amber/30 px-2 py-0.5 rounded-md transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button onClick={nextMonth} className="p-2 rounded-xl text-ob-dim hover:text-ob-text hover:bg-ob-raised transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-ob-surface border border-ob-border rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-ob-border">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-mono font-semibold text-ob-dim uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="h-14 border-b border-r border-ob-border/30 last:border-r-0" />

            const dateStr   = toDateStr(year, month, day)
            const dayShifts = shiftsByDate[dateStr] ?? []
            const dayPay    = earningsByDate[dateStr] ?? 0
            const isToday   = dateStr === todayStr
            const isSel     = dateStr === selected
            const dotColors = dayShifts.slice(0, 3).map(s => getCompanyById(s.companyId)?.color ?? '#4E4E60')

            // Heat-map: amber intensity based on relative earnings this month
            const heatOpacity = dayPay > 0 && !isSel
              ? Math.min(0.05 + (dayPay / maxMonthEarnings) * 0.25, 0.30)
              : 0

            const row  = Math.floor(idx / 7)
            const col  = idx % 7
            const totalRows = Math.ceil(cells.length / 7) - 1

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(isSel ? null : dateStr)}
                className={`relative h-14 w-full flex flex-col items-center justify-center gap-0.5 transition-colors
                  ${row < totalRows ? 'border-b border-ob-border/30' : ''}
                  ${col < 6 ? 'border-r border-ob-border/30' : ''}
                  ${isSel ? 'bg-ob-amber/20' : 'hover:bg-ob-raised'}
                `}
                style={heatOpacity > 0 ? { backgroundColor: `rgba(232,160,32,${heatOpacity})` } : {}}
              >
                {/* Today ring */}
                {isToday && !isSel && (
                  <div className="absolute inset-[6px] rounded-full ring-1 ring-ob-amber/50 pointer-events-none" />
                )}

                <span className={`text-sm font-mono font-medium leading-none z-10 ${
                  isSel             ? 'text-ob-amber font-bold'  :
                  isToday           ? 'text-ob-amber'            :
                  dayShifts.length  ? 'text-ob-text'             :
                                      'text-ob-muted'
                }`}>
                  {day}
                </span>

                {dotColors.length > 0 && (
                  <div className="flex gap-[3px] z-10">
                    {dotColors.map((color, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isSel ? 'rgba(232,160,32,0.7)' : color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail sheet */}
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

/* ── Desktop log / edit modal ── */
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

  const label = (shift ? new Date(shift.date + 'T00:00:00') : date)
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ob-bg/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-ob-surface border border-ob-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ob-border">
          <div>
            <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.15em]">
              {shift ? 'Edit shift' : 'Log work'}
            </p>
            <h3 className="font-syne font-bold text-ob-text text-lg mt-0.5">{label}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-ob-dim hover:text-ob-text hover:bg-ob-raised rounded-xl transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5">
          {companies.length === 0 ? (
            <p className="text-sm text-ob-muted font-mono text-center py-4">Add a client first.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Client</label>
                <div className="relative">
                  <select
                    value={form.companyId}
                    onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                    className="w-full appearance-none bg-ob-raised border border-ob-border rounded-xl px-4 py-3 text-sm text-ob-text font-medium focus:outline-none focus:border-ob-amber/50 transition-colors"
                    required
                  >
                    <option value="" disabled>Select…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>End</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className={inputCls} required />
                </div>
              </div>

              {previewHours !== null && (
                <div className="flex items-center justify-between px-4 py-3 bg-ob-bg border border-ob-border rounded-xl">
                  <div>
                    <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1">Duration</p>
                    <p className="text-xl font-syne font-bold text-ob-text tabular-nums">{previewHours.toFixed(2)} hrs</p>
                  </div>
                  {previewPay !== null && (
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1">Earnings</p>
                      <p className="text-xl font-syne font-bold text-ob-amber tabular-nums">{formatCurrency(previewPay)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit"
                  className="flex-1 py-3 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-sm font-semibold rounded-xl transition-colors">
                  {shift ? 'Save changes' : 'Save shift'}
                </button>
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 bg-ob-raised border border-ob-border hover:border-ob-dim text-ob-muted hover:text-ob-text text-sm font-medium rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Custom compact event pill for month view ── */
function CalendarEvent({ event }) {
  const color = event.resource.color
  const paid  = event.resource.paid
  return (
    <div
      className="flex items-center gap-1 w-full overflow-hidden group/ev"
      style={{ opacity: paid ? 1 : 0.6 }}
    >
      {/* Colored dot */}
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {/* Label */}
      <span
        className="text-[10px] font-mono truncate leading-none"
        style={{ color: 'var(--ob-muted)' }}
      >
        {event.title}
      </span>
    </div>
  )
}

/* ── Page ── */
export default function CalendarPage() {
  const { shifts }         = useShiftStore()
  const { getCompanyById } = useCompanyStore()
  const [modalDate,  setModalDate]  = useState(null)
  const [editShift,  setEditShift]  = useState(null)

  const events = shifts.flatMap(s => {
    const company  = getCompanyById(s.companyId)
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    const base     = new Date(s.date + 'T00:00:00')
    const start    = new Date(base); start.setHours(sh, sm, 0, 0)
    const end      = new Date(base); end.setHours(eh, em, 0, 0)

    const meta  = { color: company?.color ?? '#4E4E60', paid: s.paid }
    const title = `${company?.name ?? '?'} · ${formatCurrency(s.pay)}`

    if (end <= start) {
      const midnight    = new Date(base); midnight.setHours(23, 59, 59, 999)
      const nextMorning = new Date(base); nextMorning.setDate(nextMorning.getDate() + 1); nextMorning.setHours(0, 0, 0, 0)
      const nextEnd     = new Date(base); nextEnd.setDate(nextEnd.getDate() + 1); nextEnd.setHours(eh, em, 0, 0)
      return [
        { id: s.id + '-a', title,                                    start, end: midnight,           resource: meta },
        { id: s.id + '-b', title: `${company?.name ?? '?'} (cont.)`, start: nextMorning, end: nextEnd, resource: meta },
      ]
    }
    return [{ id: s.id, title, start, end, resource: meta }]
  })

  // Month view: transparent container — CalendarEvent handles all styling
  // Week view: keep colored block (rbc-time-view CSS override keeps it styled)
  const eventPropGetter = (event) => ({
    style: {
      backgroundColor: event.resource.color,
      border:          'none',
      borderRadius:    '3px',
      opacity:         event.resource.paid ? 1 : 0.7,
    },
  })

  return (
    <div>
      {/* Page header */}
      <div className="mb-5">
        <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.18em] mb-1">Overview</p>
        <h1 className="text-2xl font-syne font-bold text-ob-text">Calendar</h1>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileCalendar />
      </div>

      {/* Desktop */}
      <div
        className="hidden md:block bg-ob-surface border border-ob-border rounded-2xl overflow-hidden"
        style={{ height: 640 }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventPropGetter}
          components={{ event: CalendarEvent }}
          views={['month', 'week']}
          defaultView="month"
          style={{ height: '100%', padding: '16px' }}
          selectable
          onSelectSlot={({ start }) => { setEditShift(null); setModalDate(start) }}
          onSelectEvent={event => {
            const s = shifts.find(sh => sh.id === event.id || event.id === sh.id + '-a')
            if (s) { setModalDate(null); setEditShift(s) }
          }}
        />
      </div>

      {/* Desktop modals */}
      {modalDate && !editShift && (
        <DesktopLogModal date={modalDate} shift={null} onClose={() => setModalDate(null)} />
      )}
      {editShift && (
        <DesktopLogModal date={null} shift={editShift} onClose={() => setEditShift(null)} />
      )}
    </div>
  )
}
