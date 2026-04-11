import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const toCamel = (c) => ({
  id: c.id,
  name: c.name,
  hourlyRate: Number(c.hourly_rate),
  color: c.color,
})

const useCompanyStore = create((set, get) => ({
  companies: [],

  fetchCompanies: async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at')
    if (!error) set({ companies: (data || []).map(toCamel) })
  },

  addCompany: async (company) => {
    const { data, error } = await supabase
      .from('companies')
      .insert({ name: company.name, hourly_rate: company.hourlyRate, color: company.color })
      .select()
      .single()
    if (!error && data) set((s) => ({ companies: [...s.companies, toCamel(data)] }))
  },

  updateCompany: async (id, updates) => {
    const payload = {}
    if (updates.name       !== undefined) payload.name        = updates.name
    if (updates.hourlyRate !== undefined) payload.hourly_rate = updates.hourlyRate
    if (updates.color      !== undefined) payload.color       = updates.color

    const { error } = await supabase.from('companies').update(payload).eq('id', id)
    if (!error)
      set((s) => ({
        companies: s.companies.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }))
  },

  deleteCompany: async (id) => {
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (!error) set((s) => ({ companies: s.companies.filter((c) => c.id !== id) }))
  },

  getCompanyById: (id) => get().companies.find((c) => c.id === id),
}))

export default useCompanyStore
