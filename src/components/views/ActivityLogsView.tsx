import React, { useState, useEffect } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  History,
  Clock,
  ShieldAlert,
  Calendar,
  UserCheck,
  Megaphone,
  FileText,
  Users,
  Laptop,
  Globe,
  Radio,
  RefreshCw,
  LogOut,
  Crown,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Lock,
} from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const {
    activities,
    activeSessions,
    fetchActiveSessions,
    terminateSession,
    isAdmin,
    currentUser,
    staffList,
  } = useVoidMC();

  const [activeTab, setActiveTab] = useState<'sessions' | 'audit'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Auto-refresh active sessions on mount and every 10s
  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(() => {
      fetchActiveSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveSessions]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchActiveSessions();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleTerminate = async (sessionId: string, staffName: string) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to force terminate the active session for ${staffName}?`)) {
      return;
    }
    setTerminatingSessionId(sessionId);
    const result = await terminateSession(sessionId);
    setTerminatingSessionId(null);
    if (result.success) {
      setActionFeedback(`Session for ${staffName} terminated successfully.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } else {
      alert(result.message);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'strike':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'attendance':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'role':
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-purple-400" />;
      case 'application':
        return <FileText className="w-4 h-4 text-pink-400" />;
      case 'security':
        return <Lock className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-purple-400" />;
    }
  };

  // Filtered active sessions
  const filteredSessions = activeSessions.filter(sess => {
    const query = searchQuery.toLowerCase();
    return (
      sess.name.toLowerCase().includes(query) ||
      sess.minecraftIgn.toLowerCase().includes(query) ||
      sess.role.toLowerCase().includes(query) ||
      (sess.ip && sess.ip.includes(query)) ||
      (sess.userAgent && sess.userAgent.toLowerCase().includes(query))
    );
  });

  // Filtered audit logs
  const filteredActivities = activities.filter(item => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtext && item.subtext.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#120a2a] via-[#180f38] to-[#120a2a] border border-purple-500/30 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-purple-300 shadow-lg">
              <Activity className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                  Active Sessions & Activity Logs
                </h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-300/70 mt-1">
                Real-time active staff logins, session telemetry, and immutable system audit trail.
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/70 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Refresh active sessions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
            </button>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Tab Toggle Navigation */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-purple-900/40">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/40'
                : 'bg-purple-950/40 text-purple-300/70 hover:text-white hover:bg-purple-900/40 border border-transparent'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Active Logged-in Staff</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
              {activeSessions.length} Online
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/40'
                : 'bg-purple-950/40 text-purple-300/70 hover:text-white hover:bg-purple-900/40 border border-transparent'
            }`}
          >
            <History className="w-4 h-4 text-purple-300" />
            <span>System Audit Trail</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 text-[10px] font-mono">
              {activities.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#110927] p-3.5 rounded-2xl border border-purple-500/25">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'sessions'
                ? 'Search active staff, IGN, role, IP...'
                : 'Search audit events, actions, staff...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#180e38] border border-purple-500/30 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
          />
        </div>

        {activeTab === 'audit' && (
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['all', 'attendance', 'strike', 'announcement', 'application'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-purple-700 text-white border border-purple-400/50'
                    : 'bg-purple-950/50 text-purple-300/70 hover:text-white hover:bg-purple-900/40 border border-purple-900/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: ACTIVE LOGGED-IN STAFF & SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-purple-300/80 font-bold uppercase tracking-wider">
              Currently Logged In & Connected ({filteredSessions.length})
            </span>
            <span className="text-[11px] text-purple-400/60 font-mono">
              Auto-polled every 10 seconds
            </span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#120a2a]/60 border border-purple-500/20 p-8 space-y-3">
              <Users className="w-12 h-12 text-purple-400/40 mx-auto" />
              <h3 className="text-base font-bold text-white">No Active Staff Sessions Found</h3>
              <p className="text-xs text-purple-300/70 max-w-sm mx-auto">
                {searchQuery
                  ? 'No active sessions match your search criteria.'
                  : 'Currently no staff members are logged in with active tokens.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map(session => {
                const staffMember = staffList.find(s => s.id === session.userId);
                const avatar =
                  session.minecraftIgn
                    ? `https://minotar.net/helm/${encodeURIComponent(session.minecraftIgn)}/100.png`
                    : staffMember?.avatarUrl || 'https://minotar.net/helm/Steve/100.png';

                const isCurrentSelf = currentUser?.id === session.userId;
                const loginFormatted = new Date(session.loginTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                const dateFormatted = new Date(session.loginTime).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={session.sessionId}
                    className={`relative rounded-2xl p-4 border transition-all ${
                      isCurrentSelf
                        ? 'bg-gradient-to-b from-[#1c1142] to-[#140b2f] border-purple-400/60 shadow-xl shadow-purple-950/60 ring-1 ring-purple-400/30'
                        : 'bg-[#140b2f]/90 border-purple-500/25 hover:border-purple-500/40 shadow-lg'
                    }`}
                  >
                    {/* Top row: Avatar, Info, and Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={avatar}
                            alt={session.name}
                            className="w-11 h-11 rounded-xl object-cover bg-purple-950 border border-purple-400/40"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#140b2f]">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white truncate">
                              {session.name}
                            </h3>
                            {session.isAdmin && (
                              <span title="Administrator">
                                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/30 inline-block mt-0.5">
                            {session.role}
                          </span>
                        </div>
                      </div>

                      {/* Online Pill */}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wide shrink-0">
                        {isCurrentSelf ? 'You (Active)' : 'Online'}
                      </span>
                    </div>

                    {/* Session Details List */}
                    <div className="mt-3.5 pt-3 border-t border-purple-900/40 space-y-1.5 text-xs text-purple-200/80">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-purple-400 font-medium">Minecraft IGN:</span>
                        <span className="font-mono font-bold text-white">{session.minecraftIgn}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-purple-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-400" />
                          Login Time:
                        </span>
                        <span className="font-mono text-purple-200">
                          {dateFormatted} at {loginFormatted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-purple-400 font-medium flex items-center gap-1">
                          <Globe className="w-3 h-3 text-purple-400" />
                          IP Address:
                        </span>
                        <span className="font-mono text-purple-300">
                          {session.ip || 'Protected'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-purple-400 font-medium flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-purple-400" />
                          Client:
                        </span>
                        <span className="font-mono text-purple-300 truncate max-w-[160px]" title={session.userAgent}>
                          {session.userAgent ? session.userAgent.split(' ')[0] : 'Web Client'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Action: Force Terminate */}
                    {isAdmin && (
                      <div className="mt-3.5 pt-2.5 border-t border-purple-900/30 flex justify-end">
                        <button
                          onClick={() => handleTerminate(session.sessionId, session.name)}
                          disabled={terminatingSessionId === session.sessionId}
                          className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-950/50 hover:bg-red-900/50 px-2.5 py-1 rounded-lg border border-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>
                            {terminatingSessionId === session.sessionId
                              ? 'Terminating...'
                              : isCurrentSelf
                              ? 'End My Session'
                              : 'Force Logout'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SYSTEM AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/40 text-xs">
            <span className="text-purple-300/80 font-bold uppercase tracking-wider">
              Recent System Events ({filteredActivities.length})
            </span>
            <span className="text-purple-400/60 font-mono text-[11px]">
              Chronological Audit Trail
            </span>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-xs text-purple-400/60">
              No activity logs match your filter.
            </div>
          ) : (
            filteredActivities.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#1a0e3a]/60 hover:bg-[#1f1146] border border-purple-900/35 flex items-start gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-black/40 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  {getLogIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{item.text}</span>
                    <span className="text-[10px] text-purple-300/60 font-mono-code shrink-0">
                      {item.timeAgo}
                    </span>
                  </div>
                  {item.subtext && (
                    <p className="text-[11px] text-purple-300/75 mt-0.5">{item.subtext}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
