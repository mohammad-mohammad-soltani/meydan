# Admin Panel Design (`app/(app)/admin/**`)

## Goal

Give a WordPress `administrator` a complete management panel inside the Next.js
app that covers all twelve documented admin API sections — the headline feature
being «افزودن میدان» — while a non-administrator (including `meydan_manager`)
sees neither a panel page nor a panel link.

The panel inherits the existing `(app)` shell, theme, providers and
`template.tsx`; it introduces no new layout contract.

## Access control

Two layers, deliberately different in strength:

| Layer | File | What it proves |
|---|---|---|
| Edge redirect | `proxy.ts` (`config.matcher`) + `lib/protected-routes.ts` | A session cookie exists. It cannot read a role. |
| Authoritative gate | `features/admin/server/require-administrator.ts` | The API says the viewer holds the `administrator` role. |
| Denial screen | `app/(app)/admin/layout.tsx` | Turns the gate's verdict into a screen. |
| Per-page re-check | every `app/(app)/admin/**/page.tsx` | No page query runs before the role is confirmed. |

The gate resolves four states and never falls through to the panel:

1. no session cookie → `redirect(loginHref("/admin"))`;
2. `GET /me` answers 401 (cookie present, token dead) → `redirect(loginHref("/admin"))`;
3. any other failure → `<AdminGateError>`, a retryable error screen;
4. signed in but not an administrator → `<AdminForbidden role>`, and `children`
   is not rendered because the guard returns first.

`resolveAdminGate` returns the verdict as data (`administrator` / `denied` /
`unavailable`) rather than as an exception, because React may not construct the
JSX for a denial inside the `try` that produced it. A failure to *reach* the API
is `unavailable`, never `denied`: an outage must not look like a permission
problem.

**The gate is deliberately two layers.** Next evaluates a nested page segment
even when its parent layout renders something other than `{children}`, so a
layout-only guard still runs the page component — and its data queries — for a
non-administrator, and ships the resulting tree to the client. Every page
therefore calls `isAdministrator()` as its first statement and returns `null`
when it is not an administrator; the layout is then the only thing on screen.
This was confirmed against a production build: before the per-page re-check a
non-administrator's `/admin` response carried the rendered dashboard, and after
it every one of the 23 admin routes returns only the denial screen.

The login redirect is driven by the **cookie check**, not by the 401, so a
rejected token cannot produce a redirect loop. `dynamic = "force-dynamic"` and
`robots: { index: false, follow: false }` keep a role-dependent page out of any
cache and out of search results.

`hasAdministratorRole` in `features/auth/services/viewer-role.service.ts` is the
single predicate — the layout and the client link both use it, so the gate and
the link cannot disagree. It is fail-closed: only an explicit `administrator`
entry in `/me`'s `roles` counts.

The link is `AdminNavLink`, rendered in the desktop sidebar only. The bottom bar
is a fixed `grid-cols-5` grid; a role-dependent sixth item would reflow every
tab, so it is left alone. The link renders `null` until the role is known.

## API layer

`features/admin/services/admin-api.ts` is the transport every admin service
funnels through. Two backend behaviours shape it:

1. **Idempotency.** Admin POSTs are cached for 24 hours under the
   `idempotency-key` header, and the cache replays the *whole* response — a 4xx
   included. A key reused across two submissions therefore replays the first
   failure forever. A fresh `crypto.randomUUID()` is minted per non-idempotent
   request.
2. **Two error shapes.** Controllers answer
   `{ error: { code, message, fields } }`; the `/admin/*` permission callbacks
   return a raw `WP_Error`, which WordPress serializes as
   `{ code, message, data: { status } }`. `MeydanApiError` normalizes both, and
   `adminErrorMessage` turns either into one Persian sentence. `error.fields`
   survives as `MeydanApiError.fields`, and `fieldErrorMessage` maps the
   server's reason codes (`required`, `invalid`, `taken`, `invalid_or_taken`,
   `not_eligible`, `too_long`) to Persian.

`meydanApiEnvelope<T>` was added to `lib/meydan-api.ts` for the page/per_page
lists, whose `meta.total`/`meta.pages` `meydanApi` discards. It shares one
private `requestEnvelope` core with `meydanApi`/`meydanApiPage`, so error
handling and the auth guard exist once.

### Who attaches the session token

The service modules are **isomorphic**: the server pages read the first page and
the client views refetch on every filter and page change. The two callers reach
the API by different routes, and only one of them carries credentials
automatically.

