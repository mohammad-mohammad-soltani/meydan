export type PusheSdk = {
  init: (appId: string) => unknown;
  subscribe: () => unknown;
  setCustomId: (customId: string | null) => Promise<unknown> | unknown;
  getCustomId?: () => Promise<string>;
};

declare global {
  interface Window {
    Pushe?: PusheSdk;
  }
}

export const PUSHE_APP_ID_STORAGE_KEY = "meydan-pushe-app-id";

let sdkPromise: Promise<PusheSdk> | null = null;
let initializedAppId: string | null = null;

export function loadPusheSdk(): Promise<PusheSdk> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pushe is only available in the browser."));
  }

  if (window.Pushe) return Promise.resolve(window.Pushe);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<PusheSdk>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-meydan-pushe="true"]');
    const script = existing ?? document.createElement("script");

    const finish = () => {
      if (window.Pushe) resolve(window.Pushe);
      else reject(new Error("Pushe SDK loaded without exposing window.Pushe."));
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load Pushe SDK.")), { once: true });

    if (!existing) {
      script.src = "https://static.pushe.co/pusheweb.js";
      script.async = true;
      script.dataset.meydanPushe = "true";
      document.head.appendChild(script);
    } else if (window.Pushe) {
      finish();
    }
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
}

export async function initializePushe(appId: string): Promise<PusheSdk> {
  const sdk = await loadPusheSdk();
  if (initializedAppId !== appId) {
    sdk.init(appId);
    initializedAppId = appId;
  }
  return sdk;
}

export function rememberPusheAppId(appId: string): void {
  if (typeof window === "undefined") return;

  const value = appId.trim();
  if (!value) return;

  try {
    window.localStorage.setItem(PUSHE_APP_ID_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable in hardened/private browser modes.
  }
}

function rememberedPusheAppId(): string {
  if (typeof window === "undefined") return "";

  try {
    return (window.localStorage.getItem(PUSHE_APP_ID_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export async function clearPusheIdentity(): Promise<boolean> {
  const appId = rememberedPusheAppId();
  if (!appId) return false;

  try {
    const sdk = await initializePushe(appId);
    await Promise.resolve(sdk.setCustomId(null));

    try {
      window.localStorage.removeItem(PUSHE_APP_ID_STORAGE_KEY);
    } catch {
      // The remote custom id is already cleared; local cleanup is best-effort.
    }

    return true;
  } catch {
    // Keep the app id so the auth-page cleanup can retry on a later load.
    return false;
  }
}
