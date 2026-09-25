/** A versioned marker added only by the Naghshman Android WebView. */
export const NAGHSHMAN_NATIVE_USER_AGENT = 'NaghshmanNative/1';

export function isNaghshmanNativeClient(userAgent: string | null | undefined): boolean {
  return typeof userAgent === 'string' && userAgent.includes(NAGHSHMAN_NATIVE_USER_AGENT);
}
