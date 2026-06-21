import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { statusApi } from '../../api'
import Spinner from '../../components/ui/Spinner'
import { formatDistanceToNow, format } from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function PublicStatusPage() {
  const { slug } = useParams()

  // Fetch Public Status Data
  const { data: statusRes, isLoading, error } = useQuery({
    queryKey: ['publicStatus', slug],
    queryFn: () => statusApi.getBySlug(slug),
    refetchInterval: 15000, // reload public page every 15s
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm font-medium">Fetching public status board...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full card bg-red-500/10 border-red-500/20 p-6 text-center text-red-400">
          <svg className="w-16 h-16 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-semibold text-lg">Status Page Unavailable</h3>
          <p className="text-sm mt-1">{error.response?.data?.message || 'The requested status page does not exist or has been deleted.'}</p>
          <div className="pt-4">
            <Link to="/login" className="btn-primary py-2 text-xs">
              Go to upTime
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const payload = statusRes?.data?.data || statusRes?.data || {}
  const m = payload.monitor || {}
  const incidents = payload.incidents || []
  const bars = payload.uptimeBars || []
  const history = payload.responseHistory || []

  // Status indicators
  let statusBadgeClass = 'badge-unknown'
  let statusText = 'Unknown'
  let healthDotClass = 'status-dot-unknown'
  let statusMessage = 'System status is currently checking.'

  if (m.status === 'up') {
    statusBadgeClass = 'badge-up text-sm py-1 px-3'
    statusText = 'OPERATIONAL'
    healthDotClass = 'status-dot-up w-3.5 h-3.5'
    statusMessage = 'All systems are fully operational.'
  } else if (m.status === 'down') {
    statusBadgeClass = 'badge-down text-sm py-1 px-3'
    statusText = 'OUTAGE'
    healthDotClass = 'status-dot-down w-3.5 h-3.5 animate-pulse'
    statusMessage = 'This service is currently experiencing an outage.'
  } else if (m.status === 'slow') {
    statusBadgeClass = 'badge-slow text-sm py-1 px-3'
    statusText = 'DEGRADED'
    healthDotClass = 'status-dot-slow w-3.5 h-3.5'
    statusMessage = 'This service is experiencing performance degradation.'
  }

  // Parse chart data
  const chartData = history.map((item) => ({
    time: format(new Date(item.timestamp), 'HH:mm'),
    latency: item.responseTime,
  }))

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const remainingSecs = seconds % 60
    return `${mins}m ${remainingSecs}s`
  }

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 px-4 sm:px-6 py-10 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-brand-500/5 blur-[150px]" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-500/5 blur-[150px]" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-surface-600">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
              upTime Status
            </span>
          </div>

          <Link to="/login" className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
            Configure Uptime Monitor &rarr;
          </Link>
        </header>

        {/* Global health status card */}
        <div className={`card flex items-center gap-4 p-5 ${
          m.status === 'up'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : m.status === 'down'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <span className={healthDotClass} />
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">{statusText}</h1>
            <p className="text-sm opacity-90 mt-0.5">{statusMessage}</p>
          </div>
        </div>

        {/* Monitor Info */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">{m.name}</h2>
            <span className={statusBadgeClass}>{m.status?.toUpperCase()}</span>
          </div>
          <p className="text-sm text-slate-400 truncate">{m.url}</p>

          <div className="divider pt-2" />

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Uptime (24h)</p>
              <p className="text-xl font-bold text-slate-200 mt-1">
                {m.uptimeStats?.last24Hours !== null ? `${m.uptimeStats.last24Hours}%` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Uptime (30d)</p>
              <p className="text-xl font-bold text-slate-200 mt-1">
                {m.uptimeStats?.last30Days !== null ? `${m.uptimeStats.last30Days}%` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Average Latency</p>
              <p className="text-xl font-bold text-slate-200 mt-1">
                {m.responseTimeStats?.avg ? `${m.responseTimeStats.avg} ms` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Last Check Latency</p>
              <p className="text-xl font-bold text-brand-400 mt-1">
                {m.responseTimeStats?.last ? `${m.responseTimeStats.last} ms` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 24-Hour Uptime Bars */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">24-Hour Availability Timeline</h3>
            {m.lastCheckedAt && (
              <span className="text-xs text-slate-400">
                Last checked: {formatDistanceToNow(new Date(m.lastCheckedAt))} ago
              </span>
            )}
          </div>

          <div>
            <div className="flex gap-[3px] h-8 w-full">
              {bars.map((bar, idx) => {
                let colorClass = 'uptime-bar-no_data'
                if (bar.status === 'up') colorClass = 'uptime-bar-up'
                else if (bar.status === 'down') colorClass = 'uptime-bar-down'
                else if (bar.status === 'degraded') colorClass = 'uptime-bar-degraded'

                const tooltipTitle = `${format(new Date(bar.windowStart), 'HH:mm')} - ${format(new Date(bar.windowEnd), 'HH:mm')}`
                const tooltipText =
                  bar.status === 'no_data'
                    ? 'No checks in this window'
                    : `Availability: ${bar.uptimePercent}% (${bar.status.toUpperCase()})`

                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-sm transition-all duration-150 cursor-pointer relative group ${colorClass}`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-surface-800 border border-surface-600 rounded px-2.5 py-1.5 text-center text-xs shadow-2xl min-w-36 pointer-events-none">
                      <p className="font-semibold text-slate-100">{tooltipTitle}</p>
                      <p className="text-slate-300 mt-0.5">{tooltipText}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>24 hours ago</span>
              <span>Uptime: {m.uptimeStats?.last24Hours || 100}%</span>
              <span>Just now</span>
            </div>
          </div>
        </div>

        {/* Latency History Graph */}
        <div className="card space-y-4">
          <div>
            <h3 className="section-title">Response Latency (Last 24 Hours)</h3>
            <p className="section-subtitle">Realcheck latencies logged in milliseconds</p>
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No recent check latency history loaded.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#475569',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                    cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#latencyG)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-surface-600">
            <h3 className="section-title">Incident History</h3>
            <p className="section-subtitle">Latest outages logs</p>
          </div>

          {incidents.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              All checks operational. No recent outages have occurred.
            </div>
          ) : (
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Outage Started</th>
                    <th>Outage Ended</th>
                    <th>Outage Duration</th>
                    <th className="text-right">Outage Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc._id}>
                      <td className="text-sm">
                        {format(new Date(inc.startTime), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="text-sm">
                        {inc.resolved && inc.endTime
                          ? format(new Date(inc.endTime), 'MMM dd, yyyy HH:mm:ss')
                          : '-'}
                      </td>
                      <td className="text-sm font-medium text-slate-100">
                        {inc.resolved ? formatDuration(inc.duration) : 'Active now'}
                      </td>
                      <td className="text-right">
                        {inc.resolved ? (
                          <span className="badge-up">Resolved</span>
                        ) : (
                          <span className="badge-down animate-pulse">Ongoing Outage</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-6">
          Powered by{' '}
          <a
            href="/"
            className="text-slate-400 hover:text-brand-400 transition-colors font-semibold"
          >
            upTime SaaS Platform
          </a>
        </footer>
      </div>
    </div>
  )
}
