import React, { useState } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import {
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Trash2,
  AlertCircle,
  Shield,
  User,
  Filter,
  Search,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';
import { StaffLeaveApplication } from '../../types';

export const ApplicationsView: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    applicationsList,
    submitApplication,
    reviewApplication,
    deleteApplication,
    setShowStaffLoginModal,
  } = useVoidMC();

  // Form State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [appType, setAppType] = useState<'LOA' | 'Leave'>('LOA');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Admin Review State
  const [reviewingAppId, setReviewingAppId] = useState<string | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowStaffLoginModal(true);
      return;
    }

    if (!reason.trim()) {
      setSubmitError('Please provide a reason for your application.');
      return;
    }
    if (!startDate || !endDate) {
      setSubmitError('Please specify both the start date and end date.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setSubmitError('End date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const res = await submitApplication(appType, reason.trim(), startDate, endDate, additionalDetails.trim() || undefined);
    setSubmitting(false);

    if (res.success) {
      setSubmitSuccess(res.message);
      setReason('');
      setStartDate('');
      setEndDate('');
      setAdditionalDetails('');
      setShowSubmitModal(false);
      setTimeout(() => setSubmitSuccess(null), 4000);
    } else {
      setSubmitError(res.message);
    }
  };

  const handleReview = async (appId: string, status: 'approved' | 'rejected') => {
    setReviewActionLoading(true);
    await reviewApplication(appId, status, adminResponseText.trim() || undefined);
    setReviewActionLoading(false);
    setReviewingAppId(null);
    setAdminResponseText('');
  };

  // Applications visible to current user:
  // If Admin: can view all applications.
  // If Normal staff: can view their own submitted applications.
  const myApplications = currentUser
    ? applicationsList.filter(a => a.staffId === currentUser.id)
    : [];

  const displayList = isAdmin ? applicationsList : myApplications;

  const filteredApplications = displayList.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch =
      app.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.minecraftIgn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = displayList.filter(a => a.status === 'pending').length;
  const approvedCount = displayList.filter(a => a.status === 'approved').length;
  const rejectedCount = displayList.filter(a => a.status === 'rejected').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#120a2a] via-[#180f38] to-[#120a2a] border border-purple-500/30 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/30 border border-purple-500/40 text-purple-300 shadow-lg">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                  Staff Applications — LOA & Leave
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                    Admin Review Active
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Submit Leave of Absence (LOA) and Leave requests, track approval status, and manage staff availability.
              </p>
            </div>
          </div>

          {/* Action Button */}
          {currentUser && (
            <button
              onClick={() => {
                setShowSubmitModal(true);
                setSubmitError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Application</span>
            </button>
          )}
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#140c2e]/80 border border-purple-500/30 flex items-center justify-between">
          <span className="text-xs text-purple-300/80 font-medium">Total Apps</span>
          <span className="text-lg font-bold font-mono text-white">{displayList.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#140c2e]/80 border border-amber-500/30 flex items-center justify-between">
          <span className="text-xs text-amber-300/80 font-medium">Pending</span>
          <span className="text-lg font-bold font-mono text-amber-400">{pendingCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#140c2e]/80 border border-emerald-500/30 flex items-center justify-between">
          <span className="text-xs text-emerald-300/80 font-medium">Approved</span>
          <span className="text-lg font-bold font-mono text-emerald-400">{approvedCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#140c2e]/80 border border-red-500/30 flex items-center justify-between">
          <span className="text-xs text-red-300/80 font-medium">Rejected</span>
          <span className="text-lg font-bold font-mono text-red-400">{rejectedCount}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#120a2a]/90 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-purple-400/70 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, IGN, or reason..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#170e33] border border-purple-500/30 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer capitalize ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-950/40 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-500/20'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Application List */}
      <div className="space-y-3">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0f0924]/80 border border-purple-900/30 space-y-3">
            <FileText className="w-10 h-10 text-purple-400/40 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Applications Found</h3>
            <p className="text-xs text-purple-300/60 max-w-sm mx-auto">
              {currentUser
                ? 'You have not submitted any applications matching this filter. Click "Submit Application" above to request an LOA or Leave.'
                : 'Sign in to your staff account to submit and view your LOA or Leave applications.'}
            </p>
            {!currentUser && (
              <button
                onClick={() => setShowStaffLoginModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                Sign In to Staff Account
              </button>
            )}
          </div>
        ) : (
          filteredApplications.map(app => (
            <div
              key={app.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                app.status === 'approved'
                  ? 'bg-[#0f1d1e]/50 border-emerald-500/30'
                  : app.status === 'rejected'
                  ? 'bg-[#1e0f17]/50 border-red-500/30'
                  : 'bg-[#140c2e]/80 border-purple-500/30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Applicant & Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-purple-300" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
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
                        {app.type === 'LOA' ? 'Leave of Absence (LOA)' : 'Standard Leave'}
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

                    {/* Date Duration */}
                    <div className="flex items-center gap-2 text-xs text-purple-200/90 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        <strong>{app.startDate}</strong> to <strong>{app.endDate}</strong>
                      </span>
                      <span className="text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/20">
                        Submitted: {app.submittedAt}
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="p-3 rounded-xl bg-black/40 border border-purple-900/30 text-xs text-slate-200 mt-2">
                      <p className="font-semibold text-purple-300 mb-0.5">Reason for Absence:</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{app.reason}</p>
                      {app.additionalDetails && (
                        <div className="mt-2 pt-2 border-t border-purple-900/30 text-[11px] text-purple-300/80">
                          <span className="font-semibold text-purple-400">Additional Details: </span>
                          {app.additionalDetails}
                        </div>
                      )}
                    </div>

                    {/* Admin Review Response block if already reviewed */}
                    {app.reviewedAt && (
                      <div
                        className={`p-3 rounded-xl border text-xs mt-2 ${
                          app.status === 'approved'
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-red-950/30 border-red-500/40 text-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold uppercase tracking-wider text-[10px]">
                            Admin Decision by {app.reviewedBy || 'Authorized Admin'}
                          </span>
                          <span className="text-[10px] opacity-75">{app.reviewedAt}</span>
                        </div>
                        {app.adminResponse ? (
                          <p className="leading-relaxed italic">"{app.adminResponse}"</p>
                        ) : (
                          <p className="italic text-[11px]">No additional comments provided.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center md:flex-col gap-2 shrink-0">
                  {/* Delete button (Applicant can delete pending app, Admin can delete any) */}
                  {(isAdmin || (currentUser && currentUser.id === app.staffId && app.status === 'pending')) && (
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="p-2 rounded-xl bg-purple-950/40 hover:bg-red-950 border border-purple-500/20 hover:border-red-500/40 text-purple-400 hover:text-red-300 transition-colors"
                      title="Withdraw / Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Admin Review Trigger Button */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setReviewingAppId(reviewingAppId === app.id ? null : app.id);
                        setAdminResponseText(app.adminResponse || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{reviewingAppId === app.id ? 'Close' : 'Review'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Admin Review Expanding Box */}
              {isAdmin && reviewingAppId === app.id && (
                <div className="mt-4 pt-4 border-t border-purple-900/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Administrative Review Console
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-300 mb-1">
                      Admin Response / Explanation to Applicant:
                    </label>
                    <textarea
                      rows={2}
                      value={adminResponseText}
                      onChange={e => setAdminResponseText(e.target.value)}
                      placeholder="e.g. Approved. Have a good break! / Denied due to staff shortage during event."
                      className="w-full p-2.5 rounded-xl bg-[#1a0f35] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={reviewActionLoading}
                      onClick={() => handleReview(app.id, 'approved')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Application</span>
                    </button>

                    <button
                      disabled={reviewActionLoading}
                      onClick={() => handleReview(app.id, 'rejected')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Application</span>
                    </button>

                    <button
                      onClick={() => setReviewingAppId(null)}
                      className="px-3 py-2 rounded-xl bg-purple-950/60 text-purple-300 hover:text-white text-xs font-medium ml-auto"
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

      {/* Application Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#120a28] border border-purple-500/40 p-6 shadow-2xl shadow-purple-950/60 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />

            <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide uppercase font-display">
                    Submit Staff Application
                  </h3>
                  <p className="text-xs text-purple-300/70">
                    Request Leave of Absence (LOA) or Leave
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-lg text-purple-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Applicant Info */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block">{currentUser?.name}</span>
                  <span className="text-[10px] text-purple-300 font-mono">
                    IGN: {currentUser?.minecraftIgn}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/30 text-purple-300 font-mono text-[10px] uppercase">
                  {currentUser?.role}
                </span>
              </div>

              {/* Type Selector: LOA vs Leave */}
              <div>
                <label className="block text-purple-300 font-semibold mb-1.5">
                  Application Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAppType('LOA')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      appType === 'LOA'
                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:text-white'
                    }`}
                  >
                    <span className="font-bold block text-xs">LOA (Leave of Absence)</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Extended period (3+ days)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppType('Leave')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      appType === 'Leave'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:text-white'
                    }`}
                  >
                    <span className="font-bold block text-xs">Standard Leave</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Short break (1–3 days)</span>
                  </button>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-purple-300 font-semibold mb-1">
                  Reason for Request <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. School examinations, family trip, medical rest"
                  className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-purple-300 font-semibold mb-1">
                  Additional Details / Contact Info (Optional)
                </label>
                <textarea
                  rows={2}
                  value={additionalDetails}
                  onChange={e => setAdditionalDetails(e.target.value)}
                  placeholder="e.g. Will be reachable on Discord in emergencies"
                  className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-purple-950/60 text-purple-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
