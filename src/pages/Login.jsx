import { useState } from 'react'
import { Mail, Send, CheckCircle2 } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'

export default function Login() {
  const { sendMagicLink } = useAuthStore()
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await sendMagicLink(email.trim())
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600 tracking-tight mb-2">Clockwork</h1>
          <p className="text-gray-500 text-sm">Track your freelance time &amp; earnings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {sent ? (
            /* ── Confirmation state ── */
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-1">
                We sent a magic link to
              </p>
              <p className="text-sm font-medium text-gray-800 mb-5">{email}</p>
              <p className="text-xs text-gray-400">
                Tap the link in the email and you'll be signed in instantly.
                You can close this tab.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-5 text-xs text-brand-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* ── Email form ── */
            <>
              <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl mx-auto mb-5">
                <Mail size={22} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Sign in</h2>
              <p className="text-sm text-gray-400 text-center mb-6">
                Enter your email and we'll send you a magic link — no password needed.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                  required
                />

                {error && (
                  <p className="text-xs text-red-500 px-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={15} />
                      Send magic link
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Your data is private and only visible to you.
        </p>
      </div>
    </div>
  )
}
