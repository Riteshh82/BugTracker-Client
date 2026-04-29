import api from "./axios";

export const login = (email, password) =>
  api.post("/auth/login", { email, password });
export const register = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");
export const updateProfileApi = (data) => api.put("/auth/profile", data);
export const getUsers = () => api.get("/auth/users");
export const getProjects = () => api.get("/projects");
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post("/projects", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addMember = (id, userId) => api.post(`/projects/${id}/members`, { userId });
export const removeMember = (id, userId) => api.delete(`/projects/${id}/members/${userId}`);

export const getModules = (projectId) =>
  api.get(`/projects/${projectId}/modules`);
export const createModule = (projectId, data) =>
  api.post(`/projects/${projectId}/modules`, data);
export const updateModule = (projectId, id, data) =>
  api.put(`/projects/${projectId}/modules/${id}`, data);
export const deleteModule = (projectId, id) =>
  api.delete(`/projects/${projectId}/modules/${id}`);
export const getFeatures = (moduleId) =>
  api.get(`/modules/${moduleId}/features`);
export const createFeature = (moduleId, data) =>
  api.post(`/modules/${moduleId}/features`, data);
export const updateFeature = (moduleId, id, data) =>
  api.put(`/modules/${moduleId}/features/${id}`, data);
export const deleteFeature = (moduleId, id) =>
  api.delete(`/modules/${moduleId}/features/${id}`);

export const getBugs = (params) => api.get("/bugs", { params });
export const getBug = (id) => api.get(`/bugs/${id}`);
export const createBug = (formData) =>
  api.post("/bugs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateBug = (id, data) => api.put(`/bugs/${id}`, data);
export const deleteBug = (id) => api.delete(`/bugs/${id}`);
export const restoreBug = (id) => api.put(`/bugs/${id}/restore`);
export const getBugActivity = (id) => api.get(`/bugs/${id}/activity`);

export const getComments = (bugId) => api.get(`/bugs/${bugId}/comments`);
export const addComment = (bugId, data) =>
  api.post(`/bugs/${bugId}/comments`, data);
export const updateComment = (id, data) => api.put(`/comments/${id}`, data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);

export const getAnalytics = (params) =>
  api.get("/dashboard/analytics", { params });

export const getNotifications = () => api.get("/notifications");
export const markAllRead = () => api.put("/notifications/read-all");
export const markRead = (id) => api.put(`/notifications/${id}/read`);
