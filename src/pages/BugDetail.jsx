import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBug, updateBug, deleteBug, restoreBug, getComments, addComment, getBugActivity } from '../api';
import { priorityClass, statusClass, typeClass, timeAgo, initials, avatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUSES   = ['Open','Assigned','In Progress','Resolved','Closed','Reopened'];
const PRIORITIES = ['Blocker','High','Medium','Low'];

const Avatar = ({ name, size = 7 }) => (
  <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`} style={{ background: avatarColor(name || '') }}>
    {initials(name)}
  </div>
);

export default function BugDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bug, setBug] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState('comments');
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [bugRes, commentRes, activityRes] = await Promise.all([getBug(id), getComments(id), getBugActivity(id)]);
      setBug(bugRes.data.bug);
      setComments(commentRes.data.comments);
      setActivity(activityRes.data.activity);
    } catch { toast.error('Bug not found'); navigate(-1); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleUpdate = async (field, value) => {
    try {
      const res = await updateBug(id, { [field]: value });
      setBug(res.data.bug);
      toast.success('Updated!');
    } catch { toast.error('Update failed'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const res = await addComment(id, { content: comment });
      setComments(prev => [...prev, res.data.comment]);
      setComment('');
    } catch { toast.error('Failed to post comment'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Move this bug to trash?')) return;
    await deleteBug(id);
    toast.success('Moved to trash');
    navigate(-1);
  };

  if (!bug) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-notion-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-notion-muted bg-notion-hover px-2 py-0.5 rounded">{bug.bugId}</span>
              <span className={typeClass(bug.type)}>{bug.type}</span>
              <span className={priorityClass(bug.priority)}>{bug.priority}</span>
              <span className={statusClass(bug.status)}>{bug.status}</span>
            </div>
            <h1 className="text-xl font-bold text-notion-text">{bug.title}</h1>
            <p className="text-xs text-notion-muted mt-1">Reported by <span className="text-notion-text">{bug.createdBy?.name}</span> · {timeAgo(bug.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="btn-danger btn-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Trash
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-notion-text">Details</h2>
              {bug.description && (<div><label className="label">Description</label><p className="text-sm text-notion-text/80 leading-relaxed whitespace-pre-wrap">{bug.description}</p></div>)}
              {bug.stepsToReproduce && (<div><label className="label">Steps to Reproduce</label><p className="text-sm text-notion-text/80 whitespace-pre-wrap leading-relaxed">{bug.stepsToReproduce}</p></div>)}
              {bug.expectedResult && (<div><label className="label">Expected Result</label><p className="text-sm text-notion-text/80">{bug.expectedResult}</p></div>)}
              {bug.actualResult && (<div><label className="label">Actual Result</label><p className="text-sm text-notion-text/80">{bug.actualResult}</p></div>)}
            </div>

            {/* Screenshots */}
            {bug.screenshots?.length > 0 && (
              <div className="card">
                <h2 className="text-sm font-semibold text-notion-text mb-3">Screenshots</h2>
                <div className="flex flex-wrap gap-3">
                  {bug.screenshots.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer">
                      <img src={s.url} alt={s.filename} className="w-32 h-24 object-cover rounded-lg border border-notion-border hover:border-notion-accent transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments / Activity tabs */}
            <div className="card">
              <div className="flex gap-4 border-b border-notion-border mb-4 -mx-5 px-5">
                {['comments','activity','history'].map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`pb-3 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'text-notion-accent border-notion-accent' : 'text-notion-muted border-transparent hover:text-notion-text'}`}>
                    {t} {t === 'comments' ? `(${comments.length})` : t === 'activity' ? `(${activity.length})` : ''}
                  </button>
                ))}
              </div>

              {tab === 'comments' && (
                <div className="space-y-4">
                  {comments.length === 0 && <p className="text-xs text-notion-muted text-center py-4">No comments yet</p>}
                  {comments.map(c => (
                    <div key={c._id} className="flex gap-3">
                      <Avatar name={c.author?.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-notion-text">{c.author?.name}</span>
                          <span className="text-[10px] text-notion-muted">{timeAgo(c.createdAt)}</span>
                          {c.isEdited && <span className="text-[10px] text-notion-muted italic">(edited)</span>}
                        </div>
                        <p className="text-sm text-notion-text/80 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <form onSubmit={handleAddComment} className="flex gap-3 pt-2 border-t border-notion-border">
                    <Avatar name={user?.name} />
                    <div className="flex-1 flex gap-2">
                      <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="input flex-1" />
                      <button type="submit" disabled={saving || !comment.trim()} className="btn-primary btn-sm">Post</button>
                    </div>
                  </form>
                </div>
              )}

              {tab === 'activity' && (
                <div className="space-y-3">
                  {activity.length === 0 && <p className="text-xs text-notion-muted text-center py-4">No activity yet</p>}
                  {activity.map((a, i) => (
                    <div key={a._id} className="flex items-center gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-notion-accent shrink-0" />
                      <Avatar name={a.performedBy?.name} size={5} />
                      <span className="text-notion-text">{a.performedBy?.name}</span>
                      <span className="text-notion-muted">{a.action.replace('_', ' ')}</span>
                      {a.metadata?.fields && <span className="text-notion-muted">({a.metadata.fields})</span>}
                      <span className="ml-auto text-notion-muted">{timeAgo(a.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'history' && (
                <div className="space-y-3">
                  {(!bug.history || bug.history.length === 0) && <p className="text-xs text-notion-muted text-center py-4">No history yet</p>}
                  {(bug.history || []).map((h, i) => (
                    <div key={i} className="text-xs bg-notion-bg/50 rounded-lg px-3 py-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-notion-text capitalize">{h.field}</span>
                        <span className="text-notion-muted">changed by</span>
                        <span className="text-notion-accent">{h.changedBy?.name || 'Unknown'}</span>
                        <span className="ml-auto text-notion-muted">{timeAgo(h.changedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 line-through">{String(h.oldValue)}</span>
                        <svg className="w-3 h-3 text-notion-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        <span className="text-emerald-400">{String(h.newValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card space-y-4">
              <h3 className="text-xs font-semibold text-notion-text uppercase tracking-wide">Properties</h3>

              <div>
                <label className="label">Status</label>
                <select className="input" value={bug.status} onChange={e => handleUpdate('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={bug.priority} onChange={e => handleUpdate('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assigned To</label>
                <p className="text-sm text-notion-text">{bug.assignedTo?.name || <span className="text-notion-muted italic">Unassigned</span>}</p>
              </div>
              <div>
                <label className="label">Project</label>
                <p className="text-sm text-notion-text">{bug.project?.name}</p>
              </div>
              {bug.module && <div><label className="label">Module</label><p className="text-sm text-notion-text">{bug.module?.name}</p></div>}
              {bug.feature && <div><label className="label">Feature</label><p className="text-sm text-notion-text">{bug.feature?.name}</p></div>}
              {bug.tags?.length > 0 && (
                <div>
                  <label className="label">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {bug.tags.map(t => <span key={t} className="badge bg-notion-hover text-notion-muted border border-notion-border">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
