export type MeydanApiEnvelope<T> = {
  data: T;
  meta?: { request_id?: string; next_cursor?: string | null; count?: number };
};

type MeydanErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
};

export class MeydanClientError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;

  constructor(message: string, status: number, code?: string, fields?: Record<string, string>) {
    super(message);
    this.name = "MeydanClientError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function isUnauthenticated(error: unknown): boolean {
  return error instanceof MeydanClientError && error.status === 401;
}

export async function meydanClientApi<T>(path: string, init?: RequestInit): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const bodyIsJsonString = typeof init?.body === "string";
  const response = await fetch(`/api/meydan${normalized}`, {
    ...init,
    cache: init?.cache ?? "no-store",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(bodyIsJsonString ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  const raw = await response.text();
  let body: MeydanApiEnvelope<T> | MeydanErrorEnvelope;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    throw new MeydanClientError(`پاسخ نامعتبر از سرور (${response.status})`, response.status);
  }

  if (!response.ok) {
    const error = "error" in body ? body.error : undefined;
    throw new MeydanClientError(
      error?.message || `خطای ارتباط با میدان (${response.status})`,
      response.status,
      error?.code,
      error?.fields,
    );
  }

  if (!("data" in body)) {
    throw new MeydanClientError("پاسخ API فاقد data است.", response.status);
  }

  return body.data;
}

export function requireLogin(error: unknown): boolean {
  if (!isUnauthenticated(error)) return false;
  if (typeof window !== "undefined") {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?next=${encodeURIComponent(next)}`);
  }
  return true;
}
