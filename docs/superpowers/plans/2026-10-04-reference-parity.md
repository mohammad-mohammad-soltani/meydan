# Meydan Reference Parity Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development and dispatching-parallel-agents for independent feature boundaries. No further user approval is required: the user explicitly requested direct implementation after audit.

**Goal:** Reproduce the supplied HTML's rendered geometry, colors and interaction states in the existing Next application while preserving IRANSansXV and real backend functionality.

**Architecture:** Keep existing React components, routes, providers and feature services. Extract exact final reference styles into scoped feature CSS and explicit semantic/reference tokens; never ship the reference bundle, mock content, demo users or unrelated fonts. PHP Rest/Domain is the backend contract; the Postman collection is an additional but incomplete inventory.

**Tech Stack:** Installed Next16.3.4, React19, Tailwind4, Leaflet, WordPress Meydan REST, Playwright with system Chrome.

**Spec:** User request in attached Pasted text.txt; `docs/reference-parity/{shell-color,api,feature,feed-media}-audit.md`; original HTML in Downloads.

## Global Constraints

- Preserve `app/fonts/IRANSansXV.woff2` and `--font-iran-sans`; no new fonts.
- No iframe/blob/compiled prototype bundle/second React app/static substitute for working components.
- Colors/gradients/opacity and dimensions come from extracted HTML CSS plus final computed styles.
- Existing route contracts, auth gates, permissions, public profiles, uploads, PWA, native bridge, realtime, audio/video and admin remain.
- Use API data; no fake metrics, mock users or interactions. Missing backend-dependent action gets SoonBadge only after source verification; client features remain functional.
- Shared `/me`, cursor pagination and request batching are retained.
- No backend edits needed unless a verified contract defect blocks required existing behavior; no invented endpoints.

## Review Focus

- Guests: only protected mutations prompt login; public navigation stays public.
- Night/AMOLED: final cascade and contextual colors remain distinct and theme preference persists.
- Mobile/tablet: narrow cards, pinned tabs, modal bounds, safe areas and scroll containers fit all requested widths.
- Real API empty/error data: honest loading/empty/error state without decorative mock records.
- Media: interactive card links do not intercept photo/reel/share actions; native uploads and audio survive.

### Task1: Audit (before product code)

- [ ] Read full feature boundaries and backend Rest/Domain/SPEC/Postman; record interaction/API matrix and missing APIs.
- [x] Parse reference CSS/JS and record colors/custom properties/gradients/shadows/borders/alpha expressions.
- [x] Render reference and existing shell; record computed geometry/color values and final cascade.

### Task2: Shell and theme (root)

**Files:** `components/layouts/*`, `components/shared/AppLogo.tsx`, `app/globals.css`, `app/black-theme.css`, new `components/layouts/shell.module.css`, new `app/reference-tokens.css`.

**Interfaces:** Existing children/auth/native props and production routes unchanged. Exposes `--m-bg/soft/line/tx/mu/glass` aliases and explicit reference tokens for feature CSS.

- [ ] Set exact shell280/635/310 inside1265 desktop container, responsive1024–1279 geometry, wide and chat rail layouts.
- [ ] Apply final nav7% red background/foreground labels/red22px icons, header/footer/FAB/bottom bar geometry/colors and source vector mark variants.
- [ ] Preserve stored themes; unify exact theme base colors and retain contextual feature tokens.
- [ ] Screenshot/check computed shell in5 requested viewports/3 themes.

### Task3: Feed, media, compose

**Files:** `features/{feed,media,compose}/**` only.

**Interfaces:** Existing services and PostCard/reels/upload props preserved. Consumes shared reference tokens.

- [ ] Match feed tab/filter/card/quote/action/suggestion final styles and reference typography.
- [ ] Match photo viewer/reel rail/comments/control/scrim/progress layouts across mobile/desktop.
- [ ] Match compose4 tabs/form/author/upload geometry; real narrative/work mutations remain. Verify campaign/media campaign creation source, keep missing public creation explicitly soon.
- [ ] Meaningful media/tab interactions and targeted existing regression tests.

### Task4: Content, explore, speakers, map, profile, chat

**Files:** Corresponding `features/**` boundaries (share/audio excluded).

**Interfaces:** Existing data/query/pagination/invitation/notification/Leaflet/profile/follow services retained; consumes root tokens.

- [ ] Match final source CSS for each page: hero/quick actions/shelves, explore tabs/sections, speaker rows/search/categories/invites, map search/controls/list, profile header/tabs/follow sheets, chat workspace/notifications/composer/bubbles.
- [ ] Correct works font override to shared IRANSansXV; scope styles to avoid overwriting shell semantics.
- [ ] Remove verified fake metrics and content fixture fallbacks while retaining real data and truthful missing-feature states.
- [ ] Verify live reads and local interactive behavior; authenticated mutation verification only if a legitimate test session exists.

### Task5: Share/Story Maker, audio and API behavior review

**Files:** `features/{share,audio}/**`, regression tests for behavioral fixes.

**Interfaces:** Existing SharePost, providers and actual native/file/canvas functions remain. Fontfamily from existing shared variable.

- [ ] Match source Story Maker UI/themes/preview/export and share/photo sheets exactly with real selected post.
- [ ] Verify client-only actions are functional; remove fake synthetic audio measurement if it misrepresents real playback.
- [ ] Review API audit findings against implementation, especially SoonBadge claims.

### Task6: Integration and verification

**Files:** `scripts/reference-parity.mjs`, Playwright verification config/spec as appropriate, docs/reference-parity verification report and artifact outputs.

- [ ] `npm run lint` exit0.
- [ ] `npm run build` exit0.
- [ ] `npm run test:map` exit0.
- [ ] `npm run test:admin` exit0.
- [ ] Compare source/implementation screenshots at390×844,430×932,768×1024,1280×800,1440×900; computed colors/geometry for key elements.
- [ ] Exercise routes/theme/drawer/search/tabs/feed/media/share/StoryMaker/compose/invitations/map/chat/profile/client initiatives where legitimate data/session permits. Record any unverified authorization-dependent actions.
- [ ] Review actual diff and report achieved changes, UI/API mapping, genuinely unavailable actions, viewports, exact tokens and remaining differences. Do not claim pixel-perfect if evidence shows gaps.
