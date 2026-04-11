import { useState } from 'react'
import { Plus, Trash2, Clock, AlertCircle, Pencil, CheckCircle2, Circle } from 'lucide-react'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { calcHours, calcPay, formatCurrency } from '../utils/calculations'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const BLANK  = { companyId: '', date: today(), startTime: '', endTime: '' }

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function Shifts() {
  const { shifts, addShift, updateShift, deleteShift, markPaid } = useShiftStore()
  const { companies, getCompanyById }                  = useCompanyStore()

  const [form, setForm]         = useState(BLANK)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [filterCo, setFilterCo] = useState('all')

  const openAdd = () => {
    setForm({ ...BLANK, companyId: companies[0]?.id ?? '' })
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (s) => {
    setForm({ companyId: s.companyId, date: s.date, startTime: s.startTime, endTime: s.endTime })
    setEditId(s.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const close = () => { setShowForm(false); setForm(BLANK); setEditId(null) }

  const previewHours = form.startTime && form.endTime ? calcHours(form.startTime, form.endTime) : null
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
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.startTime < b.startTime ? 1 : -1
    })

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shifts</h2>
          <p className="text-sm text-gray-500 mt-0.5">Log your work sessions</p>
        </div>
        <button
          onClick={openAdd}
          disabled={companies.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors disabled:opacity-40"
        >
          <Plus size={16} />
          Log Shift
        </button>
      </div>

      {companies.length === 0 && (
        <div className="flex items-start gap-3 p-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          Add a client in the Clients tab before logging shifts.
        </div>
      )}

      {/* ── Form (add & edit) ── */}
      {showForm && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {editId ? 'Edit Shift' : 'New Shift'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Client</label>
              <select
                value={form.companyId}
                onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              >
                <option value="" disabled>Select…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Start</label>
                <input type="time" value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">End</label>
                <input type="time" value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required />
              </div>
            </div>

            {previewHours !== null && (
              <div className="px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl text-sm text-center">
                <span className="text-brand-700 font-semibold">{previewHours.toFixed(2)} hrs</span>
                {previewPay !== null && <span className="text-brand-500 ml-2">= {formatCurrency(previewPay)}</span>}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex-1 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors">
                {editId ? 'Save changes' : 'Save shift'}
              </button>
              <button type="button" onClick={close}
                className="flex-1 py-3 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter bar ── */}
      {shifts.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-4 px-4">
          <button onClick={() => setFilterCo('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCo === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            All
          </button>
          {companies.map(c => (
            <button key={c.id} onClick={() => setFilterCo(c.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCo === c.id ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              style={filterCo === c.id ? { backgroundColor: c.color } : {}}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 && companies.length > 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl">
          <Clock size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No shifts logged yet</p>
          <p className="text-gray-400 text-sm mt-1">Tap Log Shift to track a session</p>
        </div>
      )}

      {visible.length > 0 && (
        <>
          {/* ── Mobile cards ── */}
          <div className="md:hidden bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
            {visible.map(s => {
              const company = getCompanyById(s.companyId)
              return (
                <div key={s.id} className="px-4 py-3.5 flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: company?.color ?? '#9ca3af' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{company?.name ?? '—'}</p>
                      <p className="font-semibold text-gray-900 text-sm flex-shrink-0">{formatCurrency(s.pay)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-400">{fmtDate(s.date)} · {s.startTime}–{s.endTime}</p>
                      <p className="text-xs text-gray-400">{s.hours.toFixed(2)}h</p>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <button
                        onClick={() => markPaid(s.id, !s.paid)}
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                          s.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {s.paid ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                        {s.paid ? 'Paid' : 'Unpaid'}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 text-gray-300 hover:text-brand-500 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteShift(s.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Hours</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Pay</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map(s => {
                  const company = getCompanyById(s.companyId)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {company && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: company.color }} />}
                          <span className="font-medium text-gray-900">{company?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{fmtDate(s.date)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{s.startTime} – {s.endTime}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-gray-900">{s.hours.toFixed(2)}h</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(s.pay)}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => markPaid(s.id, !s.paid)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            s.paid ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                          {s.paid ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                          {s.paid ? 'Paid' : 'Unpaid'}
                        </button>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(s)}
                            className="p-1.5 text-gray-300 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteShift(s.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
