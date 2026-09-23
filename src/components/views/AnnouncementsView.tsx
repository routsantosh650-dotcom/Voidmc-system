import React, { useState } from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import { Megaphone, PlusCircle, Pin, Trash2, Edit2, CheckCircle2, Shield, AlertTriangle, X } from 'lucide-react';
import { Announcement } from '../../types/index';

interface AnnouncementsViewProps {
  onOpenAnnouncement: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ onOpenAnnouncement }) => {
  const { announcements, isAdmin, deleteAnnouncement, updateAnnouncement } = useVoidMC();
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [deletingAnn, setDeletingAnn] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag] = useState('IMPORTANT');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn) return;
    const res = await updateAnnouncement(editingAnn.id, {
      title: editTitle,
      content: editContent,
      tag: editTag,
    });
    if (res.success) {
      setEditingAnn(null);
      setMsg({ type: 'success', text: 'Announcement updated successfully!' });
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ type: 'error', text: res.message || 'Failed to update announcement' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAnn) return;
    setIsDeleting(true);
    try {
      const res = await deleteAnnouncement(deletingAnn.id);
      if (res.success) {
        setMsg({ type: 'success', text: 'Announcement deleted successfully.' });
      } else {
        setMsg({ type: 'error', text: res.message || 'Failed to delete announcement.' });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting announcement';
      setMsg({ type: 'error', text: errorMessage });
    } finally {
      setIsDeleting(false);
      setDeletingAnn(null);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#130a2a]/90 p-5 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-md">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase font-display">
              Server Directives & Announcements
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
              Official bulletins, server updates, and critical guidelines broadcast to all staff.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAnnouncement}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Toast Feedback */}
      {msg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            msg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/80 border-red-500/50 text-red-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0f0a24] border border-purple-900/40 text-purple-400 text-xs">
            No announcements currently published.
          </div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann.id}
              className={`p-5 rounded-2xl border transition-all ${
                ann.isPinned
                  ? 'bg-[#150d2e]/95 border-amber-500/40 shadow-xl shadow-purple-950/40'
                  : 'bg-[#130a2a]/90 border-purple-500/25'
              }`}
            >
              {/* Header Row: Line 1 (Important • Pinned) & Action Controls */}
              <div className="flex items-center justify-between gap-2 border-b border-purple-900/30 pb-2.5 mb-3">
                {/* Line 1: Important • Pinned */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs font-bold uppercase tracking-wider font-mono">
                    {ann.tag || 'IMPORTANT'}
                  </span>
                  <span className="text-purple-400 font-bold">•</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                    <Pin className="w-3 h-3 text-amber-400 rotate-45 inline" />
                    {ann.isPinned ? 'PINNED' : 'PINNED'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-purple-300/70 font-mono">
                    {ann.timeAgo || ann.createdAt}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAnn(ann);
                          setEditTitle(ann.title);
                          setEditContent(ann.content);
                          setEditTag(ann.tag);
                        }}
                        className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingAnn(ann)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Line 2: VoidMC Staff Command System */}
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-300 font-display mb-1.5">
                VoidMC Staff Command System
              </div>

              {/* Line 3: Announcement Title */}
              <h3 className="text-base sm:text-lg font-extrabold text-white mb-3 leading-snug">
                {ann.title}
              </h3>

              {/* Line 4: Announcement Content */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/40 p-4 rounded-xl border border-purple-900/40 whitespace-pre-wrap">
                {ann.content}
              </p>

              {/* Footer: Posted By & Broadcast Badge */}
              <div className="mt-3.5 pt-2.5 border-t border-purple-900/25 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    Posted by <strong className="text-purple-200">{ann.author}</strong>{' '}
                    <span className="text-purple-400 font-mono">({ann.authorRole})</span>
                  </span>
                </span>
                <span className="font-mono text-[10px] text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-500/20">
                  VoidMC Broadcast
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {deletingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f0924] border border-red-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase font-display text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Confirm Announcement Deletion</span>
              </div>
              <button
                onClick={() => setDeletingAnn(null)}
                className="text-purple-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-purple-200">
              <p>Are you sure you want to permanently delete this announcement?</p>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/50">
                <div className="text-[10px] font-mono text-amber-300 uppercase font-bold mb-1">
                  {deletingAnn.tag} • PINNED
                </div>
                <div className="font-bold text-white text-sm">"{deletingAnn.title}"</div>
              </div>
              <p className="text-[11px] text-red-300/80">
                This action cannot be undone and will immediately remove this bulletin from all staff boards.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingAnn(null)}
                className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ANNOUNCEMENT MODAL */}
      {editingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f0924] border border-purple-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="text-base font-bold text-white uppercase font-display">Edit Announcement</h3>
              <button
                onClick={() => setEditingAnn(null)}
                className="text-purple-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-purple-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Category Tag</label>
                <select
                  value={editTag}
                  onChange={e => setEditTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="IMPORTANT">IMPORTANT</option>
                  <option value="SERVER">SERVER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="EVENT">EVENT</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-300 font-semibold mb-1">Content</label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181138] border border-purple-500/30 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAnn(null)}
                  className="px-4 py-2 rounded-lg bg-purple-950/60 text-purple-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
