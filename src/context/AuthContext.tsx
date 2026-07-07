import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, getToken, setToken } from "@/lib/api";

type User = { id: string; email: string; role: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

const USER_STORAGE_KEY = "auth_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const persist = (token: string, user: User) => {
    setToken(token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    persist(res.token, res.user);
  };

  const register = async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    persist(res.token, res.user);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api("/api/auth/change-password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
