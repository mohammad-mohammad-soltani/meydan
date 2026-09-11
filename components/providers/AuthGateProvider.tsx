"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  loginHref,
  rememberReturnTo,
  sanitizeReturnTo,
} from "@/lib/auth-navigation";

type AuthGateValue = {
  isAuthenticated: boolean;
  requireAuth: (returnTo?: string) => boolean;
};

const AuthGateContext = createContext<AuthGateValue | null>(null);

export function AuthGateProvider({
  children,
  isAuthenticated,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  const requireAuth = useCallback(
    (returnTo?: string) => {
      if (isAuthenticated) return true;
      if (typeof window === "undefined") return false;

      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const target = sanitizeReturnTo(returnTo || current);
      rememberReturnTo(target);
      window.location.assign(loginHref(target));
      return false;
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({ isAuthenticated, requireAuth }),
    [isAuthenticated, requireAuth],
  );

  return <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>;
}

export function useAuthGate(): AuthGateValue {
  const value = useContext(AuthGateContext);
  if (!value) {
    throw new Error("useAuthGate must be used inside AuthGateProvider");
  }
  return value;
}
