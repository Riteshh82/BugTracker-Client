import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getBug, updateBug, getModules, getFeatures, getUsers } from "../api";
import toast from "react-hot-toast";
import { useAuth } from "../context/Authcontext.jsx";

const PRIORITIES = ["Blocker", "High", "Medium", "Low"];
const TYPES = ["Bug", "Suggestion", "Improvement"];
const STATUSES = ["Open", "Assigned", "In Progress", "Resolved", "Closed", "Reopened"];
const PRIORITY_COLORS = { Blocker: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };

export default function EditBug() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [modules, setModules] = useState([]);
  const [features, setFeatures] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [originalBug, setOriginalBug] = useState(null);

  useEffect(() => {
    getBug(id).then(r => {
      const bug = r.data.bug;
      setOriginalBug(bug);
      setForm({
        title: bug.title || "",
        description: bug.description || "",
        stepsToReproduce: bug.stepsToReproduce || "",
        expectedResult: bug.expectedResult || "",
        actualResult: bug.actualResult || "",
        priority: bug.priority || "Medium",
        type: bug.type || "Bug",
        status: bug.status || "Open",
        tags: bug.tags?.join(", ") || "",
        module: bug.module?._id || "",
        feature: bug.feature?._id || "",
        assignedTo: bug.assignedTo?._id || "",
      });
      // Load modules for project
      if (bug.project?._id) {
        getModules(bug.project._id).then(mr => setModules(mr.data.modules)).catch(() => {});
      }
      // Load features if module exists
      if (bug.module?._id) {
        getFeatures(bug.module._id).then(fr => setFeatures(fr.data.features)).catch(() => {});
      }
    }).catch(() => { toast.error("Bug not found"); navigate(-1); });

    getUsers().then(r => setUsers(r.data.users || [])).catch(() => {});
  }, [id]);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleModuleChange = async (e) => {
    const moduleId = e.target.value;
    setForm(p => ({ ...p, module: moduleId, feature: "" }));
    if (!moduleId) { setFeatures([]); return; }
    try {
      const fr = await getFeatures(moduleId);
      setFeatures(fr.data.features);
    } catch { setFeatures([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      if (!payload.module) delete payload.module;
      if (!payload.feature) delete payload.feature;
      if (!payload.assignedTo) payload.assignedTo = null;
      await updateBug(id, payload);
      toast.success("Bug updated!");
      navigate(`/bugs/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-notion-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Only the reporter can edit
  if (originalBug && user?._id !== originalBug.createdBy?._id) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-lg font-semibold text-notion-text mb-2">Access Denied</h2>
        <p className="text-notion-muted text-sm mb-6">Only the reporter can edit this bug.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Compact header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-notion-muted mb-1">
              <button onClick={() => navigate(-1)} className="hover:text-notion-accent">← Back</button>
              <span>·</span>
              <span className="font-mono">{originalBug?.bugId}</span>
            </div>
            <h1 className="text-xl font-bold text-notion-text">Edit Bug</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary btn-sm">Discard</button>
            <button form="edit-bug-form" type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <form id="edit-bug-form" onSubmit={handleSubmit}>
          {/* Two-column layout: main left, meta right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* LEFT — bug text content */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input className="input" value={form.title} onChange={set("title")} required placeholder="Short description of the bug" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input resize-none" rows={4} value={form.description} onChange={set("description")} placeholder="Describe the bug in detail..." />
                </div>
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
                    <div>
                      <label className="label">Tags (comma-separated)</label>
                      <input className="input" value={form.tags} onChange={set("tags")} placeholder="ui, critical, auth" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — meta sidebar */}
            <div className="space-y-4">
              {/* Classification */}
              <div className="card space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-muted">Classification</h3>
                <div>
                  <label className="label">Priority</label>
                  <div className="space-y-1.5">
                    {PRIORITIES.map(p => (
                      <label key={p} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${form.priority === p ? "border-notion-accent bg-notion-accent/10" : "border-notion-border hover:border-notion-accent/40"}`}>
                        <input type="radio" className="hidden" value={p} checked={form.priority === p} onChange={set("priority")} />
                        <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[p] }} />
                        <span className="text-xs text-notion-text">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={set("type")}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={set("status")}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Assignment & Location */}
              <div className="card space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-muted">Assignment</h3>
                <div>
                  <label className="label">Assigned To</label>
                  <select className="input" value={form.assignedTo} onChange={set("assignedTo")}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
                {modules.length > 0 && (
                  <div>
                    <label className="label">Module</label>
                    <select className="input" value={form.module} onChange={handleModuleChange}>
                      <option value="">None</option>
                      {modules.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
                {features.length > 0 && (
                  <div>
                    <label className="label">Feature</label>
                    <select className="input" value={form.feature} onChange={set("feature")}>
                      <option value="">None</option>
                      {features.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                {/* Read-only project */}
                <div>
                  <label className="label">Project</label>
                  <p className="text-sm text-notion-text bg-notion-hover px-3 py-2 rounded-lg">{originalBug?.project?.name || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
