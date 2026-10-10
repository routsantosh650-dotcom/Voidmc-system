import React, { useState, useMemo, useRef } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import { StaffMember, AttendanceRecord } from '../../types';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  UserCheck,
  AlertCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users,
  Percent,
  FileText,
  Sparkles,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { getTodayIST, formatISTTime } from '../../utils/timeUtils';

export const AttendanceView: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    staffList,
    attendanceRecords,
    markAttendance,
    adminMarkAttendance,
    deleteAttendance,
    clearAllAttendance,
    setShowStaffLoginModal,
  } = useVoidMC();

  const todayIST = useMemo(() => getTodayIST(), []);
  const todayStr = todayIST.dateStr;

  // Selected Staff Profile (Tapped by user)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(
    currentUser?.id || (staffList.length > 0 ? staffList[0].id : null)
  );
  const detailSectionRef = useRef<HTMLDivElement>(null);

  // Search for Staff Profiles Grid
  const [profileSearch, setProfileSearch] = useState('');

  // Self Check-In Form State
  const [shiftHours, setShiftHours] = useState<number>(2);
  const [shiftNotes, setShiftNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Month navigation (in IST)
  const [selectedYear, setSelectedYear] = useState<number>(todayIST.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayIST.month); // 0-indexed

  // Individual Log scope ('month' | 'all')
  const [logScope, setLogScope] = useState<'month' | 'all'>('month');

  // Admin date action popover / modal state
  const [adminSelectedDate, setAdminSelectedDate] = useState<string | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [adminHoursInput, setAdminHoursInput] = useState<number>(2);
  const [adminMarking, setAdminMarking] = useState(false);

  // Confirm Clear All Modal
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Selected Staff object
  const selectedStaff: StaffMember | null = useMemo(() => {
    if (!staffList.length) return null;
    if (selectedStaffId) {
      const found = staffList.find(s => s.id === selectedStaffId);
      if (found) return found;
    }
    return currentUser || staffList[0];
  }, [staffList, selectedStaffId, currentUser]);

  // Current logged-in user's record today
  const myRecordToday = useMemo(() => {
    if (!currentUser) return undefined;
    return attendanceRecords.find(r => r.staffId === currentUser.id && r.date === todayStr);
  }, [attendanceRecords, currentUser, todayStr]);

  // Handle Self Attendance Mark (Present = Blue, Absent = Red)
  const handleSelfMark = async (status: 'present' | 'absent') => {
    if (!currentUser) {
      setShowStaffLoginModal(true);
      return;
    }
    setSubmitting(true);
    setFeedbackMsg(null);
    const defaultNote =
      status === 'present' ? 'Active duty shift completed' : 'Unable to attend shift today';
    const res = await markAttendance(status, shiftNotes.trim() || defaultNote, status === 'present' ? shiftHours : 0);
    setSubmitting(false);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: `Attendance recorded: Marked ${status.toUpperCase()} on ${todayStr} (IST)!`,
      });
      setShiftNotes('');
      setSelectedStaffId(currentUser.id);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Handle Admin Marking any date on selected staff's calendar
  const handleAdminMarkDate = async (dateStr: string, status: 'present' | 'absent' | 'unmarked') => {
    if (!selectedStaff || !isAdmin) return;
    setAdminMarking(true);
    const res = await adminMarkAttendance(
      selectedStaff.id,
      dateStr,
      status,
      adminNotesInput.trim() || undefined,
      status === 'present' ? adminHoursInput : 0
    );
    setAdminMarking(false);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setAdminSelectedDate(null);
      setAdminNotesInput('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Month Navigation
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
    setAdminSelectedDate(null);
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
    setAdminSelectedDate(null);
  };

  const monthName = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth]);

  // Calculate monthly stats for EVERY staff member (for the Profile Cards Grid)
  const staffProfilesSummary = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;

    return staffList
      .filter(s => {
        if (!profileSearch.trim()) return true;
        const q = profileSearch.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.minecraftIgn.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          (s.department || '').toLowerCase().includes(q)
        );
      })
      .map(staff => {
        const allStaffRecords = attendanceRecords.filter(r => r.staffId === staff.id);
        const monthRecords = allStaffRecords.filter(r => r.date.startsWith(monthPrefix));

        const presentCount = monthRecords.filter(r => r.status === 'present').length;
        const absentCount = monthRecords.filter(r => r.status === 'absent').length;
        const totalMarked = presentCount + absentCount;
        const percentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

        const todayRecord = allStaffRecords.find(r => r.date === todayStr);

        return {
          staff,
          presentCount,
          absentCount,
          totalMarked,
          percentage,
          todayRecord,
          totalLogsCount: allStaffRecords.length,
        };
      });
  }, [staffList, attendanceRecords, selectedYear, selectedMonth, profileSearch, todayStr]);

  // Calculate detailed Calendar & Individual Logs for the SELECTED (tapped) staff member
  const selectedStaffDetail = useMemo(() => {
    if (!selectedStaff) return null;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;

    const allMemberRecords = attendanceRecords
      .filter(r => r.staffId === selectedStaff.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);

    const monthMemberRecords = allMemberRecords.filter(r => r.date.startsWith(monthPrefix));

    const days: {
      day: number;
      dateStr: string;
      status: 'present' | 'absent' | 'unmarked';
      isToday: boolean;
      record?: AttendanceRecord;
    }[] = [];

    const presentDates: AttendanceRecord[] = [];
    const absentDates: AttendanceRecord[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = monthMemberRecords.find(r => r.date === dayStr);
      const isToday = dayStr === todayStr;

      let status: 'present' | 'absent' | 'unmarked' = 'unmarked';
      if (record?.status === 'present') {
        status = 'present';
        presentDates.push(record);
      } else if (record?.status === 'absent') {
        status = 'absent';
        absentDates.push(record);
      }

      days.push({
        day,
        dateStr: dayStr,
        status,
        isToday,
        record,
      });
    }

    const presentCount = presentDates.length;
    const absentCount = absentDates.length;
    const totalMarked = presentCount + absentCount;
    const attendancePercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    return {
      daysInMonth,
      firstDayOfWeek,
      days,
      presentDates,
      absentDates,
      presentCount,
      absentCount,
      totalMarked,
      attendancePercentage,
      monthMemberRecords,
      allMemberRecords,
    };
  }, [selectedStaff, selectedYear, selectedMonth, attendanceRecords, todayStr]);

  const handleSelectProfile = (staffId: string) => {
    setSelectedStaffId(staffId);
    setAdminSelectedDate(null);
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* TOP HEADER BANNER */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#120a2a] via-[#180f38] to-[#120a2a] border border-purple-500/30 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/30 border border-blue-500/40 text-blue-300 shadow-lg">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                  Staff Attendance & Profile Logs
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[10px] font-bold text-blue-300 uppercase tracking-wide">
                  Blue = Present • Red = Absent
                </span>
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Tap on any staff member&apos;s profile below to view their monthly attendance calendar, percentage, and individual log.
              </p>
            </div>
          </div>

          {/* Month Selector in Header */}
          <div className="flex items-center gap-2 bg-[#0e0720] p-1.5 rounded-xl border border-purple-500/30 self-start sm:self-auto">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-3 min-w-[130px] text-center font-display uppercase tracking-wider">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: TODAY'S ATTENDANCE CHECK-IN (Manual Only — No Auto-Marking) */}
      <div className="rounded-2xl bg-[#0f0a24] border border-purple-500/35 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-900/40 pb-4 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Mark Today&apos;s Attendance ({todayStr} IST)
            </h2>
          </div>
          <span className="text-xs text-purple-300 font-mono">
            Manual Check-In Only • Zero Auto-Marking
          </span>
        </div>

        {feedbackMsg && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-blue-950/80 border-blue-500/50 text-blue-200'
                : 'bg-red-950/80 border-red-500/50 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#170f38]/70 border border-purple-500/30 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-400/50 object-cover shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-white">{currentUser.name}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30 text-[10px] font-bold text-purple-200 uppercase tracking-wide">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-300/80 font-mono mt-0.5">
                    <span>IGN: <strong className="text-purple-200">{currentUser.minecraftIgn}</strong></span>
                    <span>•</span>
                    <span>Dept: {currentUser.department || 'Staff Team'}</span>
                  </div>
                </div>
              </div>

              {/* Today's Status Indicator */}
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block mb-1">
                  My Status Today ({todayStr}):
                </span>
                {myRecordToday ? (
                  myRecordToday.status === 'present' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600/25 border border-blue-400/50 text-blue-300">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      PRESENT ({myRecordToday.timeFormatted})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/25 border border-red-500/50 text-red-300">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      ABSENT ({myRecordToday.timeFormatted})
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Not Marked Yet Today
                  </span>
                )}
              </div>
            </div>

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
                    className="w-full px-3 py-2 rounded-xl bg-[#1b1240] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    Duty Summary / Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={shiftNotes}
                    onChange={e => setShiftNotes(e.target.value)}
                    placeholder="e.g. Handled player tickets, spawn patrol, or reason for absence"
                    className="w-full px-3 py-2 rounded-xl bg-[#1b1240] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelfMark('present')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Present (Blue)</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelfMark('absent')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Mark Absent (Red)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-5 space-y-3">
            <p className="text-xs text-purple-300/80">
              Sign in with your staff account to mark your daily attendance. You can still tap any staff profile below to view their attendance calendar and individual log.
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

      {/* SECTION 2: ALL STAFF PROFILES GRID (Tap on any profile to view their attendance) */}
      <div className="rounded-2xl bg-[#0f0a24] border border-purple-500/35 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-display">
                Staff Profiles — Tap Any Profile to View Attendance ({staffProfilesSummary.length})
              </h2>
              <p className="text-xs text-purple-300/70">
                Select a staff member to inspect their {monthName} calendar (Blue = Present, Red = Absent), monthly percentage, and individual log
              </p>
            </div>
          </div>

          {/* Search Staff Profile */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={profileSearch}
              onChange={e => setProfileSearch(e.target.value)}
              placeholder="Search staff profile..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#170f38] border border-purple-500/30 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Staff Profile Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffProfilesSummary.map(item => {
            const isSelected = selectedStaff?.id === item.staff.id;
            return (
              <div
                key={item.staff.id}
                onClick={() => handleSelectProfile(item.staff.id)}
                className={`group relative rounded-2xl p-4 border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#1d1245] via-[#17113a] to-[#120b2e] border-blue-400 shadow-lg shadow-blue-950/50 ring-2 ring-blue-500/40'
                    : 'bg-[#140c30]/80 hover:bg-[#19103c] border-purple-500/25 hover:border-purple-400/50'
                }`}
              >
                {/* Top Row: Avatar, Name, Role & Monthly Percentage Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={
                          item.staff.avatarUrl ||
                          `https://minotar.net/helm/${encodeURIComponent(item.staff.minecraftIgn)}/100.png`
                        }
                        alt={item.staff.name}
                        className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-400/40 object-cover shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      {/* Today status dot */}
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#140c30] ${
                          item.todayRecord?.status === 'present'
                            ? 'bg-blue-400'
                            : item.todayRecord?.status === 'absent'
                            ? 'bg-red-500'
                            : 'bg-slate-500'
                        }`}
                        title={
                          item.todayRecord
                            ? `Today: ${item.todayRecord.status.toUpperCase()}`
                            : 'Not Marked Today'
                        }
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-200 transition-colors">
                        {item.staff.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/30 text-[10px] font-bold text-purple-200 uppercase font-mono mt-0.5">
                        {item.staff.role}
                      </span>
                      <div className="text-[11px] text-purple-300/70 font-mono truncate mt-0.5">
                        IGN: {item.staff.minecraftIgn}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Percentage Pill */}
                  <div className="text-right shrink-0">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${
                        item.totalMarked === 0
                          ? 'bg-purple-950/60 border-purple-500/30 text-purple-300'
                          : item.percentage >= 75
                          ? 'bg-blue-600/25 border-blue-400/50 text-blue-300'
                          : item.percentage >= 50
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-red-600/25 border-red-500/50 text-red-300'
                      }`}
                    >
                      <span>{item.percentage}%</span>
                    </div>
                    <span className="block text-[9px] text-purple-400 font-mono mt-0.5 uppercase">
                      Monthly Rate
                    </span>
                  </div>
                </div>

                {/* Progress Bar (Blue vs Red) */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-[#0b061a] border border-purple-900/50 overflow-hidden flex">
                    {item.totalMarked > 0 ? (
                      <>
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                        <div
                          className="bg-red-500 h-full transition-all duration-300"
                          style={{ width: `${100 - item.percentage}%` }}
                        />
                      </>
                    ) : (
                      <div className="bg-purple-900/30 h-full w-full" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
                    <span className="text-blue-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {item.presentCount} Present
                    </span>
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {item.absentCount} Absent
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                          : 'text-purple-400 group-hover:text-purple-200'
                      }`}
                    >
                      {isSelected ? '✓ Viewing' : 'Tap to View →'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: TAPPED STAFF MEMBER'S CALENDAR, MONTHLY PERCENTAGE & INDIVIDUAL LOG */}
      {selectedStaff && selectedStaffDetail && (
        <div
          ref={detailSectionRef}
          className="rounded-3xl bg-[#0e0824] border-2 border-blue-500/40 p-5 sm:p-7 shadow-2xl space-y-6"
        >
          {/* Selected Staff Profile Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#170e38] via-[#1d1245] to-[#170e38] p-5 rounded-2xl border border-purple-500/30">
            <div className="flex items-center gap-4">
              <img
                src={
                  selectedStaff.avatarUrl ||
                  `https://minotar.net/helm/${encodeURIComponent(selectedStaff.minecraftIgn)}/100.png`
                }
                alt={selectedStaff.name}
                className="w-16 h-16 rounded-2xl bg-purple-950 border-2 border-blue-400/60 object-cover shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                    {selectedStaff.name}&apos;s Attendance
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-900/80 border border-purple-400/40 text-xs font-bold text-purple-200 uppercase font-mono">
                    {selectedStaff.role}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-purple-300/80 font-mono mt-1 flex-wrap">
                  <span>IGN: <strong className="text-white">{selectedStaff.minecraftIgn}</strong></span>
                  <span>•</span>
                  <span>Department: <strong>{selectedStaff.department || 'Staff Team'}</strong></span>
                  <span>•</span>
                  <span>Individual Logs: <strong>{selectedStaffDetail.allMemberRecords.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Month Switcher inside Selected Profile */}
            <div className="flex items-center gap-2 bg-[#0c061e] p-1.5 rounded-xl border border-purple-500/30 self-start md:self-auto">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white px-3 min-w-[130px] text-center font-display uppercase">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MONTHLY PERCENTAGE & STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Monthly Attendance Percentage */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/50 to-indigo-950/40 border border-blue-400/40 shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                  Monthly Percentage
                </span>
                <Percent className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {selectedStaffDetail.attendancePercentage}%
              </div>
              <div className="w-full h-2 rounded-full bg-[#090516] border border-blue-900/50 overflow-hidden flex mt-2">
                {selectedStaffDetail.totalMarked > 0 && (
                  <>
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${selectedStaffDetail.attendancePercentage}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${100 - selectedStaffDetail.attendancePercentage}%` }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Present Days (BLUE) */}
            <div className="p-4 rounded-2xl bg-blue-950/35 border border-blue-500/40">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wide block mb-1">
                Present Days (Blue)
              </span>
              <div className="text-2xl font-black text-blue-400 font-mono flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-400" />
                <span>{selectedStaffDetail.presentCount} Days</span>
              </div>
              <span className="text-[11px] text-blue-300/70 font-mono block mt-1">
                Marked Present in {monthName}
              </span>
            </div>

            {/* Absent Days (RED) */}
            <div className="p-4 rounded-2xl bg-red-950/35 border border-red-500/40">
              <span className="text-xs font-bold text-red-300 uppercase tracking-wide block mb-1">
                Absent Days (Red)
              </span>
              <div className="text-2xl font-black text-red-400 font-mono flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-400" />
                <span>{selectedStaffDetail.absentCount} Days</span>
              </div>
              <span className="text-[11px] text-red-300/70 font-mono block mt-1">
                Marked Absent in {monthName}
              </span>
            </div>

            {/* Total Marked / Days in Month */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wide block mb-1">
                Total Marked Days
              </span>
              <div className="text-2xl font-black text-white font-mono">
                {selectedStaffDetail.totalMarked} / {selectedStaffDetail.daysInMonth}
              </div>
              <span className="text-[11px] text-purple-300/70 font-mono block mt-1">
                {monthName} Calendar
              </span>
            </div>
          </div>

          {/* MONTHLY CALENDAR (BLUE = PRESENT, RED = ABSENT) */}
          <div className="space-y-3 bg-[#130b2e]/70 p-4 sm:p-6 rounded-2xl border border-purple-500/25">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-purple-900/40">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                  <span>{selectedStaff.name} — {monthName} Attendance Calendar</span>
                </h3>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  {isAdmin
                    ? 'Admin Mode: Tap any date on the calendar below to mark Present (Blue), Absent (Red), or Clear.'
                    : 'Blue dates indicate Present shifts; Red dates indicate Absent days.'}
                </p>
              </div>

              {/* Color Legend */}
              <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <span className="w-3 h-3 rounded bg-blue-500 border border-blue-300 shadow-sm shadow-blue-500/50" />
                  Blue = Present
                </span>
                <span className="flex items-center gap-1.5 text-red-300 font-bold">
                  <span className="w-3 h-3 rounded bg-red-600 border border-red-400 shadow-sm shadow-red-600/50" />
                  Red = Absent
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-3 rounded bg-purple-950 border border-purple-700" />
                  Unmarked
                </span>
              </div>
            </div>

            {/* Admin Date Editor Bar (when Admin taps a date cell on the calendar) */}
            {isAdmin && adminSelectedDate && (
              <div className="p-4 rounded-2xl bg-[#1b1040] border-2 border-amber-400/50 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Admin Attendance Control — {selectedStaff.name} on <span className="text-amber-300 font-mono">{adminSelectedDate}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setAdminSelectedDate(null)}
                    className="p-1 rounded-lg text-purple-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                      Shift Hours (if Present)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={adminHoursInput}
                      onChange={e => setAdminHoursInput(parseFloat(e.target.value) || 2)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#11092a] border border-purple-500/30 text-white text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                      Shift Note / Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      value={adminNotesInput}
                      onChange={e => setAdminNotesInput(e.target.value)}
                      placeholder="e.g. Verified shift or absent note..."
                      className="w-full px-3 py-1.5 rounded-xl bg-[#11092a] border border-purple-500/30 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    disabled={adminMarking}
                    onClick={() => handleAdminMarkDate(adminSelectedDate, 'present')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Set Present (Blue)</span>
                  </button>
                  <button
                    disabled={adminMarking}
                    onClick={() => handleAdminMarkDate(adminSelectedDate, 'absent')}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Set Absent (Red)</span>
                  </button>
                  <button
                    disabled={adminMarking}
                    onClick={() => handleAdminMarkDate(adminSelectedDate, 'unmarked')}
                    className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-500/30 text-purple-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Date</span>
                  </button>
                </div>
              </div>
            )}

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center pt-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                <div
                  key={dayName}
                  className="text-[11px] font-bold uppercase tracking-wider text-purple-400 py-1 font-mono"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty offset cells before the 1st of the month */}
              {Array.from({ length: selectedStaffDetail.firstDayOfWeek }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="p-2 rounded-xl bg-transparent border border-transparent min-h-[68px] sm:min-h-[80px]"
                />
              ))}

              {/* Actual Month Days */}
              {selectedStaffDetail.days.map(d => {
                const isSelectedDate = adminSelectedDate === d.dateStr;
                return (
                  <div
                    key={d.day}
                    onClick={() => {
                      if (isAdmin) {
                        setAdminSelectedDate(d.dateStr);
                        setAdminNotesInput(d.record?.shiftNotes || '');
                        setAdminHoursInput(d.record?.shiftDurationHours || 2);
                      }
                    }}
                    className={`relative p-2 sm:p-2.5 rounded-xl border text-center transition-all min-h-[68px] sm:min-h-[82px] flex flex-col justify-between ${
                      isAdmin ? 'cursor-pointer hover:scale-[1.02]' : ''
                    } ${
                      isSelectedDate ? 'ring-2 ring-amber-400' : ''
                    } ${
                      d.status === 'present'
                        ? 'bg-blue-600/35 border-blue-400 text-blue-100 shadow-md shadow-blue-950/60'
                        : d.status === 'absent'
                        ? 'bg-red-600/35 border-red-500 text-red-100 shadow-md shadow-red-950/60'
                        : d.isToday
                        ? 'bg-purple-900/40 border-purple-400/60 text-white'
                        : 'bg-[#0c071e]/80 border-purple-900/35 text-purple-400/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-black font-mono">{d.day}</span>
                      {d.isToday && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-[8px] font-bold text-amber-300 uppercase">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="my-1">
                      {d.status === 'present' && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/40 border border-blue-300/40 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white">
                          ✓ Present
                        </span>
                      )}
                      {d.status === 'absent' && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-red-600/40 border border-red-300/40 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white">
                          ✗ Absent
                        </span>
                      )}
                      {d.status === 'unmarked' && (
                        <span className="text-[10px] opacity-40 font-mono block">—</span>
                      )}
                    </div>

                    {d.record ? (
                      <div className="text-[8px] sm:text-[9px] font-mono opacity-85 truncate">
                        {d.record.timeFormatted}
                      </div>
                    ) : (
                      <div className="h-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: INDIVIDUAL ATTENDANCE LOG FOR SELECTED STAFF MEMBER ("individual log ek ek ka") */}
          <div className="space-y-4 bg-[#120b2c]/80 p-4 sm:p-6 rounded-2xl border border-purple-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-display">
                    {selectedStaff.name}&apos;s Individual Attendance Log
                  </h3>
                  <p className="text-xs text-purple-300/70">
                    Personal attendance history exclusively for {selectedStaff.name} ({selectedStaff.minecraftIgn})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#18103a] p-1 rounded-xl border border-purple-500/30">
                  <button
                    onClick={() => setLogScope('month')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      logScope === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                  >
                    {monthName} ({selectedStaffDetail.monthMemberRecords.length})
                  </button>
                  <button
                    onClick={() => setLogScope('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      logScope === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                  >
                    All Time ({selectedStaffDetail.allMemberRecords.length})
                  </button>
                </div>

                {isAdmin && attendanceRecords.length > 0 && (
                  <button
                    onClick={() => setConfirmClearModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Clear all attendance records"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Individual Log Table */}
            {(() => {
              const logsToShow =
                logScope === 'month'
                  ? selectedStaffDetail.monthMemberRecords
                  : selectedStaffDetail.allMemberRecords;

              if (logsToShow.length === 0) {
                return (
                  <div className="p-8 text-center text-purple-300/70 text-xs space-y-2 bg-[#0b061a]/60 rounded-xl border border-purple-900/30">
                    <Calendar className="w-8 h-8 mx-auto text-purple-500/40" />
                    <p>
                      No attendance logs recorded for <strong>{selectedStaff.name}</strong> in{' '}
                      {logScope === 'month' ? monthName : 'their history'} yet.
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto rounded-xl border border-purple-900/40 bg-[#0b061a]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-purple-900/50 bg-[#160e36] text-purple-300 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Recorded Time (IST)</th>
                        <th className="py-3 px-4">Shift Details / Notes</th>
                        {isAdmin && <th className="py-3 px-4 text-right">Admin Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-950/60">
                      {logsToShow.map(record => (
                        <tr key={record.id} className="hover:bg-purple-950/25 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {record.date}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                record.status === 'present'
                                  ? 'bg-blue-600/25 text-blue-300 border border-blue-400/50'
                                  : 'bg-red-600/25 text-red-300 border border-red-500/50'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  record.status === 'present' ? 'bg-blue-400' : 'bg-red-400'
                                }`}
                              />
                              {record.status === 'present' ? 'Present (Blue)' : 'Absent (Red)'}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-purple-200">
                            {record.timeFormatted || formatISTTime(record.timestamp)}
                          </td>

                          <td className="py-3 px-4 text-purple-300/90">
                            <div>{record.shiftNotes || 'Standard shift'}</div>
                            {record.status === 'present' && record.shiftDurationHours ? (
                              <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                                Shift Duration: {record.shiftDurationHours} hrs
                              </div>
                            ) : null}
                          </td>

                          {isAdmin && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => deleteAttendance(record.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/40 transition-colors cursor-pointer"
                                title="Delete this attendance log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
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
                className="w-1/2 py-2 rounded-lg bg-purple-950/60 text-purple-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllAttendance();
                  setConfirmClearModal(false);
                }}
                className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
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
