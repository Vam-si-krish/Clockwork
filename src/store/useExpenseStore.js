import { create } from 'zustand'
import { supabase } from '../lib/supabase'

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

const toCamel = (e) => ({
  id:          e.id,
  amount:      Number(e.amount),
  category:    e.category,
  description: e.description ?? '',
  merchant:    e.merchant ?? '',
  date:        e.date,
})

const useExpenseStore = create((set) => ({
  expenses: [],

  fetchExpenses: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error) set({ expenses: (data || []).map(toCamel) })
  },

  addExpense: async (expense) => {
    const user_id = await getCurrentUserId()
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id,
        amount:      expense.amount,
        category:    expense.category,
        description: expense.description || null,
        merchant:    expense.merchant || null,
        date:        expense.date,
      })
      .select()
      .single()
    if (!error && data) set((s) => ({ expenses: [toCamel(data), ...s.expenses] }))
  },

  updateExpense: async (id, updates) => {
    const payload = {}
    if (updates.amount      !== undefined) payload.amount      = updates.amount
    if (updates.category    !== undefined) payload.category    = updates.category
    if (updates.description !== undefined) payload.description = updates.description || null
    if (updates.merchant    !== undefined) payload.merchant    = updates.merchant || null
    if (updates.date        !== undefined) payload.date        = updates.date

    const { error } = await supabase.from('expenses').update(payload).eq('id', id)
    if (!error)
      set((s) => ({
        expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }))
  },

  deleteExpense: async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error) set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }))
  },
}))

export default useExpenseStore
