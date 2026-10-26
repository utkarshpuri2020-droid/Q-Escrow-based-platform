"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest, setStoredToken, removeStoredToken, getStoredToken } from "./api";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "BUYER" | "SELLER" | "REVIEWER" | "ADMIN";
  email_verified: boolean;
  account_status: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiRequest<User>("/users/me");
      setUser(data);
    } catch {
      setUser(null);
      removeStoredToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    setStoredToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      removeStoredToken();
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
