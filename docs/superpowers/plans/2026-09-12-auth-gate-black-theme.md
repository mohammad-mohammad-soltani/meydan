# Auth Gate + Black Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add immediate login gating for all protected user actions and a third pure-black theme with a three-option theme menu.

**Architecture:** Add a shared client auth-gate provider fed by the existing server-side `isAuthenticated()` result, plus server guards for protected routes. Centralize return-to sanitization in a pure helper so both auth redirects and post-login navigation use the same rules. Add a small theme utility/menu and a `black` semantic token layer while preserving existing light/dark behavior.

**Tech Stack:** Next.js App Router, React client/server components, Tailwind CSS v4 semantic variables, Node source-level regression tests, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-12-auth-gate-black-theme-design.md`

## Global Constraints

- Public reading/navigation remains available without login.
- Protected UI actions redirect before optimistic state changes or protected network requests.
- Login redirects use `/auth?returnTo=<internal path>`; external/protocol-relative return targets are rejected.
- Protected mutations are not automatically replayed after login.
- Existing `light` and gray `dark` themes remain unchanged in meaning.
- New `black` theme is labeled «تیره» and uses `#000000` for primary semantic surfaces.
- Persist theme with `meydan-theme = light | dark | black` and apply before first paint.

---

### Task 1: Auth return-path and client gate

**Files:**
- Create: `lib/auth-navigation.ts`
- Create: `components/providers/AuthGateProvider.tsx`
- Modify: `app/(app)/layout.tsx`
- Test: `tests/auth-gate-theme.test.mjs`

**Interfaces:**
- Produces: `sanitizeReturnTo(value: string | null | undefined, fallback?: string): string`
- Produces: `loginHref(returnTo?: string): string`
- Produces: `useAuthGate(): { isAuthenticated: boolean; requireAuth(returnTo?: string): boolean }`

- [ ] **Step 1: Write the failing test**

Assert the helper/provider files exist, reject `https://...` and `//...` return targets, and expose `requireAuth` using `/auth?returnTo=`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: FAIL because auth gate/helper do not exist.

- [ ] **Step 3: Write minimal implementation**

Create the pure return-path helper and context provider. Wrap the app shell tree in `AuthGateProvider` using the existing server-computed authentication flag.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: auth helper/provider assertions PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add shared auth gate`

### Task 2: Gate protected routes and interactive actions

**Files:**
- Modify: `components/layouts/FloatingComposeButton.tsx`
- Create: `app/(app)/chat/layout.tsx`
- Modify: `app/(app)/compose/page.tsx`
- Modify: `app/(app)/profile/page.tsx`
- Modify: `app/(app)/profile/edit/page.tsx`
- Modify: `features/feed/hooks/useFeed.ts`
- Modify: `features/feed/components/ConnectedGoodActionCard.tsx`
- Modify: `features/posts/hooks/usePost.ts`
- Modify: `features/posts/components/PostView.tsx`
- Modify: `features/profile/hooks/useProfile.ts`
- Test: `tests/auth-gate-theme.test.mjs`

**Interfaces:**
- Consumes: `useAuthGate().requireAuth(returnTo?)`
- Consumes: `loginHref(returnTo)` for server redirects.

- [ ] **Step 1: Extend failing test**

Assert compose click invokes `requireAuth('/compose')`; compose/chat server routes use an authentication guard; feed/post/profile protected mutations call the gate before optimistic changes; profile redirects preserve return paths.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: FAIL against current unguarded actions.

- [ ] **Step 3: Implement route and action gating**

Add immediate gate checks to compose, Following selection, like/repost/follow/join/comment/profile-message/profile-like actions. Keep API 401 redirects as fallback but route them through the shared login helper. Add server guards for `/compose` and the `/chat/**` subtree.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: protected-action assertions PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: redirect protected actions before execution`

### Task 3: Return to intended page after authentication

**Files:**
- Modify: `app/auth/page.tsx`
- Test: `tests/auth-gate-theme.test.mjs`

**Interfaces:**
- Consumes: `sanitizeReturnTo()` from `lib/auth-navigation.ts`.

- [ ] **Step 1: Extend failing test**

Assert successful OTP auth and successful registration replace to a sanitized `returnTo`, with `/profile` fallback.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: FAIL because auth currently always replaces to `/profile`.

- [ ] **Step 3: Implement post-login return**

Read `returnTo` from `window.location.search` at navigation time, sanitize it, and use it after both existing-account auth and registration completion.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: return users to intended page after login`

### Task 4: Three-state theme and pure-black tokens

**Files:**
- Create: `lib/theme.ts`
- Create: `components/layouts/ThemeMenu.tsx`
- Modify: `components/layouts/MobileHeader.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Test: `tests/auth-gate-theme.test.mjs`

**Interfaces:**
- Produces: `ThemeName = 'light' | 'dark' | 'black'`
- Produces: `readStoredTheme()` and `applyTheme(theme)` client helpers.

- [ ] **Step 1: Extend failing test**

Assert three theme values exist, the menu contains «روز», «شب», «تیره», root boot script recognizes `black`, and `html.black` assigns `#000000` to background/surface/card/popover/input semantic tokens.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: FAIL because only two themes exist.

- [ ] **Step 3: Implement theme utility/menu/tokens**

Replace the binary theme toggle with a three-option popover. Persist the selection, apply dark color-scheme to both dark modes, extend the `dark:` custom variant to include `.black`, and add semantic pure-black variables for the new mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/auth-gate-theme.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add pure black theme`

### Task 5: Full regression verification

**Files:**
- Modify if needed: `.github/workflows/chat-ui-ci.yml` to include the new regression test.

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/auth-gate-theme.test.mjs tests/chat-message-menu.test.mjs tests/chat-utils.test.mjs tests/map-theme.test.mjs tests/podcasts-search.test.mjs`
Expected: all PASS.

- [ ] **Step 2: Run full frontend build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Review branch diff against main**

Ensure only auth-gating/theme code, tests, workflow, and design/plan docs changed.

- [ ] **Step 4: Merge only after CI is green**

Fast-forward `main` to the verified branch head.
