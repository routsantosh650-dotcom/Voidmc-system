import React, { useState } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  CheckCircle,
  RotateCcw,
  Check,
} from 'lucide-react';

interface StrikesViewProps {
  onOpenIssueStrike: () => void;
}

export const StrikesView: React.FC<StrikesViewProps> = ({ onOpenIssueStrike }) => {
  const {
    strikesList,
    staffList,
    currentUser,
    isAdmin,
    revokeStrike,
    acknowledgeStrike,
  } = useVoidMC();

  const [filter, setFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [revokeReason, setRevokeReason] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const filteredStrikes = strikesList.filter(strike => {
    if (filter !== 'all' && strike.status !== filter) return false;
    if (selectedStaffFilter !== 'all' && strike.staffId !== selectedStaffFilter) return false;
    return true;
  });

  const handleRevokeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingId) return;
    await revokeStrike(revokingId, revokeReason || 'Pardoned by Administrator');
    setRevokingId(null);
    setRevokeReason('');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#13071a]/90 p-5 rounded-2xl border border-red-500/30 shadow-xl shadow-red-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400 shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-display">
              Disciplinary Strikes System
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
              Strict 3-strike disciplinary enforcement policy.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenIssueStrike}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue Strike</span>
          </button>
        )}
      </div>

      {/* Policy Warning Banner */}
      <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-white uppercase tracking-wide">
            VoidMC Staff Disciplinary Policy:
          </span>
          <p className="text-red-200/80 leading-relaxed">
            Staff members who accumulate 3 active strikes are automatically suspended from duty. Only the three authorized administrators (Elite ansh, obito uchiha, and Santosh Rout) can issue or revoke strikes.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#120a2a]/80 border border-purple-500/25 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['all', 'active', 'revoked'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all shrink-0 cursor-pointer ${
                filter === tab
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-purple-300/70 hover:text-white hover:bg-purple-950/50'
              }`}
            >
              {tab} ({strikesList.filter(s => tab === 'all' ? true : s.status === tab).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-purple-300/70">Staff Member:</span>
          <select
            value={selectedStaffFilter}
            onChange={e => setSelectedStaffFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none"
          >
            <option value="all">All Staff</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Strikes List */}
      {filteredStrikes.length > 0 ? (
        <div className="space-y-3.5">
          {filteredStrikes.map(strike => {
            const isTargetMe = currentUser?.id === strike.staffId;

            return (
              <div
                key={strike.id}
                className={`p-4 rounded-2xl border transition-all ${
                  strike.status === 'revoked'
                    ? 'bg-purple-950/20 border-purple-500/20 opacity-70'
                    : 'bg-[#150926]/90 border-red-500/35 shadow-lg shadow-red-950/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={strike.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={strike.staffName}
                      className="w-10 h-10 rounded-xl object-cover border border-purple-400/40 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{strike.staffName}</span>
                        <span className="text-[10px] text-purple-300 font-mono px-1.5 py-0.2 rounded bg-purple-900/40">
                          {strike.staffRole}
                        </span>
                        <span className="text-[10px] font-mono text-purple-400">
                          IGN: {strike.minecraftIgn}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-purple-300/70 mt-0.5 font-mono">
                        <span>Issued on {strike.issuedAt || strike.date || 'Recently'}</span>
                        <span>•</span>
                        <span>Severity: <strong className="uppercase text-amber-400">{strike.severity}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Strike Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-mono ${
                        strike.status === 'active'
                          ? 'bg-red-950/80 border-red-500/60 text-red-300'
                          : 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                      }`}
                    >
                      Strike {strike.strikeNumber}/3 • {strike.status}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-purple-900/30 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Violation Reason:</span>
                    <span>Issued by Administrator: <strong className="text-purple-300">{strike.issuedBy}</strong></span>
                  </div>
                  <p className="text-slate-100 font-medium">{strike.reason}</p>
                  {strike.evidenceUrl && (
                    <div className="pt-1 text-[11px]">
                      <span className="text-slate-400">Evidence Link: </span>
                      <a
                        href={strike.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 underline hover:text-purple-300"
                      >
                        {strike.evidenceUrl}
                      </a>
                    </div>
                  )}
                  {strike.revokedReason && (
                    <div className="pt-1 text-[11px] text-emerald-400 border-t border-purple-900/30 mt-1">
                      Revocation Note: {strike.revokedReason} (Revoked by {strike.revokedBy})
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="mt-3 pt-2.5 border-t border-purple-900/30 flex items-center justify-between text-xs">
                  <div>
                    {strike.acknowledged ? (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Acknowledged by staff member
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-400 font-medium">
                        Pending acknowledgment
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Acknowledge button if this strike was given to current user and not acknowledged */}
                    {isTargetMe && strike.status === 'active' && !strike.acknowledged && (
                      <button
                        onClick={() => acknowledgeStrike(strike.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Acknowledge Strike
                      </button>
                    )}

                    {/* Revoke button for Admins */}
                    {isAdmin && strike.status === 'active' && (
                      <button
                        onClick={() => setRevokingId(strike.id)}
                        className="px-3 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Revoke Strike
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#120a2a]/60 border border-purple-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-400 mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white uppercase font-display">No Disciplinary Strikes Found</h3>
          <p className="text-xs text-purple-300/70 max-w-sm mx-auto">
            All VoidMC staff members currently have clean disciplinary records with zero active strikes.
          </p>
          {isAdmin && (
            <button
              onClick={onOpenIssueStrike}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Issue Disciplinary Strike
            </button>
          )}
        </div>
      )}

      {/* Revoke Modal */}
      {revokingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#140b2b] border border-purple-500/40 p-5 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-white uppercase font-display">Revoke Disciplinary Strike</h3>
            <form onSubmit={handleRevokeConfirm} className="space-y-3 text-xs">
              <div>
                <label className="block text-purple-200 mb-1">Reason for Revoking Strike:</label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={e => setRevokeReason(e.target.value)}
                  placeholder="e.g. Cleared of fault, evidence verified, misunderstanding..."
                  className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRevokingId(null)}
                  className="px-3 py-1.5 rounded-lg text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Confirm Revoke
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
