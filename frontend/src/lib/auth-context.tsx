"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "inspector" | "company" | "user";

export interface UserProfile {
  user_id: string;
  name: string;
  role: UserRole;
  email: string;
  entityName?: string; // Company Name or Dept Name
  jurisdiction?: string; // Zone or Area for Inspectors
  badgeNumber?: string;
  fssaiNumber?: string;
}

export const DEMO_USERS: Record<UserRole, UserProfile & { pass: string }> = {
  inspector: {
    user_id: "insp_rajesh",
    pass: "insp123",
    name: "Rajesh Sharma",
    role: "inspector",
    email: "rajesh.sharma@metrology.gov.in",
    entityName: "Legal Metrology Dept, Enforcement Wing",
    jurisdiction: "North Zone (Delhi NCR)",
    badgeNumber: "LM-DEL-2041",
  },
  company: {
    user_id: "amul_india",
    pass: "comp123",
    name: "Gujarat Milk Mktg Fed (Amul)",
    role: "company",
    email: "compliance@amul.coop",
    entityName: "GCMMF Ltd. / Packaging & Labeling Compliance",
    fssaiNumber: "10012021000071",
  },
  admin: {
    user_id: "admin_delhi",
    pass: "admin123",
    name: "Dr. Vikram Seth",
    role: "admin",
    email: "dir.metrology@nic.in",
    entityName: "Directorate of Legal Metrology, GoI",
    jurisdiction: "National Directorate",
  },
  user: {
    user_id: "consumer_anita",
    pass: "user123",
    name: "Anita Roy",
    role: "user",
    email: "anita.consumer@gmail.com",
    entityName: "Citizen Watchdog",
  },
};

interface AuthContextType {
  user: UserProfile | null;
  login: (user_id: string, pass: string, role?: UserRole) => boolean;
  register: (profile: UserProfile, pass: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "metrascan_user_auth_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Inspector so the demo has rich enforcement actions immediately available
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS.inspector);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USERS.inspector));
      }
    } catch {
      // Fallback
    }
  }, []);

  const login = (user_id: string, pass: string, preferredRole?: UserRole): boolean => {
    // Check demo users first
    const demoFound = Object.values(DEMO_USERS).find(
      (u) =>
        (u.user_id.toLowerCase() === user_id.trim().toLowerCase() ||
          u.email.toLowerCase() === user_id.trim().toLowerCase()) &&
        u.pass === pass
    );

    if (demoFound) {
      const profile: UserProfile = {
        user_id: demoFound.user_id,
        name: demoFound.name,
        role: demoFound.role, // Strictly enforce account role to prevent privilege escalation
        email: demoFound.email,
        entityName: demoFound.entityName,
        jurisdiction: demoFound.jurisdiction,
        badgeNumber: demoFound.badgeNumber,
        fssaiNumber: demoFound.fssaiNumber,
      };
      setUser(profile);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch {}
      return true;
    }

    // Generic accepted credentials for testing any ID
    if (user_id.trim().length > 0 && pass.trim().length > 0) {
      const selectedRole = preferredRole || "inspector";
      const profile: UserProfile = {
        user_id: user_id.trim(),
        name: user_id.trim().replace(/[_.-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        role: selectedRole,
        email: `${user_id.trim()}@metrascan.local`,
        entityName:
          selectedRole === "company"
            ? `${user_id.toUpperCase()} Foods Ltd.`
            : selectedRole === "inspector"
            ? "Legal Metrology Enforcement"
            : selectedRole === "admin"
            ? "Metrology Directorate"
            : "Consumer Watchdog",
        jurisdiction: selectedRole === "inspector" ? "Central Zone" : undefined,
      };
      setUser(profile);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch {}
      return true;
    }

    return false;
  };

  const register = (profile: UserProfile, _pass: string): boolean => {
    setUser(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
    return true;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
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

