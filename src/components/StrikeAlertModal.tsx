import React from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { AlertOctagon, ShieldAlert, CheckCircle, X } from 'lucide-react';

export const StrikeAlertModal: React.FC = () => {
  const { activeStrikeAlert, dismissStrikeAlert, acknowledgeStrike } = useVoidMC();

  if (!activeStrikeAlert) return null;

  const isStrike3 = activeStrikeAlert.strikeNumber === 3;

  const handleAcknowledge = () => {
    acknowledgeStrike(activeStrikeAlert.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#130712] border-2 border-red-500/70 p-6 shadow-[0_0_50px_rgba(239,68,68,0.35)] overflow-hidden">
        {/* Pulsing red alarm glow behind header */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Alarm Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-950/80 border border-red-500 text-red-400 shadow-lg shadow-red-900/50 shrink-0">
              <AlertOctagon className="w-7 h-7 text-red-500 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-red-400 font-mono font-bold">
                  VOIDMC DISCIPLINARY DIRECTIVE
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Staff Strike Issued To Your Account
              </h2>
            </div>
          </div>

          <button
            onClick={dismissStrikeAlert}
            className="text-red-400/60 hover:text-white p-1 rounded-lg hover:bg-red-950/50"
            title="Dismiss temporary view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strike Gauge Meter */}
        <div className="mt-5 p-4 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-red-300">Disciplinary Status</span>
            <span className="font-mono text-red-400 font-bold uppercase">
              Strike {activeStrikeAlert.strikeNumber} of 3
            </span>
          </div>

          {/* 3 Blocks meter */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(num => {
              const isActive = num <= activeStrikeAlert.strikeNumber;
              return (
                <div
                  key={num}
                  className={`h-3 rounded-lg border transition-all ${
                    isActive
                      ? num === 3
                        ? 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                        : 'bg-red-500 border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      : 'bg-red-950/20 border-red-900/30'
                  }`}
                />
              );
            })}
          </div>

          {isStrike3 && (
            <div className="pt-1 text-[11px] text-red-200 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>CRITICAL: 3 Strikes reached. Account subject to staff suspension.</span>
            </div>
          )}
        </div>

        {/* Reason Box */}
        <div className="mt-4 p-4 rounded-xl bg-black/50 border border-red-900/40 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-purple-300">
            <span>Issued by: <strong>{activeStrikeAlert.issuedBy}</strong></span>
            <span className="font-mono">{activeStrikeAlert.issuedAt || activeStrikeAlert.date || 'Today'}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Reason for Violation:</span>
            <p className="text-white font-medium mt-0.5 leading-relaxed">
              {activeStrikeAlert.reason}
            </p>
          </div>

          {activeStrikeAlert.evidenceUrl && (
            <div className="pt-1 text-xs">
              <span className="text-slate-400">Evidence Link: </span>
              <a
                href={activeStrikeAlert.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 underline hover:text-purple-300"
              >
                {activeStrikeAlert.evidenceUrl}
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleAcknowledge}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/40 transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            I Acknowledge This Strike
          </button>
        </div>
      </div>
    </div>
  );
};
