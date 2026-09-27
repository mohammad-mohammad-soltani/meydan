import { isNaghshmanNativeWindow } from './native-bridge';

type NativeAuthHost = {
  NaghshmanNative?: { platform?: unknown; version?: unknown };
  ReactNativeWebView?: { postMessage?: (payload: string) => void };
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

const VALID_REFRESH_TOKEN = /^ref_[A-Za-z0-9_-]{20,512}$/;

/**
 * A native login is complete only after the Android shell has written its
 * refresh credential to SecureStore and acknowledged it to the WebView.
 * A successful OTP HTTP response alone does not lift the native guest guard.
 */
export function persistNativeLogin(
  host: NativeAuthHost,
  refreshToken: string | undefined,
  timeoutMs = 12_000,
): Promise<void> {
  if (!isNaghshmanNativeWindow(host)) return Promise.resolve();
  if (!refreshToken || !VALID_REFRESH_TOKEN.test(refreshToken)) {
    return Promise.reject(new Error('توکن نشست اپ از سرور دریافت نشد. دوباره تلاش کنید.'));
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      host.removeEventListener('naghshman:native-auth-state', onState);
      host.removeEventListener('naghshman:native-auth-error', onError);
      if (error) reject(error);
      else resolve();
    };
    const onState: EventListener = (event) => {
      const detail = (event as CustomEvent<{ authenticated?: boolean }>).detail;
      if (detail?.authenticated === true) finish();
    };
    const onError: EventListener = () => {
      finish(new Error('ذخیره نشست در گوشی انجام نشد. دوباره تلاش کنید.'));
    };
    host.addEventListener('naghshman:native-auth-state', onState);
    host.addEventListener('naghshman:native-auth-error', onError);
    timer = setTimeout(() => {
      finish(new Error('پاسخ ذخیره‌سازی نشست از اپ دریافت نشد. دوباره تلاش کنید.'));
    }, timeoutMs);

    try {
      host.ReactNativeWebView?.postMessage?.(JSON.stringify({
        source: 'naghshman-web',
        version: 1,
        type: 'persist-refresh',
        token: refreshToken,
      }));
    } catch {
      finish(new Error('ارتباط با بخش ورود اپ برقرار نشد. دوباره تلاش کنید.'));
    }
  });
}
