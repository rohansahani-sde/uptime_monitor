import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorsApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function EditMonitor() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch Monitor Data
  const { data: monitorData, isLoading, error } = useQuery({
    queryKey: ['monitor', id],
    queryFn: () => monitorsApi.getById(id),
  })

  // Form states
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('website')
  const [interval, setInterval] = useState(10)
  const [threshold, setThreshold] = useState(2000)
  const [method, setMethod] = useState('GET')
  const [expectedStatusCode, setExpectedStatusCode] = useState(200)
  const [headers, setHeaders] = useState([{ key: '', value: '' }])
  const [notifyOnDown, setNotifyOnDown] = useState(true)
  const [notifyOnRecover, setNotifyOnRecover] = useState(true)
  const [notifyOnSlow, setNotifyOnSlow] = useState(false)

  // Populate form when data arrives
  useEffect(() => {
    if (monitorData?.data?.data?.monitor) {
      const m = monitorData.data.data.monitor
      setName(m.name || '')
      setUrl(m.url || '')
      setType(m.type || 'website')
      setInterval(m.interval || 10)
      setThreshold(m.threshold || 2000)
      setMethod(m.method || 'GET')
      setExpectedStatusCode(m.expectedStatusCode || 200)
      setNotifyOnDown(m.notifyOnDown !== false)
      setNotifyOnRecover(m.notifyOnRecover !== false)
      setNotifyOnSlow(m.notifyOnSlow === true)

      // Convert headers Map/Object to row array
      if (m.headers && typeof m.headers === 'object') {
        const parsedRows = Object.entries(m.headers).map(([key, value]) => ({
          key,
          value,
        }))
        setHeaders(parsedRows.length ? parsedRows : [{ key: '', value: '' }])
      } else {
        setHeaders([{ key: '', value: '' }])
      }
    }
  }, [monitorData])

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

  const updateMutation = useMutation({
    mutationFn: (data) => monitorsApi.update(id, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Monitor updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      queryClient.invalidateQueries({ queryKey: ['monitor', id] })
      navigate(`/monitors/${id}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update monitor')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!name.trim()) return toast.error('Monitor name is required')
    if (!url.trim() || !/^https?:\/\/.+/.test(url)) {
      return toast.error('Please enter a valid URL (starting with http:// or https://)')
    }

    // Process headers
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

    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm">Loading monitor configurations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-500/10 border-red-500/20 p-6 text-center text-red-400">
        <h3 className="font-semibold text-lg">Failed to find monitor configuration</h3>
        <p className="text-sm mt-1">{error.response?.data?.message || error.message}</p>
        <Link to="/monitors" className="mt-3 inline-flex btn-primary btn-sm">
          Back to Monitors
        </Link>
      </div>
    )
  }

  const isFree = user?.plan === 'free'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-600 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Edit Monitor Settings</h2>
          <p className="text-sm text-slate-400">Modify properties for "{name}"</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/monitors/${id}`} className="btn-secondary btn-sm">
            Cancel
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            {/* Type & Interval */}
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

          {/* API Config (Conditional) */}
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

        {/* Right 1 Column */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="text-md font-bold text-slate-200">Alerts & Latency</h3>

            {/* Threshold */}
            <div>
              <label className="label" htmlFor="threshold">
                Latency Threshold (ms)
              </label>
              <input
                id="threshold"
                type="number"
                className="input"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                min="100"
                max="30000"
                required
              />
            </div>

            {/* Alerts */}
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
                  <p className="font-medium">Notify on Slow Response</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating Monitor...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
