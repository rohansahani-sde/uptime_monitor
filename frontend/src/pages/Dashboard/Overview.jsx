import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { monitorsApi } from '../../api'
import Spinner from '../../components/ui/Spinner'

export default function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => monitorsApi.getAll(),
    refetchInterval: 15000, // auto-refresh every 15s
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm">Loading dashboard metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-500/10 border-red-500/20 p-6 text-center text-red-400">
        <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="font-semibold text-lg">Failed to load monitors</h3>
        <p className="text-sm mt-1">{error.response?.data?.message || error.message}</p>
      </div>
    )
  }

  const monitors = data?.data?.data?.monitors || data?.data?.monitors || []

  // Metrics calculations
  const totalMonitors = monitors.length
  const activeMonitors = monitors.filter((m) => !m.isPaused).length
  const upMonitors = monitors.filter((m) => !m.isPaused && m.status === 'up').length
  const downMonitors = monitors.filter((m) => !m.isPaused && m.status === 'down').length
  const slowMonitors = monitors.filter((m) => !m.isPaused && m.status === 'slow').length
  const pausedMonitors = monitors.filter((m) => m.isPaused).length

  // Calculate average response time of active monitors
  const activeMonitorsWithResponseTime = monitors.filter(
    (m) => !m.isPaused && m.responseTimeStats?.avg
  )
  const avgResponseTime = activeMonitorsWithResponseTime.length
    ? Math.round(
        activeMonitorsWithResponseTime.reduce((acc, m) => acc + m.responseTimeStats.avg, 0) /
          activeMonitorsWithResponseTime.length
      )
    : 0

  // Calculate overall average uptime
  const activeMonitorsWithUptime = monitors.filter(
    (m) => !m.isPaused && m.uptimeStats?.last24Hours !== null
  )
  const avgUptime = activeMonitorsWithUptime.length
    ? Math.round(
        (activeMonitorsWithUptime.reduce((acc, m) => acc + m.uptimeStats.last24Hours, 0) /
          activeMonitorsWithUptime.length) *
          100
      ) / 100
    : 100

  // System Health Status
  let healthTitle = 'All systems operational'
  let healthDesc = `All ${upMonitors} active monitors are reporting 100% availability.`
  let healthColorClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  let healthDotClass = 'status-dot-up'

  if (downMonitors > 0) {
    healthTitle = `${downMonitors} service${downMonitors > 1 ? 's are' : ' is'} experiencing downtime`
    healthDesc = `We have detected incidents affecting ${downMonitors} of your monitored endpoints.`
    healthColorClass = 'bg-red-500/10 border-red-500/20 text-red-400'
    healthDotClass = 'status-dot-down'
  } else if (slowMonitors > 0) {
    healthTitle = `${slowMonitors} service${slowMonitors > 1 ? 's are' : ' is'} slow`
    healthDesc = `Some of your monitored endpoints are responding slower than your threshold.`
    healthColorClass = 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    healthDotClass = 'status-dot-slow'
  } else if (totalMonitors === 0) {
    healthTitle = 'No monitors configured'
    healthDesc = 'Add your first website or API endpoint to begin monitoring.'
    healthColorClass = 'bg-slate-500/10 border-slate-500/20 text-slate-400'
    healthDotClass = 'status-dot-unknown'
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Status Bar */}
      <div className={`card flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 ${healthColorClass}`}>
        <div className="flex items-center gap-3">
          <div className={`${healthDotClass} w-3.5 h-3.5`} />
          <div>
            <h2 className="text-lg font-bold">{healthTitle}</h2>
            <p className="text-sm opacity-80 mt-0.5">{healthDesc}</p>
          </div>
        </div>
        <div>
          <Link to="/monitors/new" className="btn-primary w-full md:w-auto text-center flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Monitor
          </Link>
        </div>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="stat-label">Total Monitors</span>
          <span className="stat-value">{totalMonitors}</span>
          <span className="stat-sub">{activeMonitors} active, {pausedMonitors} paused</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Uptime (24h)</span>
          <span className="stat-value">{avgUptime}%</span>
          <span className="stat-sub">Across all active monitors</span>
        </div>

        <span className="stat-card">
          <span className="stat-label">Avg Latency</span>
          <span className="stat-value">{avgResponseTime || '-'} ms</span>
          <span className="stat-sub">Across active monitors</span>
        </span>

        <div className="stat-card">
          <span className="stat-label">Incidents (Active)</span>
          <span className="stat-value text-red-400">{downMonitors}</span>
          <span className="stat-sub">{slowMonitors} slow response alert(s)</span>
        </div>
      </div>

      {/* Incidents Warning List */}
      {downMonitors > 0 && (
        <div className="card bg-red-500/5 border-red-500/10 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Active Incident Alerts
          </h3>
          <div className="space-y-2">
            {monitors
              .filter((m) => m.status === 'down')
              .map((m) => (
                <div key={m._id} className="flex items-center justify-between text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="status-dot-down" />
                    <div>
                      <span className="font-semibold text-slate-200">{m.name}</span>{' '}
                      <span className="text-slate-400">({m.url})</span>
                    </div>
                  </div>
                  <Link to={`/monitors/${m._id}`} className="text-xs text-red-400 hover:text-red-300 font-semibold underline">
                    View incident
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Monitors Summary Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-surface-600 flex items-center justify-between">
          <div>
            <h3 className="section-title">Monitors Overview</h3>
            <p className="section-subtitle">Real-time status and quick metrics</p>
          </div>
          <Link to="/monitors" className="btn-secondary btn-sm">
            View All Monitors
          </Link>
        </div>

        {monitors.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">You haven't set up any monitors yet.</p>
            <Link to="/monitors/new" className="mt-3 inline-flex btn-primary btn-sm">
              Create Monitor
            </Link>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Monitor</th>
                  <th>Status</th>
                  <th>Uptime (24h)</th>
                  <th>Uptime (30d)</th>
                  <th>Response Time</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {monitors.slice(0, 5).map((m) => {
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

                  return (
                    <tr key={m._id}>
                      <td>
                        <div>
                          <Link to={`/monitors/${m._id}`} className="font-semibold text-slate-100 hover:text-brand-400 transition-colors">
                            {m.name}
                          </Link>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{m.url}</p>
                        </div>
                      </td>
                      <td>
                        <span className={statusBadgeClass}>{statusText}</span>
                      </td>
                      <td>
                        <span className="font-medium text-slate-200">
                          {m.uptimeStats?.last24Hours !== null ? `${m.uptimeStats.last24Hours}%` : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-slate-400">
                          {m.uptimeStats?.last30Days !== null ? `${m.uptimeStats.last30Days}%` : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-slate-200">
                          {m.responseTimeStats?.last ? `${m.responseTimeStats.last} ms` : '-'}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link to={`/monitors/${m._id}`} className="btn-ghost btn-sm px-2 text-brand-400 hover:text-brand-300">
                          View details
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
