"use client";

import { Component, type ReactNode } from "react";

type SilentBoundaryProps = {
  children: ReactNode;
  /** Rendered instead of the children when they crash. Defaults to nothing. */
  fallback?: ReactNode;
  /** Support label included in the console report. */
  label: string;
};

type SilentBoundaryState = { failed: boolean };

/**
 * Keeps an optional widget from taking the page down with it.
 *
 * The trends board, the player and other shell extras are decorative: if one
 * of them throws, the route should still render. Route-level failures are still
 * handled by `app/error.tsx`.
 */
export class SilentBoundary extends Component<SilentBoundaryProps, SilentBoundaryState> {
  state: SilentBoundaryState = { failed: false };

  static getDerivedStateFromError(): SilentBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[meydan] ${this.props.label} failed`, error);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
