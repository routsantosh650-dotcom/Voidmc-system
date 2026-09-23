import React, { useEffect } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import {
  X,
  User,
  Settings,
  LogOut,
  Shield,
  Calendar,
  FileText,
  AlertTriangle,
  Copy,
  Check,
  Laptop,
  KeyRound,
  Crown,
  Activity,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { IMAGES } from '../assets';

export const ProfileDrawer: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isProfileDrawerOpen,
    setIsProfileDrawerOpen,
    setActiveTab,
    logout,
    strikesList,
    attendanceRecords,
    setShowAdminLoginModal,
    activeSessions,
  } = useVoidMC();

  const [copiedIgn, setCopiedIgn] = React.useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileDrawerOpen) {
        setIsProfileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileDrawerOpen, setIsProfileDrawerOpen]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isProfileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isProfileDrawerOpen]);

  if (!isProfileDrawerOpen) return null;

  const userStrikes = currentUser ? strikesList.filter(s => s.staffId === currentUser.id && s.status === 'active') : [];
  const todayStr = new Date().toISOString().split('T')[0];
  const markedToday = currentUser
    ? attendanceRecords.some(r => r.staffId === currentUser.id && r.date === todayStr && r.status === 'present')
    : false;

  const handleCopyIgn = () => {
    if (!currentUser?.minecraftIgn) return;
    navigator.clipboard.writeText(currentUser.minecraftIgn);
    setCopiedIgn(true);
    setTimeout(() => setCopiedIgn(false), 2000);
  };

  const navigateTo = (tabName: string) => {
    setActiveTab(tabName);
    setIsProfileDrawerOpen(false);
  };

  const handleLogout = () => {
    setIsProfileDrawerOpen(false);
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={() => setIsProfileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <aside
        className="relative z-10 w-full max-w-sm sm:max-w-md h-full bg-[#0d0722] border-l border-purple-500/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft"
        role="dialog"
        aria-modal="true"
        aria-label="Staff Profile Menu"
      >
        {/* Background art blend */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Drawer Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-purple-900/40 bg-[#120a2e]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Staff Profile & Controls
              </h2>
              <span className="text-[10px] text-purple-300/70 block">
                VoidMC SMP Staff Network
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsProfileDrawerOpen(false)}
            className="p-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 active:scale-95 transition-all cursor-pointer"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {currentUser ? (
            <>
              {/* Profile Card Hero */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#180f38] via-[#140b2f] to-[#0f0722] border border-purple-500/35 p-4 shadow-xl overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all" />

                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-purple-950 border-2 border-purple-400/60 shadow-lg shadow-purple-950/60 p-0.5">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#120a2e]">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white tracking-wide truncate">
                        {currentUser.name}
                      </h3>
                      {isAdmin && (
                        <span title="Administrator">
                          <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-500/30 text-[10px] font-bold text-purple-200 uppercase font-mono tracking-wider">
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] text-purple-300/70 truncate">
                        {currentUser.department || 'Staff Team'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minecraft IGN Pill with Copy Button */}
                <div className="mt-3 pt-3 border-t border-purple-900/40 flex items-center justify-between text-xs bg-purple-950/40 px-3 py-2 rounded-xl border border-purple-500/20">
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <span className="text-[10px] uppercase font-semibold text-purple-400">IGN:</span>
                    <span className="font-mono font-bold text-white">{currentUser.minecraftIgn}</span>
                  </div>
                  <button
                    onClick={handleCopyIgn}
                    className="flex items-center gap-1 text-[11px] font-medium text-purple-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy Minecraft IGN"
                  >
                    {copiedIgn ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Attendance & Standing Quick Status */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div
                  onClick={() => navigateTo('attendance')}
                  className="p-3 rounded-xl bg-[#140c2e] border border-purple-500/25 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-purple-300/70">Today's Duty</span>
                    <Calendar className="w-3.5 h-3.5 text-purple-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className={`text-xs font-bold block ${markedToday ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {markedToday ? '✓ Checked In' : '• Pending Today'}
                  </span>
                </div>

                <div
                  onClick={() => navigateTo('strikes')}
                  className="p-3 rounded-xl bg-[#140c2e] border border-purple-500/25 hover:border-red-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-purple-300/70">Discipline</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-purple-400 group-hover:text-red-400 transition-colors" />
                  </div>
                  <span className={`text-xs font-bold block ${userStrikes.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {userStrikes.length > 0 ? `${userStrikes.length}/3 Strikes` : 'Good Standing'}
                  </span>
                </div>
              </div>

              {/* Navigation Options Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-widest px-1">
                  Menu & Shortcuts
                </span>

                {/* Admin Command Panel (for admins) */}
                {isAdmin && (
                  <button
                    onClick={() => navigateTo('admin')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-600/20 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/30 text-amber-300">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block">Admin Command Panel</span>
                        <span className="text-[10px] text-amber-300/70">System controls, staff & oversight</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                {/* Account & Settings */}
                <button
                  onClick={() => navigateTo('settings')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#140c2e]/90 border border-purple-500/25 hover:bg-purple-900/40 hover:border-purple-500/40 text-purple-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-950 text-purple-300 group-hover:bg-purple-900 group-hover:text-purple-200 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Account & Password Settings</span>
                      <span className="text-[10px] text-purple-300/70">Change password and preferences</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Active Sessions & Activity Logs */}
                <button
                  onClick={() => navigateTo('activity-logs')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#140c2e]/90 border border-purple-500/25 hover:bg-purple-900/40 hover:border-purple-500/40 text-purple-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-950 text-purple-300 group-hover:bg-purple-900 group-hover:text-purple-200 transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Live Staff & Activity Logs</span>
                      <span className="text-[10px] text-purple-300/70">
                        {activeSessions.length} active sessions online
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Submit LOA / Leave Application */}
                <button
                  onClick={() => navigateTo('applications')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#140c2e]/90 border border-purple-500/25 hover:bg-purple-900/40 hover:border-purple-500/40 text-purple-200 hover:text-white transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-950 text-purple-300 group-hover:bg-purple-900 group-hover:text-purple-200 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">Submit LOA / Leave Request</span>
                      <span className="text-[10px] text-purple-300/70">Apply for temporary absence</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Admin Auth Modal Trigger for non-admins */}
                {!isAdmin && (
                  <button
                    onClick={() => {
                      setIsProfileDrawerOpen(false);
                      setShowAdminLoginModal(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-white block">Admin Login Portal</span>
                        <span className="text-[10px] text-amber-300/70">Elevate to management access</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-300">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Not Signed In</h3>
                <p className="text-xs text-purple-300/70 mt-1 max-w-xs mx-auto">
                  Please log in with your registered staff credentials to access attendance, settings, and staff tools.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Bottom Actions: Sign Out */}
        <div className="relative z-10 p-5 border-t border-purple-900/40 bg-[#120a2e]/90 backdrop-blur-md space-y-2">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600/90 to-red-700/90 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-950/50 active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider font-display"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of VoidMC</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsProfileDrawerOpen(false);
                setShowAdminLoginModal(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Staff Member Login
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] text-purple-400/60 font-mono px-1">
            <span>VoidMC Staff Hub</span>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
