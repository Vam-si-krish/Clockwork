import { useState, useRef } from 'react'
import { Plus, Trash2, Clock, Pencil, CheckCircle2, Circle, X, AlertTriangle } from 'lucide-react'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { calcHours, calcPay, totalEarnings, formatCurrency } from '../utils/calculations'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const BLANK = { companyId: '', date: todayStr(), startTime: '', endTime: '' }

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// Visual bar: where in the 24h day does this shift sit?
function TimeBar({ startTime, endTime, color }) {
  if (!startTime || !endTime) return null
  const toMins   = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const start    = toMins(startTime)
  const end      = toMins(endTime)
  const total    = 1440
  const overnight = end < start
  const leftPct  = (start / total) * 100
  const widthPct = overnight
    ? ((total - start + end) / total) * 100
    : Math.max(((end - start) / total) * 100, 1.5)

  return (
    <div className="relative h-[3px] bg-ob-raised rounded-full w-20 flex-shrink-0">
      <div
        className="absolute top-0 h-full rounded-full"
        style={{
          left:  `${leftPct}%`,
          width: `${Math.min(widthPct, 100 - leftPct)}%`,
          backgroundColor: color,
          opacity: 0.9,
        }}
      />
    </div>
  )
}

// Paid / Unpaid toggle badge
function PaidBadge({ paid, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium transition-colors ${
        paid
          ? 'bg-ob-green/10 text-ob-green hover:bg-ob-green/20'
          : 'bg-ob-amber/10 text-ob-amber hover:bg-ob-amber/20'
      }`}
    >
      {paid ? <CheckCircle2 size={10} /> : <Circle size={10} />}
      {paid ? 'PAID' : 'UNPAID'}
    </button>
  )
}

export default function Shifts() {
  const { shifts, addShift, updateShift, deleteShift, markPaid } = useShiftStore()
  const { companies, getCompanyById }                            = useCompanyStore()

  const [form, setForm]         = useState(BLANK)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [filterCo, setFilterCo] = useState('all')
  const [confirmId, setConfirmId] = useState(null)
  const confirmTimer = useRef(null)

  const requestDelete = (id) => {
    if (confirmId === id) {
      clearTimeout(confirmTimer.current)
      setConfirmId(null)
      deleteShift(id)
    } else {
      clearTimeout(confirmTimer.current)
      setConfirmId(id)
      confirmTimer.current = setTimeout(() => setConfirmId(null), 2500)
    }
  }

  const openAdd = () => {
    setForm({ ...BLANK, companyId: companies[0]?.id ?? '' })
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (s) => {
    setForm({ companyId: s.companyId, date: s.date, startTime: s.startTime, endTime: s.endTime })
    setEditId(s.id)
    setShowForm(true)
  }

  const close = () => { setShowForm(false); setForm(BLANK); setEditId(null) }

  const previewHours = form.startTime && form.endTime
    ? calcHours(form.startTime, form.endTime) : null
  const previewPay   = previewHours !== null && form.companyId
    ? calcPay(previewHours, getCompanyById(form.companyId)?.hourlyRate ?? 0) : null

  const handleSubmit = (e) => {
    e.preventDefault()
    const company = getCompanyById(form.companyId)
    if (!company) return
    const hours = calcHours(form.startTime, form.endTime)
    const pay   = calcPay(hours, company.hourlyRate)
    if (editId) {
      updateShift(editId, { ...form, hours, pay, hourlyRate: company.hourlyRate })
    } else {
      addShift({ ...form, hours, pay, hourlyRate: company.hourlyRate })
    }
    close()
  }

  const visible = shifts
    .filter(s => filterCo === 'all' || s.companyId === filterCo)
    .slice()
    .sort((a, b) => a.date !== b.date ? (a.date < b.date ? 1 : -1) : (a.startTime < b.startTime ? 1 : -1))

  const visibleEarnings = totalEarnings(visible)

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.18em] mb-1">Work log</p>
          <h1 className="text-2xl font-syne font-bold text-ob-text">Shifts</h1>
        </div>
        <button
          onClick={openAdd}
          disabled={companies.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-sm font-semibold rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={15} />
          Log Shift
        </button>
      </div>

      {/* ── No clients warning ── */}
      {companies.length === 0 && (
        <div className="flex items-start gap-3 p-4 mb-5 bg-ob-amber/[0.06] border border-ob-amber/20 rounded-xl text-ob-amber text-sm">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          Add a client in the Clients tab before logging shifts.
        </div>
      )}

      {/* ── Filter bar ── */}
      {shifts.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setFilterCo('all')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              filterCo === 'all'
                ? 'bg-ob-text text-ob-bg'
                : 'bg-ob-surface border border-ob-border text-ob-muted hover:text-ob-text hover:border-ob-dim'
            }`}
          >
            All
            <span className={`text-[10px] ${filterCo === 'all' ? 'text-ob-dim' : 'text-ob-dim'}`}>
              {shifts.length}
            </span>
          </button>
          {companies.map(c => {
            const count = shifts.filter(s => s.companyId === c.id).length
            return (
              <button
                key={c.id}
                onClick={() => setFilterCo(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  filterCo === c.id
                    ? 'text-ob-bg'
                    : 'bg-ob-surface border border-ob-border text-ob-muted hover:text-ob-text hover:border-ob-dim'
                }`}
                style={filterCo === c.id ? { backgroundColor: c.color } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: filterCo === c.id ? 'rgba(0,0,0,0.35)' : c.color }} />
                {c.name}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Summary strip ── */}
      {visible.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-ob-surface border border-ob-border rounded-xl mb-3">
          <p className="text-[11px] font-mono text-ob-dim">
            {visible.length} {visible.length === 1 ? 'shift' : 'shifts'}
            {filterCo !== 'all' && ` · ${getCompanyById(filterCo)?.name}`}
          </p>
          <p className="text-sm font-mono font-semibold text-ob-text tabular-nums">
            {formatCurrency(visibleEarnings)}
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {visible.length === 0 && companies.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-ob-surface border border-ob-border rounded-2xl">
          <Clock size={32} className="text-ob-border mb-3" />
          <p className="text-ob-muted font-medium text-sm">No shifts logged yet</p>
          <p className="text-ob-dim text-xs mt-1 font-mono">Tap Log Shift to track a session</p>
        </div>
      )}

      {/* ── Mobile cards ── */}
      {visible.length > 0 && (
        <div className="md:hidden bg-ob-surface border border-ob-border rounded-2xl overflow-hidden divide-y divide-ob-border/50">
          {visible.map(s => {
            const company = getCompanyById(s.companyId)
            return (
              <div key={s.id} className="px-4 py-3.5 flex items-start gap-3">
                <div
                  className="w-[3px] self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: company?.color ?? '#4E4E60' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ob-text text-sm truncate">{company?.name ?? '—'}</p>
                    <p className="font-mono font-semibold text-ob-text text-sm flex-shrink-0 tabular-nums">
                      {formatCurrency(s.pay)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] font-mono text-ob-dim">
                      {fmtDate(s.date)} · {s.startTime}–{s.endTime}
                    </p>
                    <p className="text-[11px] font-mono text-ob-muted">{s.hours.toFixed(2)}h</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <PaidBadge paid={s.paid} onToggle={() => markPaid(s.id, !s.paid)} />
                      <TimeBar startTime={s.startTime} endTime={s.endTime} color={company?.color ?? '#E8A020'} />
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-ob-dim hover:text-ob-amber rounded-lg transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => requestDelete(s.id)}
                        className={`transition-all rounded-lg ${
                          confirmId === s.id
                            ? 'px-2 py-1 text-[10px] font-mono font-bold text-ob-red bg-ob-red/10 border border-ob-red/30'
                            : 'p-1.5 text-ob-dim hover:text-ob-red'
                        }`}
                      >
                        {confirmId === s.id ? 'Sure?' : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Desktop table ── */}
      {visible.length > 0 && (
        <div className="hidden md:block bg-ob-surface border border-ob-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ob-border">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Client</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Date</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Time</th>
                <th className="px-5 py-3 text-right text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Hrs</th>
                <th className="px-5 py-3 text-right text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Pay</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => {
                const company = getCompanyById(s.companyId)
                return (
                  <tr
                    key={s.id}
                    className={`group hover:bg-ob-raised/60 transition-colors ${
                      i < visible.length - 1 ? 'border-b border-ob-border/40' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-[3px] h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: company?.color ?? '#4E4E60' }}
                        />
                        <span className="font-medium text-ob-text">{company?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-ob-muted text-xs">{fmtDate(s.date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-ob-muted text-xs">{s.startTime} – {s.endTime}</span>
                        <TimeBar startTime={s.startTime} endTime={s.endTime} color={company?.color ?? '#E8A020'} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-ob-muted text-xs tabular-nums">
                      {s.hours.toFixed(2)}h
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-ob-text tabular-nums">
                      {formatCurrency(s.pay)}
                    </td>
                    <td className="px-5 py-3.5">
                      <PaidBadge paid={s.paid} onToggle={() => markPaid(s.id, !s.paid)} />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-ob-dim hover:text-ob-amber rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => requestDelete(s.id)}
                          className={`transition-all rounded-lg ${
                            confirmId === s.id
                              ? 'px-2 py-1 text-[10px] font-mono font-bold text-ob-red bg-ob-red/10 border border-ob-red/30'
                              : 'p-1.5 text-ob-dim hover:text-ob-red'
                          }`}
                        >
                          {confirmId === s.id ? 'Sure?' : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Slide-in Drawer (add / edit) ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-ob-bg/70 backdrop-blur-sm transition-opacity duration-200 ${
          showForm ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-[60] w-full md:w-[420px] bg-ob-surface border-l border-ob-border flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          showForm ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ob-border flex-shrink-0">
          <div>
            <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.15em]">
              {editId ? 'Editing shift' : 'New shift'}
            </p>
            <h2 className="text-lg font-syne font-bold text-ob-text mt-0.5">
              {editId ? 'Update session' : 'Log work session'}
            </h2>
          </div>
          <button
            onClick={close}
            className="p-2 text-ob-dim hover:text-ob-text hover:bg-ob-raised rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Client */}
          <div>
            <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-2">
              Client
            </label>
            <div className="relative">
              <select
                value={form.companyId}
                onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                className="w-full appearance-none bg-ob-raised border border-ob-border rounded-xl px-4 py-3 text-sm text-ob-text font-medium focus:outline-none focus:border-ob-amber/50 transition-colors"
                required
              >
                <option value="" disabled>Select client…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {/* Color indicator */}
              {form.companyId && (
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{ backgroundColor: getCompanyById(form.companyId)?.color ?? '#4E4E60' }}
                />
              )}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ob-dim pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {form.companyId && (
                <div className="absolute left-[18px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{ backgroundColor: getCompanyById(form.companyId)?.color ?? '#4E4E60' }} />
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-2">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-ob-raised border border-ob-border rounded-xl px-4 py-3 text-sm text-ob-text font-mono focus:outline-none focus:border-ob-amber/50 transition-colors"
              required
            />
          </div>

          {/* Start / End */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-2">
                Start time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full bg-ob-raised border border-ob-border rounded-xl px-4 py-3 text-sm text-ob-text font-mono focus:outline-none focus:border-ob-amber/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-2">
                End time
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full bg-ob-raised border border-ob-border rounded-xl px-4 py-3 text-sm text-ob-text font-mono focus:outline-none focus:border-ob-amber/50 transition-colors"
                required
              />
            </div>
          </div>

          {/* Live preview */}
          {previewHours !== null && (
            <div className="bg-ob-bg border border-ob-border rounded-xl px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1">Duration</p>
                <p className="text-2xl font-syne font-bold text-ob-text tabular-nums">
                  {previewHours.toFixed(2)}
                  <span className="text-sm text-ob-muted font-sans font-normal ml-1">hrs</span>
                </p>
              </div>
              {previewPay !== null && (
                <div className="text-right">
                  <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1">Earnings</p>
                  <p className="text-2xl font-syne font-bold text-ob-amber tabular-nums">
                    {formatCurrency(previewPay)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Time bar preview */}
          {form.startTime && form.endTime && form.companyId && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">Day position</p>
              <div className="relative h-2 bg-ob-raised rounded-full overflow-hidden">
                {(() => {
                  const toMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
                  const start  = toMins(form.startTime)
                  const end    = toMins(form.endTime)
                  const color  = getCompanyById(form.companyId)?.color ?? '#E8A020'
                  const overnight = end < start
                  const leftPct  = (start / 1440) * 100
                  const widthPct = overnight
                    ? ((1440 - start + end) / 1440) * 100
                    : Math.max(((end - start) / 1440) * 100, 1)
                  return (
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{ left: `${leftPct}%`, width: `${Math.min(widthPct, 100 - leftPct)}%`, backgroundColor: color }}
                    />
                  )
                })()}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-ob-dim/60">
                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
              </div>
            </div>
          )}
        </form>

        {/* Drawer footer */}
        <div
          className="px-6 pt-5 border-t border-ob-border flex gap-3 flex-shrink-0"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <button
            type="submit"
            form="shift-form"
            onClick={handleSubmit}
            className="flex-1 py-3 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-sm font-semibold rounded-xl transition-colors"
          >
            {editId ? 'Save changes' : 'Save shift'}
          </button>
          <button
            type="button"
            onClick={close}
            className="flex-1 py-3 bg-ob-raised border border-ob-border hover:border-ob-dim text-ob-muted hover:text-ob-text text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
