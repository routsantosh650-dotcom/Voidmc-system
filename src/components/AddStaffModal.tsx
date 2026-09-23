import React, { useState } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { UserPlus, X, Copy, Check } from 'lucide-react';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose }) => {
  const { rolesList, addStaffMember } = useVoidMC();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [minecraftIgn, setMinecraftIgn] = useState('');
  const [role, setRole] = useState(rolesList[0]?.name || 'MC MODS');
  const [department, setDepartment] = useState('Moderation');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !minecraftIgn.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    const res = await addStaffMember({
      name: name.trim(),
      username: username.trim(),
      minecraftIgn: minecraftIgn.trim(),
      role,
      department,
      password: password.trim(),
    });

    if (res.success && res.credentials) {
      setCreatedCredentials(res.credentials);
    } else {
      setError(res.message);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    const text = `VoidMC Staff Account\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName('');
    setUsername('');
    setMinecraftIgn('');
    setPassword('');
    setError(null);
    setCreatedCredentials(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-[#120a28] border border-purple-500/40 p-6 shadow-2xl shadow-purple-950/60 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">
                Create Staff Account
              </h3>
              <p className="text-xs text-purple-300/70">Assign login credentials and rank</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-purple-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {createdCredentials ? (
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-3">
            <p className="text-xs font-bold text-emerald-300">Account Created Successfully!</p>
            <div className="p-3 rounded-lg bg-black/40 font-mono text-xs text-purple-200 space-y-1">
              <div><strong>Username:</strong> {createdCredentials.username}</div>
              <div><strong>Password:</strong> {createdCredentials.password}</div>
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
            </button>
            <button
              onClick={handleClose}
              className="w-full py-1.5 rounded-lg bg-purple-950/50 text-purple-300 hover:text-white text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block text-purple-300 font-semibold mb-1">Full / Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-purple-300 font-semibold mb-1">Login Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. alexhunter"
                  className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Minecraft IGN</label>
                <input
                  type="text"
                  value={minecraftIgn}
                  onChange={e => setMinecraftIgn(e.target.value)}
                  placeholder="e.g. Alex_Hunter"
                  className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-purple-300 font-semibold mb-1">Rank / Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Moderation"
                  className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-purple-300 font-semibold mb-1">Login Password</label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="e.g. Staff@Void123"
                className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-purple-950/60 text-purple-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Create Staff
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
