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
  const [ctxLabels, setCtxLabels] = useState({ project: "", module: "", feature: "" });

  // Load context labels
  useEffect(() => {
    if (ctxProject) {
      getProject(ctxProject).then(r => setCtxLabels(p => ({ ...p, project: r.data.project.name }))).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!ctxProject) return;
    getModules(ctxProject).then(r => {
      const mod = r.data.modules.find(m => m._id === ctxModule);
      if (mod) setCtxLabels(p => ({ ...p, module: mod.name }));
      if (!ctxModule) setModules(r.data.modules);
    }).catch(() => {});
  }, [ctxProject]);

  useEffect(() => {
    if (!ctxModule) return;
    getFeatures(ctxModule).then(r => {
      const feat = r.data.features.find(f => f._id === ctxFeature);
      if (feat) setCtxLabels(p => ({ ...p, feature: feat.name }));
      if (!ctxFeature) setFeatures(r.data.features);
    }).catch(() => {});
  }, [ctxModule]);

  useEffect(() => {
    if (ctxProject) return;
    getProjects().then(r => setProjects(r.data.projects)).catch(() => {});
  }, []);

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
      toast.success(`${res.data.bug.bugId} created!`);
      navigate(`/bugs/${res.data.bug._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create bug");
    } finally {
      setSaving(false);
    }
  };

  const hasContext = ctxProject || ctxModule || ctxFeature;
  const showProject = !ctxProject;
  const showModule  = !ctxModule;
  const showFeature = !ctxFeature;
  const locationCols = [showProject, showModule, showFeature].filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Sticky header — submit always visible */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-notion-text">Report a Bug</h1>
            {hasContext && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-notion-muted">
                <svg className="w-3 h-3 text-notion-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {ctxLabels.project && <span className="text-notion-accent font-medium">{ctxLabels.project}</span>}
                {ctxLabels.module && <><span>›</span><span className="text-notion-accent font-medium">{ctxLabels.module}</span></>}
                {ctxLabels.feature && <><span>›</span><span className="text-notion-accent font-medium">{ctxLabels.feature}</span></>}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary btn-sm">Cancel</button>
            <button id="submit-bug" form="new-bug-form" type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  Submit Bug
                </>
              )}
            </button>
          </div>
        </div>

        <form id="new-bug-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* LEFT — main bug info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card space-y-4">
                {/* Title */}
                <div>
                  <label className="label">Title *</label>
                  <input id="bug-title" className="input" value={form.title} onChange={set("title")} placeholder="Short description of the bug" required />
                </div>

                {/* Description */}
                <div>
                  <label className="label">Description</label>
                  <textarea className="input resize-none" rows={3} value={form.description} onChange={set("description")} placeholder="Describe the bug in detail..." />
                </div>

                {/* Steps / Expected / Actual in a grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Steps to Reproduce</label>
                    <textarea className="input resize-none" rows={4} value={form.stepsToReproduce} onChange={set("stepsToReproduce")} placeholder={"1. Go to...\n2. Click on...\n3. See error"} />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Expected Result</label>
                      <textarea className="input resize-none" rows={1} value={form.expectedResult} onChange={set("expectedResult")} placeholder="What should happen?" />
                    </div>
                    <div>
                      <label className="label">Actual Result</label>
                      <textarea className="input resize-none" rows={1} value={form.actualResult} onChange={set("actualResult")} placeholder="What actually happens?" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location — only if not fully pre-filled */}
              {locationCols > 0 && (
                <div className="card space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-muted">Location</h3>
                  <div className={`grid gap-3 grid-cols-${Math.min(locationCols, 3)}`}>
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

              {/* Attachments — compact */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-muted">Screenshots</h3>
                  <label className="flex items-center gap-1.5 text-xs text-notion-accent cursor-pointer hover:underline">
                    <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {files.length ? `${files.length} file(s) selected — change` : "Upload files"}
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs bg-notion-hover px-2.5 py-1.5 rounded-lg border border-notion-border">
                        <svg className="w-3 h-3 text-notion-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                        <span className="text-notion-text max-w-[120px] truncate">{f.name}</span>
                        <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-notion-muted hover:text-red-400 ml-1">×</button>
                      </div>
                    ))}
                  </div>
                )}
                {files.length === 0 && (
                  <p className="text-xs text-notion-muted text-center py-2">max 5 files, 10MB each</p>
                )}
              </div>
            </div>

            {/* RIGHT — classification sidebar */}
            <div className="space-y-4">
              <div className="card space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-muted">Classification</h3>
                {/* Priority radio */}
                <div>
                  <label className="label">Priority</label>
                  <div className="space-y-1.5">
                    {PRIORITIES.map(p => (
                      <label key={p} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.priority === p ? "border-notion-accent bg-notion-accent/10" : "border-notion-border hover:border-notion-accent/40"}`}>
                        <input type="radio" className="hidden" value={p} checked={form.priority === p} onChange={set("priority")} />
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[p] }} />
                        <span className="text-xs text-notion-text">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Type */}
                <div>
                  <label className="label">Type</label>
                  <div className="space-y-1.5">
                    {TYPES.map(t => (
                      <label key={t} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.type === t ? "border-notion-accent bg-notion-accent/10" : "border-notion-border hover:border-notion-accent/40"}`}>
                        <input type="radio" className="hidden" value={t} checked={form.type === t} onChange={set("type")} />
                        <span className="text-xs text-notion-text">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Status */}
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={set("status")}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {/* Tags */}
                <div>
                  <label className="label">Tags</label>
                  <input className="input" placeholder="ui, critical, login" value={form.tags} onChange={set("tags")} />
                </div>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
