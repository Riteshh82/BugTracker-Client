import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBugs, updateBug, getModules, getFeatures } from '../api';
import { useFilters } from '../context/FilterContext';
import FilterBar from '../components/FilterBar';
import ImportBugsModal from '../components/ImportBugsModal';
import { priorityClass, statusClass, typeClass, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const PRIORITIES = ['Blocker', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'];

export default function BugTable() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { filters, setFilter, setMany, toQueryParams } = useFilters();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [features, setFeatures] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [showImport, setShowImport] = useState(false);

  // Seed project into filter when landing on this page
  useEffect(() => {
    setMany({ project: projectId });
  }, [projectId]);

  // Load modules for filter bar
  useEffect(() => {
    getModules(projectId).then(r => setModules(r.data.modules)).catch(() => {});
  }, [projectId]);

  // Load features when module filter changes
  useEffect(() => {
    if (!filters.module) { setFeatures([]); return; }
    getFeatures(filters.module).then(r => setFeatures(r.data.features)).catch(() => {});
  }, [filters.module]);

  const fetchBugs = useCallback(() => {
    setLoading(true);
    const params = toQueryParams({ project: projectId });
    getBugs(params)
      .then(r => setBugs(r.data.bugs))
      .catch(() => toast.error('Failed to load bugs'))
      .finally(() => setLoading(false));
  }, [filters, projectId]);

  useEffect(() => { fetchBugs(); }, [fetchBugs]);

  const handleInlineEdit = async (bugId, field, value) => {
    try {
      await updateBug(bugId, { [field]: value });
      setBugs(prev => prev.map(b => b._id === bugId ? { ...b, [field]: value } : b));
      setEditingCell(null);
    } catch { toast.error('Update failed'); }
  };

  const SortIcon = ({ col }) => (
    <svg className={`w-3 h-3 inline ml-1 transition-transform ${filters.sortBy === col && filters.sortDir === 'desc' ? 'rotate-180' : ''} ${filters.sortBy !== col ? 'opacity-30' : 'text-notion-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );

  const handleSort = (key) => {
    if (filters.sortBy === key) setFilter('sortDir', filters.sortDir === 'asc' ? 'desc' : 'asc');
    else { setFilter('sortBy', key); setFilter('sortDir', 'asc'); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-notion-text">Bug Table</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Import Excel
          </button>
          <button onClick={() => navigate(`/bugs/new?project=${projectId}`)} className="btn-primary btn-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Report Bug
          </button>
        </div>
      </div>

      <FilterBar hideModule={false} modules={modules} features={features} bugCount={bugs.length} />

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
            ) : bugs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-notion-muted">No bugs found</td></tr>
            ) : bugs.map((bug, i) => (
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

      <ImportBugsModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={fetchBugs}
      />
    </div>
  );
}
