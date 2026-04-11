import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useToDoStore = create((set) => ({
  todos: [],

  fetchTodos: async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at')
    if (!error) set({ todos: data || [] })
  },

  addTodo: async (text) => {
    const { data, error } = await supabase
      .from('todos')
      .insert({ text, completed: false })
      .select()
      .single()
    if (!error && data) set((s) => ({ todos: [...s.todos, data] }))
  },

  toggleTodo: async (id) => {
    const todo = useToDoStore.getState().todos.find((t) => t.id === id)
    if (!todo) return
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id)
    if (!error)
      set((s) => ({
        todos: s.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      }))
  },

  deleteTodo: async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (!error) set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
  },
}))

export default useToDoStore
