import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBugs, restoreBug, updateBug } from '../api';
import { priorityClass, statusClass, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Trash() {
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrashed = () => {
    setLoading(true);
    getBugs({ isDeleted: true, limit: 100 })
      .then(r => setBugs(r.data.bugs))
      .catch(() => toast.error('Failed to load trash'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTrashed(); }, []);

  const handleRestore = async (id) => {
    try {
      await restoreBug(id);
      setBugs(prev => prev.filter(b => b._id !== id));
      toast.success('Bug restored!');
    } catch { toast.error('Restore failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-notion-text flex items-center gap-2">
            <span>🗑️</span> Trash
          </h1>
          <p className="text-notion-muted text-sm mt-1">Soft-deleted bugs — restore or permanently manage them</p>
        </div>
        <span className="text-xs text-notion-muted">{bugs.length} item{bugs.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse bg-notion-hover" />)}
        </div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-lg font-semibold text-notion-text">Trash is empty</h2>
          <p className="text-notion-muted text-sm mt-1">No deleted bugs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bugs.map((bug, i) => (
            <motion.div key={bug._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="card flex items-center gap-4 opacity-70 hover:opacity-100 transition-opacity"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-notion-muted">{bug.bugId}</span>
                  <span className={priorityClass(bug.priority)}>{bug.priority}</span>
                  <span className={statusClass(bug.status)}>{bug.status}</span>
                </div>
                <p className="text-sm font-medium text-notion-text truncate">{bug.title}</p>
                <p className="text-xs text-notion-muted mt-0.5">
                  Deleted {bug.deletedAt ? timeAgo(bug.deletedAt) : 'recently'} · {bug.project?.name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => navigate(`/bugs/${bug._id}`)} className="btn-ghost btn-sm">View</button>
                <button onClick={() => handleRestore(bug._id)} className="btn-secondary btn-sm">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Restore
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
