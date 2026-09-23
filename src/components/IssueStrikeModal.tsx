import React, { useState } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { AlertTriangle, ShieldAlert, X, Check, Lock } from 'lucide-react';

interface IssueStrikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStaffId?: string;
}

export const IssueStrikeModal: React.FC<IssueStrikeModalProps> = ({
  isOpen,
  onClose,
  preselectedStaffId,
}) => {
  const { currentUser, isAdmin, staffList, strikesList, issueStrike } = useVoidMC();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    preselectedStaffId || (staffList.length > 0 ? staffList[0].id : '')
  );
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('major');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const targetStaff = staffList.find(s => s.id === selectedStaffId);
  const targetStaffStrikes = strikesList.filter(s => s.staffId === selectedStaffId && s.status === 'active');
  const nextStrikeNum = Math.min(3, targetStaffStrikes.length + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a clear reason for this strike.' });
      return;
    }

    const result = await issueStrike(selectedStaffId, reason, severity, evidenceUrl);
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => {
        setReason('');
        setEvidenceUrl('');
        setFeedback(null);
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#110924] border border-red-500/40 p-6 shadow-2xl shadow-red-950/50 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-purple-500 to-red-500" />

        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/70 border border-red-500/50 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">
                Issue Disciplinary Strike
              </h3>
              <p className="text-xs text-purple-300/70">
                Authorized Admin Disciplinary Directive
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-purple-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdmin ? (
          <div className="py-8 text-center space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-red-950 border border-red-500/40 flex items-center justify-center text-red-400">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-display">
              Administrative Permission Required
            </h4>
            <p className="text-xs text-purple-300/80 max-w-sm mx-auto">
              Only authorized administrators (Elite ansh, obito uchiha, Santosh Rout) can issue disciplinary strikes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {feedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/80 border-red-500/50 text-red-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}

            <div>
              <label className="block text-purple-300 font-semibold mb-1">Target Staff Member</label>
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-red-400"
              >
                {staffList.map(s => {
                  const currentStrikes = strikesList.filter(str => str.staffId === s.id && str.status === 'active').length;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - Current Active Strikes: {currentStrikes}/3
                    </option>
                  );
                })}
              </select>
            </div>

            {targetStaff && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block">{targetStaff.name}</span>
                  <span className="text-[10px] text-purple-300">IGN: {targetStaff.minecraftIgn}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-red-300 uppercase font-mono block">Incoming Strike</span>
                  <span className="text-xs font-bold text-red-400 font-mono">
                    Strike {nextStrikeNum}/3
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-purple-300 font-semibold mb-1">Severity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['minor', 'major', 'critical'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      severity === level
                        ? 'bg-red-900/80 border-red-500 text-white shadow-md'
                        : 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-purple-300 font-semibold mb-1">Violation Reason</label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="State clearly the reason for this disciplinary strike..."
                className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-red-400"
                required
              />
            </div>

            <div>
              <label className="block text-purple-300 font-semibold mb-1">Evidence URL (Optional)</label>
              <input
                type="text"
                value={evidenceUrl}
                onChange={e => setEvidenceUrl(e.target.value)}
                placeholder="https://imgur.com/... or discord screenshot link"
                className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-purple-950/60 text-purple-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30"
              >
                Issue Strike
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
