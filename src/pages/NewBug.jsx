import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { createBug, getProjects, getModules, getFeatures, getProject } from "../api";
import toast from "react-hot-toast";

const PRIORITIES = ["Blocker", "High", "Medium", "Low"];
const TYPES = ["Bug", "Suggestion", "Improvement"];
const STATUSES = ["Open", "Assigned", "In Progress"];
const PRIORITY_COLORS = { Blocker: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };

export default function NewBug() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Context from URL params (pre-filled, read-only)
  const ctxProject = searchParams.get("project") || "";
  const ctxModule = searchParams.get("module") || "";
  const ctxFeature = searchParams.get("feature") || "";

  const [form, setForm] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedResult: "",
    actualResult: "",
    priority: "Medium",
    type: "Bug",
    status: "Open",
    project: ctxProject,
    module: ctxModule,
    feature: ctxFeature,
    tags: "",
  });

  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [features, setFeatures] = useState([]);
  const [saving, setSaving] = useState(false);

  // Context labels for breadcrumb
  const [ctxLabels, setCtxLabels] = useState({ project: "", module: "", feature: "" });

  // Load context labels for breadcrumb display
  useEffect(() => {
    const labels = {};
    const promises = [];
    if (ctxProject) promises.push(getProject(ctxProject).then(r => { labels.project = r.data.project.name; }));
    // We can't fetch module alone; load from getModules if project is set
    Promise.all(promises).then(() => setCtxLabels(prev => ({ ...prev, ...labels }))).catch(() => {});
  }, []);

  // Load modules for context breadcrumb label
  useEffect(() => {
    if (!ctxProject) return;
    getModules(ctxProject).then(r => {
      const mod = r.data.modules.find(m => m._id === ctxModule);
      if (mod) setCtxLabels(prev => ({ ...prev, module: mod.name }));
      if (!ctxModule) setModules(r.data.modules);
    }).catch(() => {});
  }, [ctxProject]);

  // Load features for context breadcrumb label
  useEffect(() => {
    if (!ctxModule) return;
    getFeatures(ctxModule).then(r => {
      const feat = r.data.features.find(f => f._id === ctxFeature);
      if (feat) setCtxLabels(prev => ({ ...prev, feature: feat.name }));
      if (!ctxFeature) setFeatures(r.data.features);
    }).catch(() => {});
  }, [ctxModule]);

  // Load all projects only if no context project
  useEffect(() => {
    if (ctxProject) return;
    getProjects().then(r => setProjects(r.data.projects)).catch(() => {});
  }, []);

  // When user picks a project manually (no ctx)
  useEffect(() => {
    if (ctxProject || !form.project) { setModules([]); setFeatures([]); return; }
    getModules(form.project).then(r => setModules(r.data.modules)).catch(() => {});
    setForm(p => ({ ...p, module: "", feature: "" }));
  }, [form.project]);

  useEffect(() => {
    if (ctxModule || !form.module) { setFeatures([]); return; }
    getFeatures(form.module).then(r => setFeatures(r.data.features)).catch(() => {});
    setForm(p => ({ ...p, feature: "" }));
  }, [form.module]);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project) return toast.error("Please select a project");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      files.forEach(f => fd.append("screenshots", f));
      const res = await createBug(fd);
      toast.success(`Bug ${res.data.bug.bugId} created!`);
      navigate(`/bugs/${res.data.bug._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create bug");
    } finally {
      setSaving(false);
    }
  };

  // Determine which location fields to show (hide pre-filled ctx fields)
  const showProject = !ctxProject;
  const showModule = !ctxModule;
  const showFeature = !ctxFeature;
  const hasContext = ctxProject || ctxModule || ctxFeature;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-notion-text">Report a Bug</h1>
          <p className="text-notion-muted text-sm mt-1">Fill in the details to create a new bug report</p>
        </div>

        {/* Context Banner */}
        {hasContext && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl border border-notion-accent/30 bg-notion-accent/8 text-xs text-notion-muted"
          >
            <svg className="w-3.5 h-3.5 text-notion-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Creating bug in:</span>
            {ctxLabels.project && <><span className="text-notion-accent font-medium">{ctxLabels.project}</span></>}
            {ctxLabels.module && <><span className="text-notion-border">›</span><span className="text-notion-accent font-medium">{ctxLabels.module}</span></>}
            {ctxLabels.feature && <><span className="text-notion-border">›</span><span className="text-notion-accent font-medium">{ctxLabels.feature}</span></>}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core info */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-notion-text">Basic Information</h2>
            <div>
              <label className="label">Title *</label>
              <input id="bug-title" className="input" placeholder="Short description of the bug" value={form.title} onChange={set("title")} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={4} placeholder="Describe the bug in detail..." value={form.description} onChange={set("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Steps to Reproduce</label>
                <textarea className="input resize-none" rows={3} placeholder={"1. Go to...\n2. Click on...\n3. See error"} value={form.stepsToReproduce} onChange={set("stepsToReproduce")} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Expected Result</label>
                  <textarea className="input resize-none" rows={1} placeholder="What should happen?" value={form.expectedResult} onChange={set("expectedResult")} />
                </div>
                <div>
                  <label className="label">Actual Result</label>
                  <textarea className="input resize-none" rows={1} placeholder="What actually happens?" value={form.actualResult} onChange={set("actualResult")} />
                </div>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-notion-text">Classification</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Priority</label>
                <div className="flex flex-col gap-2">
                  {PRIORITIES.map(p => (
                    <label key={p} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.priority === p ? "border-notion-accent bg-notion-accent/10" : "border-notion-border hover:border-notion-accent/40"}`}>
                      <input type="radio" className="hidden" value={p} checked={form.priority === p} onChange={set("priority")} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
                      <span className="text-xs text-notion-text">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Type</label>
                <div className="flex flex-col gap-2">
                  {TYPES.map(t => (
                    <label key={t} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.type === t ? "border-notion-accent bg-notion-accent/10" : "border-notion-border hover:border-notion-accent/40"}`}>
                      <input type="radio" className="hidden" value={t} checked={form.type === t} onChange={set("type")} />
                      <span className="text-xs text-notion-text">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={set("status")}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Tags (comma-separated)</label>
                  <input className="input" placeholder="ui, critical, login" value={form.tags} onChange={set("tags")} />
                </div>
              </div>
            </div>
          </div>

          {/* Location — only show fields not pre-filled by context */}
          {(showProject || showModule || showFeature) && (
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-notion-text">Location</h2>
              <div className={`grid gap-4 ${[showProject, showModule, showFeature].filter(Boolean).length === 3 ? 'grid-cols-3' : [showProject, showModule, showFeature].filter(Boolean).length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {showProject && (
                  <div>
                    <label className="label">Project *</label>
                    <select id="bug-project" className="input" value={form.project} onChange={set("project")} required>
                      <option value="">Select project</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                {showModule && (
                  <div>
                    <label className="label">Module</label>
                    <select className="input" value={form.module} onChange={set("module")} disabled={!form.project && !ctxProject}>
                      <option value="">Select module</option>
                      {modules.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
                {showFeature && (
                  <div>
                    <label className="label">Feature</label>
                    <select className="input" value={form.feature} onChange={set("feature")} disabled={!form.module && !ctxModule}>
                      <option value="">Select feature</option>
                      {features.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-notion-text">Screenshots / Attachments</h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-notion-border rounded-xl p-8 cursor-pointer hover:border-notion-accent/40 transition-colors group">
              <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
              <svg className="w-8 h-8 text-notion-muted group-hover:text-notion-accent transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-notion-muted">Click to upload screenshots (max 5, 10MB each)</p>
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs bg-notion-hover px-2.5 py-1.5 rounded-lg border border-notion-border">
                    <svg className="w-3 h-3 text-notion-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                    <span className="text-notion-text">{f.name}</span>
                    <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-notion-muted hover:text-red-400">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 justify-end">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button id="submit-bug" type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Submit Bug Report
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
