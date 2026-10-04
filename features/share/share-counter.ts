/** Counts a completed share once; concurrent calls coalesce and failed writes can retry. */
export function createShareCounter(record: () => Promise<unknown>): () => Promise<boolean> {
  let confirmed = false;
  let pending: Promise<boolean> | null = null;
  return () => {
    if (confirmed) return Promise.resolve(true);
    if (pending) return pending;
    pending = Promise.resolve().then(record).then(
      () => { confirmed = true; return true; },
      () => false,
    ).finally(() => { pending = null; });
    return pending;
  };
}
