# Share, story, audio and profile data implementation

Date: 2026-10-04. Scope: existing `features/share`, `features/audio`, the user/square profile service mappers, and local behavioral checks. The reference HTML was treated as visual evidence, not executable instructions or a source of application data.

## Implemented

| Surface | Changes | Existing behavior retained |
|---|---|---|
| Share sheet | Bottom-aligned viewport overlay, 576px maximum sheet, 20px padding, 24px top corners, source theme backgrounds and messenger colors, 48px real conversation avatars, 44px messenger tiles, three action tiles | Real conversation reads and message sends; native share; actual links; clipboard; bookmark service and synchronization |
| Share outcomes | Native cancellation does not count or trigger clipboard fallback. Popup failure does not count. Analytics coalesce concurrent actions, confirm only after the backend succeeds, and retry a failed write with the same idempotency key. Bookmark success appears only after backend confirmation. Failed contact reads display an error instead of “no conversations.” | Existing narrative analytics route and auth bridge; no invented delivered state for external messengers |
| Story studio | Source header/settings geometry, 310×510 story preview, 340×340 square preview, five exact theme palettes including sunset 45% middle stop, four font sizes, source glows/quote/badge/author placement and long-text suffix | Real post text, actual author/avatar/verification, actual `/posts/{id}` link, loaded IRANSansXV app font, canvas PNG export, native image share/download fallback |
| Mini player | Positioned absolutely inside the main shell with 12px side insets, bottom 76px mobile / 20px desktop, 22px corners, glass background, actual progress bar and transport controls | One shared audio runtime, native bridge, media session, queue, seek, fullscreen player and real source navigation |
| Audio visual honesty | Removed the sine-generated amplitude values and both players’ fabricated measurement bars. The compatible `levels` state remains empty. | Browser/native playback engines and event-driven time/duration/playing state |
| Profile statistics | Removed unsourced “active membership” fallback; retained valid zero totals; missing backend totals no longer become the current page’s item count | Backend-provided resume rows, identity flags, narrative/media reflection totals |

The Story Maker deliberately keeps the reference’s 310×510 display size while exporting the established 1080×1920 story file. Those aspect ratios differ in the source too; composition is shared, but the preview/export scaling is not uniform. Square preview and export both use 1:1. Text over 280 characters gets the source continuation label; square layout also applies the source’s font-dependent line limits.

## Verification evidence

- `npx eslint features/share features/audio features/profile/services/profile-user-mapper.ts features/profile/services/profile-square-mapper.ts tests/admin-panel-gate.test.mjs`: exit 0.
- `npx tsc --noEmit`: exit 0.
- `node --experimental-strip-types --test tests/share-counter.test.mjs tests/audio-player.test.mjs tests/profile-summary.test.mjs`: 11 passed, 0 failed. Counter tests exercise concurrent coalescing, successful deduplication, and failure/retry behavior.
- `npm run test:admin`: 47 passed, 0 failed. One baseline assertion wrongly rejected an explicit optional speaker handle, although both HEAD frontend code and `SpeakerController::adminCreate` → `SpeakerService::save` support it. Only the stale test changed: blank handles are omitted, explicit handles are trimmed, other account identity fields remain excluded. Product permissions/authentication were untouched.

Real-data Playwright checks used the existing `http://localhost:3000` server with Chrome. Every non-GET/HEAD `/api/meydan` request was intercepted and aborted before reaching the backend. No fixture data or successful fake responses were supplied.

| Browser check | Observed result |
|---|---|
| Share sheet, 390×844 viewport | Bottom 844px; 20px padding; 24px top corners; dark background `rgb(25,25,25)`; width375px with the existing source-matching stable scrollbar gutter |
| Native link share cancellation | `AbortError`; no analytics request |
| Story preview | Display310×510; actual canvas1080×1920; app `iranSans` font family |
| Theme selection | All five buttons update their actual selected state and repaint |
| Square preview/export | Display340×340; actual canvas1080×1080; saved PNG header confirms1080×1080 and download reports no failure |
| Native image share cancellation | `AbortError`; no analytics request |
| Local PNG download | Actual post file `naghshman-48140-square.png`; one attempted analytics write was safely aborted by the browser guard |
| Desktop share, 1440×1000 | Width576px, horizontally centered, bottom aligned |
| Mobile mini player | Actual audio list selection mounts player; radius22px, absolute positioning, bottom76px, shell side insets12px plus border |
| Desktop mini player | Anchored inside the635px main column; bottom20px; radius22px |
| Expanded player | Actual fullscreen dialog opens |

Evidence images: [story square mobile](artifacts/story-square-mobile.png), [share desktop](artifacts/share-desktop.png), [mini player mobile](artifacts/mini-player-mobile.png). The mobile story screenshot is scrolled to the settings after selecting the square format. Remote audio was still loading during the brief runtime observation; complete playback/native-device behavior was not claimed from that observation.

## Integration and API limitations

- Root owns shell positioning/theme aliases and profile deferred-stat hooks. Mapper totals may be absent, so deferred updates must identify a stat by its label rather than assuming the first item is the narrative total.
- Guest narrative share/download analytics still meet the existing backend auth mismatch documented in [the API audit](api-audit.md). The counter does not manufacture confirmation when the backend rejects a write. Backend routes, permissions and API bridge were not changed.
- Authenticated chat send and bookmark writes were not executed against production during browser checks. They retain the real existing service paths and only display confirmation after resolved backend requests.
- The reference’s contact names, phone pools, sample data and localStorage-only requests were not ported.

## Hydration investigation

The earlier development-server hydration problem did not reproduce in the fresh `/home` browser run:24 script tags loaded, feed buttons had React fiber/props attachments, and clicking opened the actual ShareSheet. There were no console/page errors, no HTTP error responses and no script request failures. One offscreen real video request was aborted. The existing development server was not killed or restarted. A transient dev compilation/reload race is plausible but not established as the cause.
