"use client";

import { useEffect } from "react";
import { clearWebPushSubscription } from "@/lib/web-push";

export function PushIdentityCleanup() {
  useEffect(() => {
    void clearWebPushSubscription();
  }, []);

  return null;
}
