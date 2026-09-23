import React, { useState } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  Settings,
  RotateCcw,
  Shield,
  Database,
  Trash2,
  CheckCircle2,
  Crown,
  AlertTriangle,
  KeyRound,
  User,
  Lock,
  Bell,
  Volume2,
  VolumeX,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    resetSystemData,
    clearAllAttendance,
    clearAllAnnouncements,
    setShowAdminLoginModal,
    changePassword,
  } = useVoidMC();

  // Reset dialog state (Admin only)
  const [resetConfirming, setResetConfirming] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Change Password state (for all logged in staff)
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dutyReminders, setDutyReminders] = useState(true);

  const handleExecuteReset = async () => {
    if (!isAdmin) return;
    setResetConfirming(false);
    const res = await resetSystemData();
    if (res.success) {
      setResetSuccess('System reset executed successfully! All attendance, strikes, and announcements reset to clean slate.');
      setTimeout(() => setResetSuccess(null), 5000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Please fill out all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }

    setPwLoading(true);
    setPwError(null);
    setPwSuccess(null);

    const res = await changePassword(currentPw, newPw);
    setPwLoading(false);

    if (res.success) {
      setPwSuccess(res.message);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSuccess(null), 4000);
    } else {
      setPwError(res.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#130a2a]/90 p-5 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-display">
              {isAdmin ? 'System Configuration & Admin Controls' : 'Staff Account & Preferences'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
              {isAdmin
                ? 'Authorized administrators, attendance policies, and system state controls.'
                : 'Manage your staff profile credentials, security password, and notifications.'}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setShowAdminLoginModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Admin Authentication</span>
          </button>
        )}
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* NORMAL STAFF PROFILE & ACCOUNT DETAILS */}
      {currentUser && (
        <div className="p-5 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25 space-y-4 shadow-lg">
          <div className="flex items-center gap-3 border-b border-purple-900/40 pb-3">
            <User className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Staff Account Profile
              </h3>
              <p className="text-xs text-purple-300/70">
                Your registered staff credentials and server assignment
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/30">
              <span className="text-slate-400 block text-[10px] uppercase">Staff Name:</span>
              <span className="text-white font-bold text-sm">{currentUser.name}</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/30">
              <span className="text-slate-400 block text-[10px] uppercase">Minecraft IGN:</span>
              <span className="text-purple-300 font-mono font-bold text-sm">{currentUser.minecraftIgn}</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/30">
              <span className="text-slate-400 block text-[10px] uppercase">Staff Role:</span>
              <span className="text-emerald-400 font-bold font-mono text-xs uppercase">{currentUser.role}</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/30">
              <span className="text-slate-400 block text-[10px] uppercase">Department:</span>
              <span className="text-purple-200 font-medium text-xs">{currentUser.department || 'Moderation'}</span>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY: CHANGE PASSWORD FOR NORMAL STAFF */}
      {currentUser && (
        <div className="p-5 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25 space-y-4 shadow-lg">
          <div className="flex items-center gap-3 border-b border-purple-900/40 pb-3">
            <Lock className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Security & Change Password
              </h3>
              <p className="text-xs text-purple-300/70">
                Update your account password. Keep your staff credentials secure at all times.
              </p>
            </div>
          </div>

          {pwError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 max-w-xl text-xs">
            <div>
              <label className="block text-purple-300 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="Enter your current password"
                className="w-full p-2.5 rounded-xl bg-[#1a0f35] border border-purple-500/30 text-white font-mono focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-purple-300 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 rounded-xl bg-[#1a0f35] border border-purple-500/30 text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full p-2.5 rounded-xl bg-[#1a0f35] border border-purple-500/30 text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{pwLoading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* STAFF PREFERENCES & NOTIFICATION SETTINGS */}
      <div className="p-5 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 border-b border-purple-900/40 pb-3">
          <Bell className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Portal Preferences & Alerts
            </h3>
            <p className="text-xs text-purple-300/70">
              Customize portal notifications and alert sound effects
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-900/30">
            <div>
              <span className="font-bold text-white block">Portal Audio & Chimes</span>
              <span className="text-purple-300/70 text-[11px]">Play audio tones when new notices or approvals arrive</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-purple-950/60 border-purple-500/30 text-purple-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-900/30">
            <div>
              <span className="font-bold text-white block">Daily Attendance Reminder</span>
              <span className="text-purple-300/70 text-[11px]">Show reminder banner if attendance is not checked in today</span>
            </div>
            <button
              onClick={() => setDutyReminders(!dutyReminders)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                dutyReminders
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-purple-950/60 border-purple-500/30 text-purple-400'
              }`}
            >
              {dutyReminders ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* SERVER PARAMETERS & DUTY POLICIES */}
      <div className="p-5 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25 space-y-3 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
          Server Parameters & Staff Policy
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30 flex justify-between">
            <span className="text-slate-400">Server Domain:</span>
            <span className="font-mono font-bold text-purple-300">play.voidmc.fun</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30 flex justify-between">
            <span className="text-slate-400">Minecraft Version:</span>
            <span className="font-mono font-bold text-purple-300">1.16 - 26.3</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30 flex justify-between">
            <span className="text-slate-400">Attendance Policy:</span>
            <span className="font-mono font-bold text-emerald-400">Mandatory Daily Check-in</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30 flex justify-between">
            <span className="text-slate-400">Strike Disciplinary Rule:</span>
            <span className="font-mono font-bold text-red-400">3 Strikes = Auto Demotion</span>
          </div>
        </div>
      </div>

      {/* ADMIN-ONLY SECTION: AUTHORIZED ADMINISTRATORS & DESTRUCTIVE DATA RESET */}
      {/* (Requirement 4: Hidden from normal staff, restricted to authorized admins) */}
      {isAdmin && (
        <div className="space-y-6 pt-4 border-t border-purple-900/40">
          {/* Three Authorized Administrators Section */}
          <div className="p-5 rounded-2xl bg-[#140c2e]/90 border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <Crown className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-display">
                Authorized Server Administrators (Exclusive Access)
              </h3>
            </div>
            <p className="text-xs text-purple-300/80">
              Only these three accounts possess administrative authority over staff, attendance, strikes, and system settings:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <div>
                    <span className="font-bold text-white block">Elite ansh</span>
                    <span className="text-[10px] text-amber-400 font-mono">Owner</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  AUTHORIZED
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-base">⭐</span>
                  <div>
                    <span className="font-bold text-white block">obito uchiha</span>
                    <span className="text-[10px] text-amber-400 font-mono">Co-Owner</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  AUTHORIZED
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <div>
                    <span className="font-bold text-white block">Santosh Rout</span>
                    <span className="text-[10px] text-amber-400 font-mono">Staff Manager</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  AUTHORIZED
                </span>
              </div>
            </div>
          </div>

          {/* ADMIN-ONLY RESET & DATA MANAGEMENT (Requirement 4) */}
          <div className="p-6 rounded-2xl bg-[#140816]/90 border-2 border-red-500/40 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">
                  Administrative System Reset & Data Management
                </h3>
                <p className="text-xs text-red-200/80">
                  Restricted to the 3 authorized administrators. Reset system data to clean state.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setResetConfirming(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset System Data</span>
              </button>

              <button
                onClick={async () => {
                  if (window.confirm('Clear all staff attendance entries?')) {
                    await clearAllAttendance();
                    setResetSuccess('Attendance records cleared.');
                    setTimeout(() => setResetSuccess(null), 3000);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-purple-400" />
                <span>Clear All Attendance Only</span>
              </button>

              <button
                onClick={async () => {
                  if (window.confirm('Clear all announcements?')) {
                    await clearAllAnnouncements();
                    setResetSuccess('Announcements cleared.');
                    setTimeout(() => setResetSuccess(null), 3000);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-purple-400" />
                <span>Clear All Announcements Only</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET DIALOG */}
      {resetConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#150a12] border-2 border-red-500/70 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white uppercase font-display">
              Confirm Complete System Reset
            </h3>

            <p className="text-xs text-red-200/90 leading-relaxed">
              Are you sure you want to execute a system reset? All attendance logs, disciplinary strikes, and announcements will be cleared to a clean state.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setResetConfirming(false)}
                className="w-1/2 py-2 rounded-xl bg-purple-950/70 text-purple-300 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Execute Reset Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
