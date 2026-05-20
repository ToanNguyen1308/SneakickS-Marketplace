import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

const readUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readUserFromStorage);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  const persist = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
    setToken(newToken);
    setUser(newUser);
  };

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      persist(data.token, data.data);
      return data.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    setLoading(true);
    try {
      const { data } = await authApi.register({ username, email, password });
      persist(data.token, data.data);
      return data.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
  }, []);

  // Khi co token nhung khong co user (vd reload tab), goi /me
  useEffect(() => {
    if (token && !user) {
      authApi
        .me()
        .then(({ data }) => {
          localStorage.setItem("user", JSON.stringify(data.data));
          setUser(data.data);
        })
        .catch(() => persist(null, null));
    }
  }, [token, user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
