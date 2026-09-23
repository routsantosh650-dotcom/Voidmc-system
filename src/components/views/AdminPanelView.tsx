import React, { useState, useEffect } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  Shield,
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  Lock,
  Activity,
  LogOut,
  Calendar,
  Megaphone,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  ExternalLink,
  Crown,
  RefreshCw,
  Clock,
  Laptop,
  FileText,
  Pin,
} from 'lucide-react';
import { StaffMember } from '../../types';
import { AdminAttendanceManager } from '../admin/AdminAttendanceManager';

export const AdminPanelView: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    staffList,
    rolesList,
    attendanceRecords,
    announcements,
    strikesList,
    activeSessions,
    fetchActiveSessions,
    terminateSession,
    addStaffMember,
    updateStaffMember,
    resetStaffPassword,
    deleteStaffMember,
    deleteAttendance,
    clearAllAttendance,
    createAnnouncement,
    deleteAnnouncement,
    clearAllAnnouncements,
    issueStrike,
    revokeStrike,
    resetSystemData,
    setShowAdminLoginModal,
    applicationsList,
    reviewApplication,
    deleteApplication,
  } = useVoidMC();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'staff' | 'sessions' | 'attendance' | 'applications' | 'announcements' | 'strikes' | 'system'
  >('staff');

  // Applications Filter & Review State
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reviewingAppId, setReviewingAppId] = useState<string | null>(null);
  const [adminResponseInput, setAdminResponseInput] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Staff Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffIgn, setNewStaffIgn] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('MC MODS');
  const [newStaffDept, setNewStaffDept] = useState('Moderation');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [addStaffError, setAddStaffError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Edit Staff State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editIgn, setEditIgn] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');

  // Reset Password State
  const [resetPwStaff, setResetPwStaff] = useState<StaffMember | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetPwMessage, setResetPwMessage] = useState<string | null>(null);

  // Confirmation Modals
  const [deleteStaffConfirm, setDeleteStaffConfirm] = useState<StaffMember | null>(null);
  const [clearAttendanceConfirm, setClearAttendanceConfirm] = useState(false);
  const [clearAnnouncementsConfirm, setClearAnnouncementsConfirm] = useState(false);
  const [systemResetConfirm, setSystemResetConfirm] = useState(false);
  const [systemResetInput, setSystemResetInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Announcement State
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTag, setAnnTag] = useState('IMPORTANT');
  const [annPinned, setAnnPinned] = useState(false);

  // Strike State
  const [showIssueStrike, setShowIssueStrike] = useState(false);
  const [strikeStaffId, setStrikeStaffId] = useState('');
  const [strikeReason, setStrikeReason] = useState('');
  const [strikeSeverity, setStrikeSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [strikeEvidence, setStrikeEvidence] = useState('');

  // Fetch active sessions when on sessions tab
  useEffect(() => {
    if (isAdmin && activeAdminTab === 'sessions') {
      fetchActiveSessions();
    }
  }, [isAdmin, activeAdminTab, fetchActiveSessions]);

  // If not admin, show restricted prompt
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-950/50">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-wider font-display">
          Admin Command Restricted
        </h2>
        <p className="text-sm text-purple-300/80 leading-relaxed">
          Access to this management console requires authorized administrative credentials.
          Only <strong className="text-amber-300">Elite ansh</strong>, <strong className="text-amber-300">obito uchiha</strong>, and <strong className="text-amber-300">Santosh Rout</strong> are permitted.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setShowAdminLoginModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Open Admin Authentication Console
          </button>
        </div>
      </div>
    );
  }

  // Filtered staff
  const filteredStaff = staffList.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.minecraftIgn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStaffError(null);
    if (!newStaffName || !newStaffUsername || !newStaffIgn || !newStaffPassword) {
      setAddStaffError('Please complete all required fields.');
      return;
    }

    const res = await addStaffMember({
      name: newStaffName,
      username: newStaffUsername,
      minecraftIgn: newStaffIgn,
      role: newStaffRole,
      department: newStaffDept,
      password: newStaffPassword,
    });

    if (res.success && res.credentials) {
      setCreatedCredentials(res.credentials);
      setNewStaffName('');
      setNewStaffUsername('');
      setNewStaffIgn('');
      setNewStaffPassword('');
      setActionSuccessMsg('Staff member successfully created!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setAddStaffError(res.message);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `VoidMC SMP Staff Credentials\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}\nPortal URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    const res = await updateStaffMember(editingStaff.id, {
      role: editRole,
      minecraftIgn: editIgn,
      status: editStatus,
    });
    if (res.success) {
      setEditingStaff(null);
      setActionSuccessMsg('Staff details updated successfully.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwStaff || !newPasswordVal) return;
    const res = await resetStaffPassword(resetPwStaff.id, newPasswordVal);
    if (res.success) {
      setResetPwMessage(`Password for ${resetPwStaff.name} changed to: ${newPasswordVal}`);
      setNewPasswordVal('');
      setTimeout(() => {
        setResetPwStaff(null);
        setResetPwMessage(null);
      }, 5000);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaffConfirm) return;
    const res = await deleteStaffMember(deleteStaffConfirm.id);
    setDeleteStaffConfirm(null);
    if (res.success) {
      setActionSuccessMsg(res.message);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleClearAllAttendance = async () => {
    const res = await clearAllAttendance();
    setClearAttendanceConfirm(false);
    if (res.success) {
      setActionSuccessMsg('All attendance records successfully cleared.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleClearAllAnnouncements = async () => {
    const res = await clearAllAnnouncements();
    setClearAnnouncementsConfirm(false);
    if (res.success) {
      setActionSuccessMsg('All announcements cleared.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleCreateAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    const res = await createAnnouncement(annTitle.trim(), annContent.trim(), annTag, annPinned);
    if (res.success) {
      setShowAddAnnouncement(false);
      setAnnTitle('');
      setAnnContent('');
      setActionSuccessMsg('Announcement published to all staff!');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleIssueStrikeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strikeStaffId || !strikeReason.trim()) return;
    const res = await issueStrike(strikeStaffId, strikeReason.trim(), strikeSeverity, strikeEvidence.trim());
    if (res.success) {
      setShowIssueStrike(false);
      setStrikeStaffId('');
      setStrikeReason('');
      setStrikeEvidence('');
      setActionSuccessMsg(res.message);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  const handleSystemReset = async () => {
    if (systemResetInput.trim().toUpperCase() !== 'RESET') return;
    const res = await resetSystemData();
    setSystemResetConfirm(false);
    setSystemResetInput('');
    if (res.success) {
      setActionSuccessMsg('System reset complete. Data restored to clean state.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Admin Command Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#140b2e] via-[#1a0f3d] to-[#120822] border border-amber-500/40 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                  Admin Command Panel
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Logged in as: <strong className="text-amber-300 font-semibold">{currentUser?.name}</strong> ({currentUser?.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchActiveSessions();
                setActionSuccessMsg('Data synced from server.');
                setTimeout(() => setActionSuccessMsg(null), 2000);
              }}
              className="px-3 py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Data</span>
            </button>
          </div>
        </div>

        {/* Success message banner */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-1 border-b border-purple-900/40">
          <button
            onClick={() => setActiveAdminTab('staff')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'staff'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Management ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('sessions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'sessions'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Sessions & Monitoring</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('attendance')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'attendance'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Attendance Oversight ({attendanceRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('applications')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'applications'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>LOA & Leave Applications ({applicationsList.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('announcements')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'announcements'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Announcements ({announcements.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('strikes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'strikes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Disciplinary Strikes ({strikesList.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('system')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'system'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                : 'text-red-300 hover:text-white hover:bg-red-950/40'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>System Reset & Danger Zone</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STAFF MANAGEMENT */}
      {activeAdminTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#110c26] p-4 rounded-xl border border-purple-900/40">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search staff by name, username, or IGN..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#181138] border border-purple-500/30 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-400"
                />
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#181138] border border-purple-500/30 text-xs text-purple-200 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Roles ({staffList.length})</option>
                {rolesList.map(r => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setCreatedCredentials(null);
                  setShowAddStaffModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="rounded-2xl bg-[#0f0a24] border border-purple-900/40 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-900/50 bg-[#160e36] text-purple-300 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Login Username</th>
                    <th className="py-3.5 px-4">Rank / Role</th>
                    <th className="py-3.5 px-4">Account Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/60">
                  {filteredStaff.map(staff => {
                    const isCoreAdmin = staff.isAdmin;
                    return (
                      <tr key={staff.id} className="hover:bg-purple-950/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={staff.avatarUrl}
                              alt={staff.name}
                              className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 object-cover"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1">
                                <span>{staff.name}</span>
                                {isCoreAdmin && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                              </div>
                              <span className="text-[11px] text-purple-400 font-mono">IGN: {staff.minecraftIgn}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-purple-200">
                          {staff.username}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                            isCoreAdmin
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-purple-900/40 text-purple-300 border border-purple-500/20'
                          }`}>
                            {staff.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isCoreAdmin ? (
                            <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Authorized Admin
                            </span>
                          ) : (
                            <span className="text-purple-300/70 text-[11px]">Normal Staff</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            staff.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {staff.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-purple-300/80 text-[11px]">
                          {staff.lastActive || 'Unknown'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password Button */}
                            <button
                              onClick={() => {
                                setResetPwStaff(staff);
                                setNewPasswordVal('');
                                setResetPwMessage(null);
                              }}
                              className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-amber-300 transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setEditingStaff(staff);
                                setEditRole(staff.role);
                                setEditIgn(staff.minecraftIgn);
                                setEditStatus(staff.status);
                              }}
                              className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white transition-colors"
                              title="Edit Staff Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (Disabled for 3 core admins) */}
                            {!isCoreAdmin ? (
                              <button
                                onClick={() => setDeleteStaffConfirm(staff)}
                                className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-red-100 transition-colors"
                                title="Remove Staff Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="p-1.5 text-purple-700 cursor-not-allowed" title="Core Admin Protected">
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE SESSIONS & MONITORING */}
      {activeAdminTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#110c26] p-4 rounded-xl border border-purple-900/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Real-Time Logged-In Sessions
              </h3>
              <p className="text-xs text-purple-300/70">
                Track active logins and terminate suspicious or unauthorized access immediately.
              </p>
            </div>
            <button
              onClick={fetchActiveSessions}
              className="px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Sessions</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0f0a24] border border-purple-900/40 overflow-hidden shadow-lg">
            {activeSessions.length === 0 ? (
              <div className="p-8 text-center text-purple-400 text-xs">
                No external active sessions logged in at this moment. Current session: {currentUser?.name}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-purple-900/50 bg-[#160e36] text-purple-300 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Staff Member</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Login Time</th>
                      <th className="py-3.5 px-4">Last Activity</th>
                      <th className="py-3.5 px-4">Device / IP</th>
                      <th className="py-3.5 px-4 text-right">Session Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/60">
                    {activeSessions.map(session => (
                      <tr key={session.sessionId} className="hover:bg-purple-950/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{session.name}</span>
                            {session.isAdmin && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                          <span className="text-[11px] text-purple-400 font-mono">@{session.username}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-purple-900/40 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase">
                            {session.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            ONLINE
                          </span>
                        </td>

                        <td className="py-3 px-4 text-purple-200 text-[11px]">
                          {new Date(session.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="py-3 px-4 text-purple-300/80 text-[11px]">
                          {new Date(session.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>

                        <td className="py-3 px-4 text-purple-300/70 text-[11px] font-mono">
                          <div className="flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-purple-400" />
                            <span className="truncate max-w-[150px]">{session.userAgent}</span>
                          </div>
                          <span className="text-[10px] text-purple-500 block">IP: {session.ip}</span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              const res = await terminateSession(session.sessionId);
                              if (res.success) {
                                setActionSuccessMsg(`Session for ${session.name} terminated!`);
                                setTimeout(() => setActionSuccessMsg(null), 3000);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                            title="Force Logout this session"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Force Logout</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE OVERSIGHT */}
      {activeAdminTab === 'attendance' && (
        <AdminAttendanceManager />
      )}

      {/* TAB 3.5: APPLICATIONS REVIEW (LOA & LEAVE) */}
      {activeAdminTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#110c26] p-4 rounded-xl border border-purple-900/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Staff Leave & LOA Applications Oversight
              </h3>
              <p className="text-xs text-purple-300/70">
                Review submitted staff absence requests, approve or reject, and attach official responses.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#181138] p-1 rounded-xl border border-purple-500/30">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAppStatusFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    appStatusFilter === tab
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-purple-300/70 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List of Applications */}
          <div className="space-y-3">
            {applicationsList.filter(a => appStatusFilter === 'all' || a.status === appStatusFilter).length === 0 ? (
              <div className="p-12 text-center text-purple-400 text-xs bg-[#0f0924] rounded-2xl border border-purple-900/40 space-y-2">
                <FileText className="w-8 h-8 text-purple-500/40 mx-auto" />
                <p>No applications match the "{appStatusFilter}" filter.</p>
              </div>
            ) : (
              applicationsList
                .filter(a => appStatusFilter === 'all' || a.status === appStatusFilter)
                .map(app => (
                  <div
                    key={app.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      app.status === 'approved'
                        ? 'bg-[#0f1d1e]/50 border-emerald-500/30'
                        : app.status === 'rejected'
                        ? 'bg-[#1e0f17]/50 border-red-500/30'
                        : 'bg-[#140c2e]/90 border-purple-500/35'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{app.staffName}</span>
                          <span className="text-xs text-purple-300/80 font-mono">({app.minecraftIgn})</span>
                          <span className="px-2 py-0.5 rounded bg-purple-900/50 text-[10px] text-purple-300 uppercase font-mono">
                            {app.staffRole}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              app.type === 'LOA'
                                ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
                                : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                            }`}
                          >
                            {app.type}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                              app.status === 'approved'
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                : app.status === 'rejected'
                                ? 'bg-red-950/80 border-red-500/50 text-red-300'
                                : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                            }`}
                          >
                            {app.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            {app.status === 'rejected' && <XCircle className="w-3 h-3 text-red-400" />}
                            {app.status === 'pending' && <Clock className="w-3 h-3 text-amber-400" />}
                            {app.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-purple-200/90 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>
                            <strong>{app.startDate}</strong> to <strong>{app.endDate}</strong>
                          </span>
                          <span className="text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                            Submitted: {app.submittedAt}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-purple-900/30 text-xs text-slate-200">
                          <p className="font-semibold text-purple-300 mb-0.5">Reason for Absence:</p>
                          <p className="leading-relaxed whitespace-pre-wrap">{app.reason}</p>
                          {app.additionalDetails && (
                            <div className="mt-2 pt-2 border-t border-purple-900/30 text-[11px] text-purple-300/80">
                              <span className="font-semibold text-purple-400">Additional Details: </span>
                              {app.additionalDetails}
                            </div>
                          )}
                        </div>

                        {app.reviewedAt && (
                          <div
                            className={`p-3 rounded-xl border text-xs ${
                              app.status === 'approved'
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                : 'bg-red-950/30 border-red-500/40 text-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold uppercase tracking-wider text-[10px]">
                                Decision by {app.reviewedBy || 'Authorized Admin'}
                              </span>
                              <span className="text-[10px] opacity-75">{app.reviewedAt}</span>
                            </div>
                            {app.adminResponse ? (
                              <p className="leading-relaxed italic">"{app.adminResponse}"</p>
                            ) : (
                              <p className="italic text-[11px]">No notes attached.</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center md:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setReviewingAppId(reviewingAppId === app.id ? null : app.id);
                            setAdminResponseInput(app.adminResponse || '');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{reviewingAppId === app.id ? 'Close' : 'Review'}</span>
                        </button>

                        <button
                          onClick={async () => {
                            await deleteApplication(app.id);
                            setActionSuccessMsg('Application deleted');
                            setTimeout(() => setActionSuccessMsg(null), 2000);
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/40 transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Review Console Form */}
                    {reviewingAppId === app.id && (
                      <div className="mt-4 pt-4 border-t border-purple-900/40 space-y-3 animate-fadeIn">
                        <div>
                          <label className="block text-xs font-semibold text-purple-300 mb-1">
                            Admin Response / Reason to Applicant (Optional):
                          </label>
                          <textarea
                            rows={2}
                            value={adminResponseInput}
                            onChange={e => setAdminResponseInput(e.target.value)}
                            placeholder="e.g. Approved. Thank you for notifying leadership in advance."
                            className="w-full p-2.5 rounded-xl bg-[#1a0f35] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            disabled={reviewLoading}
                            onClick={async () => {
                              setReviewLoading(true);
                              await reviewApplication(app.id, 'approved', adminResponseInput.trim() || undefined);
                              setReviewLoading(false);
                              setReviewingAppId(null);
                              setActionSuccessMsg(`Application approved for ${app.staffName}`);
                              setTimeout(() => setActionSuccessMsg(null), 3000);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve Application</span>
                          </button>

                          <button
                            disabled={reviewLoading}
                            onClick={async () => {
                              setReviewLoading(true);
                              await reviewApplication(app.id, 'rejected', adminResponseInput.trim() || undefined);
                              setReviewLoading(false);
                              setReviewingAppId(null);
                              setActionSuccessMsg(`Application rejected for ${app.staffName}`);
                              setTimeout(() => setActionSuccessMsg(null), 3000);
                            }}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject Application</span>
                          </button>

                          <button
                            onClick={() => setReviewingAppId(null)}
                            className="px-3 py-2 rounded-xl bg-purple-950/60 text-purple-300 hover:text-white text-xs ml-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeAdminTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#110c26] p-4 rounded-xl border border-purple-900/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Announcements Management
              </h3>
              <p className="text-xs text-purple-300/70">
                Broadcast server directives and manage published bulletins.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setClearAnnouncementsConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>

              <button
                onClick={() => setShowAddAnnouncement(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Create Announcement</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0f0a24] border border-purple-900/40 text-center text-purple-400 text-xs">
                No announcements currently published.
              </div>
            ) : (
              announcements.map(ann => (
                <div
                  key={ann.id}
                  className="p-4 rounded-xl bg-[#110b2a] border border-purple-900/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-purple-900/30 pb-2">
                    {/* Line 1: Important • Pinned */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-purple-900/70 border border-purple-500/30 text-[10px] font-bold text-purple-200 font-mono uppercase">
                        {ann.tag || 'IMPORTANT'}
                      </span>
                      <span className="text-purple-400 text-xs font-bold">•</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 font-mono uppercase flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5 text-amber-400 rotate-45 inline" />
                        {ann.isPinned ? 'PINNED' : 'PINNED'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-purple-400 font-mono">
                        {ann.createdAt}
                      </span>
                      <button
                        onClick={async () => {
                          await deleteAnnouncement(ann.id);
                          setActionSuccessMsg('Announcement removed.');
                          setTimeout(() => setActionSuccessMsg(null), 2000);
                        }}
                        className="p-1 rounded text-red-400 hover:text-red-200 hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line 2: VoidMC Staff Command System */}
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300 font-display">
                    VoidMC Staff Command System
                  </div>

                  {/* Line 3: Title */}
                  <h4 className="text-sm font-bold text-white">{ann.title}</h4>

                  {/* Line 4: Content */}
                  <p className="text-xs text-purple-200/90 leading-relaxed bg-black/30 p-3 rounded-lg border border-purple-900/30 whitespace-pre-wrap">
                    {ann.content}
                  </p>

                  <div className="text-[10px] text-purple-400 pt-1 flex items-center justify-between border-t border-purple-900/30">
                    <span>Published by {ann.author} ({ann.authorRole})</span>
                    <span className="font-mono text-purple-500">VoidMC Broadcast</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DISCIPLINARY STRIKES */}
      {activeAdminTab === 'strikes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#110c26] p-4 rounded-xl border border-purple-900/40">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Staff Disciplinary Strikes
              </h3>
              <p className="text-xs text-purple-300/70">
                Authorized administrators can issue official strikes with real-time staff alerts.
              </p>
            </div>

            <button
              onClick={() => setShowIssueStrike(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Issue New Strike</span>
            </button>
          </div>

          <div className="space-y-3">
            {strikesList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0f0a24] border border-purple-900/40 text-center text-purple-400 text-xs">
                No active disciplinary strikes on record. Server staff team is compliant.
              </div>
            ) : (
              strikesList.map(strike => (
                <div
                  key={strike.id}
                  className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-mono font-bold">
                        Strike {strike.strikeNumber}/3
                      </span>
                      <span className="text-xs font-bold text-white">{strike.staffName}</span>
                      <span className="text-[10px] text-purple-400 font-mono">IGN: {strike.minecraftIgn}</span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                        strike.status === 'active' ? 'bg-red-900 text-red-200' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {strike.status}
                      </span>
                    </div>
                    <p className="text-xs text-red-200">{strike.reason}</p>
                    <div className="text-[10px] text-red-300/70 pt-0.5">
                      Issued by {strike.issuedBy} on {strike.issuedAt}
                      {strike.acknowledged ? ' • Acknowledged by staff ✓' : ' • Pending acknowledgment ⏳'}
                    </div>
                  </div>

                  {strike.status === 'active' && (
                    <button
                      onClick={async () => {
                        await revokeStrike(strike.id);
                        setActionSuccessMsg('Strike revoked.');
                        setTimeout(() => setActionSuccessMsg(null), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/30 text-xs text-purple-200 transition-colors shrink-0"
                    >
                      Revoke Strike
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM RESET & DANGER ZONE */}
      {activeAdminTab === 'system' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-red-950/30 border-2 border-red-500/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-900/50 text-red-400 border border-red-500/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase font-display">
                  System Reset & Database Purge
                </h3>
                <p className="text-xs text-red-200/80">
                  Resets the system back to the clean baseline state.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#140a12] border border-red-500/30 text-xs text-red-200/90 space-y-2">
              <p className="font-semibold text-red-400">What will happen when you reset:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>All attendance logs and history will be cleared.</li>
                <li>All custom announcements and disciplinary strikes will be reset.</li>
                <li>All active login sessions will be safely terminated.</li>
                <li>The three core authorized accounts (<strong className="text-amber-300">Elite ansh, obito uchiha, Santosh Rout</strong>) will remain preserved.</li>
              </ul>
            </div>

            <div>
              <button
                onClick={() => {
                  setSystemResetInput('');
                  setSystemResetConfirm(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Execute Complete System Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0f0924] border border-purple-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white uppercase font-display">
                  Onboard New Staff Member
                </h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-purple-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {addStaffError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
                {addStaffError}
              </div>
            )}

            {/* Created Credentials Copy Box */}
            {createdCredentials ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Account Created Successfully! Copy & Send to Staff Member:</span>
                </div>
                <div className="p-3 rounded-lg bg-[#080514] font-mono text-xs text-purple-200 space-y-1">
                  <div><strong>Username:</strong> {createdCredentials.username}</div>
                  <div><strong>Password:</strong> {createdCredentials.password}</div>
                  <div><strong>Portal:</strong> {window.location.origin}</div>
                </div>
                <button
                  onClick={handleCopyCredentials}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedCreds ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Staff Credentials'}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Staff Display Name *</label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      placeholder="e.g. Alex Hunter"
                      className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Minecraft IGN *</label>
                    <input
                      type="text"
                      value={newStaffIgn}
                      onChange={e => setNewStaffIgn(e.target.value)}
                      placeholder="e.g. Alex_Hunter"
                      className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Assigned Role *</label>
                    <select
                      value={newStaffRole}
                      onChange={e => setNewStaffRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                    >
                      {rolesList
                        .filter(r => !r.isOwnerRole && r.id !== 'staff-manager')
                        .map(r => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Department</label>
                    <input
                      type="text"
                      value={newStaffDept}
                      onChange={e => setNewStaffDept(e.target.value)}
                      placeholder="e.g. Moderation, Support"
                      className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Login Username *</label>
                    <input
                      type="text"
                      value={newStaffUsername}
                      onChange={e => setNewStaffUsername(e.target.value)}
                      placeholder="e.g. alexhunter"
                      className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 font-semibold mb-1">Login Password *</label>
                    <input
                      type="text"
                      value={newStaffPassword}
                      onChange={e => setNewStaffPassword(e.target.value)}
                      placeholder="e.g. Staff@Void123"
                      className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 rounded-lg bg-purple-950/60 text-purple-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 cursor-pointer"
                  >
                    Create Staff Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f0924] border border-purple-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="text-base font-bold text-white">Edit: {editingStaff.name}</h3>
              <button onClick={() => setEditingStaff(null)} className="text-purple-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-purple-300 font-semibold mb-1">Minecraft IGN</label>
                <input
                  type="text"
                  value={editIgn}
                  onChange={e => setEditIgn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {!editingStaff.isAdmin && (
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Role / Rank</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                  >
                    {rolesList.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as 'active' | 'suspended')}
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-lg bg-purple-950/60 text-purple-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetPwStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f0924] border border-purple-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Reset Staff Password</h3>
              </div>
              <button onClick={() => setResetPwStaff(null)} className="text-purple-400 hover:text-white">✕</button>
            </div>

            {resetPwMessage ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs">
                {resetPwMessage}
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
                <p className="text-purple-300">
                  Changing password for: <strong className="text-white">{resetPwStaff.name}</strong> (@{resetPwStaff.username}).
                  This will invalidate all current active sessions for this staff member.
                </p>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">New Password</label>
                  <input
                    type="text"
                    value={newPasswordVal}
                    onChange={e => setNewPasswordVal(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetPwStaff(null)}
                    className="px-4 py-2 rounded-lg bg-purple-950/60 text-purple-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Confirm Password Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE STAFF */}
      {deleteStaffConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#140a12] border border-red-500/50 p-6 text-center space-y-4">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Remove Staff Member?</h3>
            <p className="text-xs text-red-200/80">
              Are you sure you want to remove <strong>{deleteStaffConfirm.name}</strong>? Their account, credentials, and active logins will be deleted.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteStaffConfirm(null)}
                className="w-1/2 py-2 rounded-lg bg-purple-950/60 text-purple-300 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR ATTENDANCE CONFIRM */}
      {clearAttendanceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#140a12] border border-red-500/50 p-6 text-center space-y-4">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Clear All Attendance Records?</h3>
            <p className="text-xs text-red-200/80">
              This will permanently delete all {attendanceRecords.length} attendance records from the server database.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setClearAttendanceConfirm(false)}
                className="w-1/2 py-2 rounded-lg bg-purple-950/60 text-purple-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllAttendance}
                className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Clear Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR ANNOUNCEMENTS CONFIRM */}
      {clearAnnouncementsConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#140a12] border border-red-500/50 p-6 text-center space-y-4">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Clear All Announcements?</h3>
            <p className="text-xs text-red-200/80">
              Are you sure you want to remove all published announcements?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setClearAnnouncementsConfirm(false)}
                className="w-1/2 py-2 rounded-lg bg-purple-950/60 text-purple-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllAnnouncements}
                className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SYSTEM RESET CONFIRM */}
      {systemResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#160a12] border-2 border-red-500/70 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-lg font-bold text-white uppercase font-display">
                Confirm System Reset
              </h3>
            </div>
            <p className="text-xs text-red-200 leading-relaxed">
              This is a destructive action. Type <strong className="text-white font-mono bg-red-950 px-1.5 py-0.5 rounded border border-red-500/40">RESET</strong> below to confirm.
            </p>
            <input
              type="text"
              value={systemResetInput}
              onChange={e => setSystemResetInput(e.target.value)}
              placeholder="Type RESET"
              className="w-full px-3 py-2 rounded-lg bg-[#0a050c] border border-red-500/50 text-white font-mono text-center text-sm focus:outline-none focus:border-red-400"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSystemResetConfirm(false)}
                className="w-1/2 py-2 rounded-lg bg-purple-950/60 text-purple-300 text-xs"
              >
                Cancel
              </button>
              <button
                disabled={systemResetInput.trim().toUpperCase() !== 'RESET'}
                onClick={handleSystemReset}
                className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer"
              >
                Execute Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ANNOUNCEMENT */}
      {showAddAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f0924] border border-purple-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="text-base font-bold text-white uppercase font-display">Create Announcement</h3>
              <button onClick={() => setShowAddAnnouncement(false)} className="text-purple-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncementSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-purple-300 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  placeholder="e.g. End War Event Scheduled"
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Tag / Category</label>
                <select
                  value={annTag}
                  onChange={e => setAnnTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="IMPORTANT">IMPORTANT</option>
                  <option value="SERVER">SERVER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="EVENT">EVENT</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Content *</label>
                <textarea
                  rows={4}
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  placeholder="Type bulletin text..."
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="annPinned"
                  checked={annPinned}
                  onChange={e => setAnnPinned(e.target.checked)}
                  className="rounded border-purple-500"
                />
                <label htmlFor="annPinned" className="text-purple-300 font-semibold cursor-pointer">
                  Pin to top of staff dashboard
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAnnouncement(false)}
                  className="px-4 py-2 rounded-lg bg-purple-950/60 text-purple-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE STRIKE */}
      {showIssueStrike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#140a16] border border-red-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-red-950 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base text-white uppercase font-display">Issue Disciplinary Strike</h3>
              </div>
              <button onClick={() => setShowIssueStrike(false)} className="text-purple-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleIssueStrikeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-red-200 font-semibold mb-1">Target Staff Member *</label>
                <select
                  value={strikeStaffId}
                  onChange={e => setStrikeStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#200f24] border border-red-500/30 text-white focus:outline-none focus:border-red-400"
                >
                  <option value="">Select staff member...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - IGN: {s.minecraftIgn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-red-200 font-semibold mb-1">Severity</label>
                <select
                  value={strikeSeverity}
                  onChange={e => setStrikeSeverity(e.target.value as 'minor' | 'major' | 'critical')}
                  className="w-full px-3 py-2 rounded-lg bg-[#200f24] border border-red-500/30 text-white focus:outline-none focus:border-red-400"
                >
                  <option value="minor">Minor Infraction</option>
                  <option value="major">Major Breach</option>
                  <option value="critical">Critical / Final Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-red-200 font-semibold mb-1">Violation Reason *</label>
                <textarea
                  rows={3}
                  value={strikeReason}
                  onChange={e => setStrikeReason(e.target.value)}
                  placeholder="State the rule violation or reason for strike..."
                  className="w-full px-3 py-2 rounded-lg bg-[#200f24] border border-red-500/30 text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-red-200 font-semibold mb-1">Evidence URL (Optional)</label>
                <input
                  type="text"
                  value={strikeEvidence}
                  onChange={e => setStrikeEvidence(e.target.value)}
                  placeholder="https://imgur.com/... or log link"
                  className="w-full px-3 py-2 rounded-lg bg-[#200f24] border border-red-500/30 text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueStrike(false)}
                  className="px-4 py-2 rounded-lg bg-purple-950/60 text-purple-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Issue Strike & Alert Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
