import React, { useState } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { Shield, Lock, Crown, AlertTriangle, KeyRound, Check, Sparkles, X } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { showAdminLoginModal, setShowAdminLoginModal, adminLogin } = useVoidMC();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showAdminLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both admin username and password.');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await adminLogin(username.trim(), password.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0e0a22] border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Header Ribbon */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-purple-950 via-[#1a0f3d] to-amber-950/70 border-b border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-lg shadow-amber-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-wider text-amber-200 uppercase font-display">
                    Admin Command Console
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    RESTRICTED
                  </span>
                </div>
                <p className="text-xs text-purple-300/80">Authorized Administrative Personnel Only</p>
              </div>
            </div>

            <button
              onClick={() => setShowAdminLoginModal(false)}
              className="p-1.5 rounded-lg text-purple-300/70 hover:text-white hover:bg-purple-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning Banner: 3 Authorized Accounts Only */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-200/90 leading-relaxed">
            <p className="font-semibold text-amber-300 mb-1">Strict Authorization Notice:</p>
            Only the three authorized server administrators are permitted to enter this panel:
            <div className="grid grid-cols-3 gap-1 mt-1.5 font-mono text-[10px] font-bold text-amber-300">
              <span className="bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 truncate">👑 Elite ansh</span>
              <span className="bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 truncate">⭐ obito uchiha</span>
              <span className="bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 truncate">🛡️ Santosh Rout</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5 uppercase tracking-wider">
              Admin Username / Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. Elite ansh, obito uchiha, Santosh Rout"
                className="w-full px-4 py-2.5 rounded-xl bg-[#171033] border border-purple-500/40 text-white placeholder-purple-400/40 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-sans"
              />
              <Crown className="w-4 h-4 text-amber-400/60 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5 uppercase tracking-wider">
              Admin Security Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#171033] border border-purple-500/40 text-white placeholder-purple-400/40 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-amber-400/60 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Authenticating Admin...' : 'Authenticate & Enter Admin Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
