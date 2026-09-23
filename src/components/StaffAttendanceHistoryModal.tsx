import React, { useState, useMemo } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { StaffMember, AttendanceRecord } from '../types/index';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Shield,
  FileText,
  Percent,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { getTodayIST, formatISTTime, formatISTDateReadable } from '../utils/timeUtils';

interface StaffAttendanceHistoryModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffAttendanceHistoryModal: React.FC<StaffAttendanceHistoryModalProps> = ({
  staff,
  isOpen,
  onClose,
}) => {
  const { attendanceRecords } = useVoidMC();
  const todayIST = useMemo(() => getTodayIST(), []);

  const [selectedYear, setSelectedYear] = useState<number>(todayIST.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayIST.month); // 0-indexed

  // Filter records for this staff member
  const staffRecords = useMemo(() => {
    if (!staff) return [];
    return attendanceRecords.filter(r => r.staffId === staff.id);
  }, [staff, attendanceRecords]);

  // Compute month breakdown and days
  const monthData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });

    const isCurrentMonth =
      todayIST.year === selectedYear && todayIST.month === selectedMonth;
    const currentDay = isCurrentMonth ? todayIST.day : daysInMonth;

    const days: {
      day: number;
      dateStr: string;
      status: 'present' | 'absent' | 'unmarked_today' | 'future';
      record?: AttendanceRecord;
    }[] = [];

    const presentDates: { date: string; time: string; hours?: number; notes?: string }[] = [];
    const absentDates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = staffRecords.find(r => r.date === dayStr);

      const isFuture = isCurrentMonth ? day > currentDay : false;
      const isToday = isCurrentMonth && day === currentDay;

      let status: 'present' | 'absent' | 'unmarked_today' | 'future' = 'future';

      if (record && record.status === 'present') {
        status = 'present';
        presentDates.push({
          date: dayStr,
          time: record.timeFormatted || formatISTTime(record.timestamp),
          hours: record.shiftDurationHours || 2,
          notes: record.shiftNotes || 'Standard shift',
        });
      } else if (record && record.status === 'absent') {
        status = 'absent';
        absentDates.push(dayStr);
      } else if (isToday) {
        status = 'unmarked_today';
      } else if (!isFuture) {
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
    const totalDaysCounted = presentCount + absentCount;
    const rate = totalDaysCounted > 0 ? Math.round((presentCount / totalDaysCounted) * 100) : 0;

    return {
      monthName,
      daysInMonth,
      days,
      presentDates,
      absentDates,
      presentCount,
      absentCount,
      rate,
    };
  }, [selectedYear, selectedMonth, staffRecords, todayIST]);

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

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#0e0824] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Profile Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-purple-950/90 via-[#1e1040] to-purple-950/90 border-b border-purple-500/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={staff.avatarUrl || `https://minotar.net/helm/${encodeURIComponent(staff.minecraftIgn)}/100.png`}
                alt={staff.name}
                className="w-16 h-16 rounded-2xl bg-purple-950 border-2 border-purple-400/60 object-cover shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#0e0824]">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-white uppercase tracking-wider font-display">
                  {staff.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-purple-900/80 border border-purple-400/40 text-xs font-bold text-purple-200 uppercase font-mono">
                  {staff.role}
                </span>
                {staff.isAdmin && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 uppercase font-mono">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-purple-300/80 font-mono mt-1 flex-wrap">
                <span>IGN: <strong className="text-white">{staff.minecraftIgn}</strong></span>
                <span>•</span>
                <span>Dept: <strong>{staff.department || 'Staff Team'}</strong></span>
                <span>•</span>
                <span>Total Recorded Shifts: <strong>{staffRecords.length}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Month Switcher & Overview Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#150d33] p-4 rounded-2xl border border-purple-500/25">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Monthly Attendance History
                </span>
                <span className="text-[11px] text-purple-400/70 font-mono">
                  All timestamps recorded in India Standard Time (IST)
                </span>
              </div>
            </div>

            {/* Switcher */}
            <div className="flex items-center gap-2 bg-[#0c061e] p-1.5 rounded-xl border border-purple-500/30">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-purple-100 px-3 min-w-[130px] text-center font-display uppercase">
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

          {/* Month Stats Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/25">
              <span className="text-[11px] text-purple-300 block mb-1">Month Period</span>
              <span className="text-sm font-bold text-white font-mono">{monthData.daysInMonth} Days</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 block mb-1">Days Present</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                {monthData.presentCount} Days
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30">
              <span className="text-[11px] text-red-300 block mb-1">Days Absent</span>
              <span className="text-sm font-bold text-red-400 flex items-center gap-1.5 font-mono">
                <XCircle className="w-4 h-4" />
                {monthData.absentCount} Days
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
              <span className="text-[11px] text-indigo-300 block mb-1">Attendance Rate</span>
              <span className="text-sm font-bold text-indigo-300 font-mono">
                {monthData.rate}%
              </span>
            </div>
          </div>

          {/* Calendar Visual Grid */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider block">
              {monthData.monthName} — Day-by-Day Attendance Grid
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {monthData.days.map(d => (
                <div
                  key={d.day}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    d.status === 'present'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-sm'
                      : d.status === 'absent'
                      ? 'bg-red-950/50 border-red-500/40 text-red-200'
                      : d.status === 'unmarked_today'
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-200 animate-pulse'
                      : 'bg-purple-950/20 border-purple-900/30 text-purple-400/40'
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
                      <span className="text-[10px] block opacity-40 font-mono">—</span>
                    )}
                  </div>
                  {d.record && (
                    <div className="text-[9px] text-purple-300/80 font-mono mt-0.5 truncate" title={d.record.timeFormatted}>
                      {d.record.timeFormatted || formatISTTime(d.record.timestamp)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Specific Absent Dates & Present Dates breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Absent Dates */}
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-300 font-bold text-xs uppercase tracking-wide">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Specific Dates Absent ({monthData.absentDates.length})</span>
                </div>
                <span className="text-[10px] text-red-400 font-mono">Unmarked</span>
              </div>

              {monthData.absentDates.length === 0 ? (
                <p className="text-xs text-emerald-300/90 italic p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/20">
                  🎉 Perfect attendance! No absent dates recorded in {monthData.monthName}.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
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

            {/* Present Dates */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Specific Dates Present ({monthData.presentDates.length})</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Verified IST</span>
              </div>

              {monthData.presentDates.length === 0 ? (
                <p className="text-xs text-purple-300/70 italic p-3 bg-purple-950/30 rounded-lg border border-purple-500/20">
                  No present records for this month yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {monthData.presentDates.map(p => (
                    <div
                      key={p.date}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs"
                    >
                      <span className="font-mono font-bold text-emerald-200">{p.date}</span>
                      <span className="font-mono text-emerald-300 text-[11px]">{p.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Complete Chronological Shift Logs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider font-display">
                Complete Shift Submissions & Time Log ({staffRecords.length})
              </span>
              <span className="text-[11px] text-purple-400 font-mono">All Time Records</span>
            </div>

            {staffRecords.length === 0 ? (
              <div className="p-6 text-center text-xs text-purple-400/60 bg-purple-950/20 rounded-xl border border-purple-900/30">
                No shift submissions found for this staff member.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-purple-900/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#180f38] border-b border-purple-900/40 text-purple-300 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Exact Time (IST)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Shift Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/60 bg-[#120a2e]/60">
                    {staffRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-purple-950/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-white font-medium">
                          {rec.date}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-purple-300">
                          {rec.timeFormatted || formatISTTime(rec.timestamp)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rec.status === 'present'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-purple-200 font-mono">
                          {rec.shiftDurationHours ? `${rec.shiftDurationHours} hrs` : '2 hrs'}
                        </td>
                        <td className="py-2.5 px-3 text-purple-300/80 max-w-xs truncate">
                          {rec.shiftNotes || 'Standard shift'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#120a2c] border-t border-purple-900/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
