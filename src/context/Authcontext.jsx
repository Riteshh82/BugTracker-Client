import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginApi,
  register as registerApi,
  getMe,
  updateProfileApi,
} from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await registerApi(data);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.replace("/login");
  };

  const updateProfile = async (data) => {
    const res = await updateProfileApi(data);
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
