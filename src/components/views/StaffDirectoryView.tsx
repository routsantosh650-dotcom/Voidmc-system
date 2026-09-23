import React, { useState } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  Users,
  Search,
  UserPlus,
  Crown,
  ShieldAlert,
  Trash2,
  Shield,
} from 'lucide-react';
import { getRoleColorStyles } from '../../utils/roleHelpers';

interface StaffDirectoryViewProps {
  onOpenAddStaff: () => void;
  onOpenIssueStrikeForStaff: (staffId: string) => void;
}

export const StaffDirectoryView: React.FC<StaffDirectoryViewProps> = ({
  onOpenAddStaff,
  onOpenIssueStrikeForStaff,
}) => {
  const { staffList, rolesList, isAdmin, deleteStaffMember, strikesList } = useVoidMC();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredStaff = staffList.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.minecraftIgn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role.toUpperCase() === roleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#130a2a]/90 p-5 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-display">
              Staff Directory & Roster
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
              Roster of all {staffList.length} verified VoidMC staff members and server administrators.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAddStaff}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#120a2a]/80 border border-purple-500/25">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, IGN or role..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-purple-300/70">Role:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none"
          >
            <option value="all">All Roles</option>
            {rolesList.map(r => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredStaff.map(member => {
          const roleObj = rolesList.find(r => r.name.toUpperCase() === member.role.toUpperCase());
          const roleStyles = getRoleColorStyles(roleObj ? roleObj.color : 'purple');
          const activeStrikes = strikesList.filter(s => s.staffId === member.id && s.status === 'active').length;

          return (
            <div
              key={member.id}
              className={`p-4 rounded-2xl border transition-all ${
                activeStrikes >= 3
                  ? 'bg-red-950/20 border-red-500/40'
                  : 'bg-[#150d2e]/90 border-purple-500/25 hover:border-purple-400/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-12 h-12 rounded-xl object-cover border border-purple-400/40"
                    />
                    {member.isAdmin && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow-sm">
                        <Crown className="w-3 h-3 fill-current" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{member.name}</span>
                      {member.isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block">
                      IGN: {member.minecraftIgn}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-md ${roleStyles.badgeBg}`}
                      >
                        {member.role}
                      </span>
                      {member.department && (
                        <span className="text-[10px] text-purple-300/70">{member.department}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      activeStrikes >= 3
                        ? 'bg-red-950 border-red-500 text-red-400'
                        : activeStrikes > 0
                        ? 'bg-amber-950 border-amber-500 text-amber-400'
                        : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    {activeStrikes} {activeStrikes === 1 ? 'Strike' : 'Strikes'}
                  </span>
                </div>
              </div>

              {/* Card Footer with actions */}
              <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  User: @{member.username}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Issue Strike Button (Admins only, target must not be admin) */}
                  {isAdmin && !member.isAdmin && (
                    <button
                      onClick={() => onOpenIssueStrikeForStaff(member.id)}
                      className="px-2 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Issue Disciplinary Strike to this staff member"
                    >
                      <ShieldAlert className="w-3 h-3 text-red-400" /> Strike
                    </button>
                  )}

                  {isAdmin && !member.isAdmin && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Remove ${member.name} from staff directory?`)) {
                          await deleteStaffMember(member.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 cursor-pointer"
                      title="Remove Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
