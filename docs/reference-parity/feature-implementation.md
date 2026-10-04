# Feature implementation

Owned scope: content, explore, speakers, speaker invitations, coming-soon; additionally the two content routes supplying archive counts. Changes use local CSS under their feature folders. Shell, global tokens, profile, map, chat, shared audio and share are handled separately.

- Content tabs now use the final50px solid header,25% underline. Banners contain only enabled real managed images/links; sample DEFAULTS are removed. Carousel has86% mobile/70% desktop cards,16:9,28px corners,18px inset. Quick actions use62px circles and exact reference hex colors. Section spacing/head icons, flat speech rows46px avatars, night cards, and responsive picked-media rail/grid match the final cascade.
- Ava featured cards use final half-width proportions and0.95 aspect ratio, real playback/queues unchanged. Producer shelves and notes use corrected insets/cards; note reader has240px hero,22px title and46px round actions. Unsupported services remain visibly disabled.
- Available report-night labels come from the real returned array and say “شب موجود”. Date-derived currentReportNight utility and route usage removed. Real per-day night numbers/colors remain unchanged.
- Explore header glow/gradient, search54px/focus halo, section icons/type, tag/suggestion cards, ranked rows, active two/three-column grid, and red speaker callout match reference. API bookmarks previously discarded by landing mapper are now forwarded to BookmarkButton. Search/follow/retry hooks retained.
- Speakers now have a17px heading,38px back control,46px search,34px bordered filters, edge-to-edge divided rows,50px avatars, and12.5px invite controls. Initial avatars use deterministic pastel colors. Numeric cities resolve through existing geo option cache: one shared id→name lookup with bounded batches of six province requests, no per-speaker requests. Lookup failures retry later and unresolved numeric IDs are omitted instead of displayed as names.
- Real invitation boxes/actions remain intact; cards use reference20px muted containers/type, form fields46px/radius16, monochrome selected tabs. Invitation chat navigation uses Next router, preserving destination and error flow.
- Coming-soon forms use reference header/field sizes; unrelated96px decorative hero panels removed. Signup/screening/BistCall remain unavailable; drafts remain functional.

Verification:

- `tsc --noEmit`: passed after concurrent share edits settled.
- ESLint across all five owned feature folders and both content routes: passed, zero warnings.
- Scoped `git diff --check`: passed.
- Read-only Playwright screenshots at390×900 and1440×900 for `/content`, both audio/notes tabs, `/speakers`, `/explore`, `/speaker-signup`, `/screening`, `/bistcall`: all rendered; document widths375/1425 matched the existing15px gutter, no horizontal document overflow. Screenshots: `/tmp/meydan-feature-implemented-{390,1440}-*.png`.
- Actual speaker page returned50 rows and resolved Tehran city labels, alongside the API94 total. No sample speaker identities inserted.

Browser limitation: the existing development server returns SSR pages but does not finish client hydration in fresh Playwright contexts. Explore landing effect never requested `/explore/home` after16seconds; speaker filter/search handlers did not execute. No page errors occurred; console repeatedly reported HMR WebSocket `ERR_INVALID_HTTP_RESPONSE`; auth provider dataset and React DOM attachment were absent. Therefore live interaction assertions are not claimed as passed. Root is coordinating a separate production build/preview for real interaction verification. Authenticated invitation states were source-reviewed, not exercised with backend mutations.
