"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SearchModalContextValue = { isSearchOpen: boolean; openSearch: () => void; closeSearch: () => void; };
const SearchModalContext = createContext<SearchModalContextValue | null>(null);

/** Temporary global bridge until search moves into its own feature. */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const value = useMemo(() => ({ isSearchOpen, openSearch: () => setIsSearchOpen(true), closeSearch: () => setIsSearchOpen(false) }), [isSearchOpen]);
  return <SearchModalContext.Provider value={value}>{children}</SearchModalContext.Provider>;
}

export function useSearchModal() {
  const context = useContext(SearchModalContext);
  if (!context) throw new Error("useSearchModal must be used within SearchProvider");
  return context;
}
