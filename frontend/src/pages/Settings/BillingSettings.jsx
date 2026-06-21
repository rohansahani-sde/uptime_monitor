import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import Spinner from '../../components/ui/Spinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function BillingSettings() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()

  // 1. Fetch Subscription Data
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.get(),
  })

  // Mutations
  const upgradeMutation = useMutation({
    mutationFn: (payload) => subscriptionApi.upgrade(payload),
    onSuccess: (res) => {
      toast.success('Successfully upgraded to Premium!')
      // Update plan in AuthContext user state
      updateUser({ plan: 'premium' })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Upgrade failed')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: (res) => {
      toast.success('Subscription cancelled. Reverted to Free plan.')
      // Update plan in AuthContext user state
      updateUser({ plan: 'free' })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cancellation failed')
    },
  })

  const handleUpgrade = () => {
    // Razorpay checkout is mocked on backend; submit dummy ids
    upgradeMutation.mutate({
      razorpayOrderId: 'order_' + Math.random().toString(36).substr(2, 9),
      razorpayPaymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
    })
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your Premium subscription? Your monitors limit will be reduced to 5.')) {
      cancelMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="text-slate-400 mt-4 text-sm">Loading billing profile...</p>
      </div>
    )
  }

  const sub = data?.data?.data?.subscription || data?.data?.subscription || null
  const isPremium = user?.plan === 'premium'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-600 pb-5">
        <h2 className="text-xl font-bold text-slate-100">Billing & Subscription</h2>
        <p className="text-sm text-slate-400">View your subscription plan and billing cycles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Plan info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h3 className="text-md font-bold text-slate-200">Current Plan</h3>

            <div className="flex items-center justify-between bg-surface-800 border border-surface-600 p-5 rounded-xl">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold uppercase tracking-wide text-slate-100">
                    {user?.plan} Plan
                  </span>
                  <span className={isPremium ? 'badge-premium' : 'badge-paused'}>
                    {sub?.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isPremium
                    ? 'Thank you for supporting upTime! You have unlocked all premium benefits.'
                    : 'Unlock more monitors, faster intervals, and email alerts.'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-extrabold text-slate-100">
                  {isPremium ? '₹999' : '₹0'}
                </span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
            </div>

            {isPremium && sub && (
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Subscription Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-surface-800/40 p-4 rounded-lg border border-surface-600">
                  <div>
                    <span className="text-slate-400">Next Billing Date</span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {sub.currentPeriodEnd
                        ? format(new Date(sub.currentPeriodEnd), 'MMMM dd, yyyy')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Amount to Bill</span>
                    <p className="font-semibold text-slate-200 mt-0.5">₹999.00 / mo</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment ID</span>
                    <p className="font-mono text-xs text-slate-300 mt-1 truncate">
                      {sub.razorpayPaymentId || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Order ID</span>
                    <p className="font-mono text-xs text-slate-300 mt-1 truncate">
                      {sub.razorpayOrderId || '-'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                    className="btn-danger btn-sm"
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Plan Feature Comparison Grid */}
          <div className="card space-y-4">
            <h3 className="text-md font-bold text-slate-200">Tier Features Comparison</h3>
            <div className="table-container">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Features</th>
                    <th>Free</th>
                    <th>Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium text-slate-200">Max Monitors</td>
                    <td>5 Monitors</td>
                    <td className="text-brand-400 font-semibold">50 Monitors</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-slate-200">Interval Check</td>
                    <td>5 or 10 mins</td>
                    <td className="text-brand-400 font-semibold">1, 2, 3, 5, or 10 mins</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-slate-200">Email Alerts</td>
                    <td className="text-slate-500">❌ None</td>
                    <td className="text-emerald-400 font-semibold">✔️ Instant Email Notifications</td>
                  </tr>
                  <tr>
                    <td className="font-medium text-slate-200">Weekly Performance Report</td>
                    <td className="text-slate-500">❌ None</td>
                    <td className="text-emerald-400 font-semibold">✔️ Delivered to Inbox</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Upgrade checkout */}
        {!isPremium && !isAdmin && (
          <div className="card bg-brand-500/10 border-brand-500/20 flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100">Upgrade to Premium</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Get high-resolution uptime monitoring and never miss an incident alert.
                </p>
              </div>

              <div className="pt-2">
                <span className="text-3xl font-extrabold text-slate-100">₹999</span>
                <span className="text-sm text-slate-400"> / month</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  Up to 50 active monitors
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  1-minute check intervals
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  Instant Gmail notifications
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  Weekly availability reports
                </li>
              </ul>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={upgradeMutation.isPending}
              className="btn-primary w-full py-3 mt-6 flex items-center justify-center gap-2"
            >
              {upgradeMutation.isPending ? 'Processing Upgrade...' : 'Upgrade Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
