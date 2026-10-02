import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => existsSync(path.join(root, relative));

/**
 * The admin panel is gated twice on purpose: `proxy.ts` only proves a session
 * cookie exists (it cannot read a role), and the layout does the real role check
 * on the server. These tests pin both halves, plus the rule the plan states
 * most emphatically — a non-administrator sees no admin link at all.
 */
test("the proxy matcher covers the admin subtree", () => {
  const proxy = source("proxy.ts");

  // The shared document matcher covers /admin; the runtime guard still uses
  // the protected route policy to decide whether to redirect.
  assert.match(proxy, /isProtectedPath\(pathname\)/);
  assert.match(source("lib/protected-routes.ts"), /"\/admin"/);
});

test("speaker promotion searches accounts and never overwrites their identity", () => {
  const form = source("features/admin/components/AdminSpeakerForm.tsx");
  const speakers = source("features/admin/services/speakers.service.ts");
  const profileBody = speakers.slice(
    speakers.indexOf("function speakerProfileBody"),
    speakers.indexOf("export async function promoteSpeaker"),
  );

  assert.match(form, /id="speaker-user-search"/);
  assert.match(form, /type="search"/);
  assert.match(form, /foldDigits\(userQuery\)/);
  assert.match(form, /getSpeakerCategories\(\)/);
  assert.match(form, /getProvinces\(\)/);
  assert.doesNotMatch(form, /id="speaker-name"/);
  assert.doesNotMatch(form, /هویت و معرفی سخنران/);
  assert.doesNotMatch(profileBody, /\b(name|bio|role|handle|expertise|initials):/);
  assert.match(form, /admin-speaker-form/);
  assert.match((source("app/globals.css") + source("features/admin/admin-workspace.css") + source("features/media/viewer.css")), /admin-speaker-city/);
});

