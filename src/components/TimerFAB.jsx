import { useState, useEffect } from 'react'
import { Play, Square, ChevronDown, Check } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import useTimerStore from '../store/useTimerStore'
import useShiftStore from '../store/useShiftStore'
import useCompanyStore from '../store/useCompanyStore'
import { calcHours, calcPay } from '../utils/calculations'

// Pages where the timer bar appears
const ALLOWED = ['/']

function pad(n) { return String(n).padStart(2, '0') }

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

function toHHmm(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

export default function TimerFAB() {
  const location = useLocation()
  const { isRunning, startTime, companyId, startTimer, stopTimer } = useTimerStore()
  const { addShift }                = useShiftStore()
  const { companies, getCompanyById } = useCompanyStore()

  const [elapsed,    setElapsed]    = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedId, setSelectedId] = useState(() => companyId ?? companies[0]?.id ?? '')

  // Only render on allowed pages, and only on mobile
  const visible = ALLOWED.includes(location.pathname)

  useEffect(() => {
    if (!isRunning || !startTime) return
    const tick = () => setElapsed(Date.now() - new Date(startTime).getTime())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isRunning, startTime])

  useEffect(() => {
    if (!selectedId && companies[0]?.id) setSelectedId(companies[0].id)
  }, [companies])

  useEffect(() => {
    if (isRunning && companyId) setSelectedId(companyId)
  }, [isRunning, companyId])

  if (!visible || companies.length === 0) return null

  const displayId     = isRunning ? companyId : selectedId
  const activeCompany = getCompanyById(displayId)

  const handleSelectCompany = (cId) => {
    setShowPicker(false)
    if (isRunning) {
      // Switch client mid-session: stop current, start new
      doStop(cId)
      setTimeout(() => {
        startTimer(cId)
        setElapsed(0)
        setSelectedId(cId)
      }, 50)
    } else {
      setSelectedId(cId)
    }
  }

  const doStop = (nextId) => {
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

  const handleStartStop = () => {
    if (isRunning) {
      doStop()
    } else {
      if (!selectedId) return
      startTimer(selectedId)
      setElapsed(0)
    }
  }

  return (
    <>
      {/* Client picker overlay */}
      {showPicker && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          <div className="md:hidden fixed bottom-[120px] left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <p className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              {isRunning ? 'Switch client' : 'Select client'}
            </p>
            {companies.map(c => {
              const isActive = c.id === displayId
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCompany(c.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className={`flex-1 text-sm text-left ${isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {c.name}
                  </span>
                  <span className="text-xs text-gray-400">${c.hourlyRate}/hr</span>
                  {isActive && <Check size={15} className="text-brand-500 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Timer bar — sits just above the bottom nav */}
      <div className="md:hidden fixed bottom-[62px] left-0 right-0 z-40 px-3 py-2.5 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">

          {/* Client selector */}
          <button
            onClick={() => setShowPicker(p => !p)}
            className="flex items-center gap-2 flex-1 min-w-0 px-3 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeCompany?.color ?? '#9ca3af' }}
            />
            <span className="text-sm font-semibold text-gray-800 truncate flex-1 text-left">
              {activeCompany?.name ?? 'Select client'}
            </span>
            <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
          </button>

          {/* Elapsed time — only while running */}
          {isRunning && (
            <span className="text-sm font-mono font-bold text-gray-700 tabular-nums flex-shrink-0">
              {formatElapsed(elapsed)}
            </span>
          )}

          {/* Start / Stop button — large tap target */}
          <button
            onClick={handleStartStop}
            disabled={!isRunning && !selectedId}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white transition-colors flex-shrink-0 shadow-sm active:scale-95 ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40'
            }`}
          >
            {isRunning
              ? <><Square size={16} fill="currentColor" /> Stop</>
              : <><Play   size={16} fill="currentColor" /> Start</>
            }
          </button>

        </div>
      </div>
    </>
  )
}
