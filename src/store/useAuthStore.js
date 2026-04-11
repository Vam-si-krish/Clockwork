import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set) => ({
  user:    null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  sendOtp: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  },

  verifyOtp: async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    return { error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

export default useAuthStore
