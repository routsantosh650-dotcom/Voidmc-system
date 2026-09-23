import React, { useState } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { User, Lock, Sparkles, X, Shield, AlertCircle } from 'lucide-react';
import { IMAGES } from '../assets';

export const StaffLoginModal: React.FC = () => {
  const { showStaffLoginModal, setShowStaffLoginModal, login, setShowAdminLoginModal } = useVoidMC();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showStaffLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your username and password.');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await login(username.trim(), password.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0c081e] border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.25)] overflow-hidden">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-purple-950 via-[#150d33] to-[#0c081e] border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/40 p-1 flex items-center justify-center">
                <img
                  src={IMAGES.logoEmblem}
                  alt="VoidMC"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-wide uppercase font-display block">
                  Staff Portal Login
                </span>
                <span className="text-xs text-purple-300">VoidMC SMP Staff Command</span>
              </div>
            </div>

            <button
              onClick={() => setShowStaffLoginModal(false)}
              className="p-1.5 rounded-lg text-purple-300/70 hover:text-white hover:bg-purple-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5 uppercase tracking-wider">
              Staff Username / In-Game Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter assigned username or IGN"
                className="w-full px-4 py-2.5 rounded-xl bg-[#140e2d] border border-purple-500/30 text-white placeholder-purple-400/40 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-sans"
              />
              <User className="w-4 h-4 text-purple-400/60 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your staff password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#140e2d] border border-purple-500/30 text-white placeholder-purple-400/40 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-purple-400/60 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Sign In to Staff Command'}
            </button>
          </div>

          {/* Link to Admin Login */}
          <div className="pt-2 text-center border-t border-purple-900/40">
            <button
              type="button"
              onClick={() => {
                setShowStaffLoginModal(false);
                setShowAdminLoginModal(true);
              }}
              className="text-xs text-amber-400/90 hover:text-amber-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Are you an authorized administrator? Switch to Admin Login →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
