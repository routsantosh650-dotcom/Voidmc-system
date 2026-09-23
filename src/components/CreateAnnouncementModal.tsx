import React, { useState } from 'react';
import { useVoidMC } from '../context/VoidMCContext';
import { Megaphone, X } from 'lucide-react';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ isOpen, onClose }) => {
  const { createAnnouncement } = useVoidMC();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('IMPORTANT');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createAnnouncement(title, content, tag);
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#120a28] border border-purple-500/40 p-6 shadow-2xl shadow-purple-950/60 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Create Announcement</h3>
              <p className="text-xs text-purple-300/70">Broadcast notification to all staff</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-purple-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1">Announcement Title:</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="e.g. Mandatory Endwar Briefing"
              className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1">Tag Category:</label>
            <select
              value={tag}
              onChange={e => setTag(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-400"
            >
              <option value="IMPORTANT">IMPORTANT</option>
              <option value="STAFF">STAFF</option>
              <option value="EVENT">EVENT</option>
              <option value="SERVER">SERVER</option>
              <option value="MEETING">MEETING</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-purple-200 block mb-1">Content / Message:</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Write the announcement description..."
              className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
            >
              Post Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
