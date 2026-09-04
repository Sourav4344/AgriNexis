"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Profile, Role } from "../types";
import { MOCK_CURRENT_USER, MOCK_FPO_USER } from "../mockData";

interface AuthContextType {
  user: Profile;
  role: Role;
  switchRole: (role: "BUYER" | "FPO") => void;
  token: string | null;
  isAuthenticated: boolean;
  updateProfile: (data: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("BUYER");
  const [user, setUser] = useState<Profile>(MOCK_CURRENT_USER);
  const [token, setToken] = useState<string | null>("demo-bearer-token-12345");

  useEffect(() => {
    if (role === "FPO") {
      setUser(MOCK_FPO_USER);
    } else {
      setUser(MOCK_CURRENT_USER);
    }
  }, [role]);

  const switchRole = (newRole: "BUYER" | "FPO") => {
    setRole(newRole);
  };

  const updateProfile = (data: Partial<Profile>) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        switchRole,
        token,
        isAuthenticated: true,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
