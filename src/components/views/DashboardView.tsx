import React, { useState, useMemo } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  Crown,
  Users,
  Shield,
  FileText,
  Calendar,
  Copy,
  Check,
  TrendingUp,
  UserPlus,
  Megaphone,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CalendarDays,
  Bell,
  Send,
  Pin,
} from 'lucide-react';
import { getRoleColorStyles, getRoleIcon } from '../../utils/roleHelpers';
import { getTodayIST, formatISTTime } from '../../utils/timeUtils';

interface DashboardViewProps {
  onOpenAddStaff: () => void;
  onOpenAnnouncement: () => void;
  onOpenMarkAttendance: () => void;
  onOpenIssueStrike: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddStaff,
  onOpenAnnouncement,
  onOpenMarkAttendance,
  onOpenIssueStrike,
}) => {
  const {
    rolesList,
    staffList,
    attendanceRecords,
    announcements,
    activities,
    currentUser,
    isAdmin,
    setActiveTab,
    deleteAttendance,
    strikesList,
    applicationsList,
  } = useVoidMC();

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('play.voidmc.fun');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const todayIST = useMemo(() => getTodayIST(), []);
  const todayStr = todayIST.dateStr;

  // Admin stats
  const presentAttendance = attendanceRecords.filter(r => r.status === 'present');
  const totalStaffCount = staffList.length;
  const attendanceRate = totalStaffCount > 0 ? Math.round((presentAttendance.length / totalStaffCount) * 100) : 0;
  const activeStrikesCount = strikesList.filter(s => s.status === 'active').length;

  // Normal staff stats (for currentUser)
  const myRecords = useMemo(() => {
    if (!currentUser) return [];
    return attendanceRecords.filter(r => r.staffId === currentUser.id);
  }, [attendanceRecords, currentUser]);

  const myRecordToday = useMemo(() => {
    return myRecords.find(r => r.date === todayStr);
  }, [myRecords, todayStr]);

  const myStrikes = useMemo(() => {
    if (!currentUser) return [];
    return strikesList.filter(s => s.staffId === currentUser.id && s.status === 'active');
  }, [strikesList, currentUser]);

  const myApplications = useMemo(() => {
    if (!currentUser) return [];
    return applicationsList.filter(a => a.staffId === currentUser.id);
  }, [applicationsList, currentUser]);

  // Current month calculation for normal staff in IST
  const monthData = useMemo(() => {
    const year = todayIST.year;
    const month = todayIST.month;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = todayIST.day;

    const days = [];
    const presentDates: string[] = [];
    const absentDates: string[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = myRecords.find(r => r.date === dStr);
      const isFuture = d > currentDay;
      const isToday = d === currentDay;

      let status: 'present' | 'absent' | 'unmarked_today' | 'future' = 'future';
      if (rec && rec.status === 'present') {
        status = 'present';
        presentDates.push(dStr);
      } else if (isToday) {
        status = 'unmarked_today';
      } else if (!isFuture) {
        status = 'absent';
        absentDates.push(dStr);
      }

      days.push({ day: d, dateStr: dStr, status });
    }

    const presentCount = presentDates.length;
    const absentCount = absentDates.length;
    const total = presentCount + absentCount;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return {
      monthName: new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      days,
      presentDates,
      absentDates,
      presentCount,
      absentCount,
      rate,
    };
  }, [myRecords, todayIST]);

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD
  // --------------------------------------------------------------------------
  if (isAdmin) {
    return (
      <div className="space-y-5 pb-8">
        {/* Admin Panel Header & Copy Link Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#170e33]/90 via-[#130a2a]/80 to-[#0e0720]/90 p-4 sm:p-5 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-950/40">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-400/40 text-purple-300 shadow-md shadow-purple-900/40">
              <Crown className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-display">
                  Admin Panel
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  Admin Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-300/80 mt-0.5">
                Manage your staff, track attendance, and keep VoidMC running smoothly.
              </p>
            </div>
          </div>

          {/* Server Admin URL Pill with Copy Icon */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1d1240]/80 hover:bg-[#251852] border border-purple-500/40 text-purple-200 text-xs font-mono transition-all group shadow-md cursor-pointer"
              title="Click to copy VoidMC command URL"
            >
              <span>play.voidmc.fun</span>
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-200" />
              )}
            </button>
          </div>
        </div>

        {/* Existing 4 Admin Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Members */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-800/40 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-purple-300/70 font-medium block">Total Members</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight">248</span>
                  <span className="flex items-center text-xs font-semibold text-emerald-400">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> 12%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Total Staff */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-800/40 transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-purple-300/70 font-medium block">Total Staff</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight">
                    {totalStaffCount}
                  </span>
                  <span className="flex items-center text-xs font-semibold text-emerald-400">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> 8%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Active Strikes */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-900/40 transition-colors">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-purple-300/70 font-medium block">Active Strikes</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight">
                    {activeStrikesCount}
                  </span>
                  <span className="flex items-center text-xs font-semibold text-amber-400">
                    Disciplinary
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Today's Attendance (Admin Total) */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-800/40 transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-purple-300/70 font-medium block">Today's Attendance</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-white tracking-tight">
                    {presentAttendance.length} / {totalStaffCount}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">
                    {attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Roles Overview (With removed 10 empty categories gone) */}
          <div className="lg:col-span-6 rounded-2xl bg-[#120a2a]/90 border border-purple-500/30 p-4 sm:p-5 shadow-xl shadow-purple-950/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-purple-900/30">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase font-display">
                    Staff Roles Overview
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('staff-directory')}
                  className="text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {rolesList.map(role => {
                  const styles = getRoleColorStyles(role.color);
                  return (
                    <div
                      key={role.id}
                      onClick={() => setActiveTab('staff-directory')}
                      className={`p-2.5 rounded-xl border ${styles.border} ${styles.bg} hover:border-purple-400/60 transition-all cursor-pointer group flex flex-col justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${styles.iconBg}`}
                        >
                          {getRoleIcon(role.iconType, 'w-3.5 h-3.5')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-white tracking-wide block truncate uppercase">
                            {role.name}
                          </span>
                          <span className="text-[10px] text-purple-300/70 block">
                            {role.memberCount} {role.memberCount === 1 ? 'Member' : 'Members'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions & Announcements */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            <div className="rounded-2xl bg-[#120a2a]/90 border border-purple-500/30 p-4 shadow-xl shadow-purple-950/50">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-purple-900/30">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-display">
                  Admin Actions
                </h3>
              </div>

              <div className="space-y-2">
                <button
                  onClick={onOpenAddStaff}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/25 hover:border-purple-400 text-xs font-semibold text-purple-100 transition-all text-left group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-purple-900/60 text-purple-300 group-hover:text-white">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <span>Add Staff Member</span>
                </button>

                <button
                  onClick={onOpenAnnouncement}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/25 hover:border-purple-400 text-xs font-semibold text-purple-100 transition-all text-left group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-purple-900/60 text-purple-300 group-hover:text-white">
                    <Megaphone className="w-3.5 h-3.5" />
                  </div>
                  <span>Create Announcement</span>
                </button>

                <button
                  onClick={onOpenMarkAttendance}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/25 hover:border-purple-400 text-xs font-semibold text-purple-100 transition-all text-left group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-purple-900/60 text-purple-300 group-hover:text-white">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span>Mark Attendance</span>
                </button>

                <button
                  onClick={onOpenIssueStrike}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/35 hover:border-red-400 text-xs font-semibold text-red-200 transition-all text-left group shadow-sm cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-red-900/60 text-red-300 group-hover:text-white">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <span>Issue Disciplinary Strike</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#120a2a]/90 border border-purple-500/30 p-4 shadow-xl shadow-purple-950/50 flex-1">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/30">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase font-display">
                    Announcements
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="text-[11px] font-semibold text-purple-300 hover:text-white flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {announcements.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-start gap-2.5 group">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0 group-hover:bg-fuchsia-400 transition-colors shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-200 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-purple-300/60 font-mono block mt-0.5">
                        {item.createdAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attendance queue & Activity */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            <div className="rounded-2xl bg-[#120a2a]/90 border border-purple-500/30 p-4 shadow-xl shadow-purple-950/50">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/30">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase font-display">
                    Attendance Log
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-900/80 border border-purple-500/30 text-purple-200">
                  {attendanceRecords.length} Today
                </span>
              </div>

              {attendanceRecords.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {attendanceRecords.slice(0, 5).map(record => (
                    <div
                      key={record.id}
                      className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/30 hover:border-purple-500/40 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={record.avatarUrl}
                          alt={record.staffName}
                          className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 object-cover"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {record.staffName}
                          </span>
                          <span className="text-[10px] text-purple-300/70 font-mono block truncate">
                            {record.staffRole}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {record.timeFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-purple-400 text-center py-4">No attendance marked yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // NORMAL STAFF DASHBOARD (Requirements 2 & 7: Staff-focused, No admin cards/controls, No Total Attendance)
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-5 pb-8">
      {/* Normal Staff Dashboard Header (NO Admin Panel text!) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#170e33]/90 via-[#130a2a]/80 to-[#0e0720]/90 p-4 sm:p-5 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-950/40">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-400/40 text-purple-300 shadow-md">
            <Users className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-display">
                Staff Member Portal
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-200 text-[10px] font-mono font-bold uppercase">
                {currentUser?.role || 'Staff Active'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/80 mt-0.5">
              Welcome back, <strong className="text-white">{currentUser?.name || 'Staff Member'}</strong>. Track your attendance, applications, and announcements.
            </p>
          </div>
        </div>

        {/* Appropriate Normal Staff Options (Requirement 2) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenMarkAttendance}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Check In Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Apply LOA / Leave</span>
          </button>
        </div>
      </div>

      {/* 4 Useful Staff-Focused Cards (Requirement 7: Replacing admin cards, NO Total Attendance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Today's Attendance */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
                myRecordToday
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
              }`}
            >
              {myRecordToday ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-xs text-purple-300/70 font-medium block">Today's Attendance</span>
              <div className="mt-0.5">
                <span
                  className={`text-base font-bold font-mono tracking-tight ${
                    myRecordToday ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {myRecordToday ? 'PRESENT' : 'NOT MARKED'}
                </span>
                <span className="block text-[10px] text-purple-300/70">
                  {myRecordToday ? `Logged: ${myRecordToday.timeFormatted}` : 'Click Check In above'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Current Attendance Status & Duty Duration */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-purple-300/70 font-medium block">Current Shift Details</span>
              <div className="mt-0.5">
                <span className="text-base font-bold font-mono text-white tracking-tight">
                  {myRecordToday ? `${myRecordToday.shiftDurationHours || 2} Hours on Duty` : 'Ready to Check In'}
                </span>
                <span className="block text-[10px] text-purple-300/70">
                  Exact timestamp auto-recorded
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Attendance Rate */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-purple-300/70 font-medium block">Monthly Attendance</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {monthData.rate}%
                </span>
                <span className="text-[10px] text-purple-300/80">
                  ({monthData.presentCount} Present / {monthData.absentCount} Absent)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Disciplinary Standing / Strikes */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#1c123d]/80 to-[#120a2b]/90 border border-purple-500/30 p-4 shadow-lg shadow-purple-950/40 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                myStrikes.length === 0
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-950/40 border-red-500/30 text-red-400'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-purple-300/70 font-medium block">Staff Standing</span>
              <div className="mt-0.5">
                <span
                  className={`text-base font-bold font-mono tracking-tight ${
                    myStrikes.length === 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {myStrikes.length === 0 ? '0 / 3 Strikes' : `${myStrikes.length} / 3 Strikes`}
                </span>
                <span className="block text-[10px] text-purple-300/70">
                  {myStrikes.length === 0 ? 'Good Standing' : 'Disciplinary Warning'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Staff Portal 3-Column / Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (Span 6): My Monthly Attendance Section */}
        <div className="lg:col-span-6 rounded-2xl bg-[#120a2a]/90 border border-purple-500/30 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                My Monthly Attendance ({monthData.monthName})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              Full Calendar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Month Mini Grid */}
          <div>
            <span className="text-xs text-purple-300/80 block mb-2 font-medium">
              Daily Attendance Status Map:
            </span>
            <div className="grid grid-cols-7 gap-1.5">
              {monthData.days.slice(0, 28).map(d => (
                <div
                  key={d.day}
                  className={`p-2 rounded-lg text-center border text-[11px] font-mono ${
                    d.status === 'present'
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                      : d.status === 'absent'
                      ? 'bg-red-950/60 border-red-500/40 text-red-300'
                      : d.status === 'unmarked_today'
                      ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 animate-pulse'
                      : 'bg-purple-950/20 border-purple-900/30 text-purple-400/40'
                  }`}
                >
                  <span className="font-bold block">{d.day}</span>
                  <span className="text-[9px] uppercase block">
                    {d.status === 'present' ? '✓' : d.status === 'absent' ? '✗' : d.status === 'unmarked_today' ? '?' : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clear List of Specific Absent Dates (Requirement 1 & 7) */}
          <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 uppercase flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                Specific Absent Dates This Month:
              </span>
              <span className="text-[10px] text-red-400 font-mono font-bold">
                {monthData.absentDates.length} Days Absent
              </span>
            </div>

            {monthData.absentDates.length === 0 ? (
              <p className="text-xs text-emerald-300/80 italic">
                No absent dates recorded this month! Great job maintaining your shift duty.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {monthData.absentDates.map(dateStr => (
                  <span
                    key={dateStr}
                    className="px-2 py-0.5 rounded bg-red-950/70 border border-red-500/40 text-red-200 text-[11px] font-mono"
                  >
                    {dateStr}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column (Span 3): Recent Announcements */}
        <div className="lg:col-span-3 rounded-2xl bg-[#120a2a]/90 border border-purple-500/30 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Announcements
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('announcements')}
              className="text-[11px] font-semibold text-purple-300 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 4).map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-900/40 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                  {/* Line 1: Important • Pinned */}
                  <div className="flex items-center gap-1 font-bold text-purple-200">
                    <span className="bg-purple-900/60 px-1.5 py-0.5 rounded uppercase">
                      {item.tag || 'IMPORTANT'}
                    </span>
                    <span className="text-purple-400">•</span>
                    <span className="text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                      <Pin className="w-2.5 h-2.5 text-amber-400 rotate-45 inline" />
                      PINNED
                    </span>
                  </div>
                  <span className="text-purple-400">{item.createdAt}</span>
                </div>

                {/* Line 2: VoidMC Staff Command System */}
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 font-display">
                  VoidMC Staff Command System
                </div>

                {/* Line 3: Title */}
                <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>

                {/* Line 4: Content */}
                <p className="text-[11px] text-purple-200/70 line-clamp-2">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Span 3): Notifications & My Applications Summary */}
        <div className="lg:col-span-3 rounded-2xl bg-[#120a2a]/90 border border-purple-500/30 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                My LOA & Leave Requests
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('applications')}
              className="text-[11px] font-semibold text-purple-300 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              Submit <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {myApplications.length === 0 ? (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 text-center space-y-2">
              <FileText className="w-6 h-6 text-purple-400/50 mx-auto" />
              <p className="text-xs text-purple-300/80">No leave applications submitted yet.</p>
              <button
                onClick={() => setActiveTab('applications')}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold"
              >
                Request LOA or Leave
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {myApplications.slice(0, 4).map(app => (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    app.status === 'approved'
                      ? 'bg-emerald-950/30 border-emerald-500/30'
                      : app.status === 'rejected'
                      ? 'bg-red-950/30 border-red-500/30'
                      : 'bg-purple-950/30 border-purple-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase font-mono text-purple-300">
                      {app.type}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        app.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : app.status === 'rejected'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-purple-200">
                    {app.startDate} → {app.endDate}
                  </div>
                  <p className="text-[11px] text-purple-300/80 line-clamp-1 italic">
                    "{app.reason}"
                  </p>
                  {app.adminResponse && (
                    <div className="text-[10px] text-amber-300/90 pt-1 border-t border-purple-900/30">
                      <strong>Admin Note:</strong> {app.adminResponse}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
