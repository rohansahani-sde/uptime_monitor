import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect url after successful login
  const redirect = searchParams.get('redirect') || '/dashboard'

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (clientId && window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        })
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'dark', size: 'large', width: '100%' }
        )
      }
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true)
    try {
      await googleLogin(response.credential)
      toast.success('Successfully logged in with Google!')
      navigate(redirect)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      return toast.error('Please fill in all fields')
    }
    setLoading(true)
    try {
      await login({ email, password })
      toast.success('Welcome back!')
      navigate(redirect)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  // Fallback / Development bypass for Google login if client ID is missing
  const handleDevGoogleLogin = async () => {
    setLoading(true)
    try {
      // Mock Google login for development/testing if VITE_GOOGLE_CLIENT_ID is not configured
      // Send a dummy credential
      await googleLogin('mock-google-token-from-frontend')
      toast.success('Logged in with Dev Mock Google Account!')
      navigate(redirect)
    } catch (err) {
      toast.error('Mock Google OAuth failed. Make sure mock mode is supported or client ID is set.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-4">
            <svg className="w-8 h-8 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Sign in to <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">upTime</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Or{' '}
            <Link to="/signup" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
              create a free account
            </Link>
          </p>
        </div>

        <div className="card glass shadow-2xl p-8 space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-600"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-700 px-3 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Google Button */}
          <div className="space-y-3">
            <div id="google-signin-btn" className="w-full flex justify-center"></div>

            {/* Fallback button if Google Client ID is not configured (mainly for developer convenience) */}
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={handleDevGoogleLogin}
                className="w-full btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
                disabled={loading}
              >
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.7 14.96 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.5 0 9.8-4 9.8-9.8 0-.6-.1-1.2-.2-1.7h-9.6z" />
                </svg>
                Mock Google Login (Dev Mode)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
