import { parseISO, startOfWeek, startOfMonth, isWithinInterval, endOfWeek, endOfMonth } from 'date-fns'

export const EXPENSE_CATEGORIES = [
  { id: 'food',          label: 'Food',        color: '#F97316' },
  { id: 'transport',     label: 'Transport',   color: '#3B82F6' },
  { id: 'bills',         label: 'Bills',       color: '#8B5CF6' },
  { id: 'shopping',      label: 'Shopping',    color: '#EC4899' },
  { id: 'entertainment', label: 'Fun',         color: '#14B8A6' },
  { id: 'health',        label: 'Health',      color: '#4ADE80' },
  { id: 'education',     label: 'Education',   color: '#FBBF24' },
  { id: 'other',         label: 'Other',       color: '#6B7280' },
]

export function getCategoryMeta(id) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
}

/**
 * Calculate hours worked from start/end time strings (HH:mm) on a given date.
 */
export function calcHours(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMins = sh * 60 + sm
  let endMins = eh * 60 + em
  if (endMins < startMins) endMins += 24 * 60 // overnight shift
  return (endMins - startMins) / 60
}

/**
 * Calculate gross pay for a shift.
 */
export function calcPay(hours, hourlyRate) {
  return hours * hourlyRate
}

/**
 * Sum earnings from an array of shifts, each with { hours, hourlyRate }.
 */
export function totalEarnings(shifts) {
  return shifts.reduce((sum, s) => sum + calcPay(s.hours, s.hourlyRate), 0)
}

/**
 * Filter shifts to those within the current week.
 */
export function shiftsThisWeek(shifts, now = new Date()) {
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })
  return shifts.filter((s) => {
    const d = parseISO(s.date)
    return isWithinInterval(d, { start, end })
  })
}

/**
 * Filter shifts to those within the current month.
 */
export function shiftsThisMonth(shifts, now = new Date()) {
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  return shifts.filter((s) => {
    const d = parseISO(s.date)
    return isWithinInterval(d, { start, end })
  })
}

/**
 * Group shifts by companyId, returning { companyId: shifts[] }.
 */
export function groupByCompany(shifts) {
  return shifts.reduce((acc, shift) => {
    if (!acc[shift.companyId]) acc[shift.companyId] = []
    acc[shift.companyId].push(shift)
    return acc
  }, {})
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

/**
 * Given a payCycle config and a reference date (default: today),
 * returns { periodStart, periodEnd, payday } for the current pay period.
 *
 * payCycle shape:
 *   { type: 'weekly', weekStartDay: 0–6 }          0=Sun … 6=Sat
 *   { type: 'every_n_days', periodDays: N, anchorDate: 'YYYY-MM-DD' }
 */
/**
 * Returns { periodStart, periodEnd, payday } for a given pay cycle.
 * offset: 0 = current period, -1 = previous, -2 = two ago
 */
export function getPeriodBounds(payCycle, now = new Date(), offset = 0) {
  if (!payCycle || payCycle.type === 'none') return null

  if (payCycle.type === 'weekly') {
    const startDay = payCycle.weekStartDay ?? 1
    const todayDay = now.getDay()
    const diff = (todayDay - startDay + 7) % 7
    const periodStart = new Date(now)
    periodStart.setDate(now.getDate() - diff + offset * 7)
    periodStart.setHours(0, 0, 0, 0)
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodStart.getDate() + 6)
    periodEnd.setHours(23, 59, 59, 999)
    const payday = new Date(periodStart)
    payday.setDate(periodStart.getDate() + 7)
    return { periodStart, periodEnd, payday }
  }

  if (payCycle.type === 'every_n_days') {
    const anchor = new Date(payCycle.anchorDate + 'T00:00:00')
    const n = payCycle.periodDays ?? 14
    const MS_DAY = 1000 * 60 * 60 * 24
    const daysDiff = Math.floor((now - anchor) / MS_DAY)
    const currentPeriod = daysDiff < 0 ? 0 : Math.floor(daysDiff / n)
    const target = currentPeriod + offset
    if (target < 0) return null
    const periodStart = new Date(anchor)
    periodStart.setDate(anchor.getDate() + target * n)
    periodStart.setHours(0, 0, 0, 0)
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodStart.getDate() + n - 1)
    periodEnd.setHours(23, 59, 59, 999)
    const payday = new Date(periodStart)
    payday.setDate(periodStart.getDate() + n)
    return { periodStart, periodEnd, payday }
  }

  return null
}

export function expensesThisWeek(expenses, now = new Date()) {
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end   = endOfWeek(now,   { weekStartsOn: 1 })
  return expenses.filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
}

export function expensesThisMonth(expenses, now = new Date()) {
  const start = startOfMonth(now)
  const end   = endOfMonth(now)
  return expenses.filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
}

export function totalSpent(expenses) {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export function groupByCategory(expenses) {
  return expenses.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = []
    acc[e.category].push(e)
    return acc
  }, {})
}

/**
 * Filter shifts whose date falls within [periodStart, periodEnd].
 */
export function shiftsInPeriod(shifts, periodStart, periodEnd) {
  return shifts.filter(s => {
    const d = new Date(s.date + 'T00:00:00')
    return d >= periodStart && d <= periodEnd
  })
}
