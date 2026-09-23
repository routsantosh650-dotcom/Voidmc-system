import React from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import { BarChart3, TrendingUp, Users, ShieldAlert, Calendar } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { staffList, attendanceRecords, strikesList } = useVoidMC();

  const totalStaff = staffList.length;
  const presentAtt = attendanceRecords.filter(r => r.status === 'present').length;
  const totalStrikes = strikesList.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#130a2a]/90 p-5 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-display">
              Performance & Attendance Analytics
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
              Staff shifts metrics, disciplinary strike rates, and moderator quota health.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25">
          <span className="text-xs text-purple-300/70">Verified Shifts Today</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {presentAtt} / {totalStaff}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Shift fulfillment on track
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25">
          <span className="text-xs text-purple-300/70">Active Disciplinary Strikes</span>
          <div className="text-2xl font-bold font-mono-code text-white mt-1">
            {totalStrikes}
          </div>
          <p className="text-[11px] text-purple-300/70 mt-2">
            Disciplinary compliance rate: {Math.max(0, 100 - totalStrikes * 5)}%
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25">
          <span className="text-xs text-purple-300/70">Active Staff Roster</span>
          <div className="text-2xl font-bold font-mono-code text-white mt-1">
            {totalStaff} Members
          </div>
          <p className="text-[11px] text-purple-300/70 mt-2">
            28 distinct permission tiers across 9 departments
          </p>
        </div>
      </div>
    </div>
  );
};
