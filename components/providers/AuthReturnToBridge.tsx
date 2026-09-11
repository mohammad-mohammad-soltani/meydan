"use client";

import { useEffect } from "react";
import {
  RETURN_TO_STORAGE_KEY,
  sanitizeReturnTo,
} from "@/lib/auth-navigation";

export function AuthReturnToCapture() {
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("returnTo");
    if (!raw) return;
    window.sessionStorage.setItem(
      RETURN_TO_STORAGE_KEY,
      sanitizeReturnTo(raw),
    );
  }, []);

  return null;
}

export function PostLoginReturn() {
  useEffect(() => {
    if (window.location.pathname !== "/profile") return;

    const stored = window.sessionStorage.getItem(RETURN_TO_STORAGE_KEY);
    if (!stored) return;

    window.sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
    const target = sanitizeReturnTo(stored);
    if (target !== "/profile") window.location.replace(target);
  }, []);

  return null;
}
