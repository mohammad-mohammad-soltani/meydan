export type AuthUpstreamPayload = {
  data?: {
    access_token?: string;
    expires_in?: number;
  };
  error?: {
    message?: string;
  };
};

function isAuthPayload(value: unknown): value is AuthUpstreamPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.hasOwn(value, "data") || Object.hasOwn(value, "error");
}

function parseCandidate(candidate: string): AuthUpstreamPayload | null {
  try {
    const value: unknown = JSON.parse(candidate);
    return isAuthPayload(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * WordPress/PHP can prepend a runtime warning to an otherwise successful REST
 * response when display_errors is enabled. Accept only a valid Meydan auth
 * envelope, even when harmless output surrounds it, so a verified OTP is not
 * discarded after the backend has already consumed the challenge.
 */
export function parseAuthUpstreamPayload(raw: string): AuthUpstreamPayload | null {
  const normalized = raw.replace(/^\uFEFF/, "").trim();
  const direct = parseCandidate(normalized);
  if (direct) return direct;

  const firstJsonObject = normalized.indexOf("{");
  const lastJsonObject = normalized.lastIndexOf("}");
  if (firstJsonObject === -1 || lastJsonObject <= firstJsonObject) return null;

  return parseCandidate(normalized.slice(firstJsonObject, lastJsonObject + 1));
}
