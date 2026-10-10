import React, { useState, useMemo } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { StaffMember, AttendanceRecord } from '../types/index';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Percent,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { getTodayIST, formatISTTime } from '../utils/timeUtils';

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
  const { attendanceRecords, isAdmin, adminMarkAttendance, deleteAttendance } = useVoidMC();
  const todayIST = useMemo(() => getTodayIST(), []);

  const [selectedYear, setSelectedYear] = useState<number>(todayIST.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayIST.month); // 0-indexed
  const [adminSelectedDate, setAdminSelectedDate] = useState<string | null>(null);
  const [adminMarking, setAdminMarking] = useState(false);

  // Filter records for this staff member
  const staffRecords = useMemo(() => {
    if (!staff) return [];
    return attendanceRecords
      .filter(r => r.staffId === staff.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);
  }, [staff, attendanceRecords]);

  // Compute month breakdown and days (No automatic marking — only actual records)
  const monthData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();
    const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
    const monthRecords = staffRecords.filter(r => r.date.startsWith(monthPrefix));

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
      const record = monthRecords.find(r => r.date === dayStr);
      const isToday = dayStr === todayIST.dateStr;

      let status: 'present' | 'absent' | 'unmarked' = 'unmarked';

      if (record && record.status === 'present') {
        status = 'present';
        presentDates.push(record);
      } else if (record && record.status === 'absent') {
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
    const totalDaysCounted = presentCount + absentCount;
    const rate = totalDaysCounted > 0 ? Math.round((presentCount / totalDaysCounted) * 100) : 0;

    return {
      monthName,
      daysInMonth,
      firstDayOfWeek,
      days,
      presentDates,
      absentDates,
      presentCount,
      absentCount,
      totalDaysCounted,
      rate,
      monthRecords,
    };
  }, [selectedYear, selectedMonth, staffRecords, todayIST]);

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

  const handleQuickMark = async (dateStr: string, status: 'present' | 'absent' | 'unmarked') => {
    if (!staff || !isAdmin) return;
    setAdminMarking(true);
    await adminMarkAttendance(staff.id, dateStr, status);
    setAdminMarking(false);
    setAdminSelectedDate(null);
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#0e0824] border border-blue-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Profile Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-purple-950/90 via-[#1e1040] to-purple-950/90 border-b border-purple-500/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={staff.avatarUrl || `https://minotar.net/helm/${encodeURIComponent(staff.minecraftIgn)}/100.png`}
                alt={staff.name}
                className="w-16 h-16 rounded-2xl bg-purple-950 border-2 border-blue-400/60 object-cover shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 border-2 border-[#0e0824]">
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
                <span>Individual Logs: <strong>{staffRecords.length}</strong></span>
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
          {/* Month Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#150d33] p-4 rounded-2xl border border-purple-500/25">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Monthly Attendance Calendar & Rate
                </span>
                <span className="text-[11px] text-purple-300/70 font-mono">
                  Blue = Present • Red = Absent
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#0c061e] p-1.5 rounded-xl border border-purple-500/30">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-purple-100 px-3 min-w-[130px] text-center font-display uppercase">
                {monthData.monthName}
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

          {/* Month Stats Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40">
              <span className="text-[11px] text-blue-300 block mb-1">Monthly Percentage</span>
              <span className="text-lg font-black text-white font-mono flex items-center gap-1">
                <Percent className="w-4 h-4 text-blue-400" />
                {monthData.rate}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-[11px] text-blue-300 block mb-1">Present (Blue)</span>
              <span className="text-sm font-bold text-blue-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                {monthData.presentCount} Days
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30">
              <span className="text-[11px] text-red-300 block mb-1">Absent (Red)</span>
              <span className="text-sm font-bold text-red-400 flex items-center gap-1.5 font-mono">
                <XCircle className="w-4 h-4" />
                {monthData.absentCount} Days
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/25">
              <span className="text-[11px] text-purple-300 block mb-1">Total Marked</span>
              <span className="text-sm font-bold text-white font-mono">
                {monthData.totalDaysCounted} / {monthData.daysInMonth} Days
              </span>
            </div>
          </div>

          {/* Admin Quick Date Control */}
          {isAdmin && adminSelectedDate && (
            <div className="p-3.5 rounded-xl bg-[#1a103c] border border-amber-400/50 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">
                Mark <strong className="text-amber-300">{staff.name}</strong> for <span className="font-mono text-amber-300">{adminSelectedDate}</span>:
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={adminMarking}
                  onClick={() => handleQuickMark(adminSelectedDate, 'present')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Present (Blue)
                </button>
                <button
                  disabled={adminMarking}
                  onClick={() => handleQuickMark(adminSelectedDate, 'absent')}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Absent (Red)
                </button>
                <button
                  disabled={adminMarking}
                  onClick={() => handleQuickMark(adminSelectedDate, 'unmarked')}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Calendar Visual Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                {monthData.monthName} — Calendar (Blue = Present, Red = Absent)
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                <div key={dayName} className="text-[10px] font-bold uppercase text-purple-400 py-1 font-mono">
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: monthData.firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="p-2 min-h-[64px]" />
              ))}
              {monthData.days.map(d => (
                <div
                  key={d.day}
                  onClick={() => {
                    if (isAdmin) setAdminSelectedDate(d.dateStr);
                  }}
                  className={`p-2 rounded-xl border text-center transition-all min-h-[68px] flex flex-col justify-between ${
                    isAdmin ? 'cursor-pointer hover:scale-[1.02]' : ''
                  } ${
                    adminSelectedDate === d.dateStr ? 'ring-2 ring-amber-400' : ''
                  } ${
                    d.status === 'present'
                      ? 'bg-blue-600/35 border-blue-400 text-blue-100 shadow-sm'
                      : d.status === 'absent'
                      ? 'bg-red-600/35 border-red-500 text-red-100 shadow-sm'
                      : d.isToday
                      ? 'bg-purple-900/40 border-purple-400/60 text-white'
                      : 'bg-purple-950/20 border-purple-900/30 text-purple-400/40'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">{d.day}</div>
                  <div>
                    {d.status === 'present' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider block text-blue-200">
                        ✓ Present
                      </span>
                    )}
                    {d.status === 'absent' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider block text-red-200">
                        ✗ Absent
                      </span>
                    )}
                    {d.status === 'unmarked' && (
                      <span className="text-[10px] block opacity-40 font-mono">—</span>
                    )}
                  </div>
                  {d.record && (
                    <div className="text-[8px] font-mono opacity-80 truncate">
                      {d.record.timeFormatted || formatISTTime(d.record.timestamp)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Individual Attendance Log for this Staff Member */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider font-display">
                {staff.name}&apos;s Individual Attendance Log ({staffRecords.length})
              </span>
              <span className="text-[11px] text-purple-400 font-mono">Personal Records</span>
            </div>

            {staffRecords.length === 0 ? (
              <div className="p-6 text-center text-xs text-purple-400/60 bg-purple-950/20 rounded-xl border border-purple-900/30">
                No attendance logs recorded for {staff.name} yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-purple-900/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#180f38] border-b border-purple-900/40 text-purple-300 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Exact Time (IST)</th>
                      <th className="py-2.5 px-3">Shift Notes</th>
                      {isAdmin && <th className="py-2.5 px-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/60 bg-[#120a2e]/60">
                    {staffRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-purple-950/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-white font-medium">
                          {rec.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rec.status === 'present'
                                ? 'bg-blue-600/25 text-blue-300 border border-blue-400/50'
                                : 'bg-red-600/25 text-red-300 border border-red-500/50'
                            }`}
                          >
                            {rec.status === 'present' ? 'Present (Blue)' : 'Absent (Red)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-purple-300">
                          {rec.timeFormatted || formatISTTime(rec.timestamp)}
                        </td>
                        <td className="py-2.5 px-3 text-purple-300/80 max-w-xs truncate">
                          {rec.shiftNotes || 'Standard shift'}
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => deleteAttendance(rec.id)}
                              className="p-1 text-red-400 hover:text-red-200 cursor-pointer"
                              title="Delete log"
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#120a2c] border-t border-purple-900/40 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
          >
            Close Profile Attendance
          </button>
        </div>
      </div>
    </div>
  );
};
