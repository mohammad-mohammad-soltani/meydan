# Auth Gate + Black Theme Design

## Goal

Ensure every user action that requires authentication redirects to login before the protected action starts, and add a third site theme named «تیره» whose primary canvas/surfaces are pure black.

## Authentication behavior

- Keep public reading/navigation available without login.
- Introduce one client-side auth gate shared by interactive protected actions.
- The gate receives the server-computed `isAuthenticated` value from `app/(app)/layout.tsx`.
- Protected UI actions call the gate before optimistic state changes or network requests.
- Unauthenticated users are redirected immediately to `/auth?returnTo=<target>`.
- Route-level protected destinations such as `/compose` and `/chat/**` also have server-side guards, so direct URL navigation cannot bypass the client gate.
- Existing `/profile` and `/profile/edit` server guards remain, but their login redirect should include the intended return path.
- After successful OTP authentication or registration, `/auth` reads `returnTo`, accepts only internal absolute paths beginning with `/` (not `//`), and returns there. Default fallback remains `/profile`.
- Mutating actions are not automatically replayed after login. The user returns to the relevant page and may trigger the action again.

### Protected actions in scope

At minimum: compose, timeline Following tab, like/unlike, repost/unrepost, follow/unfollow, join initiative, comments, chat entry/sending, and profile editing. Existing API 401 handling remains a defense-in-depth fallback.

## Theme behavior

- Preserve existing `light` and gray `dark` themes.
- Add `black` theme, labeled «تیره» in UI.
- In black theme, the primary canvas and semantic surfaces (`background`, `surface`, `surface-muted`, `surface-elevated`, `surface-sunken`, `card`, `popover`, and inputs) are `#000000`; separation uses borders, opacity, and existing semantic colors rather than gray panels.
- The existing theme button opens a compact three-option popover: «لایت», «دارک», «تیره».
- Persist selection in `localStorage` key `meydan-theme` using `light | dark | black`.
- The pre-hydration script in `app/layout.tsx` applies the selected class before first paint to avoid theme flash.
- Tailwind `dark:` utilities must also behave as dark-mode utilities under the `black` class.

## Testing

- Add regression tests for login href sanitization/auth-gate contracts and the three theme modes.
- Verify protected-route guards and immediate compose gating with source-level behavior tests where appropriate.
- Run existing chat/podcasts tests and a full `npm run build` before merge.
