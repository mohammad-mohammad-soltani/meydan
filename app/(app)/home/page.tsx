import type { Metadata } from "next";
import { FeedView } from "@/features/feed/components/FeedView";
import { getFeedPage, getFollowSuggestions } from "@/features/feed/services/feed.service";
import { FEED_FILTERS, type FeedFilter } from "@/features/feed/types";
import { accessTokenHeader } from "@/lib/meydan-session";
import { absoluteUrl, jsonLdScript, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

// `/` permanently redirects here, so `/home` — not `/` — is the canonical landing page.
export const metadata: Metadata = { alternates: { canonical: "/home" } };

const WEBSITE_JSON_LD = jsonLdScript({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/apple-icon.png"),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/explore?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
});

export default async function HomePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  // `?filter=` opens the feed on one chip (used by the mobile drawer links).
  const requested = (await searchParams).filter;
  const filter: FeedFilter = FEED_FILTERS.includes(requested as FeedFilter) ? (requested as FeedFilter) : "all";
  const authHeaders = await accessTokenHeader();
  const [postsResult, suggestionsResult] = await Promise.allSettled([
    getFeedPage(filter === "all" ? {} : { filter }, { headers: authHeaders }),
    getFollowSuggestions(),
  ]);

  const postsUnavailable = postsResult.status === "rejected";
  const suggestionsUnavailable = suggestionsResult.status === "rejected";

  if (postsUnavailable) {
    console.error("[meydan] home feed request failed", postsResult.reason);
  }
  if (suggestionsUnavailable) {
    console.error("[meydan] home suggestions request failed", suggestionsResult.reason);
  }

  const feedPage = postsResult.status === "fulfilled" ? postsResult.value : { posts: [], nextCursor: null };
  const suggestions =
    suggestionsResult.status === "fulfilled" ? suggestionsResult.value : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={WEBSITE_JSON_LD} />
      <FeedView
        key={filter}
        initialFilter={filter}
        posts={feedPage.posts}
        nextCursor={feedPage.nextCursor}
        suggestions={suggestions}
        postsUnavailable={postsUnavailable}
        suggestionsUnavailable={suggestionsUnavailable}
      />
    </>
  );
}
