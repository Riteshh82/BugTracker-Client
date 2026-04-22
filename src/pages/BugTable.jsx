import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBugs, updateBug } from '../api';
import { priorityClass, statusClass, typeClass, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const PRIORITIES = ['Blocker', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'];

export default function BugTable() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ priority: '', status: '', search: '' });
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [editingCell, setEditingCell] = useState(null); // { bugId, field }

  const fetchBugs = () => {
    setLoading(true);
    getBugs({ project: projectId, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
      .then(r => setBugs(r.data.bugs))
      .catch(() => toast.error('Failed to load bugs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBugs(); }, [projectId, filters]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...bugs].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (!av && !bv) return 0;
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleInlineEdit = async (bugId, field, value) => {
    try {
      await updateBug(bugId, { [field]: value });
      setBugs(prev => prev.map(b => b._id === bugId ? { ...b, [field]: value } : b));
      setEditingCell(null);
    } catch { toast.error('Update failed'); }
  };

  const SortIcon = ({ col }) => (
    <svg className={`w-3 h-3 inline ml-1 transition-transform ${sortKey === col && sortDir === 'desc' ? 'rotate-180' : ''} ${sortKey !== col ? 'opacity-30' : 'text-notion-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-notion-text">Bug Table</h1>
        <button onClick={() => navigate(`/bugs/new?project=${projectId}`)} className="btn-primary btn-sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Report Bug
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-notion-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
          <input
            className="input input-sm pl-8 w-56"
            placeholder="Search bugs..."
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          />
        </div>
        <select className="input input-sm w-36" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input input-sm w-36" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filters.priority || filters.status || filters.search) && (
          <button onClick={() => setFilters({ priority: '', status: '', search: '' })} className="btn-ghost btn-sm text-red-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-notion-muted self-center">{bugs.length} bug{bugs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-notion-border">
              {[['bugId','ID'],['title','Title'],['priority','Priority'],['status','Status'],['type','Type'],['assignedTo','Assignee'],['createdAt','Reported']].map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)} className="table-header text-left px-4 py-3 cursor-pointer hover:text-notion-text transition-colors">
                  {label}<SortIcon col={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-notion-hover rounded animate-pulse" /></td></tr>
              ))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-notion-muted">No bugs found</td></tr>
            ) : sorted.map((bug, i) => (
              <motion.tr key={bug._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="table-row" onClick={() => navigate(`/bugs/${bug._id}`)}>
                <td className="px-4 py-3 text-xs font-mono text-notion-muted">{bug.bugId}</td>
                <td className="px-4 py-3 text-sm text-notion-text max-w-xs truncate font-medium">{bug.title}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {editingCell?.bugId === bug._id && editingCell.field === 'priority' ? (
                    <select autoFocus className="input input-sm w-28" defaultValue={bug.priority}
                      onChange={e => handleInlineEdit(bug._id, 'priority', e.target.value)}
                      onBlur={() => setEditingCell(null)}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  ) : (
                    <span className={priorityClass(bug.priority)} onDoubleClick={() => setEditingCell({ bugId: bug._id, field: 'priority' })}>{bug.priority}</span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {editingCell?.bugId === bug._id && editingCell.field === 'status' ? (
                    <select autoFocus className="input input-sm w-32" defaultValue={bug.status}
                      onChange={e => handleInlineEdit(bug._id, 'status', e.target.value)}
                      onBlur={() => setEditingCell(null)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={statusClass(bug.status)} onDoubleClick={() => setEditingCell({ bugId: bug._id, field: 'status' })}>{bug.status}</span>
                  )}
                </td>
                <td className="px-4 py-3"><span className={typeClass(bug.type)}>{bug.type}</span></td>
                <td className="px-4 py-3 text-xs text-notion-muted">{bug.assignedTo?.name || <span className="italic">Unassigned</span>}</td>
                <td className="px-4 py-3 text-xs text-notion-muted">{timeAgo(bug.createdAt)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-notion-muted text-center">💡 Double-click Priority or Status to inline edit</p>
    </div>
  );
}
