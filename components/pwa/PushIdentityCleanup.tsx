"use client";

import { useEffect } from "react";
import { clearPusheIdentity } from "@/lib/pushe-web";

export function PushIdentityCleanup() {
  useEffect(() => {
    void clearPusheIdentity();
  }, []);

  return null;
}