test("editor feedback keeps one grid column and success appears as an animated toast", () => {
  const css = source("features/admin/admin.css");
  const square = source("features/admin/components/AdminSquareDetailView.tsx");
  const speaker = source("features/admin/components/AdminSpeakerForm.tsx");
  const toast = source("features/admin/components/AdminSuccessToast.tsx");

  assert.match(css, /\.admin-editor-content \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.admin-shell \.admin-editor-content > \* \{ grid-column: 1;/);
  assert.match(css, /@keyframes admin-toast-in/);
  assert.match(css, /@keyframes admin-toast-out/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(square, /<AdminSuccessToast/);
  assert.match(speaker, /<AdminSuccessToast/);
  assert.match(toast, /role="status"/);
  assert.match(toast, /setPhase\("closing"\)/);
});

test("/admin is a protected prefix so an anonymous visitor never sees the shell", async () => {
  const { PROTECTED_ROUTE_PREFIXES, isProtectedPath } = await import(
    new URL("../lib/protected-routes.ts", import.meta.url).href
  );

  assert.ok(PROTECTED_ROUTE_PREFIXES.includes("/admin"));
  assert.equal(isProtectedPath("/admin"), true);
  assert.equal(isProtectedPath("/admin/squares"), true);
  assert.equal(isProtectedPath("/admin/squares/new"), true);
  assert.equal(isProtectedPath("/admin/squares/42"), true);
  // The prefix stops at a path boundary: a public page that merely starts with
  // "admin" must not be dragged behind the guard.
  assert.equal(isProtectedPath("/administrator"), false);
});

test("the admin layout fails closed in three distinct ways", () => {
  const layout = source("app/(app)/admin/layout.tsx");
  const gate = source("features/admin/server/require-administrator.ts");

  // 1. No session → the login page, carrying the admin return target. The check
  //    lives in the shared gate, which the layout consumes.
  assert.match(gate, /isAuthenticated\(\)/);
  assert.match(gate, /loginHref\("\/admin"\)/);
  assert.match(layout, /resolveAdminGate/);

  // 2. A real 401 from the API → login as well; the cookie check above is the
  //    primary signal and this is the race where the token died in between.
  assert.match(gate, /status === 401/);

  // 3. A signed-in non-administrator → the 403 screen. The verdict is data, so
  //    the JSX is built outside the try/catch that produced it.
  assert.match(layout, /AdminForbidden/);
  assert.match(gate, /hasAdministratorRole/);
  assert.match(gate, /status: "denied"/);

  // 4. Anything else → a retryable error screen, never the panel content.
  assert.match(layout, /AdminGateError/);
  assert.match(gate, /status: "unavailable"/);

  // The page must never be cached into a shared response.
  assert.match(layout, /dynamic\s*=\s*["']force-dynamic["']/);
});

test("every admin page re-checks the role before running its own queries", () => {
  // A nested page segment is evaluated even when the layout renders the denial
  // screen, so a layout-only guard would let a non-administrator's request run
  // the page's data calls and ship the tree to the client.
  const pages = [
    "app/(app)/admin/page.tsx",
    "app/(app)/admin/squares/page.tsx",
    "app/(app)/admin/squares/new/page.tsx",
    "app/(app)/admin/squares/[id]/page.tsx",
    "app/(app)/admin/squares/map/page.tsx",
    "app/(app)/admin/collectives/page.tsx",
    "app/(app)/admin/organizations/page.tsx",
    "app/(app)/admin/media-accounts/page.tsx",
    "app/(app)/admin/speakers/page.tsx",
    "app/(app)/admin/speakers/new/page.tsx",
    "app/(app)/admin/speakers/new-account/page.tsx",
    "app/(app)/admin/speakers/[id]/page.tsx",
    "app/(app)/admin/speaker-requests/page.tsx",
    "app/(app)/admin/speaker-requests/[id]/page.tsx",
    "app/(app)/admin/speaker-invitations/page.tsx",
    "app/(app)/admin/speaker-invitations/[id]/page.tsx",
    "app/(app)/admin/content/page.tsx",
    "app/(app)/admin/content/banners/page.tsx",
    "app/(app)/admin/content/new/page.tsx",
    "app/(app)/admin/content/[id]/page.tsx",
    "app/(app)/admin/content/[id]/edit/page.tsx",
    "app/(app)/admin/report-days/page.tsx",
    "app/(app)/admin/creators/page.tsx",
    "app/(app)/admin/creators/new/page.tsx",
    "app/(app)/admin/creators/[id]/page.tsx",
    "app/(app)/admin/feed/page.tsx",
    "app/(app)/admin/media-outlets/page.tsx",
    "app/(app)/admin/narratives/page.tsx",
    "app/(app)/admin/initiatives/page.tsx",
    "app/(app)/admin/initiatives/new/page.tsx",
    "app/(app)/admin/initiatives/[id]/page.tsx",
    "app/(app)/admin/initiatives/[id]/participants/page.tsx",
    "app/(app)/admin/campaigns/page.tsx",
    "app/(app)/admin/campaigns/new/page.tsx",
    "app/(app)/admin/campaigns/[id]/page.tsx",
    "app/(app)/admin/notifications/page.tsx",
    "app/(app)/admin/officials/page.tsx",
    "app/(app)/admin/users/page.tsx",
    "app/(app)/admin/users/new/page.tsx",
    "app/(app)/admin/users/[id]/page.tsx",
  ];

  // The list above must stay exhaustive: a new admin page that skips the guard
  // would reintroduce the leak this pins shut.
  const onDisk = execSync(
    `find "${root}/app/(app)/admin" -name page.tsx -print`,
    { encoding: "utf-8" },
  )
    .trim()
    .split("\n")
    .map((file) => file.replace(`${root}/`, ""))
    .sort();
  assert.deepEqual(
    onDisk,
    [...pages].sort(),
    "every admin page must be listed",
  );

  for (const page of pages) {
    const text = source(page);
    assert.match(
      text,
      /if \(!\(await isAdministrator\(\)\)\) return null;/,
      `${page} must guard`,
    );
    assert.match(
      text,
      /return null;/,
      `${page} must render nothing when denied`,
    );

    // The guard has to precede the page's first `await`, or a denied request
    // still reaches the API.
    const body = text.slice(text.indexOf("export default async function"));
    const guardAt = body.indexOf("await isAdministrator()");
    const firstAwait = body.indexOf("await ");
    assert.ok(guardAt > 0, `${page} guard must be inside the component`);
    assert.equal(
      firstAwait,
      guardAt,
      `${page} guard must precede every other await`,
    );
  }
});

test("the admin link is only rendered for an administrator", () => {
  const nav = source("components/layouts/AdminNavLink.tsx");

  // Fail-closed: while the role is unknown, the link does not exist.
  assert.match(nav, /isAdministrator/);
  assert.match(nav, /if \(!viewer\.isAdministrator\) return null/);

  const shell = source("components/layouts/AppShell.tsx");
  assert.match(shell, /AdminNavLink/);
  // The link rides in the desktop sidebar only; the bottom bar is a fixed
  // five-column grid and has no room for a role-dependent sixth item.
  const bottom = source("components/layouts/BottomNavigation.tsx");
  assert.doesNotMatch(bottom, /AdminNavLink/);
  assert.match(bottom, /grid-cols-5/);
});

test("the role helpers treat every mismatch as not-an-administrator", () => {
  const service = source("features/auth/services/viewer-role.service.ts");
  const hook = source("features/auth/hooks/useViewerRole.ts");

  assert.match(service, /ADMIN_ROLE\s*=\s*["']administrator["']/);
  assert.match(service, /export function hasAdministratorRole/);
  assert.match(service, /extractRoles\(me\)\.includes\(ADMIN_ROLE\)/);
  // An empty or absent role list must be a definite "no", not "unknown".
  assert.match(service, /NO_ROLES/);
  // The hook delegates to the service so the server and client agree.
  assert.match(hook, /viewer-role\.service|hasAdministratorRole/);
});

test("every admin section the plan lists has a route", () => {
  const sections = [
    "app/(app)/admin/page.tsx",
    "app/(app)/admin/squares/page.tsx",
    "app/(app)/admin/squares/new/page.tsx",
    "app/(app)/admin/squares/[id]/page.tsx",
    "app/(app)/admin/squares/map/page.tsx",
    "app/(app)/admin/speakers/page.tsx",
    "app/(app)/admin/speakers/new/page.tsx",
    "app/(app)/admin/speakers/[id]/page.tsx",
    "app/(app)/admin/speaker-requests/page.tsx",
    "app/(app)/admin/speaker-requests/[id]/page.tsx",
    "app/(app)/admin/speaker-invitations/page.tsx",
    "app/(app)/admin/speaker-invitations/[id]/page.tsx",
    "app/(app)/admin/content/page.tsx",
    "app/(app)/admin/content/banners/page.tsx",
    "app/(app)/admin/content/new/page.tsx",
    "app/(app)/admin/content/[id]/page.tsx",
    "app/(app)/admin/content/[id]/edit/page.tsx",
    "app/(app)/admin/creators/page.tsx",
    "app/(app)/admin/creators/new/page.tsx",
    "app/(app)/admin/creators/[id]/page.tsx",
    "app/(app)/admin/media-outlets/page.tsx",
    "app/(app)/admin/narratives/page.tsx",
    "app/(app)/admin/initiatives/page.tsx",
    "app/(app)/admin/initiatives/new/page.tsx",
    "app/(app)/admin/initiatives/[id]/page.tsx",
    "app/(app)/admin/initiatives/[id]/participants/page.tsx",
    "app/(app)/admin/campaigns/page.tsx",
    "app/(app)/admin/campaigns/new/page.tsx",
    "app/(app)/admin/campaigns/[id]/page.tsx",
    "app/(app)/admin/notifications/page.tsx",
  ];

  for (const route of sections) {
    assert.ok(exists(route), `${route} must exist`);
  }
});

test("the section navigation lists every route it can reach", () => {
  const nav = source("features/admin/components/AdminSectionNav.tsx");

  for (const href of [
    "/admin",
    "/admin/squares",
    "/admin/squares/map",
    "/admin/speakers",
    "/admin/speaker-requests",
    "/admin/speaker-invitations",
    "/admin/content",
    "/admin/creators",
    "/admin/media-outlets",
    "/admin/narratives",
    "/admin/initiatives",
    "/admin/campaigns",
    "/admin/notifications",
  ]) {
    assert.ok(nav.includes(`"${href}"`), `section nav must include ${href}`);
  }
  assert.match(nav, /aria-current/);
});

test("the admin subtree ships loading and error boundaries", () => {
  assert.ok(exists("app/(app)/admin/loading.tsx"));
  assert.ok(exists("app/(app)/admin/error.tsx"));
  assert.match(source("app/(app)/admin/error.tsx"), /reset/);
});

test("admin pages are excluded from indexing", () => {
  const layout = source("app/(app)/admin/layout.tsx");
  // Next's metadata API uses the robots object form rather than a `noindex`
  // string, so the assertion checks the fields themselves.
  assert.match(layout, /robots:\s*\{\s*index:\s*false/);
  assert.match(layout, /follow:\s*false/);
});

test("server-rendered admin reads carry the session token", () => {
  // A layout-only fix is not enough: the first paint of every admin section is a
  // server render that calls the API origin directly, so without the token each
  // read answers 401 and the section shows its error state even for a real
  // administrator. This pinned the bug where every admin page said
  // "بارگذاری این بخش پنل ممکن نشد" for a signed-in administrator.
  const services = [
    "content",
    "creators",
    "narratives",
    "programs",
    "speakers",
    "squares",
  ];

  // The services are imported by client components, so none of them may pull in
  // `next/headers` — not even transitively through the auth helper.
  for (const name of services) {
    const text = source(`features/admin/services/${name}.service.ts`);
    assert.doesNotMatch(
      text,
      /next\/headers/,
      `${name}.service.ts must stay importable from a client component`,
    );
    assert.doesNotMatch(
      text,
      /admin-request/,
      `${name}.service.ts must not import the server-only auth helper`,
    );
    assert.doesNotMatch(
      text,
      /await withAdminAuth\(\)/,
      `${name}.service.ts must take an optional init instead of reading cookies`,
    );
  }

  // The binding lives in a server-only module and is applied to every read a
  // page performs.
  const bound = source("features/admin/services/admin-server.ts");
  assert.match(bound, /import \{ withAdminAuth \} from "\.\/admin-request"/);
  assert.match(bound, /withAdminAuth\(\)/);

  const auth = source("features/admin/services/admin-request.ts");
  assert.match(
    auth,
    /import \{ accessTokenHeader \} from "@\/lib\/meydan-session"/,
  );
  assert.match(auth, /Authorization/);

  // Every page that fetches on the server must use the bound wrapper, not the
  // raw service module, for its reads.
  const pages = execSync(
    `find "${root}/app/(app)/admin" -name page.tsx -print`,
    {
      encoding: "utf-8",
    },
  )
    .trim()
    .split("\n")
    .map((file) => file.replace(`${root}/`, ""));

  const readNames = [
    "countSquares",
    "getSquare",
    "getSquareMap",
    "getSquares",
    "getAdminSpeakers",
    "getSpeaker",
    "getSpeakerInvitation",
    "getSpeakerInvitations",
    "getLinkableUsers",
    "getSpeakerRequest",
    "getSpeakerRequests",
    "getContent",
    "getContentList",
    "getCreator",
    "getCreators",
    "getMediaOutlets",
    "getParticipants",
    "getProgram",
    "getPrograms",
    "getEditorialNarratives",
  ];
  // `page.tsx` files import their reads with this exact pattern; a page that
  // imports one from a `.service` module is unbound and will 401.
  const unbound =
    /import \{[^}]*\b(get|count)[A-Za-z]+\b[^}]*\} from "@\/features\/admin\/services\/(?!admin-server)[a-z-]+";/;

  for (const page of pages) {
    const text = source(page);
    const match = text.match(unbound);
    if (match) {
      const imported = match[0].match(/\b(get|count)[A-Za-z]+\b/g) || [];
      const leaked = imported.filter((name) => readNames.includes(name));
      assert.equal(
        leaked.length,
        0,
        `${page} imports ${leaked.join(", ")} from a service module; use admin-server`,
      );
    }
  }
});

test("the admin panel has a wide desktop shell and responsive data surfaces", () => {
  // Admin routes get a dedicated wide shell on desktop while tables still
  // switch to labelled cards on narrow screens.
  const table = source("features/admin/components/AdminTable.tsx");

  // A real table for wide screens and a card list for narrow ones.
  assert.match(
    table,
    /hidden[^"]*md:block/,
    "the table layout must be hidden below md",
  );
  assert.match(
    table,
    /md:hidden/,
    "the card layout must be the narrow-screen default",
  );
  assert.match(
    table,
    /primary/,
    "a column must be markable as the card heading",
  );
  assert.match(table, /<table/, "the wide layout must stay a real table");
  assert.match(table, /<dl/, "the card layout must render labelled fields");

  // The section nav is grouped for desktop and remains reachable on mobile.
  const nav = source("features/admin/components/AdminSectionNav.tsx");
  assert.match(nav, /GROUPS/, "the section nav must define navigation groups");
  assert.match(
    nav,
    /lg:fixed/,
    "the section nav must become a desktop sidebar",
  );

  // The filters must lay out in columns rather than one control per row.
  const filters = source("features/admin/components/AdminFilters.tsx");
  assert.match(filters, /grid-cols-1/, "filters must remain usable on mobile");
  assert.match(
    filters,
    /sm:grid-cols-2/,
    "filters must use a multi-column grid",
  );

  // The two square badges mean different things and must not print the same
  // word: `approved` and the WP `verified` flag were both "تأییدشده".
  const badges = source("features/admin/components/AdminStatusBadge.tsx");
  const statusLabels = source("features/admin/types.ts");
  assert.match(statusLabels, /approved: "تأییدشده"/);
  assert.doesNotMatch(
    badges,
    /\{verified \? "تأییدشده" : "تأییدنشده"\}/,
    "the verified badge must not repeat the approval label",
  );
});
