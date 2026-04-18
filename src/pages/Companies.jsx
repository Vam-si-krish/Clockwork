import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Building2, RefreshCw, X } from 'lucide-react'
import useCompanyStore from '../store/useCompanyStore'
import useShiftStore from '../store/useShiftStore'
import { totalEarnings, formatCurrency } from '../utils/calculations'

const COLOR_OPTIONS = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f43f5e',
  '#f59e0b', '#6366f1', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16', '#06b6d4', '#a855f7',
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const BLANK = {
  name: '', hourlyRate: '', color: COLOR_OPTIONS[0],
  cycleType: 'none', weekStartDay: 1, periodDays: 14, anchorDate: todayStr(),
}

function cycleLabel(payCycle) {
  if (!payCycle || payCycle.type === 'none') return null
  if (payCycle.type === 'weekly')       return `Weekly · ${WEEKDAYS[payCycle.weekStartDay]}`
  if (payCycle.type === 'every_n_days') return `Every ${payCycle.periodDays}d`
  return null
}

const inputCls = 'w-full bg-ob-bg border border-ob-border rounded-xl px-4 py-3 text-sm text-ob-text font-medium focus:outline-none focus:border-ob-amber/50 transition-colors'
const labelCls = 'block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1.5'

export default function Companies() {
  const { companies, addCompany, updateCompany, deleteCompany } = useCompanyStore()
  const { shifts } = useShiftStore()

  const [form, setForm]         = useState(BLANK)
  const [editId, setEditId]     = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const confirmTimer = useRef(null)

  const requestDelete = (id) => {
    if (confirmId === id) {
      clearTimeout(confirmTimer.current)
      setConfirmId(null)
      deleteCompany(id)
    } else {
      clearTimeout(confirmTimer.current)
      setConfirmId(id)
      confirmTimer.current = setTimeout(() => setConfirmId(null), 2500)
    }
  }

  const openAdd = () => {
    setForm({ ...BLANK, anchorDate: todayStr() })
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (c) => {
    const pc = c.payCycle ?? {}
    setForm({
      name:         c.name,
      hourlyRate:   String(c.hourlyRate),
      color:        c.color,
      cycleType:    pc.type ?? 'none',
      weekStartDay: pc.weekStartDay ?? 1,
      periodDays:   pc.periodDays ?? 14,
      anchorDate:   pc.anchorDate ?? todayStr(),
    })
    setEditId(c.id)
    setShowForm(true)
  }

  const close = () => { setShowForm(false); setEditId(null); setForm(BLANK) }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payCycle =
      form.cycleType === 'weekly'
        ? { type: 'weekly', weekStartDay: Number(form.weekStartDay) }
      : form.cycleType === 'every_n_days'
        ? { type: 'every_n_days', periodDays: parseInt(form.periodDays), anchorDate: form.anchorDate }
      : null
    const payload = { name: form.name.trim(), hourlyRate: parseFloat(form.hourlyRate), color: form.color, payCycle }
    if (!payload.name || isNaN(payload.hourlyRate)) return
    editId ? updateCompany(editId, payload) : addCompany(payload)
    close()
  }

  return (
    <div className="max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.18em] mb-1">Roster</p>
          <h1 className="text-2xl font-syne font-bold text-ob-text">Clients</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} />
          Add client
        </button>
      </div>

      {/* ── Empty state ── */}
      {companies.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 bg-ob-surface border border-ob-border rounded-2xl">
          <Building2 size={32} className="text-ob-border mb-3" />
          <p className="text-ob-muted font-medium text-sm">No clients yet</p>
          <p className="text-ob-dim text-xs mt-1 font-mono">Add your first client to get started</p>
          <button
            onClick={openAdd}
            className="mt-4 text-xs font-mono text-ob-amber hover:text-ob-amber/70 transition-colors"
          >
            + Add a client
          </button>
        </div>
      )}

      {/* ── Client list ── */}
      {companies.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {companies.map(c => {
            const clientShifts = shifts.filter(s => s.companyId === c.id)
            const earned       = totalEarnings(clientShifts)
            const paid         = totalEarnings(clientShifts.filter(s => s.paid))
            const unpaid       = totalEarnings(clientShifts.filter(s => !s.paid))
            const paidPct      = earned > 0 ? (paid / earned) * 100 : 0
            const label        = cycleLabel(c.payCycle)

            return (
              <div
                key={c.id}
                className="group bg-ob-surface border border-ob-border rounded-2xl overflow-hidden"
                style={{ borderLeftWidth: 3, borderLeftColor: c.color }}
              >
                <div className="px-4 py-4 flex items-center gap-3">
                  {/* Color dot */}
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: `${c.color}18` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-syne font-bold text-ob-text text-sm">{c.name}</p>
                      {label && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-ob-dim border border-ob-border px-1.5 py-0.5 rounded-md">
                          <RefreshCw size={8} />
                          {label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-ob-muted mt-0.5">
                      ${c.hourlyRate}/hr
                      {clientShifts.length > 0 && (
                        <span className="ml-2 text-ob-dim">· {clientShifts.length} shifts</span>
                      )}
                    </p>
                  </div>

                  {/* Earnings */}
                  {earned > 0 && (
                    <div className="text-right flex-shrink-0 mr-1">
                      <p className="text-sm font-mono font-semibold text-ob-text tabular-nums">
                        {formatCurrency(earned)}
                      </p>
                      {unpaid > 0 && (
                        <p className="text-[10px] font-mono text-ob-amber tabular-nums">
                          {formatCurrency(unpaid)} due
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="p-2 text-ob-dim hover:text-ob-amber rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => requestDelete(c.id)}
                      className={`transition-all rounded-lg ${
                        confirmId === c.id
                          ? 'px-2 py-1 text-[10px] font-mono font-bold text-ob-red bg-ob-red/10 border border-ob-red/30'
                          : 'p-2 text-ob-dim hover:text-ob-red'
                      }`}
                    >
                      {confirmId === c.id ? 'Sure?' : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Paid / unpaid bar */}
                {earned > 0 && (
                  <div className="h-[2px] bg-ob-raised mx-4 mb-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ob-green rounded-full transition-all duration-500"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Slide-in Drawer ── */}
      <div
        className={`fixed inset-0 z-[55] bg-ob-bg/70 backdrop-blur-sm transition-opacity duration-200 ${
          showForm ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 z-[60] w-full md:w-[440px] bg-ob-surface border-l border-ob-border flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          showForm ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ob-border flex-shrink-0">
          <div>
            <p className="text-[10px] font-mono text-ob-amber uppercase tracking-[0.15em]">
              {editId ? 'Editing client' : 'New client'}
            </p>
            <h2 className="text-lg font-syne font-bold text-ob-text mt-0.5">
              {editId ? 'Update client' : 'Add client'}
            </h2>
          </div>
          <button onClick={close} className="p-2 text-ob-dim hover:text-ob-text hover:bg-ob-raised rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Name */}
          <div>
            <label className={labelCls}>Client name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Acme Corp"
              className={inputCls}
              required
            />
          </div>

          {/* Rate */}
          <div>
            <label className={labelCls}>Hourly rate</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ob-dim font-mono text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.hourlyRate}
                onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                placeholder="75"
                className={`${inputCls} pl-8`}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ob-dim font-mono text-xs">/hr</span>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className={labelCls}>Color tag</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className="w-full aspect-square rounded-xl transition-transform hover:scale-110 active:scale-95 focus:outline-none relative"
                  style={{ backgroundColor: color }}
                >
                  {form.color === color && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-white/80 ring-offset-1 ring-offset-ob-surface" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pay cycle */}
          <div>
            <label className={labelCls}>Pay cycle</label>
            <div className="flex gap-1.5 mb-3">
              {[
                { value: 'none',        label: 'None' },
                { value: 'weekly',      label: 'Weekly' },
                { value: 'every_n_days', label: 'Every N days' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, cycleType: opt.value }))}
                  className={`flex-1 py-2 text-xs font-mono font-medium rounded-lg transition-colors ${
                    form.cycleType === opt.value
                      ? 'bg-ob-amber/10 border border-ob-amber/30 text-ob-amber'
                      : 'bg-ob-raised border border-ob-border text-ob-muted hover:text-ob-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {form.cycleType === 'weekly' && (
              <div>
                <label className={labelCls}>Period starts on</label>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, weekStartDay: i }))}
                      className={`py-2 text-[10px] font-mono font-medium rounded-lg transition-colors ${
                        form.weekStartDay === i
                          ? 'bg-ob-amber/10 border border-ob-amber/30 text-ob-amber'
                          : 'bg-ob-raised border border-ob-border text-ob-muted hover:text-ob-text'
                      }`}
                    >
                      {d.slice(0, 2)}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-mono text-ob-dim mt-1.5">
                  {WEEKDAYS[form.weekStartDay]} → {WEEKDAYS[(form.weekStartDay + 6) % 7]}
                </p>
              </div>
            )}

            {form.cycleType === 'every_n_days' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelCls}>Period length (days)</label>
                  <input
                    type="number" min="1" max="365"
                    value={form.periodDays}
                    onChange={e => setForm(f => ({ ...f, periodDays: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>First period start date</label>
                  <input
                    type="date"
                    value={form.anchorDate}
                    onChange={e => setForm(f => ({ ...f, anchorDate: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer footer */}
        <div
          className="px-6 pt-5 border-t border-ob-border flex gap-3 flex-shrink-0"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-sm font-semibold rounded-xl transition-colors"
          >
            {editId ? 'Save changes' : 'Add client'}
          </button>
          <button
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
