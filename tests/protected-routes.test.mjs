import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

async function loadProtectedRoutes() {
  const file = path.join(root, "lib/protected-routes.ts");
  assert.ok(existsSync(file), "lib/protected-routes.ts must exist");
  return import(pathToFileURL(file).href);
}

test("the speaker directory is public while the invitations inbox remains protected", async () => {
  const { isProtectedPath, PROTECTED_ROUTE_PREFIXES } = await loadProtectedRoutes();

  assert.ok(PROTECTED_ROUTE_PREFIXES.includes("/speaker-invitations"));

  assert.equal(isProtectedPath("/speakers"), false);
  assert.equal(isProtectedPath("/speakers/42"), false);
  assert.equal(isProtectedPath("/speaker-invitations"), true);
  assert.equal(isProtectedPath("/speaker-invitations/received/9"), true);
});

test("protection stops at a path boundary", async () => {
  const { isProtectedPath } = await loadProtectedRoutes();

  // A different route that merely shares a prefix text must stay public.
  assert.equal(isProtectedPath("/speakers-archive"), false);
  assert.equal(isProtectedPath("/speaker-invitations-old"), false);
  assert.equal(isProtectedPath("/home"), false);
  assert.equal(isProtectedPath("/content"), false);
  assert.equal(isProtectedPath("/explore"), false);
});

test("the return target keeps the full original request", async () => {
  const { returnToFrom } = await loadProtectedRoutes();

  assert.equal(returnToFrom("/speakers", ""), "/speakers");
  assert.equal(returnToFrom("/speakers", "?tab=map"), "/speakers?tab=map");
  assert.equal(returnToFrom("/speaker-invitations", "?box=sent"), "/speaker-invitations?box=sent");
});

test("the proxy redirects a visitor without a session to the login page", () => {
  const proxyFile = path.join(root, "proxy.ts");
  assert.ok(existsSync(proxyFile), "proxy.ts (Next.js middleware) must exist at the project root");

  const proxy = readFileSync(proxyFile, "utf8");

  // Next 16 renamed middleware to proxy; the guard must use that convention.
  assert.match(proxy, /export async function proxy\(request: NextRequest\)/);
  assert.match(proxy, /from "next\/server"/);

  // It reads the real session cookie and redirects to login with a return path.
  assert.match(source("lib/meydan-session.ts"), /ACCESS_COOKIE = "meydan_access"/);
  assert.match(proxy, /request\.cookies\.get\(ACCESS_COOKIE\)\?\.value/);
  assert.match(proxy, /NextResponse\.redirect\(/);
  assert.match(proxy, /loginHref\(returnToFrom\(pathname, search\)\)/);

  // Public requests also pass through after an opportunistic refresh; stale
  // protected sessions renew before downstream server components read cookies.
  assert.match(proxy, /const isProtected = isProtectedPath\(pathname\)/);
  assert.match(proxy, /if \(accessToken \|\| !isProtected\) return NextResponse\.next\(\)/);
  assert.match(proxy, /refreshSession\(refreshToken\)/);

  // The redirect must be built from the request origin, not a hardcoded host.
  assert.match(proxy, /request\.nextUrl\.origin/);
});

test("the matcher covers the protected subtrees and nothing static", () => {
  const proxy = source("proxy.ts");

  assert.match(proxy, /matcher: \[/);
  assert.match(proxy, /_next\/static/);
  assert.match(proxy, /_next\/image/);
  assert.match(proxy, /isProtectedPath\(pathname\)/);

  // Static assets and API routes must never be intercepted, or the guard could
  // block the very JS/CSS needed to render the login page.
  assert.match(proxy, /\(\?!api\|_next\/static\|_next\/image/);
});

test("the guarded pages still verify the session server-side", () => {
  // The directory renders for everyone; compose and chat verify their sessions.
  assert.match(source("app/(app)/speakers/page.tsx"), /SpeakersView/);
  assert.match(source("app/(app)/speaker-invitations/page.tsx"), /SpeakerInvitationsView/);

  for (const file of ["app/(app)/compose/page.tsx", "app/(app)/chat/layout.tsx"]) {
    assert.match(source(file), /isAuthenticated/);
    assert.match(source(file), /loginHref/);
  }
});
