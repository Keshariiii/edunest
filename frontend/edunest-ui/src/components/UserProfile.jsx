/* eslint-disable */
import React, { useState } from 'react';
import { User, Mail, Calendar, Lock, LogOut, Edit3, Check, X, Loader2, AlertCircle, Shield, ArrowLeft } from 'lucide-react';

export default function UserProfile({ user, token, onLogout, onUserUpdate, onBack }) {
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.trim() === user.username) {
      setEditing(false);
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${apiBase}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Update failed');
      onUserUpdate?.(data.user);
      setSuccess('Username updated');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${apiBase}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        if (typeof detail === 'string') throw new Error(detail);
        if (Array.isArray(detail)) throw new Error(detail.map(d => d.msg?.replace('Value error, ', '') || d.msg).join('. '));
        throw new Error(JSON.stringify(detail));
      }
      setSuccess('Password changed successfully');
      setChangingPassword(false);
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#262626] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111] hover:text-gray-900 dark:hover:text-white transition-all shadow-sm"
            title="Back to Workspace"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 m-0">
          <Shield size={18} className="text-indigo-500" />
          Account Settings
        </h2>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-600 dark:text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">{success}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1e1e1e] rounded-2xl p-6 shadow-sm space-y-5">

        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-gray-900 dark:text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            {(user?.username?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                <button onClick={handleUpdateUsername} disabled={loading} className="p-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => { setEditing(false); setNewUsername(user?.username || ''); }} className="p-1.5 rounded-md bg-gray-200 dark:bg-[#222] text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-[#333] transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white">{user?.username}</h3>
                <button onClick={() => setEditing(true)} className="p-1 rounded text-gray-400 hover:text-indigo-500 transition-colors">
                  <Edit3 size={12} />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-[#1e1e1e]">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0 font-mono text-xs">Email</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0 font-mono text-xs">Joined</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">{joinDate}</span>
          </div>
        </div>

        {/* Change Password */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#1e1e1e]">
          {!changingPassword ? (
            <button
              onClick={() => { setChangingPassword(true); setError(''); setSuccess(''); }}
              className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-indigo-500 transition-colors"
            >
              <Lock size={12} /> Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="password"
                placeholder="New password (min 8 chars, 1 uppercase, 1 digit)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPassword(''); }}
                  className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Logout */}
        <div className="pt-3 border-t border-gray-100 dark:border-[#1e1e1e]">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-mono text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
