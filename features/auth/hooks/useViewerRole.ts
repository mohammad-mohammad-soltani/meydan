"use client";

import { useEffect, useState } from "react";

import { meydanApi } from "@/lib/meydan-api";

/** WordPress role fields the API added to `GET /me`. */
type ApiViewerRole = {
  role?: string | null;
  roles?: string[] | null;
};

type RoleState = {
  status: "idle" | "ready" | "error";
  role: string;
  roles: string[];
};

export type ViewerRole = {
  /** Primary WordPress role, e.g. `administrator`. */
  role: string;
  /** Every WordPress role granted to the viewer. */
  roles: string[];
  /** The viewer holds the `administrator` (مدیرکل) role. */
  isAdministrator: boolean;
  isLoading: boolean;
};

const EMPTY_ROLES: string[] = [];

const ANONYMOUS_ROLE: ViewerRole = {
  role: "",
  roles: EMPTY_ROLES,
  isAdministrator: false,
  isLoading: false,
};

/**
 * Reads the signed-in viewer's WordPress roles from `/me`.
 *
 * `/me` is authenticated, so guests must pass `enabled = false`: an
 * unauthenticated call makes the API client bounce the visitor to the login
 * page instead of failing quietly.
 */
export function useViewerRole(enabled: boolean): ViewerRole {
  const [state, setState] = useState<RoleState>({
    status: "idle",
    role: "",
    roles: EMPTY_ROLES,
  });

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    void meydanApi<ApiViewerRole>("/me")
      .then((me) => {
        if (!active) return;

        const roles = Array.isArray(me.roles)
          ? me.roles.filter(
              (role): role is string =>
                typeof role === "string" && role.length > 0,
            )
          : [];

        setState({
          status: "ready",
          role:
            typeof me.role === "string" && me.role
              ? me.role
              : roles[0] || "",
          roles,
        });
      })
      .catch(() => {
        if (active) setState({ status: "error", role: "", roles: EMPTY_ROLES });
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  if (!enabled) return ANONYMOUS_ROLE;

  return {
    role: state.role,
    roles: state.roles,
    isAdministrator: state.roles.includes("administrator"),
    isLoading: state.status === "idle",
  };
}
