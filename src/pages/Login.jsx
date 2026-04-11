import { useState } from 'react'
import { Mail, Send, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import Logo from '../components/Logo'

export default function Login() {
  const { sendOtp, verifyOtp } = useAuthStore()
  const [email, setEmail]     = useState('')
  const [code, setCode]       = useState('')
  const [step, setStep]       = useState('email') // 'email' | 'code'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await sendOtp(email.trim())
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('code')
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await verifyOtp(email.trim(), code.trim())
    setLoading(false)
    if (error) { setError(error.message); return }
    // onAuthStateChange in useAuthStore will set user → App redirects to /
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size={56} />
          </div>
          <h1 className="text-3xl font-bold text-brand-600 tracking-tight mb-2">Clockwork</h1>
          <p className="text-gray-500 text-sm">Track your freelance time &amp; earnings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {step === 'email' ? (
            <>
              <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl mx-auto mb-5">
                <Mail size={22} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Sign in</h2>
              <p className="text-sm text-gray-400 text-center mb-6">
                Enter your email — we'll send a 6-digit code.
              </p>

              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                  required
                />

                {error && <p className="text-xs text-red-500 px-1">{error}</p>}

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
                      Send code
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl mx-auto mb-5">
                <Mail size={22} className="text-brand-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Enter your code</h2>
              <p className="text-sm text-gray-400 text-center mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-sm font-medium text-gray-800 text-center mb-6">{email}</p>

              <form onSubmit={handleVerify} className="flex flex-col gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                  required
                />

                {error && <p className="text-xs text-red-500 px-1">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight size={15} />
                      Verify & sign in
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError('') }}
                  className="text-xs text-brand-600 hover:underline text-center"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Your data is private and only visible to you.
        </p>
        <p className="text-center text-xs text-gray-300 mt-2">
          Built by{' '}
          <a
            href="https://vamsikrish.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-brand-500 transition-colors"
          >
            Vamsi Krishna
          </a>
        </p>
      </div>
    </div>
  )
}
