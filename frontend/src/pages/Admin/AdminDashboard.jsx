import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api'
import Spinner from '../../components/ui/Spinner'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export default function AdminDashboard() {
  // 1. Fetch Platform Stats
  const { data: statsRes, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getPlatformStats(),
    refetchInterval: 30000, // refresh stats every 30s
  })

  // 2. Fetch Latest Platform Incidents
  const { data: incidentsRes, isLoading: incidentsLoading } = useQuery({
    queryKey: ['adminIncidents'],
    queryFn: () => adminApi.getIncidents({ limit: 10, resolved: false }),
    refetchInterval: 30000,
  })

  if (statsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm">Loading admin platform metrics...</p>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="card bg-red-500/10 border-red-500/20 p-6 text-center text-red-400">
        <h3 className="font-semibold text-lg">Admin access error</h3>
        <p className="text-sm mt-1">{statsError.response?.data?.message || statsError.message}</p>
      </div>
    )
  }

  const stats = statsRes?.data?.data?.stats || statsRes?.data?.stats || {}
  const incidents = incidentsRes?.data?.data?.incidents || incidentsRes?.data?.incidents || []

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-600 pb-5">
        <h2 className="text-xl font-bold text-slate-100 font-sans">Admin Dashboard</h2>
        <p className="text-sm text-slate-400">System-wide platform overview and metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="stat-label">Total Platform Users</span>
          <span className="stat-value">{stats.totalUsers || 0}</span>
          <span className="stat-sub">Registered SaaS customers</span>
        </div>

        <div className="stat-card">
          <span className="stat-label font-sans">Active Monitors</span>
          <span className="stat-value">{stats.activeMonitors || 0}</span>
          <span className="stat-sub">Out of {stats.totalMonitors || 0} total</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Checks Completed</span>
          <span className="stat-value">{stats.totalChecks || 0}</span>
          <span className="stat-sub">({stats.last24hChecks || 0} in last 24h)</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">System Incidents</span>
          <span className="stat-value text-red-400">{stats.openIncidents || 0}</span>
          <span className="stat-sub">Out of {stats.totalIncidents || 0} lifetime</span>
        </div>
      </div>

      {/* Active System Incidents */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-surface-600 flex items-center justify-between">
          <div>
            <h3 className="section-title text-red-400 flex items-center gap-2">
              <span className="status-dot-down w-3 h-3 animate-pulse" />
              Active Outages System-Wide
            </h3>
            <p className="section-subtitle">Real-time un-resolved incidents</p>
          </div>
        </div>

        {incidentsLoading ? (
          <div className="p-5">
            <Spinner size="md" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Hooray! No ongoing outages on the platform right now.
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Monitor ID / Info</th>
                  <th>Outage Time</th>
                  <th>Root Cause</th>
                  <th className="text-right">Outage Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc._id}>
                    <td>
                      <div className="font-semibold text-slate-100">
                        Monitor ID: <span className="font-mono text-xs text-slate-400">{inc.monitorId}</span>
                      </div>
                      <div className="text-xs text-slate-400">User ID: {inc.userId}</div>
                    </td>
                    <td className="text-sm">
                      {format(new Date(inc.startTime), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="text-xs font-mono text-slate-400 max-w-xs truncate">
                      {inc.rootCause || 'Connection timeout'}
                    </td>
                    <td className="text-right">
                      <span className="badge-down animate-pulse">Ongoing Outage</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Fast Actions Card */}
      <div className="card space-y-4">
        <h3 className="text-md font-bold text-slate-200">Administrative Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Link
            to="/admin/users"
            className="flex items-center justify-between p-4 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-lg group transition-colors"
          >
            <div>
              <p className="font-semibold text-slate-100 group-hover:text-brand-400">
                User Directory
              </p>
              <p className="text-[10px] text-slate-400">View/edit tiers or delete user records</p>
            </div>
            <svg className="w-5 h-5 text-slate-500 group-hover:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
