import React from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  AlertTriangle,
  Megaphone,
  History,
  Settings,
  Shield,
  FileText,
  X,
} from 'lucide-react';
import { IMAGES } from '../assets';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    isAdmin,
    currentUser,
    setShowAdminLoginModal,
    strikesList,
    attendanceRecords,
  } = useVoidMC();

  const activeStrikesCount = strikesList.filter(s => s.status === 'active').length;

  const handleNavClick = (tabId: string) => {
    if (tabId === 'admin') {
      if (isAdmin) {
        setActiveTab('admin');
      } else {
        setShowAdminLoginModal(true);
      }
    } else {
      setActiveTab(tabId);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen w-64 lg:w-72 shrink-0 bg-[#0c081e]/95 md:bg-[#0c081e]/85 backdrop-blur-xl border-r border-purple-900/30 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Navigation Links */}
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4">
          {/* Mobile Top Header with Close Button */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-purple-900/30 md:hidden">
            <div className="flex items-center gap-2">
              <img
                src={IMAGES.logoEmblem}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="font-display font-bold text-lg text-purple-200">VOIDMC SMP</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-purple-950/80 text-purple-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Panel Button for Admin; Staff Option for Normal Staff (Requirement 2) */}
          <div className="mb-3">
            {isAdmin ? (
              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group duration-200 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300'
                    : 'bg-amber-950/30 border border-amber-500/40 text-amber-200 hover:bg-amber-900/40 hover:text-amber-100 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                  <span className="tracking-wide uppercase font-display">Admin Panel ⚡</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  ACTIVE
                </span>
              </button>
            ) : currentUser ? (
              <button
                onClick={() => handleNavClick('applications')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group duration-200 cursor-pointer ${
                  activeTab === 'applications'
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                    : 'bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:bg-purple-900/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  <span className="tracking-wide uppercase font-display">Apply LOA / Leave</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  STAFF
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowAdminLoginModal(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group duration-200 cursor-pointer bg-amber-950/20 border border-amber-500/30 text-amber-300 hover:bg-amber-900/30"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="tracking-wide uppercase font-display">Admin Portal</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  AUTH
                </span>
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5">
            {/* Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                <span>Dashboard</span>
              </div>
            </button>

            {/* Attendance (Requirement 1 & 5) */}
            <button
              onClick={() => handleNavClick('attendance')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Attendance System</span>
              </div>
              {/* Only show Total Attendance to admin (Requirement 2) */}
              {isAdmin && attendanceRecords.length > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                  {attendanceRecords.length}
                </span>
              )}
            </button>

            {/* Applications - LOA & Leave (Requirement 9) */}
            <button
              onClick={() => handleNavClick('applications')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'applications'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Applications (LOA & Leave)</span>
              </div>
            </button>

            {/* Staff Directory */}
            <button
              onClick={() => handleNavClick('staff-directory')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'staff-directory'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Staff Directory</span>
              </div>
            </button>

            {/* Announcements (Requirement 7) */}
            <button
              onClick={() => handleNavClick('announcements')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'announcements'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 text-purple-400" />
                <span>Announcements</span>
              </div>
            </button>

            {/* Strikes */}
            <button
              onClick={() => handleNavClick('strikes')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'strikes'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Strikes & Discipline</span>
              </div>
              {activeStrikesCount > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold">
                  {activeStrikesCount}
                </span>
              )}
            </button>

            {/* Activity Logs */}
            <button
              onClick={() => handleNavClick('activity-logs')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'activity-logs'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-purple-400" />
                <span>Activity Logs</span>
              </div>
            </button>

            {/* Settings (Requirement 8) */}
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all group duration-200 text-left cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                  : 'text-purple-200/70 hover:text-white hover:bg-purple-950/50 hover:border hover:border-purple-500/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Box with Glowing Void Crystal Cube */}
        <div className="p-4 border-t border-purple-900/30">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#181138]/80 to-[#100b26]/90 border border-purple-500/30 p-3.5 overflow-hidden shadow-inner group">
            <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-purple-600/25 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/35 transition-all" />

            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-purple-950/60 border border-purple-400/40 p-1 flex items-center justify-center">
                <img
                  src={IMAGES.crystalCube}
                  alt="VoidMC Crystal"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold tracking-wider text-purple-400 uppercase">
                  → VOIDMC SMP
                </span>
                <span className="text-sm text-fuchsia-300 font-script font-bold drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]">
                  Expect the Unexpected
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-purple-800/25 flex items-center justify-between text-[9px] text-purple-300/60 font-mono">
              <span>VoidMC Command</span>
              <span>Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
