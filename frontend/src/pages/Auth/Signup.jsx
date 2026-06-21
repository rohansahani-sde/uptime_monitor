import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Signup() {
  const { signup, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
          document.getElementById('google-signup-btn'),
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
      toast.success('Successfully registered with Google!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      return toast.error('Please fill in all fields')
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long')
    }
    setLoading(true)
    try {
      await signup({ name, email, password })
      toast.success('Welcome! Your account has been created successfully.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Email might be in use.')
    } finally {
      setLoading(false)
    }
  }

  const handleDevGoogleSignup = async () => {
    setLoading(true)
    try {
      await googleLogin('mock-google-token-from-frontend')
      toast.success('Signed up with Dev Mock Google Account!')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Mock Google OAuth failed. Make sure mock mode is supported.')
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="card glass shadow-2xl p-8 space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
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
              <span className="bg-surface-700 px-3 text-slate-400">Or sign up with</span>
            </div>
          </div>

          {/* Google Button */}
          <div className="space-y-3">
            <div id="google-signup-btn" className="w-full flex justify-center"></div>

            {/* Fallback button if Google Client ID is not configured */}
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={handleDevGoogleSignup}
                className="w-full btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
                disabled={loading}
              >
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.65 4.5 1.8l2.4-2.4C17.3 1.7 14.96 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.5 0 9.8-4 9.8-9.8 0-.6-.1-1.2-.2-1.7h-9.6z" />
                </svg>
                Mock Google Signup (Dev Mode)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