| Caller | Reaches | Token |
|---|---|---|
| Browser (client view) | `app/api/meydan/[...path]` | the proxy reads the httpOnly cookie and sets `Authorization` |
| Server (page first paint) | the API origin directly | must be supplied by the caller |

The server side therefore goes through `features/admin/services/admin-server.ts`,
a server-only module whose read wrappers bind `withAdminAuth()` to each call.
Every service function takes an optional trailing `init`, so one implementation
serves both routes.

This split is not stylistic. `withAdminAuth` reads `next/headers`, and the
feature's client components import the service modules directly, so importing
the helper from a service fails the whole build with *"You're importing a module
that depends on next/headers"*. Keeping the binding in the server-only module is
what lets both sides share one implementation. The rule is pinned by a test: a
service may not mention `next/headers`, `admin-request` or `withAdminAuth`, and
no page may import a read from a `.service` module.

The symptom this fixed is worth recording, because it looked like a permissions
bug: with the header missing, every `/admin/*` read answered 401, so all 23
sections rendered "بارگذاری این بخش پنل ممکن نشد" for a signed-in
administrator while the API itself worked perfectly when curled with a token.

Pagination shapes are not uniform and each list respects its own:

| List | Shape | Ceiling |
|---|---|---|
| squares, programs | `page`/`per_page` + `meta.total` | 100 (squares), 50 (programs) |
| content | `cursor`/`next_cursor` | 20 per page |
| editorial narratives | `page`/`limit` inside `data` | 20 per page |
| speakers, speaker requests, participants | none — a hard `LIMIT` | 50 / 100 / 100 |

The capped lists are labelled with `AdminListCapNotice` rather than given fake
page controls.

## Feature layout

```
app/(app)/admin/                 # 29 routes: one page per surface
features/admin/
  types.ts                       # camelCase domain types
  lib/normalize.ts               # pure, dependency-free validators/normalizers
  services/*.service.ts          # one per API section; snake_case stops here
  components/Admin*.tsx          # the shared kit + one view per surface
  hooks/useAdminRefresh.ts
```

Domain types are camelCase; `snake_case` exists only inside a service, next to
the wire types it maps. `lib/normalize.ts` has no imports from the app, so
`tests/admin-normalize.test.mjs` exercises the whole payload-cleaning layer
directly with `--experimental-strip-types`.

## UI kit

No component library — the project has none — and only the semantic tokens from
`app/globals.css`. The kit is:

- `AdminPageHeader` (title, crumbs, actions, a `limitation` line that states a
  backend ceiling or trap in the UI rather than in a comment);
- `AdminNotice` (one feedback pattern, `role="alert"` for errors,
  `role="status"` otherwise) and `AdminFieldMessage` (server sentence plus the
  per-field reasons from a 422);
- `AdminField` (label, `aria-invalid`, `aria-describedby`, a field-level error);
- `AdminTable` — two layouts from one `columns` array: a real `<table>` at `md`
  and up, and one labelled card per row below it. `hideOnMobile` drops a column
  from the card layout only; `AdminPagination` / `AdminListCapNotice`;
- `AdminFilters` (declarative descriptors; filters apply on submit so typing does
  not refetch per keystroke);
- `AdminDialog` (portalled `role="dialog"`, Escape and backdrop close, focus
  move and restore, busy and error states) for every destructive or
  irreversible action;
- `AdminStateViews` (`AdminEmptyState`, `AdminErrorState`, `AdminLoadingState`,
  `AdminTableSkeleton`) — used by every list, so no page lacks
  loading/empty/error;
- domain pickers: `MediaPickerField` (uploads through `uploadNarrativeFile`),
  `GeoPickerField` (province/city/address plus the existing
  `LocationPickerMap`), `ChannelFields`, `ScheduleRows` (Jalali pickers, Gregorian
  values), `IdLookup`.

Dates follow the project convention everywhere: Jalali in the UI, Gregorian
`YYYY-MM-DD` / `HH:mm` as the value. `ScheduleRows` uses the existing
`PersianDatePicker`/`PersianTimePicker`.

The squares map is Leaflet imported dynamically with `addOpenFreeMapBasemap` and
`LIVE_MAP_THEME`; grouping is a small client-side coordinate bucket, because
`react-leaflet` and any clustering plugin are absent from the project and must
not be added.

### The panel lives in a narrow column

`AppShell` wraps every route in `max-w-xl` (~36rem) and the admin panel inherits
it, so "responsive" here does not mean "more room on a big screen" — the content
column is the same width at 400px and at 1440px. The layout rules follow from
that:

