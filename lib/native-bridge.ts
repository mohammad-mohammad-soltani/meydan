export const NATIVE_BRIDGE_SOURCE = 'naghshman-web';
export const NATIVE_BRIDGE_VERSION = 1;

type NativeAction = {
  type: 'save-media' | 'share' | 'copy-link' | 'open-browser';
  url: string;
  filename?: string;
  title?: string;
};

type NativeWindow = {
  NaghshmanNative?: { platform?: unknown; version?: unknown };
  ReactNativeWebView?: { postMessage?: unknown };
};

export function isNaghshmanNativeWindow(value: unknown): value is NativeWindow {
  if (!value || typeof value !== 'object') return false;
  const windowLike = value as NativeWindow;
  return windowLike.NaghshmanNative?.platform === 'android'
    && windowLike.NaghshmanNative.version === NATIVE_BRIDGE_VERSION
    && typeof windowLike.ReactNativeWebView?.postMessage === 'function';
}

function isSafeUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function postNativeAction(windowLike: unknown, action: NativeAction): boolean {
  if (!isNaghshmanNativeWindow(windowLike) || !isSafeUrl(action.url)) return false;

  const postMessage = windowLike.ReactNativeWebView?.postMessage;
  if (typeof postMessage !== 'function') return false;
  postMessage(JSON.stringify({
    source: NATIVE_BRIDGE_SOURCE,
    version: NATIVE_BRIDGE_VERSION,
    ...action,
  }));
  return true;
}
