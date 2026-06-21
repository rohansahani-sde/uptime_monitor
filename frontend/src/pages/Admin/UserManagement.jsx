import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import Spinner from '../../components/ui/Spinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  // Fetch Users List
  const { data: usersRes, isLoading, error } = useQuery({
    queryKey: ['adminUsers', searchTerm, page],
    queryFn: () =>
      adminApi.getUsers({
        search: searchTerm,
        page,
        limit: 10,
      }),
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateUser(id, payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    },
  })

  const handleUpdatePlan = (id, plan) => {
    updateMutation.mutate({ id, payload: { plan } })
  }

  const handleUpdateRole = (id, role) => {
    updateMutation.mutate({ id, payload: { role } })
  }

  const handleDelete = (id, name) => {
    if (window.confirm(`WARNING: Are you sure you want to delete user "${name}"? This will delete all of their monitors and incidents. This action cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  if (error) {
    return (
      <div className="card bg-red-500/10 border-red-500/20 p-6 text-center text-red-400">
        <h3 className="font-semibold text-lg">Admin access error</h3>
        <p className="text-sm mt-1">{error.response?.data?.message || error.message}</p>
      </div>
    )
  }

  const usersData = usersRes?.data?.data || usersRes?.data || {}
  const users = usersData.users || []
  const pagination = usersData.pagination || { page: 1, pages: 1 }

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-600 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">User Management</h2>
          <p className="text-sm text-slate-400">View and manage platform customer accounts</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex bg-surface-800 rounded-lg p-1 border border-surface-600 max-w-md">
        <input
          type="text"
          className="input border-0 focus:ring-0 focus:ring-offset-0 bg-transparent"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1) // Reset page on search change
          }}
        />
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <div>
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>User info</th>
                    <th>Plan Tier</th>
                    <th>System Role</th>
                    <th>Joined At</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="font-semibold text-slate-100">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td>
                        <select
                          className="bg-surface-800 border border-surface-600 rounded text-xs font-semibold px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={u.plan}
                          onChange={(e) => handleUpdatePlan(u._id, e.target.value)}
                          disabled={updateMutation.isPending}
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="bg-surface-800 border border-surface-600 rounded text-xs font-semibold px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                          disabled={updateMutation.isPending}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="text-sm text-slate-400">
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          disabled={deleteMutation.isPending}
                          className="btn-ghost btn-sm text-slate-400 hover:text-red-400 px-2"
                          title="Delete User"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="btn-secondary btn-sm"
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
                  className="btn-secondary btn-sm"
                  disabled={page === pagination.pages}
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
