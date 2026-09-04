"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, UserRole } from "@/types/auth";
import {
  getServerSessionAction,
  loginAction,
  logoutAction,
  registerAction,
} from "@/app/actions/auth";

interface AuthContextType {
  session: Session;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: Session;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [session, setSession] = useState<Session>(() =>
    initialSession ?? {
      user: null,
      expiresAt: null,
      status: "loading",
    },
  );

  useEffect(() => {
    // The locale layout can provide the authoritative session on the server. Avoid a
    // duplicate request and loading flash when it does.
    if (initialSession) return;

    getServerSessionAction()
      .then((serverSession) => {
        setSession(
          serverSession.status === "authenticated" && serverSession.user
            ? serverSession
            : { user: null, expiresAt: null, status: "unauthenticated" },
        );
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch authoritative server session:", error);
        setSession({ user: null, expiresAt: null, status: "unauthenticated" });
      });
  }, [initialSession]);

  const login = async (email: string, password: string): Promise<void> => {
    setSession((previous) => ({ ...previous, status: "loading" }));

    // Password is required by the server action. It is never stored in browser
    // storage, placed in a URL, or logged.
    const user = await loginAction(email, password);

    setSession({
      user,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "authenticated",
    });
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    setSession((previous) => ({ ...previous, status: "loading" }));

    // Password is required by the server action and is sent only through the
    // server-action request boundary.
    const user = await registerAction(name, email, password);

    setSession({
      user,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "authenticated",
    });
  };

  const logout = async (): Promise<void> => {
    setSession((previous) => ({ ...previous, status: "loading" }));
    await logoutAction();
    setSession({ user: null, expiresAt: null, status: "unauthenticated" });
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!session.user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      super_admin: 3,
      workspace_admin: 2,
      viewer: 1,
    };

    return roleHierarchy[session.user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider value={{ session, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
