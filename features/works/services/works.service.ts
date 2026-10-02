import { meydanApi, meydanApiPage } from "@/lib/meydan-api";
import type { WorkGroup, WorkMember, WorkMessage, WorkSummary, WorkUser } from "../types";

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    p.set(k, v === true ? "1" : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const worksPage = (filter: string, q: string, cursor = "") =>
  meydanApiPage<WorkGroup[]>(`/works${qs({ filter: filter === "all" ? "" : filter, q, cursor })}`);

export const worksSummary = () => meydanApi<WorkSummary>("/works/summary");

export const workDetail = (id: string) => meydanApi<WorkGroup>(`/works/${id}`);

export type MessageQuery = { kind?: string; mine?: boolean; before?: string; after?: string; limit?: number };

/** Items come back oldest-first. `nextCursor` is the oldest id (history) or the newest id (catch-up). */
export const messagePage = (id: string, q: MessageQuery = {}) =>
  meydanApiPage<WorkMessage[]>(
    `/works/${id}/messages${qs({ kind: q.kind, mine: q.mine, before_id: q.before, after_id: q.after, limit: q.limit ?? 50 })}`,
  );

export const oneMessage = (id: string) => meydanApi<WorkMessage>(`/works/messages/${id}`);

export const memberPage = (id: string, q = "", cursor = "") =>
  meydanApiPage<WorkMember[]>(`/works/${id}/members${qs({ q, cursor, limit: 50 })}`);

export const seenPage = (messageId: string, cursor = "") =>
  meydanApiPage<{ user: WorkUser; seen_at: string }[]>(`/works/announcements/${messageId}/seen${qs({ cursor })}`);

export function workAction<T = WorkMessage>(path: string, method = "PUT", body?: unknown) {
  return meydanApi<T>(`/works/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
