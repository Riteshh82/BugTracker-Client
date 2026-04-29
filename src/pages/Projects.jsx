import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects, createProject, deleteProject, addMember, removeMember, getUsers } from '../api';
import { useAuth } from '../context/Authcontext';
import { timeAgo, initials, avatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';
const Avatar = ({ name = '', size = 7, title: titleProp }) => (
  <div
    title={titleProp || name}
    style={{ background: avatarColor(name), width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.6}px` }}
    className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
  >
    {initials(name)}
  </div>
);

const Modal = ({ open, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-notion-surface border border-notion-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const GRADIENTS = [
  'from-violet-600 to-indigo-500',
  'from-blue-600 to-cyan-500',
  'from-emerald-600 to-teal-500',
  'from-rose-600 to-pink-500',
  'from-amber-600 to-orange-500',
  'from-fuchsia-600 to-purple-500',
];

export default function Projects() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [projects, setProjects]     = useState([]);
  const [allUsers, setAllUsers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating]     = useState(false);
  const [inviteProject, setInviteProject] = useState(null);
  const [userSearch, setUserSearch]       = useState('');
  const [inviting, setInviting]           = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const r = await getProjects();
      setProjects(r.data.projects);
    } catch { toast.error('Could not load projects'); }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    getUsers().then(r => setAllUsers(r.data.users)).catch(() => {});
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    if (!createForm.name.trim()) return toast.error('Project name is required');
    setCreating(true);
    try {
      await createProject(createForm);
      toast.success('Project created!');
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
    setCreating(false);
  };

  const handleInvite = async (userId) => {
    if (!inviteProject) return;
    const already = inviteProject.members?.some(m => m._id === userId);
    if (already) return toast.error('User is already a member');
    setInviting(true);
    try {
      const r = await addMember(inviteProject._id, userId);
      const updated = r.data.project;
      setProjects(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
      setInviteProject(prev => ({ ...prev, members: updated.members }));
      toast.success('Member invited!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite');
    }
    setInviting(false);
  };

  const handleRemoveMember = async (userId) => {
    if (!inviteProject) return;
    try {
      const r = await removeMember(inviteProject._id, userId);
      const updated = r.data.project;
      setProjects(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
      setInviteProject(prev => ({ ...prev, members: updated.members }));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget._id);
      toast.success('Project deleted');
      setDeleteTarget(null);
      fetchProjects();
    } catch { toast.error('Failed to delete'); }
    setDeleting(false);
  };

  const filteredUsers = allUsers.filter(u =>
    u._id !== user?._id &&
    !inviteProject?.members?.some(m => m._id === u._id) &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const isOwner = p => p.owner?._id === user?._id || p.owner === user?._id;

  return (
    <div className="max-w-6xl mx-auto px-2">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs text-notion-muted uppercase tracking-widest mb-1 font-medium">Workspace</p>
          <h1 className="text-2xl font-bold text-notion-text">Projects</h1>
        </div>
        <button
          id="create-project-btn"
          onClick={() => setShowCreate(true)}
          className="btn-primary btn-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="h-52 rounded-2xl bg-notion-surface border border-notion-border animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-notion-surface border border-notion-border flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-notion-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-notion-text mb-1">No projects yet</h2>
          <p className="text-sm text-notion-muted mb-5">Create a project to start tracking bugs</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">Create Project</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-notion-surface border border-notion-border rounded-2xl overflow-hidden hover:border-notion-accent/40 hover:shadow-xl hover:shadow-notion-accent/5 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              {/* colour bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${GRADIENTS[i % GRADIENTS.length]}`} />

              <div className="p-5">
                {/* title row */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md`}>
                    {project.name[0].toUpperCase()}
                  </div>

                  {/* actions — stop propagation */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Invite */}
                    <button
                      title="Manage members"
                      onClick={() => { setInviteProject(project); setUserSearch(''); }}
                      className="w-7 h-7 rounded-lg bg-notion-hover flex items-center justify-center text-notion-muted hover:text-notion-accent transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                    {/* Delete (owner only) */}
                    {isOwner(project) && (
                      <button
                        title="Delete project"
                        onClick={() => setDeleteTarget(project)}
                        className="w-7 h-7 rounded-lg bg-notion-hover flex items-center justify-center text-notion-muted hover:text-red-400 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-notion-text text-sm leading-snug mb-1 line-clamp-1 group-hover:text-notion-accent transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-notion-muted line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {project.description || 'No description'}
                </p>

                {/* footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-notion-border">
                  {/* members stack */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[project.owner, ...(project.members || [])].slice(0, 4).map((m, j) => (
                        <div
                          key={m?._id || j}
                          title={m?.name}
                          style={{ background: avatarColor(m?.name || '') }}
                          className="w-6 h-6 rounded-full border-2 border-notion-surface flex items-center justify-center text-white text-[9px] font-bold"
                        >
                          {initials(m?.name || '?')}
                        </div>
                      ))}
                      {(project.members?.length || 0) > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-notion-surface bg-notion-border flex items-center justify-center text-notion-muted text-[9px]">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-notion-muted">
                      {1 + (project.members?.length || 0)} member{(1 + (project.members?.length || 0)) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* owner badge / age */}
                  <div className="flex items-center gap-2">
                    {isOwner(project) && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-notion-accent/10 text-notion-accent">owner</span>
                    )}
                    <span className="text-[10px] text-notion-muted">{timeAgo(project.createdAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}


      <Modal open={showCreate} onClose={() => !creating && setShowCreate(false)}>
        <div className="px-6 pt-6 pb-2 border-b border-notion-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-notion-text">New Project</h2>
          <button onClick={() => setShowCreate(false)} className="text-notion-muted hover:text-notion-text transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="label">Project Name <span className="text-red-400">*</span></label>
            <input
              id="create-project-name"
              autoFocus
              className="input"
              placeholder="e.g. E-Commerce App"
              value={createForm.name}
              onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={createForm.description}
              onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button id="create-project-submit" type="submit" disabled={creating} className="btn-primary">
              {creating
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</span>
                : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!inviteProject} onClose={() => setInviteProject(null)}>
        <div className="px-6 pt-6 pb-3 border-b border-notion-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-notion-text">Team Members</h2>
            <p className="text-xs text-notion-muted mt-0.5 line-clamp-1">{inviteProject?.name}</p>
          </div>
          <button onClick={() => setInviteProject(null)} className="text-notion-muted hover:text-notion-text transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Current members */}
          <div>
            <p className="label mb-2">Current Members</p>
            <div className="space-y-2">
              {/* owner */}
              {inviteProject?.owner && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-notion-hover/50">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor(inviteProject.owner.name || '') }}
                  >
                    {initials(inviteProject.owner.name || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-notion-text truncate">{inviteProject.owner.name}</p>
                    <p className="text-[10px] text-notion-muted truncate">{inviteProject.owner.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-notion-accent bg-notion-accent/10 px-2 py-0.5 rounded-md">owner</span>
                </div>
              )}

              {/* members */}
              {inviteProject?.members?.length === 0 && (
                <p className="text-xs text-notion-muted text-center py-3 italic">No other members yet</p>
              )}
              {(inviteProject?.members || []).map(m => (
                <div key={m._id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-notion-hover/50">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor(m.name || '') }}
                  >
                    {initials(m.name || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-notion-text truncate">{m.name}</p>
                    <p className="text-[10px] text-notion-muted truncate">{m.email} · {m.role}</p>
                  </div>
                  {isOwner(inviteProject) && (
                    <button
                      onClick={() => handleRemoveMember(m._id)}
                      className="text-notion-muted hover:text-red-400 transition-colors p-1 rounded"
                      title="Remove member"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite section */}
          <div>
            <p className="label mb-2">Invite People</p>
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-notion-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                className="input input-sm pl-8"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-notion-muted text-center py-4 italic">
                  {userSearch ? 'No users found' : 'Everyone is already invited!'}
                </p>
              ) : filteredUsers.map(u => (
                <div key={u._id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-notion-hover transition-colors">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: avatarColor(u.name || '') }}
                  >
                    {initials(u.name || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-notion-text truncate">{u.name}</p>
                    <p className="text-[10px] text-notion-muted truncate">{u.email}</p>
                  </div>
                  <button
                    disabled={inviting}
                    onClick={() => handleInvite(u._id)}
                    className="btn-secondary btn-sm text-[11px] shrink-0 py-1"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
        <div className="p-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-notion-text mb-1">Delete Project?</h3>
          <p className="text-sm text-notion-muted mb-5">
            <span className="font-medium text-notion-text">"{deleteTarget?.name}"</span> and all its data will be deleted. This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting
                ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />Deleting…</span>
                : 'Delete Project'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
