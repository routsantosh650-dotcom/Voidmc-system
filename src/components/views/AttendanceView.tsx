import React, { useState, useMemo } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  Check,
  Shield,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';
import { getTodayIST, formatISTTime, formatISTDateReadable } from '../../utils/timeUtils';

export const AttendanceView: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    attendanceRecords,
    markAttendance,
    deleteAttendance,
    clearAllAttendance,
    setShowStaffLoginModal,
  } = useVoidMC();

  const todayIST = useMemo(() => getTodayIST(), []);

  // Mark Form State
  const [shiftHours, setShiftHours] = useState<number>(2);
  const [shiftNotes, setShiftNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Month navigation for Monthly Attendance section (in IST)
  const [selectedYear, setSelectedYear] = useState<number>(todayIST.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayIST.month); // 0-indexed

  // Search & Filter for All-Staff Table (Admin only)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent'>('all');
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Today's date string YYYY-MM-DD in IST
  const todayStr = todayIST.dateStr;

  // Current user's records
  const myRecords = useMemo(() => {
    if (!currentUser) return [];
    return attendanceRecords.filter(r => r.staffId === currentUser.id);
  }, [attendanceRecords, currentUser]);

  // Check if current user marked attendance today
  const myRecordToday = useMemo(() => {
    return myRecords.find(r => r.date === todayStr);
  }, [myRecords, todayStr]);

  const handleMarkPresent = async () => {
    if (!currentUser) {
      setShowStaffLoginModal(true);
      return;
    }
    setSubmitting(true);
    setFeedbackMsg(null);
    const res = await markAttendance('present', shiftNotes || 'Standard duty shift', shiftHours);
    setSubmitting(false);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: 'Attendance recorded: Marked PRESENT with exact IST timestamp!' });
      setShiftNotes('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Month calculations for Monthly Attendance Section
  const monthData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });

    const isCurrentMonth =
      todayIST.year === selectedYear && todayIST.month === selectedMonth;
    const currentDay = isCurrentMonth ? todayIST.day : daysInMonth;

    const days = [];
    const presentDates: { date: string; time: string; hours?: number; notes?: string }[] = [];
    const absentDates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = myRecords.find(r => r.date === dayStr);

      const isFuture = isCurrentMonth ? day > currentDay : false;
      const isToday = isCurrentMonth && day === currentDay;

      let status: 'present' | 'absent' | 'unmarked_today' | 'future' = 'future';

      if (record && record.status === 'present') {
        status = 'present';
        presentDates.push({
          date: dayStr,
          time: record.timeFormatted || formatISTTime(record.timestamp),
          hours: record.shiftDurationHours || 2,
          notes: record.shiftNotes || 'Staff duty - Present',
        });
      } else if (record && record.status === 'absent') {
        status = 'absent';
        absentDates.push(dayStr);
      } else if (isToday) {
        // Today remains open/blank until the day ends or staff marks attendance
        status = 'unmarked_today';
      } else if (!isFuture) {
        // Past day that was not marked -> automatically marked Absent after day ends
        status = 'absent';
        absentDates.push(dayStr);
      } else {
        status = 'future';
      }

      days.push({
        day,
        dateStr: dayStr,
        status,
        record,
      });
    }

    const presentCount = presentDates.length;
    const absentCount = absentDates.length;
    const totalCounted = presentCount + absentCount;
    const attendancePercentage = totalCounted > 0 ? Math.round((presentCount / totalCounted) * 100) : 0;

    return {
      monthName,
      daysInMonth,
      days,
      presentDates,
      absentDates,
      presentCount,
      absentCount,
      attendancePercentage,
    };
  }, [selectedYear, selectedMonth, myRecords, todayIST]);

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // Filtered records for Admin View
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch =
      record.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.minecraftIgn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.staffRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPresentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const totalAbsentCount = attendanceRecords.filter(r => r.status === 'absent').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#120a2a] via-[#180f38] to-[#120a2a] border border-purple-500/30 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-purple-600/30 border border-emerald-500/40 text-emerald-300 shadow-lg">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                  Staff Attendance System
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
                  Auto-Timestamp
                </span>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Mark your daily presence and track complete monthly attendance records.
              </p>
            </div>
          </div>

          {/* Quick Stats: ONLY show global Total Attendance to Admin (Requirement 2) */}
          {isAdmin ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Total Present: <strong>{totalPresentCount}</strong></span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Total Absent: <strong>{totalAbsentCount}</strong></span>
              </div>
            </div>
          ) : currentUser ? (
            <div className="px-3 py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-mono">
              <span>My Month Rate: </span>
              <strong className="text-emerald-400">{monthData.attendancePercentage}%</strong>
            </div>
          ) : null}
        </div>
      </div>

      {/* SECTION 1: DAILY ATTENDANCE MARKING CARD (Present-Only) */}
      <div className="rounded-2xl bg-[#0f0a24] border border-purple-500/35 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Today's Attendance Check-In
            </h2>
          </div>
          <span className="text-xs text-purple-300 font-mono">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {feedbackMsg && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/80 border-red-500/50 text-red-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4">
            {/* Staff Info Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#170f38]/70 border border-purple-500/30 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-400/50 object-cover shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{currentUser.name}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30 text-[10px] font-bold text-purple-200 uppercase tracking-wide">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-300/80 font-mono mt-0.5">
                    <span>IGN: <strong className="text-purple-200">{currentUser.minecraftIgn}</strong></span>
                    <span>•</span>
                    <span>Department: {currentUser.department || 'Staff Team'}</span>
                  </div>
                </div>
              </div>

              {/* Today's status */}
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block mb-1">
                  Today's Recorded Status:
                </span>
                {myRecordToday ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    PRESENT ({myRecordToday.timeFormatted})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Not Marked Yet Today
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Action Form (Present Only) */}
            <div className="p-4 rounded-xl bg-[#130b2e]/60 border border-purple-900/40 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    Shift Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="12"
                    step="0.5"
                    value={shiftHours}
                    onChange={e => setShiftHours(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1b1240] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    Duty Summary / Shift Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={shiftNotes}
                    onChange={e => setShiftNotes(e.target.value)}
                    placeholder="e.g. Handled player tickets, spawn patrol, answered queries"
                    className="w-full px-3 py-2 rounded-xl bg-[#1b1240] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Present Button ONLY (Requirement 1: Remove Absent button completely) */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleMarkPresent}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {myRecordToday ? 'Update: Mark Present (Record Current Time)' : 'Mark Present (Record Exact Time)'}
                  </span>
                </button>
                <p className="text-[11px] text-purple-400/80 mt-1.5 italic">
                  * Marking yourself Present records your exact date & timestamp. Staff who do not mark attendance are automatically marked absent by the system.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-purple-300/80">
              Please sign in with your staff account to check in and record your attendance.
            </p>
            <button
              onClick={() => setShowStaffLoginModal(true)}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              Sign In to Mark Attendance
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: MONTHLY ATTENDANCE SECTION (Requirement 1) */}
      {currentUser && (
        <div className="rounded-2xl bg-[#0f0a24] border border-purple-500/35 p-5 sm:p-6 shadow-xl space-y-5">
          {/* Section Header with Month Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                  Monthly Attendance Record
                </h2>
                <p className="text-xs text-purple-300/70">
                  Comprehensive breakdown of present dates and specific absent dates
                </p>
              </div>
            </div>

            {/* Month Switcher Controls */}
            <div className="flex items-center gap-2 bg-[#170e33] p-1.5 rounded-xl border border-purple-500/30">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-purple-100 px-2 min-w-[120px] text-center font-display uppercase">
                {monthData.monthName}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/25">
              <span className="text-[11px] text-purple-300 block mb-1">Month Period</span>
              <span className="text-sm font-bold text-white">{monthData.daysInMonth} Days</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 block mb-1">Days Present</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {monthData.presentCount} Days
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30">
              <span className="text-[11px] text-red-300 block mb-1">Days Absent</span>
              <span className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                {monthData.absentCount} Days
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
              <span className="text-[11px] text-indigo-300 block mb-1">Attendance Rate</span>
              <span className="text-sm font-bold text-indigo-300">
                {monthData.attendancePercentage}%
              </span>
            </div>
          </div>

          {/* Calendar Visual Grid */}
          <div>
            <span className="text-xs font-semibold text-purple-300 block mb-2 uppercase tracking-wider">
              {monthData.monthName} — Daily Attendance Grid
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {monthData.days.map(d => (
                <div
                  key={d.day}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    d.status === 'present'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-sm shadow-emerald-950/50'
                      : d.status === 'absent'
                      ? 'bg-red-950/50 border-red-500/40 text-red-200'
                      : d.status === 'unmarked_today'
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-200 animate-pulse'
                      : 'bg-purple-950/20 border-purple-900/30 text-purple-400/50'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">Day {d.day}</div>
                  <div className="mt-1">
                    {d.status === 'present' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-400">
                        ✓ Present
                      </span>
                    )}
                    {d.status === 'absent' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-red-400">
                        ✗ Absent
                      </span>
                    )}
                    {d.status === 'unmarked_today' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-400">
                        Today (Pending)
                      </span>
                    )}
                    {d.status === 'future' && (
                      <span className="text-[10px] block opacity-50 font-mono">—</span>
                    )}
                  </div>
                  {d.record && (
                    <div className="text-[9px] text-purple-300/80 font-mono mt-0.5 truncate">
                      {d.record.timeFormatted}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SPECIFIC ABSENT & PRESENT DATES PANELS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Specific Absent Dates */}
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase tracking-wide">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Specific Dates Absent ({monthData.absentDates.length})</span>
                </div>
                <span className="text-[10px] text-red-400 font-mono">Unmarked Dates</span>
              </div>

              {monthData.absentDates.length === 0 ? (
                <p className="text-xs text-emerald-300/90 italic p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/20">
                  🎉 Perfect record! No absent dates recorded for {monthData.monthName}.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {monthData.absentDates.map(dStr => (
                    <span
                      key={dStr}
                      className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono font-medium"
                    >
                      {dStr}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Specific Present Dates */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Specific Dates Present ({monthData.presentDates.length})</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Logged Presences</span>
              </div>

              {monthData.presentDates.length === 0 ? (
                <p className="text-xs text-purple-300/80 italic p-3 bg-purple-950/30 rounded-lg">
                  No present records yet for {monthData.monthName}.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {monthData.presentDates.map(p => (
                    <div
                      key={p.date}
                      className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-bold text-emerald-200">{p.date}</span>
                      <span className="text-emerald-400 text-[11px]">{p.time}</span>
                      {p.hours && (
                        <span className="text-[10px] text-purple-300">({p.hours} hrs)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ALL-STAFF ATTENDANCE LOGS (Authorized Admin Only) */}
      {isAdmin && (
        <div className="space-y-4 rounded-2xl bg-[#0f0a24] border border-amber-500/30 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 border-b border-purple-900/40 pb-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                All-Staff Attendance Log (Admin Oversight)
              </h2>
              <p className="text-xs text-purple-300/70">
                Administrative control over team attendance logs, deletion, and records
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#110c26] p-4 rounded-xl border border-purple-900/40">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search attendance by staff name, IGN, or role..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#181138] border border-purple-500/30 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#181138] p-1 rounded-xl border border-purple-500/30">
                {(['all', 'present', 'absent'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      filterStatus === tab
                        ? 'bg-purple-600 text-white'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {attendanceRecords.length > 0 && (
                <button
                  onClick={() => setConfirmClearModal(true)}
                  className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Clear all attendance records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-purple-900/40 overflow-hidden shadow-lg bg-[#0e0822]">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-purple-400 text-xs space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-purple-500/50" />
                <p>No records found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-purple-900/50 bg-[#160e36] text-purple-300 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Shift Details</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/60">
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-purple-950/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={record.avatarUrl}
                              alt={record.staffName}
                              className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/30 object-cover"
                            />
                            <div>
                              <span className="font-bold text-white block">{record.staffName}</span>
                              <span className="text-[10px] text-purple-400 font-mono">IGN: {record.minecraftIgn}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-purple-900/40 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase font-mono">
                            {record.staffRole}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              record.status === 'present'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                record.status === 'present' ? 'bg-emerald-400' : 'bg-red-400'
                              }`}
                            />
                            {record.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-purple-200 font-mono">
                          <div>{record.date}</div>
                          <div className="text-[10px] text-purple-400">{record.timeFormatted}</div>
                        </td>

                        <td className="py-3 px-4 text-purple-300/80">
                          <div>{record.shiftNotes || 'Standard shift'}</div>
                          {record.shiftDurationHours ? (
                            <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                              Duration: {record.shiftDurationHours} hrs
                            </div>
                          ) : null}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteAttendance(record.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/40 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR MODAL */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#140a12] border border-red-500/50 p-6 text-center space-y-4">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white uppercase font-display">
              Clear All Attendance Records?
            </h3>
            <p className="text-xs text-red-200/80">
              Are you sure you want to permanently clear all attendance entries?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="w-1/2 py-2 rounded-lg bg-purple-950/60 text-purple-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllAttendance();
                  setConfirmClearModal(false);
                }}
                className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Clear Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
