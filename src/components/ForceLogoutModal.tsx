import React from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { ShieldAlert, LogOut, KeyRound } from 'lucide-react';

export const ForceLogoutModal: React.FC = () => {
  const { forceLogoutNotice, clearForceLogoutNotice, setShowStaffLoginModal, setShowAdminLoginModal } = useVoidMC();

  if (!forceLogoutNotice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-[#140a12] border-2 border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.35)] overflow-hidden p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-950/50">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-xl font-bold text-white uppercase tracking-wide font-display mb-2">
          Session Terminated
        </h3>

        <p className="text-sm text-red-200/90 leading-relaxed mb-6">
          {forceLogoutNotice}
        </p>

        <div className="space-y-2">
          <button
            onClick={() => {
              clearForceLogoutNotice();
              setShowStaffLoginModal(true);
            }}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-600/30"
          >
            Staff Login
          </button>
          <button
            onClick={() => {
              clearForceLogoutNotice();
              setShowAdminLoginModal(true);
            }}
            className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-sm transition-colors"
          >
            Admin Panel Login
          </button>
        </div>
      </div>
    </div>
  );
};
