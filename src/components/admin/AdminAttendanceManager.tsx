import React, { useState, useMemo } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import { StaffMember, AttendanceRecord } from '../../types/index';
import {
  CalendarDays,
  Search,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { StaffAttendanceHistoryModal } from '../StaffAttendanceHistoryModal';
import { getTodayIST, formatISTTime, formatISTDateReadable } from '../../utils/timeUtils';

export const AdminAttendanceManager: React.FC = () => {
  const {
    staffList,
    attendanceRecords,
    deleteAttendance,
    clearAllAttendance,
  } = useVoidMC();

  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const todayIST = useMemo(() => getTodayIST(), []);

  // Filter States
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD or empty for all
  const [selectedMonth, setSelectedMonth] = useState<number>(todayIST.month);
  const [selectedYear, setSelectedYear] = useState<number>(todayIST.year);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected staff for full modal inspection
  const [inspectedStaff, setInspectedStaff] = useState<StaffMember | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Month navigation
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

  const currentMonthName = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedYear, selectedMonth]);

  // Compute staff member monthly stats
  const staffMonthlySummaries = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const isCurrentMonth =
      todayIST.year === selectedYear && todayIST.month === selectedMonth;
    const currentDay = isCurrentMonth ? todayIST.day : daysInMonth;

    return staffList.map(staff => {
      const records = attendanceRecords.filter(r => r.staffId === staff.id);
      
      const presentDates: string[] = [];
      const absentDates: string[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = records.find(r => r.date === dayStr);

        const isFuture = isCurrentMonth ? day > currentDay : false;
        const isToday = isCurrentMonth && day === currentDay;

        if (record && record.status === 'present') {
          presentDates.push(dayStr);
        } else if (record && record.status === 'absent') {
          absentDates.push(dayStr);
        } else if (!isToday && !isFuture) {
          absentDates.push(dayStr);
        }
      }

      const totalCounted = presentDates.length + absentDates.length;
      const rate = totalCounted > 0 ? Math.round((presentDates.length / totalCounted) * 100) : 0;

      // Check today's record in IST
      const todayRecord = records.find(r => r.date === todayIST.dateStr);

      return {
        staff,
        presentDates,
        absentDates,
        presentCount: presentDates.length,
        absentCount: absentDates.length,
        rate,
        todayRecord,
        isMarkedToday: !!todayRecord && todayRecord.status === 'present',
      };
    });
  }, [staffList, attendanceRecords, selectedYear, selectedMonth, todayIST]);

  // Filtered raw records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      // Staff filter
      if (selectedStaffId !== 'all' && record.staffId !== selectedStaffId) {
        return false;
      }

      // Date filter
      if (selectedDate && record.date !== selectedDate) {
        return false;
      }

      // Month filter (if no specific date is picked)
      if (!selectedDate) {
        const [yearStr, monthStr] = record.date.split('-');
        if (parseInt(yearStr, 10) !== selectedYear || parseInt(monthStr, 10) - 1 !== selectedMonth) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = record.staffName.toLowerCase().includes(q);
        const matchIgn = record.minecraftIgn.toLowerCase().includes(q);
        const matchRole = record.staffRole.toLowerCase().includes(q);
        const matchNotes = (record.shiftNotes || '').toLowerCase().includes(q);
        if (!matchName && !matchIgn && !matchRole && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [attendanceRecords, selectedStaffId, selectedDate, selectedYear, selectedMonth, statusFilter, searchQuery]);

  // Global Analytics
  const totalCheckedInToday = staffMonthlySummaries.filter(s => s.isMarkedToday).length;
  const totalPendingToday = staffList.length - totalCheckedInToday;
  const avgMonthlyRate =
    staffMonthlySummaries.length > 0
      ? Math.round(
          staffMonthlySummaries.reduce((acc, curr) => acc + curr.rate, 0) / staffMonthlySummaries.length
        )
      : 0;

  const handleOpenStaffHistory = (staff: StaffMember) => {
    setInspectedStaff(staff);
    setIsHistoryModalOpen(true);
  };

  const handleClearAll = async () => {
    await clearAllAttendance();
    setIsClearConfirmOpen(false);
    setLocalFeedback('All attendance records successfully purged.');
    setTimeout(() => setLocalFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="rounded-2xl bg-gradient-to-r from-[#140b2f] via-[#1c1040] to-[#140b2f] border border-purple-500/30 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-md">
              <CalendarDays className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                  Staff Attendance Management
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 uppercase">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
                Real-time staff check-in tracking, complete monthly history, absent date audits, and IST timestamps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Attendance</span>
            </button>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/25">
            <span className="text-[11px] text-purple-300 block mb-1">Total Staff Tracked</span>
            <span className="text-lg font-black text-white font-mono">{staffList.length} Staff</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-300 block mb-1">Checked In Today (IST)</span>
            <span className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {totalCheckedInToday} / {staffList.length}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <span className="text-[11px] text-amber-300 block mb-1">Pending Check-In Today</span>
            <span className="text-lg font-black text-amber-300 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {totalPendingToday} Pending
            </span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
            <span className="text-[11px] text-indigo-300 block mb-1">Avg Month Rate ({currentMonthName})</span>
            <span className="text-lg font-black text-indigo-300 font-mono">
              {avgMonthlyRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Control & Filter Panel */}
      <div className="rounded-2xl bg-[#110927] border border-purple-500/30 p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 border-b border-purple-900/40 pb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
              Filters & Month Selection
            </span>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center gap-2 bg-[#180f38] p-1.5 rounded-xl border border-purple-500/30">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-purple-100 px-2 min-w-[130px] text-center font-display uppercase">
              {currentMonthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Staff Member Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-purple-300 mb-1">
              Filter by Staff Member
            </label>
            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="w-full bg-[#180f38] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Staff Members ({staffList.length})</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role}) - {s.minecraftIgn}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-purple-300 mb-1">
              Filter by Specific Date
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-[#180f38] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="px-2 py-2 rounded-xl bg-purple-950 text-purple-300 hover:text-white text-xs border border-purple-500/30 cursor-pointer"
                  title="Clear date filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-purple-300 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#180f38] border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-purple-300 mb-1">
              Search Staff / Notes
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search IGN, rank, name..."
                className="w-full bg-[#180f38] border border-purple-500/30 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ALL STAFF MONTHLY ATTENDANCE CARDS & OVERVIEW TABLE */}
      <div className="rounded-2xl bg-[#0f0a24] border border-purple-500/30 overflow-hidden shadow-xl space-y-0">
        <div className="p-4 sm:p-5 bg-[#140c2e] border-b border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Staff Monthly Breakdown ({currentMonthName})
            </h3>
            <p className="text-xs text-purple-300/70">
              Click "View Complete History" on any staff member to view full monthly calendar and specific absent dates.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400">
            {staffMonthlySummaries.length} Staff Accounts Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-900/50 bg-[#170e36] text-purple-300 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Rank / IGN</th>
                <th className="py-3.5 px-4">Today ({todayIST.dateStr})</th>
                <th className="py-3.5 px-4">Month Stats</th>
                <th className="py-3.5 px-4">Specific Absent Dates</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-950/60 bg-[#0e0824]">
              {staffMonthlySummaries.map(item => {
                const isSelected = selectedStaffId !== 'all' && selectedStaffId === item.staff.id;
                if (selectedStaffId !== 'all' && selectedStaffId !== item.staff.id) {
                  return null;
                }

                return (
                  <tr
                    key={item.staff.id}
                    className={`hover:bg-purple-950/30 transition-colors ${
                      isSelected ? 'bg-purple-950/40' : ''
                    }`}
                  >
                    {/* Staff Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.staff.avatarUrl || `https://minotar.net/helm/${encodeURIComponent(item.staff.minecraftIgn)}/100.png`}
                          alt={item.staff.name}
                          className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-400/40 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{item.staff.name}</span>
                            {item.staff.isAdmin && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-[9px] font-bold text-amber-300">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-purple-300/70">{item.staff.department || 'Staff Team'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Rank & Minecraft IGN */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-200 uppercase">
                        {item.staff.role}
                      </span>
                      <div className="text-[11px] text-purple-300 font-mono mt-0.5">
                        IGN: <strong className="text-white">{item.staff.minecraftIgn}</strong>
                      </div>
                    </td>

                    {/* Today's Status */}
                    <td className="py-3.5 px-4">
                      {item.isMarkedToday ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            PRESENT
                          </span>
                          <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">
                            {item.todayRecord?.timeFormatted || formatISTTime(item.todayRecord?.timestamp)}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300">
                          <Clock className="w-3 h-3" />
                          Pending Check-in
                        </span>
                      )}
                    </td>

                    {/* Month Stats */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {item.rate}%
                        </span>
                        <span className="text-[10px] text-purple-300/70 font-mono">
                          ({item.presentCount}P / {item.absentCount}A)
                        </span>
                      </div>
                      <div className="w-24 bg-purple-950 rounded-full h-1.5 mt-1 border border-purple-900 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                          style={{ width: `${item.rate}%` }}
                        />
                      </div>
                    </td>

                    {/* Specific Absent Dates (Chips preview) */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {item.absentDates.length === 0 ? (
                        <span className="text-[11px] text-emerald-300 font-medium italic">
                          🎉 0 Absent Days
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                          {item.absentDates.slice(0, 3).map(d => (
                            <span
                              key={d}
                              className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-[10px] font-mono"
                            >
                              {d.split('-').slice(1).join('/')}
                            </span>
                          ))}
                          {item.absentDates.length > 3 && (
                            <span className="text-[10px] text-red-400 font-mono font-bold">
                              +{item.absentDates.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions: View Complete History */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenStaffHistory(item.staff)}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs transition-all flex items-center gap-1.5 ml-auto shadow-md shadow-purple-900/30 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View History</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: DETAILED RECORD AUDIT TRAIL */}
      <div className="rounded-2xl bg-[#0f0a24] border border-purple-500/30 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 bg-[#140c2e] border-b border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Filtered Attendance Log Entries ({filteredRecords.length})
            </h3>
            <p className="text-xs text-purple-300/70">
              Showing exact check-in timestamps in India Standard Time (IST).
            </p>
          </div>
          <span className="text-xs text-purple-400 font-mono">
            {selectedDate ? `Date: ${selectedDate}` : `Month: ${currentMonthName}`}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-purple-400 text-xs bg-[#0e0824] space-y-2">
            <Calendar className="w-8 h-8 text-purple-500/40 mx-auto" />
            <p>No attendance logs match the current filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-900/50 bg-[#160e36] text-purple-300 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Exact Date & Time (IST)</th>
                  <th className="py-3.5 px-4">Shift Details</th>
                  <th className="py-3.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60 bg-[#0e0824]">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={record.avatarUrl}
                          alt={record.staffName}
                          className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/30 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-bold text-white block">{record.staffName}</span>
                          <span className="text-[10px] text-purple-400 font-mono">IGN: {record.minecraftIgn}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-900/40 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase">
                        {record.staffRole}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          record.status === 'present'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-purple-200 font-mono">
                      <div className="text-white font-medium">{record.date}</div>
                      <div className="text-[11px] text-purple-300">
                        {record.timeFormatted || formatISTTime(record.timestamp)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-purple-300/80">
                      <div>{record.shiftNotes || 'Standard shift'}</div>
                      {record.shiftDurationHours ? (
                        <div className="text-[10px] text-amber-400 font-semibold font-mono">
                          Duration: {record.shiftDurationHours} hrs
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={async () => {
                          await deleteAttendance(record.id);
                          setLocalFeedback('Attendance record removed.');
                          setTimeout(() => setLocalFeedback(null), 2000);
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/40 transition-colors cursor-pointer"
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

      {/* Staff Full Attendance History Modal */}
      {inspectedStaff && (
        <StaffAttendanceHistoryModal
          staff={inspectedStaff}
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setInspectedStaff(null);
          }}
        />
      )}

      {/* Clear All Attendance Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#120826] border border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Attendance Records?</h3>
                <p className="text-xs text-purple-300/70">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-purple-200/90 leading-relaxed">
              Are you sure you want to permanently clear all staff attendance logs across the system? This will reset all staff monthly attendance records to empty.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-xs font-semibold text-purple-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
