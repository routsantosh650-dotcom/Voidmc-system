import React, { useState } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { Calendar, CheckCircle2, AlertCircle, X, Check, XCircle } from 'lucide-react';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, markAttendance, setShowStaffLoginModal } = useVoidMC();
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftHours, setShiftHours] = useState(2);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFeedback({ type: 'error', message: 'You must be logged in as a staff member to mark attendance.' });
      return;
    }

    setSubmitting(true);
    const result = await markAttendance('present', shiftNotes || 'Standard shift', shiftHours);
    setSubmitting(false);

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => {
        setShiftNotes('');
        setFeedback(null);
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#120a28] border border-purple-500/40 p-6 shadow-2xl shadow-purple-950/60 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-indigo-500" />

        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">
                Mark Staff Attendance
              </h3>
              <p className="text-xs text-purple-300/70">
                Exact date and timestamp are automatically recorded in India Standard Time (IST)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-purple-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!currentUser ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-purple-300/80">
              Please sign in with your staff credentials to mark attendance.
            </p>
            <button
              onClick={() => {
                onClose();
                setShowStaffLoginModal(true);
              }}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Staff Sign In
            </button>
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
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Staff Info Preview */}
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">{currentUser.name}</span>
                <span className="text-[10px] text-purple-300">IGN: {currentUser.minecraftIgn}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30 text-purple-300 font-mono text-[10px] uppercase">
                {currentUser.role}
              </span>
            </div>

            {/* Shift Duration */}
            <div>
              <label className="block text-purple-300 font-semibold mb-1">Shift Duration (Hours on duty)</label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={shiftHours}
                onChange={e => setShiftHours(parseFloat(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Shift Notes */}
            <div>
              <label className="block text-purple-300 font-semibold mb-1">
                Shift Summary / Duty Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
                placeholder="e.g. Spawn patrolling, player ticket resolutions, server monitoring"
                className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
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
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? 'Recording...' : 'Mark Present (Record Attendance)'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
