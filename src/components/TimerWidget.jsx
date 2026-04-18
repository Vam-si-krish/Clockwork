import { useState, useEffect } from 'react'
import { Play, Square, ChevronDown } from 'lucide-react'
import useTimerStore from '../store/useTimerStore'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { calcHours, calcPay, formatCurrency } from '../utils/calculations'

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatElapsed(ms) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function toHHmm(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function TimerWidget() {
  const { isRunning, startTime, companyId, startTimer, stopTimer } = useTimerStore()
  const { addShift } = useShiftStore()
  const { companies, getCompanyById } = useCompanyStore()

  const [selectedCompanyId, setSelectedCompanyId] = useState(
    () => companyId ?? companies[0]?.id ?? ''
  )
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isRunning || !startTime) return
    const tick = () => setElapsed(Date.now() - new Date(startTime).getTime())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isRunning, startTime])

  useEffect(() => {
    if (isRunning && companyId) setSelectedCompanyId(companyId)
  }, [isRunning, companyId])

  useEffect(() => {
    if (!isRunning && !selectedCompanyId && companies[0]?.id) {
      setSelectedCompanyId(companies[0].id)
    }
  }, [companies])

  const activeCompany = getCompanyById(isRunning ? companyId : selectedCompanyId)

  const handleStart = () => {
    if (!selectedCompanyId) return
    startTimer(selectedCompanyId)
    setElapsed(0)
  }

  const handleStop = () => {
    const start   = new Date(startTime)
    const end     = new Date()
    const company = getCompanyById(companyId)
    if (company) {
      const startStr = toHHmm(start)
      const endStr   = toHHmm(end)
      const dateStr  = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
      const hours    = calcHours(startStr, endStr)
      const pay      = calcPay(hours, company.hourlyRate)
      addShift({ companyId, date: dateStr, startTime: startStr, endTime: endStr, hours, pay, hourlyRate: company.hourlyRate })
    }
    stopTimer()
    setElapsed(0)
  }

  if (companies.length === 0) return null

  // Estimated pay so far
  const elapsedHours = elapsed / 3600000
  const earnedSoFar  = activeCompany ? calcPay(elapsedHours, activeCompany.hourlyRate) : 0

  return (
    <div
      className={`mb-6 rounded-2xl border transition-colors overflow-hidden ${
        isRunning
          ? 'bg-ob-surface border-ob-amber/30'
          : 'bg-ob-surface border-ob-border'
      }`}
    >
      {/* Running indicator bar */}
      {isRunning && (
        <div className="h-0.5 bg-ob-amber/20">
          <div className="h-full bg-ob-amber animate-pulse" style={{ width: '100%' }} />
        </div>
      )}

      <div className="p-4 flex items-center gap-4">
        {/* Company selector */}
        <div className="relative flex-1 min-w-0">
          <select
            value={isRunning ? companyId : selectedCompanyId}
            onChange={e => setSelectedCompanyId(e.target.value)}
            disabled={isRunning}
            className="w-full appearance-none bg-ob-raised border border-ob-border rounded-xl px-3 py-2.5 pr-8 text-sm text-ob-text font-medium focus:outline-none focus:border-ob-amber/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ob-dim pointer-events-none" />
        </div>

        {/* Elapsed time */}
        <div className="text-center flex-shrink-0">
          {isRunning ? (
            <div>
              <p className="text-2xl font-mono font-semibold tabular-nums text-ob-amber leading-none">
                {formatElapsed(elapsed)}
              </p>
              <p className="text-[10px] font-mono text-ob-dim mt-1">
                {formatCurrency(earnedSoFar)} earned
              </p>
            </div>
          ) : (
            <p className="text-sm font-mono text-ob-dim">--:--:--</p>
          )}
        </div>

        {/* Start / Stop */}
        {isRunning ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-5 py-2.5 bg-ob-red/10 border border-ob-red/30 hover:bg-ob-red/20 text-ob-red text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
          >
            <Square size={13} fill="currentColor" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!selectedCompanyId}
            className="flex items-center gap-2 px-5 py-2.5 bg-ob-amber/10 border border-ob-amber/30 hover:bg-ob-amber/20 text-ob-amber text-sm font-semibold rounded-xl transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play size={13} fill="currentColor" />
            Start
          </button>
        )}
      </div>

      {/* Running meta */}
      {isRunning && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: activeCompany?.color ?? '#E8A020' }}
          />
          <p className="text-[11px] font-mono text-ob-dim">
            {activeCompany?.name} · started {toHHmm(new Date(startTime))}
          </p>
        </div>
      )}
    </div>
  )
}
