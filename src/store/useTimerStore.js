import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useTimerStore = create(
  persist(
    (set) => ({
      isRunning: false,
      startTime: null,   // ISO string — when the timer was started
      companyId: null,

      startTimer: (companyId) =>
        set({ isRunning: true, startTime: new Date().toISOString(), companyId }),

      stopTimer: () =>
        set({ isRunning: false, startTime: null, companyId: null }),
    }),
    { name: 'clockwork-timer' }
  )
)

export default useTimerStore
