"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { session, hasPermission } = useAuth();
  const { language } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace(`/${language}/login`);
    } else if (session.status === "authenticated" && requiredRole && !hasPermission(requiredRole)) {
      // Forbidden: Redirect back to main dashboard
      router.replace(`/${language}/dashboard`);
    }
  }, [session.status, requiredRole, hasPermission, router, language]);

  if (session.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--color-accent-600)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">Loading security context...</p>
        </div>
      </div>
    );
  }

  if (session.status === "unauthenticated") {
    return null;
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return null;
  }

  return <>{children}</>;
};
