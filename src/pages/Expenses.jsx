import { useState, useMemo } from 'react'
import { Plus, X, Trash2, Pencil, ArrowUpRight } from 'lucide-react'
import useExpenseStore from '../store/useExpenseStore'
import {
  formatCurrency, expensesThisWeek, expensesThisMonth,
  totalSpent, EXPENSE_CATEGORIES, getCategoryMeta,
} from '../utils/calculations'

const todayStr = () => new Date().toISOString().slice(0, 10)

function formatRelativeDate(dateStr) {
  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  const yesterdayISO = yest.toISOString().slice(0, 10)
  if (dateStr === todayISO)     return 'Today'
  if (dateStr === yesterdayISO) return 'Yesterday'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

/* ── Add / Edit Modal ── */
function ExpenseModal({ expense, onClose, onSave }) {
  const [amount,      setAmount]      = useState(expense?.amount?.toString() ?? '')
  const [category,    setCategory]    = useState(expense?.category ?? 'food')
  const [merchant,    setMerchant]    = useState(expense?.merchant ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [date,        setDate]        = useState(expense?.date ?? todayStr())
  const [saving,      setSaving]      = useState(false)

  const isValid = amount.trim() !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    await onSave({
      amount:      parseFloat(amount),
      category,
      merchant:    merchant.trim(),
      description: description.trim(),
      date,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full md:max-w-md bg-ob-surface border border-ob-border rounded-t-2xl md:rounded-2xl z-10 flex flex-col"
        style={{ maxHeight: '85dvh' }}
      >
        {/* Scrollable inner */}
        <div className="overflow-y-auto p-5 space-y-4" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-syne font-bold text-ob-text">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-ob-dim hover:text-ob-text rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1.5">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ob-muted font-mono text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-ob-bg border border-ob-border rounded-xl pl-7 pr-3 py-2.5 font-mono text-ob-text focus:outline-none focus:border-ob-amber/50 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1.5">
            Category
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-[11px] font-medium transition-all ${
                  category === cat.id
                    ? 'text-ob-text'
                    : 'border-ob-border text-ob-dim hover:border-ob-dim'
                }`}
                style={
                  category === cat.id
                    ? { borderColor: cat.color, backgroundColor: `${cat.color}18` }
                    : {}
                }
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1.5">
            Where <span className="text-ob-dim/50 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Whole Foods"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full bg-ob-bg border border-ob-border rounded-xl px-3 py-2.5 text-ob-text focus:outline-none focus:border-ob-amber/50 text-sm"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1.5">
            Note <span className="text-ob-dim/50 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Groceries for the week"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-ob-bg border border-ob-border rounded-xl px-3 py-2.5 text-ob-text focus:outline-none focus:border-ob-amber/50 text-sm"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em] mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-ob-bg border border-ob-border rounded-xl px-3 py-2.5 font-mono text-ob-text focus:outline-none focus:border-ob-amber/50 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="w-full py-2.5 rounded-xl font-medium text-sm bg-ob-red/10 border border-ob-red/30 text-ob-red hover:bg-ob-red/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}
        </button>
        </div>{/* end scrollable inner */}
      </div>
    </div>
  )
}

/* ── Page ── */
export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenseStore()
  const [showModal,      setShowModal]      = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [filterCat,      setFilterCat]      = useState(null)

  const filtered = useMemo(
    () => (filterCat ? expenses.filter((e) => e.category === filterCat) : expenses),
    [expenses, filterCat],
  )

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = []
      groups[e.date].push(e)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const monthExpenses = expensesThisMonth(expenses)
  const weekExpenses  = expensesThisWeek(expenses)
  const monthTotal    = totalSpent(monthExpenses)
  const weekTotal     = totalSpent(weekExpenses)

  const handleSave = async (data) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data)
    } else {
      await addExpense(data)
    }
    setEditingExpense(null)
  }

  const openEdit = (expense) => {
    setEditingExpense(expense)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingExpense(null)
  }

  const today    = new Date()
  const monthStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] font-mono text-ob-red uppercase tracking-[0.18em] mb-1">
            {monthStr}
          </p>
          <h1 className="text-2xl font-syne font-bold text-ob-text leading-tight">Expenses</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ob-surface border border-ob-border text-ob-muted hover:text-ob-text hover:border-ob-dim text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ob-surface border border-ob-border rounded-xl p-4">
          <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em] mb-2.5">This month</p>
          <p className="text-xl font-mono font-semibold tabular-nums text-ob-red">
            {formatCurrency(monthTotal)}
          </p>
          <p className="text-xs text-ob-dim mt-1.5">
            {monthExpenses.length} expense{monthExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="bg-ob-surface border border-ob-border rounded-xl p-4">
          <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.12em] mb-2.5">This week</p>
          <p className="text-xl font-mono font-semibold tabular-nums text-ob-text">
            {formatCurrency(weekTotal)}
          </p>
          <p className="text-xs text-ob-dim mt-1.5">
            {weekExpenses.length} expense{weekExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setFilterCat(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors ${
            filterCat === null
              ? 'bg-ob-amber/10 border-ob-amber/30 text-ob-amber'
              : 'border-ob-border text-ob-dim hover:border-ob-dim'
          }`}
        >
          All
        </button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors ${
              filterCat === cat.id ? 'text-ob-text' : 'border-ob-border text-ob-dim hover:border-ob-dim'
            }`}
            style={
              filterCat === cat.id
                ? { borderColor: cat.color, backgroundColor: `${cat.color}18` }
                : {}
            }
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {grouped.length === 0 ? (
        <div className="bg-ob-surface border border-ob-border rounded-2xl p-10 text-center">
          <p className="text-ob-dim font-mono text-sm">
            {filterCat ? 'No expenses in this category' : 'No expenses logged yet'}
          </p>
          {!filterCat && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-mono text-ob-red hover:text-ob-red/70 transition-colors"
            >
              <Plus size={11} /> Add your first expense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([dateStr, dayExpenses]) => {
            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0)
            return (
              <div key={dateStr} className="bg-ob-surface border border-ob-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-ob-border">
                  <p className="text-[10px] font-mono text-ob-dim uppercase tracking-[0.1em]">
                    {formatRelativeDate(dateStr)}
                  </p>
                  <p className="text-xs font-mono text-ob-muted tabular-nums">
                    {formatCurrency(dayTotal)}
                  </p>
                </div>

                {dayExpenses.map((expense, i) => {
                  const cat = getCategoryMeta(expense.category)
                  return (
                    <div
                      key={expense.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-ob-raised/40 transition-colors group ${
                        i < dayExpenses.length - 1 ? 'border-b border-ob-border/40' : ''
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ob-text font-medium truncate">
                          {expense.merchant || cat.label}
                        </p>
                        <p className="text-[11px] font-mono text-ob-dim mt-0.5">
                          {expense.merchant ? cat.label : ''}
                          {expense.merchant && expense.description ? ' · ' : ''}
                          {expense.description}
                        </p>
                      </div>

                      <p className="text-sm font-mono font-semibold text-ob-text tabular-nums flex-shrink-0">
                        {formatCurrency(expense.amount)}
                      </p>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-1.5 text-ob-dim hover:text-ob-text rounded-lg transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-1.5 text-ob-dim hover:text-ob-red rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {(showModal || editingExpense) && (
        <ExpenseModal
          expense={editingExpense}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
