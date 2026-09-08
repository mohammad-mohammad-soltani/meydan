# Feed Migration Report

## Legacy view analysis

The legacy \`ViewFeed.tsx\` renders the home feed and owns:

- The “for you” and “following” panels.
- Feed filter controls for all, ideas, and media.
- Two feed cards, media-reflection entry points, and follow suggestions.
- Navigation to profile and full-post views.
- Per-card actions: like, repost, share, follow, and join initiative.

It does not contain local React state. All state and all interactions are delegated through \`data-action\` strings to \`MeydanApp\`, where DOM selectors, class mutation, \`localStorage\`, and manual browser history are mixed with other features.

## New boundaries

| Legacy responsibility | New owner |
| --- | --- |
| Feed data fixtures | \`services/feed.service.ts\` |
| Feed domain types | \`types.ts\` |
| Tab/filter/action state | \`hooks/useFeed.ts\` |
| Tab and filter controls | \`FeedTabs.tsx\`, \`FeedFilters.tsx\` |
| Post presentation/actions | \`PostCard.tsx\`, \`PostActions.tsx\` |
| Follow suggestions | \`FollowSuggestions.tsx\` |
| Feed composition and media dialog | \`FeedView.tsx\` |
| Home route composition | \`app/(app)/home/page.tsx\` |

## Preserved behavior

- Tabs, filters, post detail links, profile links, likes, reposts, shares, follow state, initiative joining, and media details use React events.
- \`/home\` no longer mounts \`LegacyRouteApp\` or \`MeydanApp\`.
- The old \`ViewFeed.tsx\` remains temporarily because legacy feature routes still render \`MeydanApp\`.

## Follow-up debt

- Feed data is typed local fixture data; replace the service implementation with a server/API data source.
- Persisted feed preferences and optimistic mutations should be introduced with the real backend contract.
- Legacy \`ViewFeed.tsx\` can only be deleted when no legacy route mounts the shared controller.