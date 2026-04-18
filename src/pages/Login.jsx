import { useState } from 'react'
import { Mail, Send, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import Logo from '../components/Logo'

export default function Login() {
  const { sendOtp, verifyOtp } = useAuthStore()
  const [email, setEmail]     = useState('')
  const [code, setCode]       = useState('')
  const [step, setStep]       = useState('email')
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
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--ob-bg)' }}
    >
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--ob-border) 1px, transparent 1px), linear-gradient(90deg, var(--ob-border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.35,
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={52} />
          </div>
          <h1 className="text-3xl font-syne font-bold tracking-tight mb-2" style={{ color: 'var(--ob-amber)' }}>
            Clockwork
          </h1>
          <p className="text-sm font-mono" style={{ color: 'var(--ob-dim)' }}>
            Track your freelance time &amp; earnings
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--ob-surface)',
            border: '1px solid var(--ob-border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          {step === 'email' ? (
            <>
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(232,160,32,0.1)', border: '1px solid rgba(232,160,32,0.2)' }}
              >
                <Mail size={20} style={{ color: 'var(--ob-amber)' }} />
              </div>

              <h2 className="text-lg font-syne font-bold text-center mb-1" style={{ color: 'var(--ob-text)' }}>
                Sign in
              </h2>
              <p className="text-sm text-center mb-6 font-mono" style={{ color: 'var(--ob-dim)' }}>
                Enter your email — we'll send a 6-digit code.
              </p>

              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-4 py-3 text-sm font-mono focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--ob-raised)',
                    border: '1px solid var(--ob-border)',
                    color: 'var(--ob-text)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(232,160,32,0.5)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--ob-border)' }}
                  autoFocus
                  required
                />

                {error && (
                  <p className="text-xs px-1 font-mono" style={{ color: 'var(--ob-red)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                  style={{
                    backgroundColor: 'rgba(232,160,32,0.1)',
                    border: '1px solid rgba(232,160,32,0.3)',
                    color: 'var(--ob-amber)',
                  }}
                >
                  {loading ? (
                    <div
                      className="w-4 h-4 rounded-full animate-spin"
                      style={{ border: '2px solid rgba(232,160,32,0.3)', borderTopColor: 'var(--ob-amber)' }}
                    />
                  ) : (
                    <>
                      <Send size={14} />
                      Send code
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(232,160,32,0.1)', border: '1px solid rgba(232,160,32,0.2)' }}
              >
                <Mail size={20} style={{ color: 'var(--ob-amber)' }} />
              </div>

              <h2 className="text-lg font-syne font-bold text-center mb-1" style={{ color: 'var(--ob-text)' }}>
                Enter your code
              </h2>
              <p className="text-sm text-center mb-1 font-mono" style={{ color: 'var(--ob-dim)' }}>
                Sent to
              </p>
              <p className="text-sm font-mono font-semibold text-center mb-6" style={{ color: 'var(--ob-muted)' }}>
                {email}
              </p>

              <form onSubmit={handleVerify} className="flex flex-col gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="· · · · · ·"
                  className="w-full rounded-xl px-4 py-3.5 text-center tracking-[0.5em] font-mono text-lg focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--ob-raised)',
                    border: '1px solid var(--ob-border)',
                    color: 'var(--ob-amber)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(232,160,32,0.5)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--ob-border)' }}
                  autoFocus
                  required
                />

                {/* Code length indicator */}
                <div className="flex justify-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-colors duration-150"
                      style={{ backgroundColor: i < code.length ? 'var(--ob-amber)' : 'var(--ob-border)' }}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-xs px-1 font-mono" style={{ color: 'var(--ob-red)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                  style={{
                    backgroundColor: 'rgba(232,160,32,0.1)',
                    border: '1px solid rgba(232,160,32,0.3)',
                    color: 'var(--ob-amber)',
                  }}
                >
                  {loading ? (
                    <div
                      className="w-4 h-4 rounded-full animate-spin"
                      style={{ border: '2px solid rgba(232,160,32,0.3)', borderTopColor: 'var(--ob-amber)' }}
                    />
                  ) : (
                    <>
                      <ArrowRight size={14} />
                      Verify &amp; sign in
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError('') }}
                  className="text-xs text-center font-mono transition-colors"
                  style={{ color: 'var(--ob-dim)' }}
                  onMouseEnter={e => { e.target.style.color = 'var(--ob-muted)' }}
                  onMouseLeave={e => { e.target.style.color = 'var(--ob-dim)' }}
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-5 space-y-1">
          <p className="text-xs font-mono" style={{ color: 'var(--ob-dim)' }}>
            Your data is private and only visible to you.
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--ob-dim)' }}>
            Built by{' '}
            <a
              href="https://vamsikrish.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ob-muted)' }}
              onMouseEnter={e => { e.target.style.color = 'var(--ob-amber)' }}
              onMouseLeave={e => { e.target.style.color = 'var(--ob-muted)' }}
            >
              Vamsi Krishna
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
