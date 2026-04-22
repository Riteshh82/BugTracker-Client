import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProject, getModules, createModule, getFeatures, createFeature, deleteModule, deleteFeature } from '../api';
import toast from 'react-hot-toast';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-notion-border">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [modules, setModules] = useState([]);
  const [features, setFeatures] = useState({});
  const [expandedModule, setExpandedModule] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProject(id).then(r => setProject(r.data.project)).catch(() => toast.error('Project not found'));
    getModules(id).then(r => setModules(r.data.modules)).catch(() => {});
  }, [id]);

  const loadFeatures = async (moduleId) => {
    if (features[moduleId]) return;
    const r = await getFeatures(moduleId);
    setFeatures(prev => ({ ...prev, [moduleId]: r.data.features }));
  };

  const handleExpandModule = (moduleId) => {
    if (expandedModule === moduleId) return setExpandedModule(null);
    setExpandedModule(moduleId);
    loadFeatures(moduleId);
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await createModule(id, form);
      setModules(prev => [...prev, r.data.module]);
      toast.success('Module created!');
      setShowModuleModal(false);
      setForm({ name: '', description: '' });
    } catch { toast.error('Failed to create module'); }
    setSaving(false);
  };

  const handleCreateFeature = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await createFeature(showFeatureModal, form);
      setFeatures(prev => ({ ...prev, [showFeatureModal]: [...(prev[showFeatureModal] || []), r.data.feature] }));
      toast.success('Feature created!');
      setShowFeatureModal(null);
      setForm({ name: '', description: '' });
    } catch { toast.error('Failed to create feature'); }
    setSaving(false);
  };

  if (!project) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-notion-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-notion-muted mb-2">
            <Link to="/projects" className="hover:text-notion-accent">Projects</Link>
            <span>›</span>
            <span className="text-notion-text">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-notion-text">{project.name}</h1>
          <p className="text-notion-muted text-sm mt-1">{project.description || 'No description'}</p>
          <div className="flex items-center gap-2 mt-3">
            {project.members?.map(m => (
              <div key={m._id} title={m.name} className="w-7 h-7 rounded-full bg-notion-accent/30 flex items-center justify-center text-notion-accent text-xs font-bold">
                {m.name?.[0]}
              </div>
            ))}
            <span className="text-xs text-notion-muted">{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/projects/${id}/bugs`)} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 6h4M10 18h4" /></svg>
            Table View
          </button>
          <button onClick={() => navigate(`/projects/${id}/kanban`)} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
            Kanban
          </button>
          <button onClick={() => navigate(`/bugs/new?project=${id}`)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Report Bug
          </button>
        </div>
      </div>

      {/* Module Tree */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-notion-text">Modules & Features</h2>
          <button id="add-module-btn" onClick={() => setShowModuleModal(true)} className="btn-secondary btn-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Module
          </button>
        </div>

        {modules.length === 0 ? (
          <div className="text-center py-10 text-notion-muted">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-sm">No modules yet. Create your first module.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {modules.map(mod => (
              <div key={mod._id} className="border border-notion-border rounded-xl overflow-hidden">
                <button
                  onClick={() => handleExpandModule(mod._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-notion-hover transition-colors text-left"
                >
                  <svg className={`w-4 h-4 text-notion-muted transition-transform ${expandedModule === mod._id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  <div className="w-6 h-6 rounded bg-notion-accent/20 flex items-center justify-center text-notion-accent text-xs font-bold">{mod.name[0]}</div>
                  <span className="text-sm font-medium text-notion-text">{mod.name}</span>
                  <span className="ml-auto text-xs text-notion-muted">{mod.description}</span>
                </button>

                <AnimatePresence>
                  {expandedModule === mod._id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-notion-border">
                      <div className="bg-notion-bg/30 p-3 space-y-1.5">
                        {(features[mod._id] || []).map(feat => (
                          <div key={feat._id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-notion-hover text-sm text-notion-muted">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
                            {feat.name}
                          </div>
                        ))}
                        <button onClick={() => { setShowFeatureModal(mod._id); setForm({ name: '', description: '' }); }} className="btn-ghost btn-sm w-full justify-start text-notion-muted">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add Feature
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module Modal */}
      <Modal open={showModuleModal} onClose={() => setShowModuleModal(false)} title="Add Module">
        <form onSubmit={handleCreateModule} className="space-y-4">
          <div><label className="label">Module Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Authentication" required /></div>
          <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowModuleModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create'}</button></div>
        </form>
      </Modal>

      {/* Feature Modal */}
      <Modal open={!!showFeatureModal} onClose={() => setShowFeatureModal(null)} title="Add Feature">
        <form onSubmit={handleCreateFeature} className="space-y-4">
          <div><label className="label">Feature Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Login Flow" required /></div>
          <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" /></div>
          <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowFeatureModal(null)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
