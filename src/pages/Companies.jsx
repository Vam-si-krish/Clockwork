import { useState } from 'react'
import { Plus, Pencil, Trash2, Building2, RefreshCw } from 'lucide-react'
import useCompanyStore from '../store/useCompanyStore'

const COLOR_OPTIONS = [
  { label: 'Sky',     value: '#0ea5e9' },
  { label: 'Violet',  value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose',    value: '#f43f5e' },
  { label: 'Amber',   value: '#f59e0b' },
  { label: 'Indigo',  value: '#6366f1' },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const BLANK = {
  name: '', hourlyRate: '', color: COLOR_OPTIONS[0].value,
  cycleType: 'none', weekStartDay: 1, periodDays: 14, anchorDate: today(),
}

function cycleLabel(payCycle) {
  if (!payCycle || payCycle.type === 'none') return null
  if (payCycle.type === 'weekly') return `Weekly · starts ${WEEKDAYS[payCycle.weekStartDay]}`
  if (payCycle.type === 'every_n_days') return `Every ${payCycle.periodDays} days`
  return null
}

export default function Companies() {
  const { companies, addCompany, updateCompany, deleteCompany } = useCompanyStore()
  const [form, setForm]         = useState(BLANK)
  const [editId, setEditId]     = useState(null)
  const [showForm, setShowForm] = useState(false)

  const openAdd = () => {
    setForm({ ...BLANK, anchorDate: today() })
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
      anchorDate:   pc.anchorDate ?? today(),
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

    const payload = {
      name:       form.name.trim(),
      hourlyRate: parseFloat(form.hourlyRate),
      color:      form.color,
      payCycle,
    }
    if (!payload.name || isNaN(payload.hourlyRate)) return
    editId ? updateCompany(editId, payload) : addCompany(payload)
    close()
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage clients &amp; hourly rates</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {editId ? 'Edit Client' : 'New Client'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Client name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Hourly rate ($/hr)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.hourlyRate}
                onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                placeholder="75"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Color tag</label>
              <div className="flex gap-3">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: opt.value }))}
                    className="w-9 h-9 rounded-full transition-transform active:scale-95 focus:outline-none"
                    style={{
                      backgroundColor: opt.value,
                      boxShadow: form.color === opt.value
                        ? `0 0 0 2px white, 0 0 0 4px ${opt.value}`
                        : 'none',
                    }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            {/* ── Pay cycle ── */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Pay cycle</label>
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
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                      form.cycleType === opt.value
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.cycleType === 'weekly' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Pay period starts on</label>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, weekStartDay: i }))}
                        className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                          form.weekStartDay === i
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {d.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Period: {WEEKDAYS[form.weekStartDay]} → {WEEKDAYS[(form.weekStartDay + 6) % 7]} · paid on next {WEEKDAYS[form.weekStartDay]}
                  </p>
                </div>
              )}

              {form.cycleType === 'every_n_days' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Period length (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={form.periodDays}
                      onChange={e => setForm(f => ({ ...f, periodDays: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">First period start date</label>
                    <input
                      type="date"
                      value={form.anchorDate}
                      onChange={e => setForm(f => ({ ...f, anchorDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors"
              >
                {editId ? 'Save changes' : 'Add client'}
              </button>
              <button
                type="button"
                onClick={close}
                className="flex-1 py-3 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Empty state ── */}
      {companies.length === 0 && !showForm && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
          <Building2 size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No clients yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first client to get started</p>
          <button onClick={openAdd} className="mt-4 text-brand-600 text-sm font-medium">
            + Add a client
          </button>
        </div>
      )}

      {/* ── Client list ── */}
      {companies.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {companies.map(c => {
            const label = cycleLabel(c.payCycle)
            return (
              <div
                key={c.id}
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center gap-3 shadow-sm"
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${c.color}22` }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-gray-400">${c.hourlyRate}/hr</p>
                    {label && (
                      <>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="flex items-center gap-1 text-xs text-brand-600">
                          <RefreshCw size={10} />
                          {label}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteCompany(c.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
