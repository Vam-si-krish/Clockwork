import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const toCamel = (s) => ({
  id: s.id,
  companyId: s.company_id,
  date: s.date,
  startTime: s.start_time,
  endTime: s.end_time,
  hours: Number(s.hours),
  pay: Number(s.pay),
  hourlyRate: Number(s.hourly_rate),
  paid: s.paid,
})

const toSnake = (s) => ({
  company_id:  s.companyId,
  date:        s.date,
  start_time:  s.startTime,
  end_time:    s.endTime,
  hours:       s.hours,
  pay:         s.pay,
  hourly_rate: s.hourlyRate,
  paid:        s.paid ?? false,
})

const useShiftStore = create((set) => ({
  shifts: [],

  fetchShifts: async () => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: false })
    if (!error) set({ shifts: (data || []).map(toCamel) })
  },

  addShift: async (shift) => {
    const { data, error } = await supabase
      .from('shifts')
      .insert(toSnake(shift))
      .select()
      .single()
    if (!error && data) set((s) => ({ shifts: [toCamel(data), ...s.shifts] }))
  },

  updateShift: async (id, updates) => {
    const payload = {}
    if (updates.paid      !== undefined) payload.paid       = updates.paid
    if (updates.endTime   !== undefined) payload.end_time   = updates.endTime
    if (updates.startTime !== undefined) payload.start_time = updates.startTime
    if (updates.hours     !== undefined) payload.hours      = updates.hours
    if (updates.pay       !== undefined) payload.pay        = updates.pay

    const { error } = await supabase.from('shifts').update(payload).eq('id', id)
    if (!error)
      set((s) => ({
        shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, ...updates } : sh)),
      }))
  },

  deleteShift: async (id) => {
    const { error } = await supabase.from('shifts').delete().eq('id', id)
    if (!error) set((s) => ({ shifts: s.shifts.filter((sh) => sh.id !== id) }))
  },

  markPaid: async (id, paid = true) => {
    const { error } = await supabase.from('shifts').update({ paid }).eq('id', id)
    if (!error)
      set((s) => ({
        shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, paid } : sh)),
      }))
  },

  markManyPaid: async (ids, paid = true) => {
    if (!ids.length) return
    const { error } = await supabase.from('shifts').update({ paid }).in('id', ids)
    if (!error)
      set((s) => ({
        shifts: s.shifts.map((sh) => (ids.includes(sh.id) ? { ...sh, paid } : sh)),
      }))
  },
}))

export default useShiftStore
