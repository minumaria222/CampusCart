import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearCsrfToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on initial application mount
  useEffect(() => {
    let mounted = true;

    api.get("/auth/me")
      .then((currentUser) => {
        if (mounted) setUser(currentUser);
      })
      .catch((error) => {
        // 401 is normal for guests; only log unexpected network failures
        if (error.status !== 401 && process.env.NODE_ENV !== "production") {
          console.warn("CampusCart session check:", error.message);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
