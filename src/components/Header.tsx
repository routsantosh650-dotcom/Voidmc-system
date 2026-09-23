import React, { useState, useEffect, useRef } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import {
  Crown,
  Bell,
  Menu,
  ShieldAlert,
  Shield,
  User,
  Megaphone,
  Calendar,
  AlertTriangle,
  Lock,
  Check,
  Trash2,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { IMAGES } from '../assets';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenQuickSwitcher?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    currentUser,
    isAdmin,
    unreadNotificationsCount,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    strikesList,
    setActiveTab,
    setShowAdminLoginModal,
    setShowStaffLoginModal,
    setIsProfileDrawerOpen,
  } = useVoidMC();

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userStrikes = currentUser ? strikesList.filter(s => s.staffId === currentUser.id) : [];
  const activeStrikesCount = userStrikes.filter(s => s.status === 'active').length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };
    if (showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationsDropdown]);

  const handleNotificationClick = async (notif: { id: string; linkTab?: string }) => {
    await markNotificationAsRead(notif.id);
    if (notif.linkTab) {
      setActiveTab(notif.linkTab);
    }
    setShowNotificationsDropdown(false);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'strike':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'announcement':
        return <Megaphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'attendance':
        return <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'security':
        return <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <header className="relative z-40 w-full border-b border-purple-900/40 bg-[#090616] select-none">
      {/* Background Cosmic Banner Art */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
        <img
          src={IMAGES.cosmicBanner}
          alt="VoidMC Cosmic Universe"
          className="w-full h-full object-cover object-right md:object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090616] via-[#090616]/75 to-[#090616]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090616] via-transparent to-[#090616]/60" />
      </div>

      <div className="relative z-10 max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Mobile Menu Button + VOIDMC SMP Brand Lockup */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl bg-purple-950/70 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/60 active:scale-95 transition-all cursor-pointer"
            title="Open Navigation"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Logo & Slogan lockup */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-purple-600/30 rounded-xl blur-md group-hover:bg-purple-500/50 transition-all duration-300" />
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#140c2e] border border-purple-500/40 p-1 shadow-lg shadow-purple-950/50 overflow-hidden">
                <img
                  src={IMAGES.logoEmblem}
                  alt="VoidMC Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-300 to-purple-400 font-display uppercase drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">
                  VOIDMC<span className="hidden xs:inline"> SMP</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] uppercase tracking-widest text-purple-400 font-mono-code px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-500/20">
                  STAFF
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-purple-300/75 font-medium">
                <span className="tracking-widest uppercase text-purple-400">BUILD</span>
                <span>•</span>
                <span className="tracking-widest uppercase text-purple-400">SURVIVE</span>
                <span>•</span>
                <span className="tracking-widest uppercase text-purple-400">CONQUER</span>
                <span className="text-purple-400/60 ml-2 font-script text-xs font-semibold">
                  — Together in the Void —
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Actions + Notifications + Slide-out Profile Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Strike Warning indicator */}
          {activeStrikesCount > 0 && (
            <button
              onClick={() => setActiveTab('strikes')}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-semibold animate-pulse hover:bg-red-900/80 transition-colors shadow-[0_0_12px_rgba(239,68,68,0.4)] cursor-pointer shrink-0"
              title="View disciplinary strikes"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline text-[11px]">Strikes:</span>
              <span className="font-mono-code bg-red-500 text-white px-1 py-0.2 rounded text-[10px]">
                {activeStrikesCount}/3
              </span>
            </button>
          )}

          {/* Admin Panel button for Admins; LOA Application for staff */}
          {isAdmin ? (
            <button
              onClick={() => setActiveTab('admin')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              title="Open Admin Command Panel"
            >
              <Shield className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span className="font-display tracking-wide uppercase">
                <span className="hidden sm:inline">Admin Panel ⚡</span>
                <span className="sm:hidden">Admin</span>
              </span>
            </button>
          ) : currentUser ? (
            <button
              onClick={() => setActiveTab('applications')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 hover:text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Staff Applications: Submit Leave or LOA"
            >
              <FileText className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span className="font-display tracking-wide uppercase">Apply LOA</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Admin Authentication"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-display tracking-wide uppercase hidden sm:inline">Admin Portal</span>
              <span className="font-display tracking-wide uppercase sm:hidden">Admin</span>
            </button>
          )}

          {/* NOTIFICATION SYSTEM - Positioned with right alignment and full viewport safety */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotificationsDropdown(prev => !prev)}
              className={`relative p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                showNotificationsDropdown
                  ? 'bg-purple-900/70 border-purple-400 text-white shadow-lg shadow-purple-900/50'
                  : 'bg-[#171033] border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/40'
              }`}
              title="Notifications & Alerts"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Window - Guaranteed fully visible without clipping */}
            {showNotificationsDropdown && (
              <div className="fixed inset-x-3 top-16 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:inset-x-auto rounded-2xl bg-[#120b29] border border-purple-500/40 shadow-2xl p-3.5 sm:p-4 z-50 backdrop-blur-xl animate-fadeIn">
                <div className="flex items-center justify-between pb-2.5 border-b border-purple-900/40 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Notifications
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-500/30 border border-red-500/50 text-[10px] font-bold text-red-300">
                        {unreadNotificationsCount} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                      title="Mark all as read"
                    >
                      <Check className="w-3 h-3" />
                      <span>Read all</span>
                    </button>
                    <button
                      onClick={clearAllNotifications}
                      className="p-1 rounded-lg text-purple-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Clear notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-purple-400/60">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          !notif.read
                            ? 'bg-purple-950/70 border-purple-500/50 hover:bg-purple-900/60'
                            : 'bg-[#170e34]/50 border-purple-900/30 text-purple-300/70 hover:bg-purple-900/30'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-bold truncate ${!notif.read ? 'text-white' : 'text-purple-200'}`}>
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-purple-300/80 line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-purple-400/60 block mt-1">
                              {notif.timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SLIDE-OUT PROFILE TRIGGER BUTTON (Replaces bulky navbar profile card) */}
          {currentUser ? (
            <button
              onClick={() => setIsProfileDrawerOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-1.5 pr-2 sm:pr-2.5 py-1 rounded-2xl bg-[#140e2b] hover:bg-[#1a1238] border border-purple-500/35 hover:border-purple-400/60 shadow-lg shadow-purple-950/40 transition-all cursor-pointer group shrink-0 active:scale-95"
              title="Open Staff Profile & Settings Drawer"
              aria-label="Open staff profile and options menu"
            >
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-purple-400/50 group-hover:border-purple-300 transition-colors"
                  referrerPolicy="no-referrer"
                />
                {isAdmin ? (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow-sm">
                    <Crown className="w-2 h-2 fill-current" />
                  </span>
                ) : (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#140e2b]" />
                )}
              </div>

              {/* Show compact username on larger screens, collapsed on mobile */}
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white tracking-wide truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                </div>
                <span className="text-[9px] text-purple-300 font-medium capitalize truncate max-w-[90px]">
                  {currentUser.role}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-200 transition-colors shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setShowStaffLoginModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