- **Navigation** is a grid of icon+label tiles (`grid-cols-4` → `sm:6` → `lg:7`),
  not a row of pills. Thirteen labelled pills cannot fit, and a horizontal
  scroller hides sections off-screen with no affordance.
- **Data rows** switch to cards below `md`. Four or five real columns in 36rem
  wrapped every cell onto three or four lines; a card gives each value its own
  labelled line instead.
- **Filters** are a `grid-cols-2 sm:grid-cols-3` of controls with the search box
  spanning the full width, so a form of five filters costs three rows rather
  than five.
- **Page headers** stack title, description and actions, because a title plus a
  two-button row does not fit beside each other in either direction.

Two content bugs were visible in the same pass and are worth recording, since
neither was caught by a type or unit test: the approval badge (`approved`) and
the WordPress verified flag both rendered the word «تأییدشده», so an approved
square showed the same badge twice; and two cells carried a `max-w-[16rem]` cap
that was wider than their column, so it never truncated and only forced a wrap.

## Backend traps encoded in the UI

These are the behaviours that fail silently rather than loudly, so each one is
either validated in the form or stated in the page:

- `POST /admin/squares` has no `name` field; it is `square_name`. `full_name` is
  the owner account's display name.
- Only `pending_verification` and `approved` are accepted on create. Creating
  with `approved` sends the owner **no** notification — the form says so.
- A missing coordinate pair becomes Tehran's centre, so a half-filled pair is
  caught client-side; `0,0` is rejected as "no location".
- An invalid `start_date` is silently dropped by `SquareActivity::setStartDate`,
  so the form validates it.
- A square's location update requires all five geo fields at once; sending a
  subset makes the backend skip the whole block and persist an unvalidated city.
- `/admin/squares/map` inner-joins the geo table, so squares without a geo row
  are absent; the empty state explains this.
- `GET /admin/speakers` is capped at 50 and has no pagination. `phone` is not in
  the admin schema at all.
- Speakers are WordPress users: promote/demote, never role strings, and an
  administrator or square account is `not_eligible`.
- `POST /admin/content` answers `data: null` for any status other than
  `publish`, and `/content` lists only `publish`. There is no
  `GET /admin/content`, so the panel reuses the public cursor list and labels the
  limitation; drafts are only visible in wp-admin.
- Media reflections take `outlet_id` (a real outlet, whose name is read from the
  post title) or a free-text `outlet`; `deleteMediaReflection` is a hard delete
  whose repeat is a 404.
- Editorial marking is `PUT` to add and `DELETE` to remove.
- Removing a narrative's content link is not idempotent (a second call 404s), so
  the 404 is absorbed as success.
- `allow_guest_join` exists on initiatives only; the campaign branch ignores it.
- Program `status` (plugin lifecycle) and `post_status` (WordPress visibility)
  are separate, and an unrecognised `post_status` is coerced to `publish`.
- Participant edits are whitelisted to `status` and `joined_at`; everything else
  is read-only.
- The broadcast audience is `all|users|squares|province|city|specific_ids`, with
  `id` for a geo scope and `ids[]` for an explicit list. `normalizeAudience`
  drops every key the chosen type does not use, so a stray id cannot widen a
  send. The response is `{ created }` — the row count — and there is no dry run,
  so the send sits behind a confirmation that restates the audience.

## Verification

- `npx eslint` — the admin subtree is clean (the repository carries 13
  pre-existing errors elsewhere, unchanged).
- `npx tsc --noEmit -p tsconfig.json` and `npm run build` — green; all 29 admin
  routes are emitted.
- `npm run test:admin` — 34 assertions over three files:
  - `tests/admin-normalize.test.mjs` runs the pure normalizers and validators;
  - `tests/admin-api-contract.test.mjs` pins the wire contract that a TypeScript
    build would not catch (verbs, field names, idempotency keys, error shapes);
  - `tests/admin-panel-gate.test.mjs` pins the two-layer gate, every page's
    guard ordering, the server-side token binding (no service may import
    `next/headers`), the narrow-column layout rules, the fail-closed
    predicate, the absence of an admin link for non-admins, and the route set.
- `node --experimental-strip-types --test tests/*.mjs` — the seven pre-existing
  failures in unrelated suites are unchanged by this work.
- The panel was rendered in headless Chrome at 390px and 900px and read back as
  screenshots, which is how the double badge and the wrap-only width caps were
  found. A control page outside `/admin` was captured at the same viewport to
  confirm the app shell's own horizontal offset is not caused by this feature.
