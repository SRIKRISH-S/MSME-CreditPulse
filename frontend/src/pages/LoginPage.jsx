import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/client'
import { Activity, Lock, User, ArrowRight, Mail } from 'lucide-react'

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      try {
        await register(username, email, password)
        setSuccess('Account created successfully! Please sign in.')
        setIsRegister(false)
        setPassword('')
        setConfirmPassword('')
      } catch (err) {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const res = await login(username, password)
        onLogin(res.data.token)
        navigate('/dashboard')
      } catch (err) {
        setError(err.response?.data?.detail || 'Login failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Brand header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl shadow-2xl shadow-gold-500/30 mb-4">
            <Activity className="w-8 h-8 text-navy-900" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CreditPulse
          </h1>
          <p className="text-navy-300 text-sm mt-2">
            MSME Financial Health Assessment Platform
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold-500/50" />
            <span className="text-gold-400 text-xs font-semibold tracking-widest uppercase">IDBI Bank</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold-500/50" />
          </div>
        </div>

        {/* Form card */}
        <div className="card-glass p-8 animate-slide-up">
          <div className="flex justify-between items-baseline mb-6">
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-1">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-navy-500 text-sm">
                {isRegister ? 'Register your RM credentials' : 'Sign in to access your dashboard'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
                setSuccess('')
              }}
              className="text-xs font-semibold text-gold-600 hover:text-gold-700 underline"
            >
              {isRegister ? 'Sign In Instead' : 'Register RM'}
            </button>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-5">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="label">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="login-email" className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="login-confirm-password" className="label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    id="login-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="input-field pl-10"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  {isRegister ? 'Register Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-navy-200">
              <p className="text-xs text-navy-400 text-center">
                Demo credentials: <span className="font-mono font-semibold text-navy-600">admin</span> / <span className="font-mono font-semibold text-navy-600">idbi2026</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-navy-500 text-xs mt-6">
          IDBI Innovate 2026 — Powered by AI
        </p>
      </div>
    </div>
  )
}
