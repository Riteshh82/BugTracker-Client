import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/Authcontext.jsx";
import toast from "react-hot-toast";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Developer",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-notion-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4 shadow-xl shadow-violet-500/20">
            <svg
              className="w-7 h-7 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-notion-text">
            Create Account
          </h1>
          <p className="text-notion-muted text-sm mt-1">
            Join your team on BugTrackr
          </p>
        </div>

        <div className="card border-notion-border/60 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="input"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                id="reg-role"
                className="input"
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
              >
                <option value="Developer">Developer</option>
                <option value="QA">QA Tester</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          <p className="text-center text-notion-muted text-sm mt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-notion-accent hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
