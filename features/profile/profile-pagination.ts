/** Index of the trigger after half of the latest visible page has been read. */
export function profilePrefetchIndex(visibleCount: number, previousVisibleCount: number): number {
  return previousVisibleCount + Math.ceil((visibleCount - previousVisibleCount) / 2);
}
