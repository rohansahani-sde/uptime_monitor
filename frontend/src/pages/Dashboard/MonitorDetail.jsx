import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorsApi, analyticsApi } from '../../api'
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
import toast from 'react-hot-toast'

export default function MonitorDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [timeframe, setTimeframe] = useState(24) // hours
  const [incidentPage, setIncidentPage] = useState(1)

  // 1. Fetch Monitor Core Info
  const { data: monitorRes, isLoading: monitorLoading, error: monitorError } = useQuery({
    queryKey: ['monitor', id],
    queryFn: () => monitorsApi.getById(id),
  })

  // 2. Fetch Response Time History
  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['responseTimeHistory', id, timeframe],
    queryFn: () => analyticsApi.getResponseTime(id, timeframe),
    refetchInterval: 15000,
  })

  // 3. Fetch Uptime Stats (Periods)
  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ['uptimeStats', id],
    queryFn: () => analyticsApi.getUptimeStats(id),
    refetchInterval: 15000,
  })

  // 4. Fetch Uptime Bars (24h)
  const { data: barsRes, isLoading: barsLoading } = useQuery({
    queryKey: ['uptimeBars', id],
    queryFn: () => analyticsApi.getUptimeBars(id),
    refetchInterval: 15000,
  })

  // 5. Fetch Monitor Incidents (Paginated)
  const { data: incidentsRes, isLoading: incidentsLoading } = useQuery({
    queryKey: ['monitorIncidents', id, incidentPage],
    queryFn: () => analyticsApi.getIncidents(id, { page: incidentPage, limit: 5 }),
    refetchInterval: 15000,
  })

  // Core mutations
  const pauseMutation = useMutation({
    mutationFn: () => monitorsApi.pause(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Monitor paused')
      queryClient.invalidateQueries({ queryKey: ['monitor', id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to pause')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: () => monitorsApi.resume(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Monitor resumed')
      queryClient.invalidateQueries({ queryKey: ['monitor', id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resume')
    },
  })

  const testMutation = useMutation({
    mutationFn: () => monitorsApi.test(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Test check triggered!')
      // Invalidate queries to reload
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['monitor', id] })
        queryClient.invalidateQueries({ queryKey: ['responseTimeHistory', id] })
        queryClient.invalidateQueries({ queryKey: ['uptimeStats', id] })
        queryClient.invalidateQueries({ queryKey: ['uptimeBars', id] })
      }, 1000)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to test')
    },
  })

  if (monitorLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm">Loading monitor analytics...</p>
      </div>
    )
  }

  if (monitorError) {
    return (
      <div className="card bg-red-500/10 border-red-500/20 p-6 text-center text-red-400">
        <h3 className="font-semibold text-lg">Failed to find monitor</h3>
        <p className="text-sm mt-1">{monitorError.response?.data?.message || monitorError.message}</p>
        <Link to="/monitors" className="mt-3 inline-flex btn-primary btn-sm">
          Back to Monitors
        </Link>
      </div>
    )
  }

  const m = monitorRes?.data?.data?.monitor || monitorRes?.data?.monitor || {}
  const history = historyRes?.data?.data?.history || historyRes?.data?.history || []
  const stats = statsRes?.data?.data?.stats || statsRes?.data?.stats || {}
  const bars = barsRes?.data?.data?.bars || barsRes?.data?.bars || []
  const incidentsData = incidentsRes?.data?.data || incidentsRes?.data || {}
  const incidents = incidentsData.incidents || []
  const pagination = incidentsData.pagination || { page: 1, pages: 1 }

  // Uptime Status Styling
  let statusBadgeClass = 'badge-unknown'
  let statusText = 'Unknown'
  if (m.isPaused) {
    statusBadgeClass = 'badge-paused'
    statusText = 'Paused'
  } else if (m.status === 'up') {
    statusBadgeClass = 'badge-up'
    statusText = 'Up'
  } else if (m.status === 'down') {
    statusBadgeClass = 'badge-down'
    statusText = 'Down'
  } else if (m.status === 'slow') {
    statusBadgeClass = 'badge-slow'
    statusText = 'Slow'
  }

  // Parse chart data
  const chartData = history.map((item) => ({
    time: format(new Date(item.timestamp), 'HH:mm'),
    latency: item.responseTime,
    success: item.success,
  }))

  const handleTogglePause = () => {
    if (m.isPaused) {
      resumeMutation.mutate()
    } else {
      pauseMutation.mutate()
    }
  }

  const handleCheckNow = () => {
    testMutation.mutate()
  }

  // Format Duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const remainingSecs = seconds % 60
    return `${mins}m ${remainingSecs}s`
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={statusBadgeClass}>{statusText}</span>
            <h2 className="text-xl font-bold text-slate-100">{m.name}</h2>
          </div>
          <a
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:underline mt-1 block max-w-lg truncate"
          >
            {m.url}
          </a>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="bg-surface-800 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
              {m.type}
            </span>
            <span>Check interval: {m.interval} mins</span>
            {m.lastCheckedAt && (
              <span>Last checked: {formatDistanceToNow(new Date(m.lastCheckedAt))} ago</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCheckNow}
            disabled={testMutation.isPending || m.isPaused}
            className="btn-secondary btn-sm flex items-center gap-1.5"
            title="Force immediate check"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
            </svg>
            Check Now
          </button>

          <button
            onClick={handleTogglePause}
            disabled={pauseMutation.isPending || resumeMutation.isPending}
            className="btn-secondary btn-sm flex items-center gap-1.5"
          >
            {m.isPaused ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pause
              </>
            )}
          </button>

          <Link to={`/monitors/${id}/edit`} className="btn-secondary btn-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Config
          </Link>
        </div>
      </div>

      {/* Grid of Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="stat-label">Uptime (24h)</span>
          <span className="stat-value">
            {stats.last24Hours?.uptimePercentage !== null ? `${stats.last24Hours?.uptimePercentage}%` : '-'}
          </span>
          <span className="stat-sub">Failed: {stats.last24Hours?.failedChecks || 0} checks</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Uptime (30d)</span>
          <span className="stat-value">
            {stats.last30Days?.uptimePercentage !== null ? `${stats.last30Days?.uptimePercentage}%` : '-'}
          </span>
          <span className="stat-sub">Failed: {stats.last30Days?.failedChecks || 0} checks</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Avg Response Time</span>
          <span className="stat-value">
            {stats.last24Hours?.avgResponseTime !== null ? `${stats.last24Hours?.avgResponseTime} ms` : '-'}
          </span>
          <span className="stat-sub">Min: {stats.last24Hours?.minResponseTime || 0}ms / Max: {stats.last24Hours?.maxResponseTime || 0}ms</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Last check latency</span>
          <span className="stat-value text-brand-400">
            {m.responseTimeStats?.last ? `${m.responseTimeStats.last} ms` : '-'}
          </span>
          <span className="stat-sub">Threshold: {m.threshold}ms</span>
        </div>
      </div>

      {/* 24-Hour Uptime Bars */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Uptime Status (Last 24 Hours)</h3>
          <span className="text-xs text-slate-400">Each block represents 30 min</span>
        </div>

        {barsLoading ? (
          <div className="h-10 skeleton" />
        ) : bars.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">No status data available yet.</div>
        ) : (
          <div>
            {/* Bars container */}
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
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-surface-800 border border-surface-600 rounded px-2.5 py-1.5 text-center text-xs shadow-2xl min-w-36 pointer-events-none">
                      <p className="font-semibold text-slate-100">{tooltipTitle}</p>
                      <p className="text-slate-300 mt-0.5">{tooltipText}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Legend info */}
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>24 hours ago</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Up
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Degraded
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Down
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-surface-600 inline-block" /> No Data
                </span>
              </div>
              <span>Just now</span>
            </div>
          </div>
        )}
      </div>

      {/* Latency History Graph */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="section-title">Response Time Latency</h3>
            <p className="section-subtitle">HTTP check latency over time</p>
          </div>

          {/* Timeframe selector */}
          <div className="flex bg-surface-800 border border-surface-600 rounded-lg p-0.5">
            {[1, 6, 12, 24].map((hr) => (
              <button
                key={hr}
                onClick={() => setTimeframe(hr)}
                className={`px-3 py-1 rounded text-xs font-semibold uppercase ${
                  timeframe === hr
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {hr}h
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="h-64 skeleton" />
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            No response time history loaded for this timeframe.
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

      {/* Incident History Log */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-surface-600">
          <h3 className="section-title font-bold">Incident Log</h3>
          <p className="section-subtitle">Historical records of verified outages</p>
        </div>

        {incidentsLoading ? (
          <div className="p-5 space-y-2">
            <div className="h-8 skeleton" />
            <div className="h-8 skeleton" />
            <div className="h-8 skeleton" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No incidents recorded. This service has been 100% healthy!
          </div>
        ) : (
          <div>
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Outage Time</th>
                    <th>Resolution Time</th>
                    <th>Duration</th>
                    <th>Root Cause</th>
                    <th>Status</th>
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
                      <td className="text-xs text-slate-400 font-mono max-w-xs truncate">
                        {inc.rootCause || 'Connection timeout'}
                      </td>
                      <td>
                        {inc.resolved ? (
                          <span className="badge-up">Resolved</span>
                        ) : (
                          <span className="badge-down animate-pulse">Ongoing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-surface-600 flex items-center justify-between">
                <button
                  onClick={() => setIncidentPage((p) => Math.max(p - 1, 1))}
                  className="btn-secondary btn-sm"
                  disabled={incidentPage === 1}
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page {incidentPage} of {pagination.pages}
                </span>
                <button
                  onClick={() => setIncidentPage((p) => Math.min(p + 1, pagination.pages))}
                  className="btn-secondary btn-sm"
                  disabled={incidentPage === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
