import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorsApi } from '../../api'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function MonitorList() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => monitorsApi.getAll(),
    refetchInterval: 15000,
  })

  // Mutations
  const pauseMutation = useMutation({
    mutationFn: (id) => monitorsApi.pause(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Monitor paused successfully')
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to pause monitor')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id) => monitorsApi.resume(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Monitor resumed successfully')
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resume monitor')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => monitorsApi.delete(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Monitor deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete monitor')
    },
  })

  const testMutation = useMutation({
    mutationFn: (id) => monitorsApi.test(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Check triggered successfully')
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to trigger check')
    },
  })

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will erase all check history.`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleTogglePause = (id, isPaused) => {
    if (isPaused) {
      resumeMutation.mutate(id)
    } else {
      pauseMutation.mutate(id)
    }
  }

  const handleTest = (id) => {
    testMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm">Loading monitors...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-500/10 border-red-500/20 p-6 text-center text-red-400">
        <h3 className="font-semibold text-lg">Failed to load monitors</h3>
        <p className="text-sm mt-1">{error.response?.data?.message || error.message}</p>
      </div>
    )
  }

  const monitors = data?.data?.data?.monitors || data?.data?.monitors || []

  // Filter monitors
  const filteredMonitors = monitors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.url.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = !m.isPaused
    else if (statusFilter === 'paused') matchesStatus = m.isPaused
    else if (statusFilter === 'up') matchesStatus = !m.isPaused && m.status === 'up'
    else if (statusFilter === 'down') matchesStatus = !m.isPaused && m.status === 'down'

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 max-w-2xl">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search monitors by name or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-surface-800 rounded-lg p-1 border border-surface-600 self-stretch">
            {['all', 'up', 'down', 'paused'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  statusFilter === filter
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-surface-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Add Monitor Button */}
        <Link to="/monitors/new" className="btn-primary w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Monitor
        </Link>
      </div>

      {/* Monitor List Table */}
      <div className="card p-0 overflow-hidden">
        {filteredMonitors.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="font-semibold text-lg text-slate-300">No monitors match your search</h3>
            <p className="text-sm mt-1">Try adjusting your keyword or status filter, or create a new monitor.</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Name & URL</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Interval</th>
                  <th>Latency</th>
                  <th>Uptime (24h)</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonitors.map((m) => {
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

                  const isMutating =
                    pauseMutation.isPending ||
                    resumeMutation.isPending ||
                    deleteMutation.isPending ||
                    testMutation.isPending

                  return (
                    <tr key={m._id}>
                      <td>
                        <div className="max-w-xs sm:max-w-md">
                          <Link
                            to={`/monitors/${m._id}`}
                            className="font-semibold text-slate-100 hover:text-brand-400 transition-colors truncate block"
                          >
                            {m.name}
                          </Link>
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 truncate hover:underline block"
                          >
                            {m.url}
                          </a>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs uppercase tracking-wider bg-surface-600 px-2 py-0.5 rounded text-slate-300 font-semibold">
                          {m.type}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={statusBadgeClass}>{statusText}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-slate-300 text-sm font-medium">{m.interval} min</span>
                      </td>
                      <td>
                        <span className="text-slate-100 text-sm font-semibold">
                          {m.responseTimeStats?.last ? `${m.responseTimeStats.last} ms` : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate-200 text-sm font-semibold">
                          {m.uptimeStats?.last24Hours !== null ? `${m.uptimeStats.last24Hours}%` : '-'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleTest(m._id)}
                            className="btn-ghost btn-sm px-2 text-slate-400 hover:text-brand-400"
                            title="Test/Check Now"
                            disabled={isMutating || m.isPaused}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleTogglePause(m._id, m.isPaused)}
                            className="btn-ghost btn-sm px-2 text-slate-400 hover:text-slate-200"
                            title={m.isPaused ? 'Resume Monitoring' : 'Pause Monitoring'}
                            disabled={isMutating}
                          >
                            {m.isPaused ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>

                          <Link
                            to={`/monitors/${m._id}/edit`}
                            className="btn-ghost btn-sm px-2 text-slate-400 hover:text-indigo-400"
                            title="Edit Monitor"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>

                          <button
                            onClick={() => handleDelete(m._id, m.name)}
                            className="btn-ghost btn-sm px-2 text-slate-400 hover:text-red-400"
                            title="Delete Monitor"
                            disabled={isMutating}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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
