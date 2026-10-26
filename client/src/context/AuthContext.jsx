import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearCsrfToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then((currentUser) => setUser(currentUser))
      .catch((error) => {
        if (error.status !== 401) console.error("Could not restore CampusCart session:", error.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    async login(credentials) {
      const result = await api.post("/auth/login", credentials);
      setUser(result.user);
      return result.user;
    },
    async register(details) {
      const result = await api.post("/auth/register", details);
      setUser(result.user);
      return result.user;
    },
    async logout() {
      try {
        await api.post("/auth/logout", {});
      } finally {
        clearCsrfToken();
        setUser(null);
      }
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
