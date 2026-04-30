import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAnalytics, getProjects } from "../api";
import { useAuth } from "../context/Authcontext.jsx";

const PRIORITY_COLORS = {
  Blocker: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};
const STATUS_COLORS = {
  Open: "#3b82f6",
  Assigned: "#8b5cf6",
  "In Progress": "#f59e0b",
  Resolved: "#10b981",
  Closed: "#6b7280",
  Reopened: "#ef4444",
};
const TYPE_COLORS = ["#7c3aed", "#06b6d4", "#10b981"];

const StatCard = ({ label, value, icon, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card"
  >
    <div className="flex items-center justify-between">
      <p className="text-xs text-notion-muted font-medium uppercase tracking-wide">
        {label}
      </p>
      <span className="text-lg">{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color || "text-notion-text"}`}>
      {value ?? "—"}
    </p>
    {sub && <p className="text-xs text-notion-muted">{sub}</p>}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-notion-surface border border-notion-border rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-notion-muted mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p
          key={i}
          className="text-xs font-semibold"
          style={{ color: p.color || p.fill }}
        >
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = (projectId = "") => {
    setLoading(true);
    Promise.all([
      getAnalytics(projectId ? { project: projectId } : {}),
      getProjects(),
    ])
      .then(([analyticsRes, projectsRes]) => {
        setData(analyticsRes.data);
        setProjects(projectsRes.data.projects);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="stat-card h-28 animate-pulse bg-notion-hover"
          />
        ))}
      </div>
    );

  const { stats, byPriority, byStatus, byType, bugsOverTime, topReporters } =
    data || {};

  const pieByPriority = (byPriority || []).map((d) => ({
    name: d._id,
    value: d.count,
  }));
  const pieByType = (byType || []).map((d) => ({
    name: d._id,
    value: d.count,
  }));
  const barByStatus = (byStatus || []).map((d) => ({
    name: d._id,
    count: d.count,
    fill: STATUS_COLORS[d._id] || "#7c3aed",
  }));
  const lineData = (bugsOverTime || []).map((d) => ({
    date: d._id?.slice(5),
    count: d.count,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-notion-text">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
              ? "afternoon"
              : "evening"}
            , <span className="text-gradient">{user?.name?.split(" ")[0]}</span>{" "}
            👋
          </h1>
          <p className="text-notion-muted text-sm mt-1">
            Here's your bug tracking overview
          </p>
        </div>
        <select
          className="input w-48"
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            fetchData(e.target.value);
          }}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Bugs"
          value={stats?.totalBugs}
          icon=""
          color="text-notion-text"
        />
        <StatCard
          label="Open"
          value={stats?.openBugs}
          icon=""
          color="text-red-400"
          sub="Needs attention"
        />
        <StatCard
          label="Resolved"
          value={stats?.resolvedBugs}
          icon=""
          color="text-emerald-400"
          sub="Closed this period"
        />
        <StatCard
          label="Reopened"
          value={stats?.reopenedBugs}
          icon=""
          color="text-orange-400"
          sub="Watch these"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 -mt-4">
        <StatCard
          label="Assigned"
          value={stats?.assignedBugs}
          icon=""
          color="text-violet-400"
        />
        <StatCard
          label="Unassigned"
          value={stats?.unassignedBugs}
          icon=""
          color="text-yellow-400"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Priority pie */}
        <div className="card col-span-1">
          <h2 className="text-sm font-semibold text-notion-text mb-4">
            By Priority
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieByPriority}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {pieByPriority.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PRIORITY_COLORS[entry.name] || "#7c3aed"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(v) => (
                  <span className="text-xs text-notion-muted">{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Type pie */}
        <div className="card col-span-1">
          <h2 className="text-sm font-semibold text-notion-text mb-4">
            By Type
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieByType}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {pieByType.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={TYPE_COLORS[i % TYPE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(v) => (
                  <span className="text-xs text-notion-muted">{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status bar */}
        <div className="card col-span-1">
          <h2 className="text-sm font-semibold text-notion-text mb-4">
            By Status
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barByStatus} barSize={20}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(124,58,237,0.06)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bugs over time + top reporters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card md:col-span-2">
          <h2 className="text-sm font-semibold text-notion-text mb-4">
            Bugs Over Time (30d)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#7c3aed",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ fill: "#7c3aed", r: 3 }}
                activeDot={{ r: 5 }}
                name="Bugs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top reporters */}
        <div className="card">
          <h2 className="text-sm font-semibold text-notion-text mb-4">
            Top Reporters
          </h2>
          {topReporters?.length === 0 ? (
            <p className="text-notion-muted text-xs text-center py-4">
              No data yet
            </p>
          ) : (
            <div className="space-y-3">
              {(topReporters || []).map((r, i) => (
                <div key={r._id} className="flex items-center gap-3">
                  <span className="text-xs text-notion-muted w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-notion-accent/30 flex items-center justify-center text-notion-accent text-xs font-bold">
                    {r.name?.[0]}
                  </div>
                  <span className="text-xs text-notion-text flex-1 truncate">
                    {r.name}
                  </span>
                  <span className="text-xs font-semibold text-notion-accent">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
