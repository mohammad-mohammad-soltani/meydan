import type { WorkMessage } from "./types";

const byId = (a: WorkMessage, b: WorkMessage) => Number(a.id) - Number(b.id);

/**
 * Merge fresh server rows into the list: rows are keyed by id (fresh data wins), an optimistic
 * row is replaced by its confirmed twin (same client id), confirmed rows stay in id order and
 * rows still being sent stay at the end.
 */
export function mergeMessages(current: WorkMessage[], incoming: WorkMessage[]): WorkMessage[] {
  const map = new Map<string, WorkMessage>();
  const clientIds = new Set(incoming.map((m) => m.client_id));
  for (const m of current) {
    if (m.delivery && clientIds.has(m.client_id)) continue;
    map.set(m.id, m);
  }
  for (const m of incoming) map.set(m.id, m);
  const all = [...map.values()];
  return [...all.filter((m) => !m.delivery).sort(byId), ...all.filter((m) => m.delivery)];
}
