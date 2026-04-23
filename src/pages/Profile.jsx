import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/Authcontext.jsx";
import { initials, avatarColor } from "../utils/helpers";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    }
    setSaving(false);
  };

  const bg = avatarColor(user?.name || "");
  const ini = initials(user?.name || "");

  const roleColors = {
    Admin: "text-red-400 bg-red-500/10",
    Developer: "text-blue-400 bg-blue-500/10",
    QA: "text-emerald-400 bg-emerald-500/10",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h1 className="text-2xl font-bold text-notion-text">Profile</h1>

        <div className="card">
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-notion-border">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl"
              style={{ background: `linear-gradient(135deg, ${bg}, ${bg}99)` }}
            >
              {ini}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-notion-text">
                {user?.name}
              </h2>
              <p className="text-notion-muted text-sm">{user?.email}</p>
              <span className={`badge mt-2 ${roleColors[user?.role] || ""}`}>
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Display Name</label>
              <input
                id="profile-name"
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input opacity-50 cursor-not-allowed"
                value={user?.email}
                disabled
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input
                className="input opacity-50 cursor-not-allowed"
                value={user?.role}
                disabled
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                id="save-profile"
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={logout} className="btn-danger">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="card">
          <h3 className="text-sm font-semibold text-notion-text mb-4">
            Account Info
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label">Member Since</p>
              <p className="text-notion-text">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="label">User ID</p>
              <p className="text-notion-muted font-mono text-xs truncate">
                {user?._id}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
