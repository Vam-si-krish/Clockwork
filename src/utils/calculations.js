import { differenceInMinutes, parseISO, startOfWeek, startOfMonth, isWithinInterval, endOfWeek, endOfMonth } from 'date-fns'

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
