"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { FeedSwipePager } from "@/features/feed/components/FeedSwipePager";
import { ContentHubTabs, type HubTab } from "./ContentHubTabs";
import { ContentHubSkeleton } from "./ContentHubSkeleton";
import { AvaView } from "./AvaView";
import { NotesView } from "./NotesView";
import { ContentView } from "./ContentView";
import { getAudioHub, getNotesHub, type AudioHub, type NotesHub } from "../services/hub.service";
import { getContentBanners, type ContentBanner } from "../services/banners.service";
import { getSpeechContentPage, getMusicVideoContentPage } from "../services/content.service";
import { getReportDays, type ReportDay } from "../services/report-days.service";
import type { ContentItem } from "../types";

const ORDER: HubTab[] = ["top", "ava", "notes"];
const HREF: Record<HubTab, string> = { top: "/content", ava: "/content?tab=ava", notes: "/content?tab=notes" };

type TopData = { banners: ContentBanner[]; speeches: ContentItem[]; musicVideos: ContentItem[]; reportDays: ReportDay[] };

export type HubPayload =
  | { tab: "top"; data: TopData }
  | { tab: "ava"; data: AudioHub }
  | { tab: "notes"; data: NotesHub };

async function fetchTab(tab: HubTab): Promise<HubPayload> {
  if (tab === "ava") {
    const hub = await getAudioHub().catch((): AudioHub => ({ featured: [], series: [], faces: [], squares: [], latest: [] }));
    return { tab, data: hub };
  }
  if (tab === "notes") {
    const hub = await getNotesHub().catch((): NotesHub => ({ categories: [], featured: [], latest: [] }));
    return { tab, data: hub };
  }
  const [banners, speeches, musicVideos, reportDays] = await Promise.all([
    getContentBanners(),
    getSpeechContentPage(),
    getMusicVideoContentPage(),
    getReportDays(),
  ]);
  return { tab: "top", data: { banners, speeches: speeches.items, musicVideos: musicVideos.items, reportDays } };
}

function paneOf(payload: HubPayload): ReactNode {
  if (payload.tab === "ava") return <AvaView initial={payload.data} />;
  if (payload.tab === "notes") return <NotesView initial={payload.data} />;
  return (
    <ContentView
      banners={payload.data.banners}
      speeches={payload.data.speeches}
      musicVideos={payload.data.musicVideos}
      reportDays={payload.data.reportDays}
      todayNight={payload.data.reportDays.length}
    />
  );
}

/**
 * Hosts the three «بسته محتوا» tabs behind the same finger-tracked pager the
 * timeline's «برای شما»/«دنبال‌شده‌ها» tabs use (`FeedSwipePager`): dragging
 * pulls the neighbouring tab's real content in from the side, and a release
 * either carries it the rest of the way or springs back — never a straight
 * jump from one tab's content to the other's.
 *
 * Each tab is still its own route (`/content`, `?tab=ava`, `?tab=notes`), so
 * sharing and refresh keep working — `page.tsx` server-fetches whichever tab
 * the URL names and hands it down as `initial`, which is always what's shown
 * for `active`. A swipe toward a tab that isn't `active` yet previews it from
 * a client-side fetch (a skeleton while that's in flight); `localTab` tracks
 * that optimistic selection so the pager settles on it immediately, without
 * waiting for the `router.replace` below to round-trip the server and bring
 * `active`/`initial` into agreement with it.
 */
export function ContentHubPager({ active, initial }: { active: HubTab; initial: HubPayload }) {
  const router = useRouter();
  const tabsRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const fetchingRef = useRef<Partial<Record<HubTab, boolean>>>({});
  const [previews, setPreviews] = useState<Partial<Record<HubTab, ReactNode>>>({});
  const [localTab, setLocalTab] = useState<HubTab>(active);

  // Reconcile the optimistic selection once the server confirms it (or hands
  // down a tab reached another way — a tab tap, back/forward). This is the
  // React-documented way to adjust state for a changed prop without an
  // effect: https://react.dev/learn/you-might-not-need-an-effect
  const [confirmedActive, setConfirmedActive] = useState(active);
  if (active !== confirmedActive) {
    setConfirmedActive(active);
    setLocalTab(active);
  }

  const ensureFetched = useCallback((tab: HubTab) => {
    if (tab === active || previews[tab] || fetchingRef.current[tab]) return;
    fetchingRef.current[tab] = true;
    void fetchTab(tab)
      .then((payload) => {
        setPreviews((current) => ({ ...current, [payload.tab]: paneOf(payload) }));
      })
      .catch(() => {
        // Leave this tab's preview unset: the next render toward it (another
        // drag) retries instead of being stuck on a permanent skeleton.
      })
      .finally(() => {
        fetchingRef.current[tab] = false;
      });
  }, [active, previews]);

  // Reads `fetchingRef`, so this may only ever be called from `renderPane`
  // below — passed to `FeedSwipePager` by reference, never invoked directly
  // in this component's own render body (a ref access ESLint can trace
  // through a direct call, but not through a prop the callee invokes later).
  const paneFor = useCallback((tab: HubTab): ReactNode => {
    if (tab === active) return paneOf(initial);
    ensureFetched(tab);
    return previews[tab] ?? <ContentHubSkeleton />;
  }, [active, initial, previews, ensureFetched]);

  const renderPane = useCallback((paneIndex: number) => paneFor(ORDER[paneIndex]), [paneFor]);

  // The pager's own children slot (the pane behind `localTab`) stays
  // ref-free: by the time a swipe can make a tab `localTab` without it being
  // `active` yet, `renderPane` already rendered it as a neighbour pane during
  // the drag and kicked off its fetch, so this only ever needs to read the
  // now-settled cache, never trigger one itself.
  const activePane = localTab === active ? paneOf(initial) : previews[localTab] ?? <ContentHubSkeleton />;

  return (
    <>
      <ContentHubTabs ref={tabsRef} indicatorRef={indicatorRef} active={localTab} />
      <FeedSwipePager
        index={ORDER.indexOf(localTab)}
        count={ORDER.length}
        onIndexChange={(next) => {
          const tab = ORDER[next];
          setLocalTab(tab);
          router.replace(HREF[tab] as Route, { scroll: false });
        }}
        renderPane={renderPane}
        topBoundaryRef={tabsRef}
        getIndicator={() => indicatorRef.current}
      >
        {activePane}
      </FeedSwipePager>
    </>
  );
}
