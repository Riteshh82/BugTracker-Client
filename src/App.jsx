import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/Authcontext.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";

import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
// import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import BugTable from "./pages/BugTable";
import KanbanBoard from "./pages/KanbanBoard";
import BugDetail from "./pages/BugDetail";
import NewBug from "./pages/NewBug";
import Profile from "./pages/Profile";
import Trash from "./pages/Trash";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-notion-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-notion-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-notion-muted text-sm">Loading BugTrackr...</p>
        </div>
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* <Route path="projects" element={<Projects />} /> */}
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/bugs" element={<BugTable />} />
        <Route path="projects/:id/kanban" element={<KanbanBoard />} />
        <Route path="bugs/new" element={<NewBug />} />
        <Route path="bugs/:id" element={<BugDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="trash" element={<Trash />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#1a1a1a",
                  color: "#e8e8e8",
                  border: "1px solid #2a2a2a",
                  borderRadius: "10px",
                  fontSize: "14px",
                },
                success: {
                  iconTheme: { primary: "#7c3aed", secondary: "#fff" },
                },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
