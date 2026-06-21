import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'

export default function ProfileSettings() {
  const { user } = useAuth()

  // Format Date joined
  const joinedDate = user?.createdAt
    ? format(new Date(user.createdAt), 'MMMM dd, yyyy')
    : 'Recently'

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-600 pb-5">
        <h2 className="text-xl font-bold text-slate-100">Profile Settings</h2>
        <p className="text-sm text-slate-400">View and manage your account details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Summary Profile */}
        <div className="card text-center space-y-4">
          <div className="relative inline-block mx-auto">
            <div className="w-24 h-24 rounded-full bg-brand-500/10 border-2 border-brand-500/20 flex items-center justify-center text-3xl font-bold text-brand-400">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span className="absolute bottom-0 right-0 rounded-full border border-slate-950 px-2 py-0.5 bg-brand-500 text-[10px] font-bold text-white uppercase tracking-wider">
              {user?.role || 'user'}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100">{user?.name}</h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>

          <div className="divider pt-2" />

          <div className="flex justify-around text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-300">Plan</p>
              <span className="badge-premium mt-1 inline-block uppercase text-[10px]">
                {user?.plan || 'Free'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-300">Joined</p>
              <p className="mt-1.5 text-slate-100 font-medium">{joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Right Card: Detail Fields */}
        <div className="lg:col-span-2 card space-y-6">
          <h3 className="text-md font-bold text-slate-200">Account Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input cursor-not-allowed opacity-75"
                value={user?.name || ''}
                disabled
              />
              <p className="text-[10px] text-slate-500 mt-1">To change name, contact support.</p>
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input cursor-not-allowed opacity-75"
                value={user?.email || ''}
                disabled
              />
              <p className="text-[10px] text-slate-500 mt-1">Contact admin to update email address.</p>
            </div>

            <div>
              <label className="label">System Role</label>
              <input
                type="text"
                className="input cursor-not-allowed opacity-75 capitalize"
                value={user?.role || 'User'}
                disabled
              />
            </div>

            <div>
              <label className="label">Account Status</label>
              <div className="input cursor-not-allowed opacity-75 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="bg-surface-800 rounded-lg border border-surface-600 p-4 space-y-2">
            <h4 className="text-sm font-semibold text-slate-200">Security Notice</h4>
            <p className="text-xs text-slate-400">
              For security, email updates require manual admin confirmation. If you registered via Google OAuth, your password management is handled directly through your Google account login system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
