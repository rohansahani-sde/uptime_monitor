import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorsApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function AddMonitor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Form states
  const [name, setName] = useState('')
  const [url, setUrl] = useState('https://')
  const [type, setType] = useState('website') // website or api
  const [interval, setInterval] = useState(10)
  const [threshold, setThreshold] = useState(2000)
  const [method, setMethod] = useState('GET')
  const [expectedStatusCode, setExpectedStatusCode] = useState(200)
  const [headers, setHeaders] = useState([{ key: '', value: '' }])
  const [notifyOnDown, setNotifyOnDown] = useState(true)
  const [notifyOnRecover, setNotifyOnRecover] = useState(true)
  const [notifyOnSlow, setNotifyOnSlow] = useState(false)

  const addHeaderRow = () => {
    setHeaders([...headers, { key: '', value: '' }])
  }

  const removeHeaderRow = (index) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const updateHeaderRow = (index, field, value) => {
    const updated = [...headers]
    updated[index][field] = value
    setHeaders(updated)
  }

  const createMutation = useMutation({
    mutationFn: (data) => monitorsApi.create(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Monitor created successfully!')
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      navigate('/monitors')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create monitor')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!name.trim()) return toast.error('Monitor name is required')
    if (!url.trim() || !/^https?:\/\/.+/.test(url)) {
      return toast.error('Please enter a valid URL (starting with http:// or https://)')
    }

    // Process headers array to map format expected by backend
    const headerMap = {}
    headers.forEach((h) => {
      if (h.key.trim() && h.value.trim()) {
        headerMap[h.key.trim()] = h.value.trim()
      }
    })

    const payload = {
      name,
      url,
      type,
      interval: Number(interval),
      threshold: Number(threshold),
      notifyOnDown,
      notifyOnRecover,
      notifyOnSlow,
    }

    if (type === 'api') {
      payload.method = method
      payload.expectedStatusCode = Number(expectedStatusCode)
      payload.headers = headerMap
    }

    createMutation.mutate(payload)
  }

  const isFree = user?.plan === 'free'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-600 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Create a New Monitor</h2>
          <p className="text-sm text-slate-400">Specify details for monitoring your website or API endpoint</p>
        </div>
        <Link to="/monitors" className="btn-secondary btn-sm">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Monitor Info & Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h3 className="text-md font-bold text-slate-200">Basic Configuration</h3>

            {/* Name */}
            <div>
              <label className="label" htmlFor="name">
                Friendly Name
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="My API / Main Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* URL */}
            <div>
              <label className="label" htmlFor="url">
                Monitor URL / Endpoint
              </label>
              <input
                id="url"
                type="url"
                className="input"
                placeholder="https://example.com/health"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            {/* Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monitor Type</label>
                <select
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="website">Website / Webpage</option>
                  <option value="api">REST API</option>
                </select>
              </div>

              <div>
                <label className="label">Check Interval</label>
                <select
                  className="input"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                >
                  {isFree ? (
                    <>
                      <option value={10}>10 Minutes</option>
                      <option value={5}>5 Minutes</option>
                      <option disabled value={3}>
                        3 Minutes (Premium only)
                      </option>
                      <option disabled value={2}>
                        2 Minutes (Premium only)
                      </option>
                      <option disabled value={1}>
                        1 Minute (Premium only)
                      </option>
                    </>
                  ) : (
                    <>
                      <option value={10}>10 Minutes</option>
                      <option value={5}>5 Minutes</option>
                      <option value={3}>3 Minutes</option>
                      <option value={2}>2 Minutes</option>
                      <option value={1}>1 Minute</option>
                    </>
                  )}
                </select>
                {isFree && (
                  <p className="text-[10px] text-amber-400 mt-1 font-medium">
                    Upgrade to Premium for 1, 2, or 3 min intervals
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* API Configuration (Conditional) */}
          {type === 'api' && (
            <div className="card space-y-4 animate-slide-up">
              <h3 className="text-md font-bold text-slate-200">API Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">HTTP Method</label>
                  <select
                    className="input"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>

                <div>
                  <label className="label">Expected Status Code</label>
                  <input
                    type="number"
                    className="input"
                    value={expectedStatusCode}
                    onChange={(e) => setExpectedStatusCode(Number(e.target.value))}
                    min="100"
                    max="599"
                    required
                  />
                </div>
              </div>

              {/* Custom Headers */}
              <div>
                <label className="label flex items-center justify-between">
                  <span>Custom HTTP Headers</span>
                  <button
                    type="button"
                    onClick={addHeaderRow}
                    className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                  >
                    + Add Header
                  </button>
                </label>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {headers.map((h, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Header Name"
                        className="input text-xs"
                        value={h.key}
                        onChange={(e) => updateHeaderRow(index, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="input text-xs"
                        value={h.value}
                        onChange={(e) => updateHeaderRow(index, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeHeaderRow(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Remove row"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Threshold & Alerts */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="text-md font-bold text-slate-200">Alerts & Latency</h3>

            {/* Response Time Threshold */}
            <div>
              <label className="label" htmlFor="threshold">
                Latency Threshold (ms)
              </label>
              <input
                id="threshold"
                type="number"
                className="input"
                placeholder="2000"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                min="100"
                max="30000"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Trigger alerts if service takes longer than this to respond.
              </p>
            </div>

            {/* Notification settings */}
            <div className="divider pt-2" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Notification Preferences
            </h4>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-sm text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  className="rounded bg-surface-800 border-surface-600 text-brand-500 focus:ring-brand-500 h-4 w-4 mt-0.5"
                  checked={notifyOnDown}
                  onChange={(e) => setNotifyOnDown(e.target.checked)}
                />
                <div>
                  <p className="font-medium">Notify when Service goes Down</p>
                  <p className="text-[10px] text-slate-400">Sends alerts immediately when outage is confirmed.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-sm text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  className="rounded bg-surface-800 border-surface-600 text-brand-500 focus:ring-brand-500 h-4 w-4 mt-0.5"
                  checked={notifyOnRecover}
                  onChange={(e) => setNotifyOnRecover(e.target.checked)}
                />
                <div>
                  <p className="font-medium">Notify when Service Recovers</p>
                  <p className="text-[10px] text-slate-400">Get notified when endpoints resolve and status is green.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-sm text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  className="rounded bg-surface-800 border-surface-600 text-brand-500 focus:ring-brand-500 h-4 w-4 mt-0.5"
                  checked={notifyOnSlow}
                  onChange={(e) => setNotifyOnSlow(e.target.checked)}
                />
                <div>
                  <p className="font-medium">Notify on Slow Response (Degraded)</p>
                  <p className="text-[10px] text-slate-400">Trigger warnings if average latency exceeds threshold.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Monitor...
              </>
            ) : (
              'Save & Start Monitoring'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
