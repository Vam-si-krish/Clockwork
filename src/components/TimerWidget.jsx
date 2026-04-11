import { useState, useEffect } from 'react'
import { Play, Square } from 'lucide-react'
import useTimerStore from '../store/useTimerStore'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { calcHours, calcPay } from '../utils/calculations'

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

  // Keep selector in sync if companies load after mount
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
      const dateStr  = start.toISOString().slice(0, 10)
      const hours    = calcHours(startStr, endStr)
      const pay      = calcPay(hours, company.hourlyRate)
      addShift({ companyId, date: dateStr, startTime: startStr, endTime: endStr, hours, pay, hourlyRate: company.hourlyRate })
    }
    stopTimer()
    setElapsed(0)
  }

  if (companies.length === 0) return null

  return (
    <div
      className="mb-6 rounded-2xl border p-4 shadow-sm"
      style={{
        backgroundColor: activeCompany ? `${activeCompany.color}10` : '#f8fafc',
        borderColor:     activeCompany ? `${activeCompany.color}40` : '#e2e8f0',
      }}
    >
      {/* Elapsed time — big and central */}
      <div className="text-center mb-4">
        {isRunning ? (
          <>
            <p className="text-5xl font-mono font-bold tracking-widest text-gray-900 tabular-nums">
              {formatElapsed(elapsed)}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              Started {toHHmm(new Date(startTime))}
              {activeCompany && ` · ${activeCompany.name}`}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400 py-2">Select a client and tap Start</p>
        )}
      </div>

      {/* Company selector + button row */}
      <div className="flex gap-3 items-center">
        <select
          value={isRunning ? companyId : selectedCompanyId}
          onChange={e => setSelectedCompanyId(e.target.value)}
          disabled={isRunning}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 bg-white"
        >
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {isRunning ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Square size={15} fill="currentColor" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!selectedCompanyId}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
          >
            <Play size={15} fill="currentColor" />
            Start
          </button>
        )}
      </div>
    </div>
  )
}
