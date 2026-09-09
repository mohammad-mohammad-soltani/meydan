const DEFAULT_API_BASE =
  "https://meydan-backend-1362642112.style.dev/wp-json/meydan/v1";

export type ApiEnvelope<T> = {
  data: T;
  meta?: { request_id?: string; next_cursor?: string | null };
};

export function getMeydanApiBaseUrl(): string {
  return (
    process.env.MEYDAN_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MEYDAN_API_BASE_URL ||
    DEFAULT_API_BASE
  ).replace(/\/$/, "");
}

export async function meydanApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getMeydanApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    cache: init?.cache ?? "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  const raw = await response.text();
  let body: ApiEnvelope<T> | { error?: { message?: string } };

  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    const preview = raw.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(
      `Meydan API returned invalid JSON (${response.status})${preview ? `: ${preview}` : ""}`,
    );
  }

  if (!response.ok) {
    const message =
      "error" in body && body.error?.message
        ? body.error.message
        : `Meydan API request failed (${response.status})`;
    throw new Error(message);
  }

  if (!("data" in body)) {
    throw new Error("Meydan API response is missing the data envelope.");
  }

  return body.data;
}

export function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

export function persianDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function compactFa(value: number | string | null | undefined): string {
  const number = Number(value || 0);
  return new Intl.NumberFormat("fa-IR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}
